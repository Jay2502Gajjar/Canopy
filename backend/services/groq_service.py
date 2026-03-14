import os
import json
import logging
from groq import Groq

logger = logging.getLogger("canopy-backend")

# Initialize robustly for fastAPI (might be lazy eval if key not present)
groq_client = None

def get_client():
    global groq_client
    if groq_client is None:
        key = os.getenv("GROQ_API_KEY")
        if not key:
            raise Exception("GROQ_API_KEY is not set")
        groq_client = Groq(api_key=key)
    return groq_client

async def chat(message: str, context: dict, employee_data: list, memory_context: str) -> str:
    """Chat endpoint backing for AI assistant"""
    try:
        client = get_client()
        
        system_prompt = (
            "You are an expert HR Intelligence Assistant for a platform called Canopy. "
            "Your job is to help HR professionals (HRO, CHRO, HRBP) manage employees, "
            "analyze transcripts, identify burnout risks, and suggest actionable strategies. "
            "Use the provided context to base your answers on real data."
        )
        
        data_context = ""
        if employee_data:
            data_context += f"System Employee Data Summary ({len(employee_data)} employees total):\n"
            summary = [
                f"- {e.get('name')} (Dept: {e.get('department')}, Role: {e.get('role')}) " 
                f"- Sentiment: {e.get('sentiment_score')}/100, Risk: {e.get('risk_tier')}"
                for e in employee_data[:20] # Top 20 for context
            ]
            data_context += "\n".join(summary) + "\n\n"
            
        if memory_context:
            data_context += f"Relevant Memory Context (Transcripts, Notes, Commitments):\n{memory_context}\n\n"
            
        if context and context.get("employeeId"):
            data_context += f"Focus Context: User is looking at employee profile: {context.get('employeeId')}\n\n"

        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Context:\n{data_context}\n\nUser Query: {message}"}
            ],
            temperature=0.3,
            max_tokens=800,
        )
        return completion.choices[0].message.content
        
    except Exception as e:
        logger.error(f"Groq chat failed: {e}")
        return "I am experiencing connectivity issues right now. Please try again later."

async def analyze_transcript(transcript_text: str) -> dict:
    try:
        client = get_client()
        prompt = (
            "Analyze the following HR meeting transcript and output ONLY valid JSON containing:\n"
            "{\n"
            '  "summary": "2-3 sentence summary",\n'
            '  "sentimentScore": <integer 1-100>,\n'
            '  "actionItems": ["action 1", "action 2"],\n'
            '  "keyTopics": ["topic 1", "topic 2"],\n'
            '  "burnoutIndicators": ["indicator 1" or empty]\n'
            "}\n\n"
            f"Transcript:\n{transcript_text}"
        )
        
        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
            response_format={"type": "json_object"}
        )
        
        content = completion.choices[0].message.content
        return json.loads(content)
    except Exception as e:
        logger.error(f"Failed to analyze transcript: {e}")
        return {
            "summary": "Analysis failed",
            "sentimentScore": 50,
            "actionItems": [],
            "keyTopics": [],
            "burnoutIndicators": []
        }

async def employee_insights(employee: dict) -> list[str]:
    try:
        client = get_client()
        emp_json = json.dumps(employee, default=str)
        prompt = (
            "Based on the following employee profile data, generate 3 short, actionable HR insights. "
            "Output ONLY a JSON array of 3 strings.\n\n"
            f"{emp_json}"
        )
        
        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.4,
            response_format={"type": "json_object"} # groq supports json_object, not explicit array
        )
        
        # parse the fallback json wrapping
        content = completion.choices[0].message.content
        try:
            parsed = json.loads(content)
            if isinstance(parsed, list):
                return parsed
            if isinstance(parsed, dict):
                return parsed.get("insights", list(parsed.values())[0])
            return ["Review profile", "Schedule check-in"]
        except:
            return ["Analyze recent performance", "Check employee engagement", "Review commitments"]
            
    except Exception as e:
        logger.error(f"Employee insight failed: {e}")
        return ["Unable to generate insights right now."]

async def generate_meeting_brief(employee: dict, transcripts: list, notes: list, commitments: list) -> str:
    try:
        client = get_client()
        
        data = {
            "employee": employee,
            "recent_transcripts": [{"date": str(t.get("date")), "analysis": t.get("ai_analysis")} for t in transcripts],
            "recent_notes": [{"date": str(n.get("date")), "content": n.get("content")} for n in notes],
            "outstanding_commitments": [{"status": c.get("status"), "text": c.get("text")} for c in commitments]
        }
        
        prompt = (
            "You are an HR assistant preparing a brief for a manager conducting a check-in meeting. "
            "Based on this employee data, write a short, highly professional meeting preparation brief. "
            "Structure: 1) Status Summary, 2) Conversation Starters, 3) Items to Follow up on.\n"
            "Keep it concise, bulleted, and ready to read in 2 minutes.\n\n"
            f"{json.dumps(data, default=str)}"
        )
        
        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3
        )
        return completion.choices[0].message.content
    except Exception as e:
        logger.error(f"Meeting brief failed: {e}")
        raise e
