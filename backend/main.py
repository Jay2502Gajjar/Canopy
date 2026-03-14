import os
from dotenv import load_dotenv
load_dotenv()
from datetime import datetime, date, timedelta, timezone
from uuid import UUID
import json
import logging
import random
import smtplib
from email.mime.text import MIMEText
from typing import List, Optional, Any, Dict
from contextlib import asynccontextmanager
import traceback

from fastapi import FastAPI, Depends, HTTPException, status, Response, Request, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
import bcrypt

# Import local modules
from db.database import init_db, close_db, get_db
from middleware.auth import get_current_user, create_access_token, UserObject, RoleChecker
from services.activity_service import log_event
from services.pinecone_service import init_pinecone, add_memory, search_memory, delete_employee_memory
from services.groq_service import chat as groq_chat, analyze_transcript, employee_insights, generate_meeting_brief
from services.zoho_service import sync_to_postgres, create_employee as zoho_create_employee

# Logging Configuration
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("canopy-backend")

# Password Context
def verify_password(plain_password, hashed_password):
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def get_password_hash(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

# Lifespan context manager for startup and shutdown
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic
    await init_db()
    await init_pinecone()
    yield
    # Shutdown logic
    await close_db()

app = FastAPI(title="Canopy HR Intelligence API", lifespan=lifespan)

# CORS Middleware
origins = [os.getenv("FRONTEND_URL", "http://localhost:3000")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Helper function to serialize dates in JSON
def custom_json_serializer(obj):
    if isinstance(obj, (datetime, date)):
        return obj.isoformat()
    raise TypeError(f"Type {type(obj)} not serializable")


# ============================================
# WEBSOCKET SERVER
# ============================================

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            await connection.send_json(message)

ws_manager = ConnectionManager()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Ignore incoming messages from client for now
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)


# ============================================
# HEALTH CHECK
# ============================================

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}

# ============================================
# AUTHENTICATION ROUTES
# ============================================

class RegisterModel(BaseModel):
    name: str
    email: str
    password: str
    role: str = "hro"

class LoginModel(BaseModel):
    email: str
    password: Optional[str] = None
    role: Optional[str] = None

@app.post("/api/auth/register", status_code=201)
async def register(data: RegisterModel, response: Response, db=Depends(get_db)):
    try:
        # Check if user exists
        existing = await db.fetchrow("SELECT id FROM users WHERE email = $1", data.email)
        if existing:
            raise HTTPException(status_code=409, detail="User with this email already exists")

        password_hash = get_password_hash(data.password)
        first_name = data.name.split(" ")[0]

        user = await db.fetchrow(
            """
            INSERT INTO users (name, first_name, email, role, password_hash)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, name, first_name, email, role, department, avatar, account_status, created_at
            """,
            data.name, first_name, data.email, data.role, password_hash
        )

        token = create_access_token({"id": str(user["id"]), "email": user["email"], "role": user["role"], "name": user["name"]})

        response.set_cookie(
            key="token",
            value=token,
            httponly=True,
            secure=(os.getenv("NODE_ENV") == "production"),
            samesite="lax",
            max_age=7 * 24 * 60 * 60,
        )

        logger.info(f"User registered: {data.email} ({data.role})")
        return {
            "user": {
                "id": str(user["id"]),
                "name": user["name"],
                "firstName": user["first_name"],
                "email": user["email"],
                "role": user["role"],
                "department": user["department"],
                "avatar": user["avatar"] or "",
                "accountStatus": user["account_status"],
            },
            "token": token
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration failed: {e}")
        raise HTTPException(status_code=500, detail="Registration failed")

def send_otp_email(to_email: str, otp_code: str):
    """Send OTP code via Gmail SMTP or log to console as fallback"""
    gmail_user = os.getenv("GMAIL_USER")
    gmail_pass = os.getenv("GMAIL_APP_PASSWORD")
    print(f"DEBUG: Attempting to send OTP to {to_email} using {gmail_user}")
    if gmail_user and gmail_pass:
        try:
            msg = MIMEText(f"Your Canopy HR login verification code is: {otp_code}\n\nThis code expires in 5 minutes.", "plain")
            msg["Subject"] = f"Canopy HR - Verification Code: {otp_code}"
            msg["From"] = gmail_user
            msg["To"] = to_email
            with smtplib.SMTP("smtp.gmail.com", 587) as server:
                server.starttls()
                server.login(gmail_user, gmail_pass)
                server.sendmail(gmail_user, to_email, msg.as_string())
            logger.info(f"OTP email sent to {to_email}")
            print(f"SUCCESS: Email sent to {to_email}")
        except Exception as e:
            logger.warning(f"SMTP failed, logging OTP instead: {e}")
            logger.info(f"========= OTP for {to_email}: {otp_code} =========")
            print(f"ERROR: SMTP failed: {e}")
    else:
        logger.info(f"========= OTP for {to_email}: {otp_code} =========")
        print(f"INFO: SMTP credentials not found, logging OTP: {otp_code}")

@app.post("/api/auth/login")
async def login(data: LoginModel, response: Response, db=Depends(get_db)):
    try:
        user = None
        if not data.password:
            # For demo mode: auto-create if no password provided
            result = await db.fetchrow("SELECT * FROM users WHERE email = $1", data.email)
            if not result:
                name = " ".join([word.capitalize() for word in data.email.split("@")[0].replace(".", " ").replace("_", " ").split()])
                hash_pw = get_password_hash("demo123")
                user = await db.fetchrow(
                    """
                    INSERT INTO users (name, first_name, email, role, password_hash)
                    VALUES ($1, $2, $3, $4, $5)
                    RETURNING *
                    """,
                    name, name.split(" ")[0], data.email, data.role or "hro", hash_pw
                )
            else:
                user = result
        else:
            result = await db.fetchrow("SELECT * FROM users WHERE email = $1", data.email)
            if not result:
                raise HTTPException(status_code=401, detail="Invalid credentials")
            user = result
            if not verify_password(data.password, user["password_hash"]):
                raise HTTPException(status_code=401, detail="Invalid credentials")

        # Generate 6-digit OTP
        otp_code = str(random.randint(100000, 999999))
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=5)
        
        # Invalidate old OTPs
        await db.execute("DELETE FROM otp_codes WHERE user_id = $1::uuid", user["id"])
        
        # Store new OTP
        await db.execute(
            "INSERT INTO otp_codes (user_id, code, expires_at) VALUES ($1, $2, $3)",
            user["id"], otp_code, expires_at
        )
        
        # Send or log OTP
        send_otp_email(user["email"], otp_code)
        
        logger.info(f"2FA OTP generated for {user['email']}")
        return {
            "requires2FA": True,
            "userId": str(user["id"]),
            "email": user["email"],
            "message": "Verification code sent to your email"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login failed: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail="Login failed")

@app.post("/api/auth/verify-otp")
async def verify_otp(data: Dict[str, Any], response: Response, db=Depends(get_db)):
    try:
        user_id = data.get("userId")
        code = data.get("code")
        if not user_id or not code:
            raise HTTPException(status_code=400, detail="userId and code are required")
        
        otp = await db.fetchrow(
            """
            SELECT * FROM otp_codes 
            WHERE user_id = $1::uuid AND code = $2 
            AND used = false AND expires_at > NOW()
            """,
            user_id, code
        )
        
        if not otp:
            # Debug log
            logger.warning(f"OTP verification failed for user_id={user_id}, code={code}")
            raise HTTPException(status_code=401, detail="Invalid or expired code")
        
        # Mark OTP as used
        await db.execute("UPDATE otp_codes SET used = true WHERE id = $1::uuid", otp["id"])
        
        # Get user
        user = await db.fetchrow("SELECT * FROM users WHERE id = $1::uuid", user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Update last login
        await db.execute("UPDATE users SET last_login = NOW() WHERE id = $1", user["id"])
        
        token = create_access_token({"id": str(user["id"]), "email": user["email"], "role": user["role"], "name": user["name"]})
        
        response.set_cookie(
            key="token",
            value=token,
            httponly=True,
            secure=(os.getenv("NODE_ENV") == "production"),
            samesite="lax",
            max_age=7 * 24 * 60 * 60,
        )
        
        logger.info(f"2FA verified for {user['email']}")
        return {
            "user": {
                "id": str(user["id"]),
                "name": user["name"],
                "firstName": user["first_name"],
                "email": user["email"],
                "role": user["role"],
                "department": user["department"] or "Human Resources",
                "avatar": user["avatar"] or "",
                "phone": user["phone"] or "",
                "lastLogin": user["last_login"],
                "accountStatus": user["account_status"],
            },
            "token": token
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"OTP verification failed: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail="Verification failed")

@app.get("/api/auth/me")
@app.get("/api/auth/profile")
async def get_profile(user_obj: UserObject = Depends(get_current_user), db=Depends(get_db)):
    try:
        u = await db.fetchrow(
            """
            SELECT id, name, first_name, email, role, department, avatar, phone, last_login, account_status, created_at
            FROM users WHERE id = $1
            """,
            user_obj.id
        )
        if not u:
            raise HTTPException(status_code=404, detail="User not found")
            
        return dict(
            id=str(u["id"]), name=u["name"], firstName=u["first_name"], email=u["email"],
            role=u["role"], department=u["department"], avatar=u["avatar"] or "",
            phone=u["phone"] or "", lastLogin=u["last_login"], accountStatus=u["account_status"]
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get profile failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch profile")

@app.patch("/api/auth/profile")
async def update_profile(data: Dict[str, Any], user_obj: UserObject = Depends(get_current_user), db=Depends(get_db)):
    try:
        name = data.get("name")
        email = data.get("email")
        
        updates = []
        params = []
        param_idx = 1
        
        if name and name.strip():
            updates.append(f"name = ${param_idx}")
            params.append(name.strip())
            param_idx += 1
            
            first_name = name.strip().split(" ")[0]
            updates.append(f"first_name = ${param_idx}")
            params.append(first_name)
            param_idx += 1
            
        if email and email.strip():
            if "@" not in email:
                raise HTTPException(status_code=400, detail="Invalid email format")
            updates.append(f"email = ${param_idx}")
            params.append(email.strip().lower())
            param_idx += 1
            
        if not updates:
            raise HTTPException(status_code=400, detail="No valid fields to update")
            
        params.append(user_obj.id)
        query = f"UPDATE users SET {', '.join(updates)} WHERE id = ${param_idx} RETURNING *"
        
        u = await db.fetchrow(query, *params)
        if not u:
            raise HTTPException(status_code=404, detail="User not found")
            
        return dict(
            id=str(u["id"]), name=u["name"], firstName=u["first_name"], email=u["email"],
            role=u["role"], department=u["department"], avatar=u["avatar"] or ""
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Profile update failed: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail="Profile update failed")

@app.post("/api/auth/logout")
async def logout(response: Response):
    response.delete_cookie("token")
    return {"message": "Logged out"}

# ============================================
# EMPLOYEES ROUTES
# ============================================

def format_employee(row):
    return {
        "id": str(row["id"]),
        "name": row["name"],
        "email": row["email"],
        "role": row["role"],
        "department": row["department"],
        "employeeId": row["employee_id"],
        "avatar": row["avatar"] or "",
        "joinDate": row["join_date"].isoformat() if row["join_date"] else None,
        "tenure": row["tenure"] or "",
        "reportingManager": row["reporting_manager"],
        "employmentType": row["employment_type"],
        "sentimentScore": row["sentiment_score"],
        "sentimentTrend": row["sentiment_trend"],
        "memoryScore": row["memory_score"],
        "riskTier": row["risk_tier"],
        "lastInteraction": row["last_interaction"].isoformat() if row["last_interaction"] else None,
        "skills": row["skills"] or [],
        "projects": row["projects"] or [],
        "interests": row["interests"] or [],
        "careerAspirations": row["career_aspirations"] or [],
        "concerns": json.loads(row["concerns"]) if "concerns" in row and row["concerns"] else [],
        "sentimentHistory": json.loads(row["sentiment_history"]) if "sentiment_history" in row and row["sentiment_history"] else [],
    }

@app.get("/api/employees")
async def get_employees(db=Depends(get_db)):
    try:
        rows = await db.fetch(
            """
            SELECT e.*,
              COALESCE(
                (SELECT json_agg(json_build_object('text', c.text, 'date', c.date, 'meetingRef', c.meeting_ref))
                 FROM employee_concerns c WHERE c.employee_id = e.id), '[]'
              ) as concerns,
              COALESCE(
                (SELECT json_agg(json_build_object('date', sh.date, 'score', sh.score) ORDER BY sh.date)
                 FROM sentiment_history sh WHERE sh.employee_id = e.id), '[]'
              ) as sentiment_history
            FROM employees e
            ORDER BY e.name ASC
            """
        )
        return [format_employee(dict(r)) for r in rows]
    except Exception as e:
        logger.error(f"Failed to fetch employees: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch employees")

@app.get("/api/employees/{emp_id}")
async def get_employee(emp_id: str, db=Depends(get_db)):
    try:
        row = await db.fetchrow(
            """
            SELECT e.*,
              COALESCE(
                (SELECT json_agg(json_build_object('text', c.text, 'date', c.date, 'meetingRef', c.meeting_ref))
                 FROM employee_concerns c WHERE c.employee_id = e.id), '[]'
              ) as concerns,
              COALESCE(
                (SELECT json_agg(json_build_object('date', sh.date, 'score', sh.score) ORDER BY sh.date)
                 FROM sentiment_history sh WHERE sh.employee_id = e.id), '[]'
              ) as sentiment_history
            FROM employees e
            WHERE e.id = $1
            """,
            emp_id
        )
        if not row:
            raise HTTPException(status_code=404, detail="Employee not found")
        return format_employee(dict(row))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch employee: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch employee")

@app.post("/api/employees", status_code=201)
async def create_employee(data: Dict[str, Any], db=Depends(get_db)):
    try:
        name = data.get("name")
        email = data.get("email")
        if not name or not email:
            raise HTTPException(status_code=400, detail="Name and email are required")
            
        dept = data.get("department", "Human Resources")
        emp_id_str = data.get("employeeId")
        if not emp_id_str:
            emp_id_str = f"EMP-{random.randint(1000, 9999)}"
            
        dept_avg = await db.fetchrow("SELECT AVG(sentiment_score) as avg FROM employees WHERE department = $1", dept)
        initial_sentiment = int(dept_avg["avg"]) if dept_avg and dept_avg["avg"] else 75

        try:
            row = await db.fetchrow(
                """
                INSERT INTO employees (name, email, role, department, employee_id, join_date, reporting_manager, employment_type, sentiment_score)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING *
                """,
                name, email, data.get("role"), dept, emp_id_str, 
                datetime.fromisoformat(str(data.get("joinDate")).replace("Z", "+00:00")).date() if data.get("joinDate") else None,
                data.get("reportingManager"), data.get("employmentType", "Full-time"), initial_sentiment
            )
        except Exception as e:
            if "duplicate key value violates unique constraint" in str(e):
                raise HTTPException(status_code=409, detail="Employee with this email already exists")
            raise e

        # Mock Zoho Sync
        zoho_create_employee(data)

        # Log Activity
        await log_event(
            event_type="profile_update",
            description=f"New employee profile created for {name} ({dept})",
            employee_id=str(row["id"]),
            employee_name=name
        )
        
        return format_employee(dict(row))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to create employee: {e}")
        raise HTTPException(status_code=500, detail="Failed to create employee")

@app.patch("/api/employees/{emp_id}")
async def update_employee(emp_id: str, fields: Dict[str, Any], db=Depends(get_db)):
    try:
        field_map = {
            "name": "name", "email": "email", "role": "role", "department": "department",
            "sentimentScore": "sentiment_score", "sentimentTrend": "sentiment_trend",
            "memoryScore": "memory_score", "riskTier": "risk_tier", "lastInteraction": "last_interaction",
            "skills": "skills", "projects": "projects", "interests": "interests",
            "careerAspirations": "career_aspirations", "reportingManager": "reporting_manager",
        }
        
        set_clauses = []
        values = []
        param_index = 1
        
        for key, value in fields.items():
            if key in field_map:
                set_clauses.append(f"{field_map[key]} = ${param_index}")
                
                # Handle dates and arrays
                if key == "lastInteraction" and value and isinstance(value, str):
                    val = datetime.fromisoformat(value.replace("Z", "+00:00")).date()
                else:
                    val = value
                    
                values.append(val)
                param_index += 1
                
        if not set_clauses:
            raise HTTPException(status_code=400, detail="No valid fields to update")
            
        set_clauses.append("updated_at = NOW()")
        values.append(emp_id)
        
        query = f"UPDATE employees SET {', '.join(set_clauses)} WHERE id = ${param_index} RETURNING *"
        row = await db.fetchrow(query, *values)
        
        if not row:
            raise HTTPException(status_code=404, detail="Employee not found")
            
        return format_employee(dict(row))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update employee: {e}")
        raise HTTPException(status_code=500, detail="Failed to update employee")

@app.delete("/api/employees/{emp_id}")
async def delete_employee(emp_id: str, db=Depends(get_db)):
    try:
        emp = await db.fetchrow("SELECT name FROM employees WHERE id = $1", emp_id)
        if not emp:
            raise HTTPException(status_code=404, detail="Employee not found")
            
        emp_name = emp["name"]
        
        # Postgres cascading delete
        await db.execute("DELETE FROM employees WHERE id = $1", emp_id)
        
        # Pinecone delete
        await delete_employee_memory(emp_id)
        
        # Log event
        await log_event(
            event_type="resignation_flagged",
            description=f"Employee profile for {emp_name} has been deleted from the system.",
            employee_name=emp_name
        )
        
        return {"message": "Employee deleted"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete employee: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete employee")

@app.get("/api/employees/{emp_id}/sentiment")
async def get_sentiment(emp_id: str, db=Depends(get_db)):
    try:
        rows = await db.fetch("SELECT date, score FROM sentiment_history WHERE employee_id = $1 ORDER BY date ASC", emp_id)
        return [{"date": r["date"].isoformat(), "score": r["score"]} for r in rows]
    except Exception as e:
        logger.error(f"Failed to fetch sentiment: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch sentiment")

@app.get("/api/employees/{emp_id}/notes")
async def get_notes(emp_id: str, db=Depends(get_db)):
    try:
        rows = await db.fetch(
            """
            SELECT id, employee_id, employee_name, content, preview, date, author, meeting_context, ai_highlights
            FROM notes WHERE employee_id = $1 ORDER BY created_at DESC
            """,
            emp_id
        )
        return [{
            "id": str(r["id"]),
            "employeeId": str(r["employee_id"]),
            "employeeName": r["employee_name"],
            "content": r["content"],
            "preview": r["preview"],
            "date": r["date"].isoformat() if r["date"] else None,
            "author": r["author"],
            "meetingContext": r["meeting_context"],
            "aiHighlights": r["ai_highlights"] or []
        } for r in rows]
    except Exception as e:
        logger.error(f"Failed to fetch notes: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch notes")

@app.post("/api/employees/sync-hrms")
async def sync_hrms(db=Depends(get_db)):
    try:
        # Pass the original connection pool (db is just one connection, pool is in database module object)
        import db.database as db_module
        result = await sync_to_postgres(db_module.pool)
        return {"message": "HRMS sync complete", **result}
    except Exception as e:
        logger.error(f"HRMS sync failed: {e}")
        raise HTTPException(status_code=500, detail="HRMS sync failed")

# ============================================
# TRANSCRIPTS ROUTES
# ============================================
@app.post("/api/transcripts/upload", status_code=201)
async def upload_transcript(data: Dict[str, Any], db=Depends(get_db)):
    try:
        emp_id = data.get("employeeId")
        content = data.get("content")
        
        if not emp_id or not content:
            raise HTTPException(status_code=400, detail="employeeId and content are required")
            
        emp = await db.fetchrow("SELECT * FROM employees WHERE id = $1::uuid", emp_id)
        if not emp:
            raise HTTPException(status_code=404, detail="Employee not found")

        # Standardize content into a list of {speaker, text} and a flat transcript_text
        content_lines = []
        transcript_text = ""
        
        if isinstance(content, list):
            for line in content:
                speaker = line.get('speaker', 'Unknown')
                text = line.get('text', '')
                content_lines.append({"speaker": speaker, "text": text})
                transcript_text += f"{speaker}: {text}\n"
        elif isinstance(content, str):
            for line in content.split('\n'):
                if line.strip():
                    speaker = "Participant"
                    text = line.strip()
                    if ":" in text:
                        parts = text.split(":", 1)
                        speaker = parts[0].strip()
                        text = parts[1].strip()
                    content_lines.append({"speaker": speaker, "text": text})
                    transcript_text += f"{speaker}: {text}\n"

        # 1. AI Analysis via Groq
        from services.groq_service import analyze_transcript
        analysis = await analyze_transcript(transcript_text)
        
        # 2. Vector Storage (Pinecone)
        from services.pinecone_service import add_memory
        try:
            await add_memory(
                id_prefix=f"transcript_{emp_id}_{datetime.now().timestamp()}",
                document=transcript_text,
                metadata={
                    "employee_id": str(emp["id"]),
                    "employee_name": emp["name"],
                    "type": "transcript",
                    "meeting_type": data.get("meetingType", "check-in")
                }
            )
        except Exception as pe:
            logger.error(f"Pinecone memory failed: {pe}")

        # 3. Save to Postgres
        date_val = datetime.now(timezone.utc).date()
        row = await db.fetchrow(
            """
            INSERT INTO transcripts (employee_id, employee_name, employee_dept, meeting_type, date, duration, ai_status, content, ai_analysis)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
            """,
            emp["id"], emp["name"], emp.get("department", ""), data.get("meetingType", "check-in"),
            date_val, data.get("duration", "30m"), "analysed",
            json.dumps(content_lines), json.dumps(analysis)
        )
        
        # 4. Update Employee Sentiment & Commmitments
        new_sentiment = analysis.get("sentimentScore", 50)
        await db.execute(
            "UPDATE employees SET sentiment_score = $1, updated_at = NOW() WHERE id = $2",
            new_sentiment, emp["id"]
        )
        
        await db.execute(
            "INSERT INTO sentiment_history (employee_id, date, score) VALUES ($1, $2, $3)",
            emp["id"], date_val, new_sentiment
        )
        
        # Extract action items
        if analysis.get("actionItems"):
            for item in analysis["actionItems"]:
                await db.execute(
                    """
                    INSERT INTO commitments (employee_id, employee_name, text, source_meeting, source_meeting_date, status)
                    VALUES ($1, $2, $3, $4, $5, 'on_track')
                    """,
                    emp["id"], emp["name"], item, data.get("meetingType", "meeting"), date_val
                )

        # 5. Global Notification
        await db.execute(
            """
            INSERT INTO notifications (source, summary, read, action_label, action_link)
            VALUES ($1, $2, $3, $4, $5)
            """,
            "system", f"New meeting analyzed for {emp['name']}", False, "View Analysis", f"/hro/transcripts/{row['id']}"
        )
        
        return dict(row)

    except Exception as e:
        logger.error(f"Transcript upload failed: {e}")
        raise HTTPException(status_code=500, detail="Transcript upload failed")

@app.get("/api/transcripts")
async def get_all_transcripts(db=Depends(get_db)):
    rows = await db.fetch("SELECT * FROM transcripts ORDER BY date DESC")
    return [{
        "id": str(r["id"]), "employeeId": str(r["employee_id"]), "employeeName": r["employee_name"],
        "employeeDept": r["employee_dept"], "meetingType": r["meeting_type"], "date": r["date"].isoformat(),
        "duration": r["duration"], "aiStatus": r["ai_status"],
        "content": json.loads(r["content"]) if isinstance(r["content"], str) else r["content"],
        "aiAnalysis": json.loads(r["ai_analysis"]) if isinstance(r["ai_analysis"], str) else r["ai_analysis"]
    } for r in rows]

@app.get("/api/transcripts/employee/{emp_id}")
async def get_employee_transcripts(emp_id: str, db=Depends(get_db)):
    rows = await db.fetch("SELECT * FROM transcripts WHERE employee_id = $1 ORDER BY date DESC", emp_id)
    return [{
        "id": str(r["id"]), "employeeId": str(r["employee_id"]), "employeeName": r["employee_name"],
        "employeeDept": r["employee_dept"], "meetingType": r["meeting_type"], "date": r["date"].isoformat(),
        "duration": r["duration"], "aiStatus": r["ai_status"],
        "content": json.loads(r["content"]) if isinstance(r["content"], str) else r["content"],
        "aiAnalysis": json.loads(r["ai_analysis"]) if isinstance(r["ai_analysis"], str) else r["ai_analysis"]
    } for r in rows]

@app.get("/api/transcripts/{t_id}")
async def get_transcript_by_id(t_id: str, db=Depends(get_db)):
    # Try as transcript ID first
    r = await db.fetchrow("SELECT * FROM transcripts WHERE id = $1::uuid", t_id)
    if not r:
        # Fallback: treat as employee_id for backwards compat
        rows = await db.fetch("SELECT * FROM transcripts WHERE employee_id = $1 ORDER BY date DESC", t_id)
        return [{
            "id": str(row["id"]), "employeeId": str(row["employee_id"]), "employeeName": row["employee_name"],
            "employeeDept": row["employee_dept"], "meetingType": row["meeting_type"], "date": row["date"].isoformat(),
            "duration": row["duration"], "aiStatus": row["ai_status"],
            "content": json.loads(row["content"]) if isinstance(row["content"], str) else row["content"],
            "aiAnalysis": json.loads(row["ai_analysis"]) if isinstance(row["ai_analysis"], str) else row["ai_analysis"]
        } for row in rows]
    return {
        "id": str(r["id"]), "employeeId": str(r["employee_id"]), "employeeName": r["employee_name"],
        "employeeDept": r["employee_dept"], "meetingType": r["meeting_type"], "date": r["date"].isoformat(),
        "duration": r["duration"], "aiStatus": r["ai_status"],
        "content": json.loads(r["content"]) if isinstance(r["content"], str) else r["content"],
        "aiAnalysis": json.loads(r["ai_analysis"]) if isinstance(r["ai_analysis"], str) else r["ai_analysis"]
    }


# ============================================
# AI ROUTES
# ============================================
@app.post("/api/ai/chat")
async def ai_chat(data: Dict[str, Any], db=Depends(get_db)):
    try:
        message = data.get("message")
        context = data.get("context", {})
        if not message:
            raise HTTPException(status_code=400, detail="Message is required")

        # Gather employee data
        employee_data = []
        try:
            emp_rows = await db.fetch("SELECT id, name, department, role, sentiment_score, risk_tier, last_interaction, skills, projects, career_aspirations FROM employees ORDER BY name")
            employee_data = [dict(r) for r in emp_rows]
        except Exception:
            pass

        # Search memory
        memory_context = ""
        try:
            memories = await search_memory(message, 5)
            if memories:
                memory_context = "\n\n".join([f"[{m['metadata'].get('type', 'context')}] {m['document']}" for m in memories])
        except Exception:
            pass

        if context.get("employeeId"):
            try:
                emp_detail = await db.fetchrow("SELECT * FROM employees WHERE id = $1", context["employeeId"])
                transcripts = await db.fetch("SELECT ai_analysis FROM transcripts WHERE employee_id = $1 ORDER BY date DESC LIMIT 3", context["employeeId"])
                notes = await db.fetch("SELECT content, date FROM notes WHERE employee_id = $1 ORDER BY date DESC LIMIT 5", context["employeeId"])
                commitments = await db.fetch("SELECT text, status, due_date FROM commitments WHERE employee_id = $1", context["employeeId"])
                
                emp_context = {
                    "employee": dict(emp_detail) if emp_detail else {},
                    "recentTranscripts": [dict(t) for t in transcripts],
                    "notes": [{"content": n["content"], "date": n["date"].isoformat() if n["date"] else None} for n in notes],
                    "commitments": [{"text": c["text"], "status": c["status"], "due_date": c["due_date"].isoformat() if c["due_date"] else None} for c in commitments]
                }
                memory_context += "\n\nSpecific Employee Context:\n" + json.dumps(emp_context, default=str)
            except Exception:
                pass

        try:
            dept_rows = await db.fetch("SELECT * FROM departments ORDER BY name")
            if dept_rows:
                memory_context += "\n\nDepartment Data:\n" + json.dumps([dict(r) for r in dept_rows], default=str)
        except Exception:
            pass

        response_text = await groq_chat(message, context, employee_data, memory_context)
        return {"response": response_text}
    except Exception as e:
        logger.error(f"AI chat failed: {e}")
        raise HTTPException(status_code=500, detail="AI chat failed")

@app.post("/api/ai/employee")
async def ai_employee_insight(data: Dict[str, Any]):
    if not data.get("employee"):
        raise HTTPException(status_code=400, detail="Employee data is required")
    insights = await employee_insights(data["employee"])
    return {"insights": insights}

@app.get("/api/ai/meeting-prep/{emp_id}")
@app.post("/api/ai/meeting-brief")
async def ai_meeting_brief(emp_id: Optional[str] = None, data: Optional[Dict[str, Any]] = None, db=Depends(get_db)):
    try:
        employee_id = emp_id or (data and data.get("employeeId"))
        if not employee_id:
            raise HTTPException(status_code=400, detail="employeeId is required")

        employee = await db.fetchrow("SELECT * FROM employees WHERE id = $1", employee_id)
        if not employee:
            raise HTTPException(status_code=404, detail="Employee not found")

        transcripts = await db.fetch("SELECT ai_analysis, date FROM transcripts WHERE employee_id = $1 ORDER BY date DESC LIMIT 3", employee_id)
        notes = await db.fetch("SELECT content, date, author FROM notes WHERE employee_id = $1 ORDER BY date DESC LIMIT 5", employee_id)
        commitments = await db.fetch("SELECT text, status, due_date FROM commitments WHERE employee_id = $1 AND resolved = false", employee_id)


        brief = None
        try:
            brief = await generate_meeting_brief(
                dict(employee),
                [dict(t) for t in transcripts],
                [dict(n) for n in notes],
                [dict(c) for c in commitments]
            )
        except Exception as e:
            logger.warning(f"Groq meeting brief failed, generating fallback: {e}")
        
        if not brief:
            emp = dict(employee)
            key_context = [
                f"{emp.get('name', 'Employee')} is a {emp.get('role', 'team member')} in {emp.get('department', 'the company')}",
                f"Current sentiment score: {emp.get('sentiment_score', 'N/A')}/100",
                f"Risk tier: {emp.get('risk_tier', 'N/A')}",
            ]
            if commitments:
                key_context.append(f"{len(commitments)} open commitment(s) pending follow-up")
            if notes:
                key_context.append(f"Last note: {str(notes[0]['content'])[:80]}...")
            
            suggested_topics = [
                "Check in on current workload and any blockers",
                "Discuss career development goals and growth",
                "Review team dynamics and collaboration",
            ]
            if commitments:
                for c in commitments[:2]:
                    suggested_topics.append(f"Follow up: {c['text']}")
            
            brief = {
                "keyContext": key_context,
                "suggestedTopics": suggested_topics,
                "brief": f"Prepare for a check-in with {emp.get('name', 'the employee')}. Review their current sentiment and outstanding commitments."
            }
        
        return brief
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Meeting brief generation failed: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail="Meeting brief generation failed")


# ============================================
# NOTES ROUTES
# ============================================
@app.get("/api/notes")
async def get_all_notes(db=Depends(get_db)):
    try:
        rows = await db.fetch("SELECT * FROM notes ORDER BY created_at DESC")
        return [{
            "id": str(n["id"]), "employeeId": str(n["employee_id"]), "employeeName": n["employee_name"],
            "content": n["content"], "preview": n["preview"], "author": n["author"],
            "date": n["date"].isoformat() if n["date"] else None,
            "createdAt": n["created_at"].isoformat() if n["created_at"] else None,
            "meetingContext": n["meeting_context"], "aiHighlights": n["ai_highlights"] or []
        } for n in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/api/notes/{emp_id}")
async def get_employee_notes(emp_id: str, db=Depends(get_db)):
    rows = await db.fetch("SELECT * FROM notes WHERE employee_id = $1 ORDER BY created_at DESC", emp_id)
    return [{
        "id": str(n["id"]), "employeeId": str(n["employee_id"]), "employeeName": n["employee_name"],
        "content": n["content"], "preview": n["preview"], "author": n["author"],
        "date": n["date"].isoformat() if n["date"] else None,
        "createdAt": n["created_at"].isoformat() if n["created_at"] else None,
        "meetingContext": n["meeting_context"], "aiHighlights": n["ai_highlights"] or []
    } for n in rows]

@app.post("/api/notes", status_code=201)
async def create_note(data: Dict[str, Any], db=Depends(get_db)):
    try:
        content = data.get("noteText") or data.get("content")
        date_str = data.get("date")
        date_val = datetime.fromisoformat(str(date_str).replace("Z", "+00:00")).date() if date_str else date.today()
        
        row = await db.fetchrow(
            """
            INSERT INTO notes (employee_id, employee_name, author, content, preview, date, meeting_context)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
            """,
            data.get("employeeId"), data.get("employeeName"), data.get("author", "HR User"), content,
            data.get("preview", content[:100] + ("..." if len(content) > 100 else "")),
            date_val, data.get("meetingContext")
        )
        
        # Pinecone
        try:
            await add_memory(f"note-{row['id']}", content, {
                "type": "note", "employee_id": data.get("employeeId"), "employee_name": data.get("employeeName", ""),
                "date": date_val.isoformat()
            })
        except Exception:
            pass
            
        await log_event("note_added", f"New manual note added", data.get("employeeId"), data.get("employeeName"))
        
        return {
            "id": str(row["id"]), "employeeId": str(row["employee_id"]), "employeeName": row["employee_name"],
            "content": row["content"], "preview": row["preview"], "author": row["author"],
            "date": row["date"].isoformat() if row["date"] else None,
            "createdAt": row["created_at"].isoformat() if row["created_at"] else None,
            "meetingContext": row["meeting_context"], "aiHighlights": row["ai_highlights"] or []
        }
    except Exception as e:
        logger.error(f"Failed to add note: {e}")
        raise HTTPException(status_code=500, detail="Failed to add note")

@app.delete("/api/notes/{id}")
async def delete_note(id: str, db=Depends(get_db)):
    try:
        note = await db.fetchrow("SELECT employee_id, employee_name FROM notes WHERE id = $1", id)
        await db.execute("DELETE FROM notes WHERE id = $1", id)
        await log_event("note_deleted", "Note removed", note["employee_id"], note["employee_name"]) if note else None
        return {"message": "Note deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to delete note")

# ============================================
# MEETINGS & COMMITMENTS ROUTES
# ============================================
@app.get("/api/meetings")
async def get_meetings(db=Depends(get_db)):
    rows = await db.fetch("SELECT * FROM meetings ORDER BY date DESC, time DESC")
    return [{
        "id": str(m["id"]), "employeeId": str(m["employee_id"]), "employeeName": m["employee_name"],
        "employeeDept": m["employee_dept"], "meetingType": m["meeting_type"], "date": m["date"].isoformat() if m["date"] else None,
        "time": m["time"], "duration": m["duration"], "aiStatus": m["ai_status"]
    } for m in rows]

@app.get("/api/meetings/upcoming")
async def get_upcoming_meetings(db=Depends(get_db)):
    rows = await db.fetch("SELECT * FROM meetings WHERE date >= CURRENT_DATE ORDER BY date ASC, time ASC LIMIT 5")
    return [{
        "id": str(m["id"]), "employeeId": str(m["employee_id"]), "employeeName": m["employee_name"],
        "employeeDept": m["employee_dept"], "meetingType": m["meeting_type"], "date": m["date"].isoformat() if m["date"] else None,
        "time": m["time"], "duration": m["duration"], "aiStatus": m["ai_status"]
    } for m in rows]

@app.get("/api/meetings/{id}")
async def get_meeting(id: str, db=Depends(get_db)):
    m = await db.fetchrow("SELECT * FROM meetings WHERE id = $1", id)
    if not m:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return {
        "id": str(m["id"]), "employeeId": str(m["employee_id"]), "employeeName": m["employee_name"],
        "employeeDept": m["employee_dept"], "meetingType": m["meeting_type"], "date": m["date"].isoformat() if m["date"] else None,
        "time": m["time"], "duration": m["duration"], "aiStatus": m["ai_status"]
    }

@app.post("/api/meetings", status_code=201)
async def create_meeting(data: Dict[str, Any], db=Depends(get_db)):
    try:
        emp_id = data.get("employeeId")
        date_str = data.get("date")
        date_str = data.get("date")
        if not emp_id or not date_str:
            raise HTTPException(status_code=400, detail="employeeId and date are required")
            
        date_val = datetime.fromisoformat(str(date_str).replace("Z", "+00:00")).date()
        m = await db.fetchrow(
            """
            INSERT INTO meetings (employee_id, employee_name, employee_dept, meeting_type, date, time, duration, ai_status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending') RETURNING *
            """,
            emp_id, data.get("employeeName"), data.get("employeeDept"), data.get("meetingType", "check-in"),
            date_val, data.get("time", "10:00"), data.get("duration", "30 min")
        )
        return {
            "id": str(m["id"]), "employeeId": str(m["employee_id"]), "employeeName": m["employee_name"],
            "employeeDept": m["employee_dept"], "meetingType": m["meeting_type"], "date": m["date"].isoformat() if m["date"] else None,
            "time": m["time"], "duration": m["duration"], "aiStatus": m["ai_status"]
        }
    except Exception as e:
        logger.error(f"Failed to create meeting: {e}")
        raise HTTPException(status_code=500, detail="Failed to create meeting")

@app.delete("/api/meetings/{meeting_id}")
async def delete_meeting(meeting_id: str, db=Depends(get_db)):
    try:
        meeting = await db.fetchrow("SELECT employee_name FROM meetings WHERE id = $1::uuid", meeting_id)
        if not meeting:
            raise HTTPException(status_code=404, detail="Meeting not found")
        await db.execute("DELETE FROM meetings WHERE id = $1::uuid", meeting_id)
        await log_event("meeting_deleted", f"Meeting with {meeting['employee_name']} cancelled", None, meeting['employee_name'])
        return {"message": "Meeting deleted"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete meeting: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete meeting")

@app.get("/api/commitments")
async def get_commitments(db=Depends(get_db)):
    rows = await db.fetch("SELECT * FROM commitments ORDER BY due_date ASC")
    return [{
        "id": str(c["id"]), "employeeId": str(c["employee_id"]), "employeeName": c["employee_name"],
        "text": c["text"], "dueDate": c["due_date"].isoformat() if c["due_date"] else None, "sourceMeeting": c["source_meeting"],
        "sourceMeetingDate": c["source_meeting_date"].isoformat() if c["source_meeting_date"] else None, "status": c["status"],
        "resolved": c["resolved"], "assignedHrbp": c["assigned_hrbp"], "createdDaysAgo": c["created_days_ago"]
    } for c in rows]

@app.post("/api/commitments/{id}/resolve")
async def resolve_commitment(id: str, db=Depends(get_db)):
    await db.execute("UPDATE commitments SET resolved = true, status = 'resolved' WHERE id = $1", id)
    return {"message": "Commitment resolved"}

@app.post("/api/commitments/{id}/unresolve")
async def unresolve_commitment(id: str, db=Depends(get_db)):
    await db.execute("UPDATE commitments SET resolved = false, status = 'on_track' WHERE id = $1", id)
    return {"message": "Commitment unresolved"}

# ============================================
# DEPARTMENTS, ANALYTICS, TEAM, ACTIVITIES
# ============================================
@app.get("/api/departments")
async def get_departments(db=Depends(get_db)):
    rows = await db.fetch("SELECT * FROM departments ORDER BY name")
    return [{
        "id": str(d["id"]), "name": d["name"], "employeeCount": d["employee_count"],
        "engagementScore": d["engagement_score"], "sentimentStatus": d["sentiment_status"],
        "delta": d["delta"], "hrbpAssigned": d["hrbp_assigned"], "meetingsLast30d": d["meetings_last_30d"]
    } for d in rows]

@app.get("/api/departments/{id}")
async def get_department(id: str, db=Depends(get_db)):
    d = await db.fetchrow("SELECT * FROM departments WHERE id = $1", id)
    if not d:
        raise HTTPException(status_code=404, detail="Department not found")
    return {
        "id": str(d["id"]), "name": d["name"], "employeeCount": d["employee_count"],
        "engagementScore": d["engagement_score"], "sentimentStatus": d["sentiment_status"],
        "delta": d["delta"], "hrbpAssigned": d["hrbp_assigned"], "meetingsLast30d": d["meetings_last_30d"]
    }

@app.get("/api/analytics/sentiment")
async def get_analytics_sentiment(db=Depends(get_db)):
    rows = await db.fetch("SELECT department, AVG(sentiment_score) as avg_score FROM employees GROUP BY department")
    return [{"department": r["department"], "averageScore": float(r["avg_score"] or 0)} for r in rows]

@app.get("/api/analytics/engagement")
async def get_analytics_engagement():
    return [
        {"month": "Jan", "score": 72}, {"month": "Feb", "score": 75}, {"month": "Mar", "score": 78},
        {"month": "Apr", "score": 83}, {"month": "May", "score": 85}, {"month": "Jun", "score": 82}
    ]

@app.get("/api/analytics/risk-heatmap")
async def get_analytics_risk():
    return [
        {"department": "Engineering", "critical": 2, "concern": 5, "watch": 12, "stable": 45},
        {"department": "Sales", "critical": 4, "concern": 8, "watch": 15, "stable": 30},
        {"department": "Marketing", "critical": 0, "concern": 2, "watch": 8, "stable": 25},
        {"department": "Product", "critical": 1, "concern": 3, "watch": 5, "stable": 15}
    ]

@app.get("/api/analytics/attrition")
async def get_analytics_attrition(db=Depends(get_db)):
    rows = await db.fetch(
        """
        SELECT department, COUNT(*) as total, SUM(CASE WHEN risk_tier IN ('critical', 'concern') THEN 1 ELSE 0 END) as at_risk
        FROM employees GROUP BY department
        """
    )
    return [{
        "department": r["department"], "total": r["total"], "atRisk": r["at_risk"],
        "rate": int((r["at_risk"] / r["total"]) * 100) if r["total"] > 0 else 0
    } for r in rows]

@app.get("/api/hr-team")
async def get_hr_team(db=Depends(get_db)):
    rows = await db.fetch("SELECT * FROM hr_team ORDER BY name")
    return [dict(r) for r in rows]

@app.post("/api/hr-team", status_code=201)
async def add_hr_team(data: Dict[str, Any], db=Depends(get_db)):
    row = await db.fetchrow(
        "INSERT INTO hr_team (name, email, role, department) VALUES ($1, $2, $3, $4) RETURNING *",
        data.get("name"), data.get("email"), data.get("role"), data.get("department")
    )
    return dict(row)

@app.get("/api/activities")
async def get_activities(db=Depends(get_db)):
    rows = await db.fetch("SELECT * FROM activities ORDER BY timestamp DESC LIMIT 20")
    return [{
        "id": str(a["id"]), "type": a["type"], "description": a["description"],
        "employeeName": a["employee_name"], "actedBy": a["acted_by"], 
        "timestamp": a["timestamp"].isoformat() if a["timestamp"] else None
    } for a in rows]

@app.get("/api/recent-changes")
async def get_recent_changes(db=Depends(get_db)):
    rows = await db.fetch("SELECT * FROM recent_changes ORDER BY timestamp DESC LIMIT 20")
    return [{
        "id": str(r["id"]), "eventType": r["event_type"], "description": r["description"],
        "employeeId": str(r["employee_id"]) if r["employee_id"] else None, "employeeName": r["employee_name"],
        "timestamp": r["timestamp"].isoformat() if r["timestamp"] else None
    } for r in rows]

# Mock OAuth endpoint matches
@app.get("/auth/zoho")
@app.get("/auth/google")
async def mock_oauth():
    return {"message": "OAuth mock endpoint"}

@app.get("/api/notifications")
async def get_notifications(db=Depends(get_db)):
    rows = await db.fetch("SELECT * FROM notifications ORDER BY timestamp DESC LIMIT 10")
    return [{
        "id": str(n["id"]), "source": n["source"], "summary": n["summary"],
        "read": n["read"], "actionLabel": n["action_label"], "actionLink": n["action_link"],
        "timestamp": n["timestamp"].isoformat() if n["timestamp"] else None
    } for n in rows]

@app.get("/api/risk-analysis")
async def get_risk_analysis(db=Depends(get_db)):
    critical = await db.fetchval("SELECT COUNT(*) FROM employees WHERE risk_tier = 'critical'")
    concern = await db.fetchval("SELECT COUNT(*) FROM employees WHERE risk_tier = 'concern'")
    watch = await db.fetchval("SELECT COUNT(*) FROM employees WHERE risk_tier = 'watch'")
    stable = await db.fetchval("SELECT COUNT(*) FROM employees WHERE risk_tier = 'stable'")
    
    return {
        "summary": {
            "critical": critical,
            "concern": concern,
            "watch": watch,
            "stable": stable, 
            "total": critical + concern + watch + stable
        },
        "factors": [
            {"name": "Low Sentiment", "weight": 40},
            {"name": "Meeting Absence", "weight": 25},
            {"name": "Unresolved Commitments", "weight": 20},
            {"name": "Negative AI Analysis", "weight": 15}
        ]
    }

# ============================================
# RESUME DOWNLOAD
# ============================================
@app.get("/api/employees/{emp_id}/resume")
async def download_resume(emp_id: str, db=Depends(get_db)):
    emp = await db.fetchrow("SELECT name FROM employees WHERE id = $1", emp_id)
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    pdf_path = os.path.join(os.path.dirname(__file__), "static", "sample_resume.pdf")
    if not os.path.exists(pdf_path):
        raise HTTPException(status_code=404, detail="Resume file not found")
    safe_name = emp["name"].replace(" ", "_")
    return FileResponse(pdf_path, media_type="application/pdf", filename=f"{safe_name}_Resume.pdf")

# ============================================
# ATS RESUME SCREENING PIPELINE
# ============================================
from fastapi import File, UploadFile

@app.post("/api/ats/upload")
async def ats_upload(files: List[UploadFile] = File(...)):
    """Step 1+2: Upload and process resumes — extract text and parse with Groq"""
    try:
        import PyPDF2
        import io
        
        candidates = []
        for f in files:
            content = await f.read()
            reader = PyPDF2.PdfReader(io.BytesIO(content))
            text = ""
            for page in reader.pages:
                text += page.extract_text() or ""
            
            # Use Groq to extract structured data from resume text
            parsed = {"name": "Unknown", "email": "", "phone": "", "skills": [], "experience": "", "education": "", "atsScore": 0}
            try:
                from services.groq_service import groq_client
                resp = groq_client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=[
                        {"role": "system", "content": "Extract structured resume data. Return ONLY valid JSON with keys: name, email, phone, skills (array of strings), experience (summary string), education (summary string), atsScore (0-100 integer based on formatting, completeness, keyword density). No markdown."},
                        {"role": "user", "content": f"Parse this resume:\n\n{text[:3000]}"}
                    ],
                    temperature=0,
                    max_tokens=800
                )
                raw = resp.choices[0].message.content.strip()
                # Remove markdown code fences if present
                if raw.startswith("```"):
                    raw = raw.split("\n", 1)[1] if "\n" in raw else raw[3:]
                    if raw.endswith("```"):
                        raw = raw[:-3]
                parsed = json.loads(raw)
            except Exception as e:
                logger.warning(f"Groq resume parse failed for {f.filename}: {e}")
                # Fallback: extract basic info from text
                lines = text.strip().split("\n")
                parsed["name"] = lines[0].strip() if lines else f.filename
                parsed["skills"] = []
                parsed["atsScore"] = 50
            
            candidates.append({
                "id": str(len(candidates) + 1),
                "filename": f.filename,
                "name": parsed.get("name", "Unknown"),
                "email": parsed.get("email", ""),
                "phone": parsed.get("phone", ""),
                "skills": parsed.get("skills", []),
                "experience": parsed.get("experience", ""),
                "education": parsed.get("education", ""),
                "atsScore": parsed.get("atsScore", 50),
                "rawText": text[:500]
            })
        
        return {"candidates": candidates, "total": len(candidates)}
    except Exception as e:
        logger.error(f"ATS upload failed: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail="Resume processing failed")

@app.post("/api/ats/filter")
async def ats_filter(data: Dict[str, Any]):
    """Step 3: Filter candidates by required skills"""
    try:
        candidates = data.get("candidates", [])
        required_skills = [s.lower().strip() for s in data.get("requiredSkills", [])]
        
        if not required_skills:
            return {"accepted": candidates, "rejected": [], "requiredSkills": required_skills}
        
        accepted = []
        rejected = []
        
        for c in candidates:
            candidate_skills = [s.lower().strip() for s in c.get("skills", [])]
            missing = [s for s in required_skills if not any(s in cs for cs in candidate_skills)]
            c["missingSkills"] = missing
            c["matchedSkills"] = [s for s in required_skills if any(s in cs for cs in candidate_skills)]
            if not missing:
                accepted.append(c)
            else:
                rejected.append(c)
        
        return {
            "accepted": accepted,
            "rejected": rejected,
            "requiredSkills": required_skills,
            "totalAccepted": len(accepted),
        }
    except Exception as e:
        logger.error(f"ATS filter failed: {e}")
        raise HTTPException(status_code=500, detail="Filtering failed")

# ============================================
# TRANSCRIPTS
# ============================================

