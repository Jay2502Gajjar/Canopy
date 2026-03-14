import os
import sys
import json
import asyncio
import asyncpg
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv

import bcrypt

def get_password_hash(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

# Load environment variables
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

async def seed():
    print("🌱 Starting database setup...\n")
    
    postgres_url = os.getenv("POSTGRES_URL")
    if not postgres_url:
        print("❌ POSTGRES_URL environment variable is not set")
        sys.exit(1)

    try:
        pool = await asyncpg.create_pool(dsn=postgres_url)
    except Exception as e:
        print(f"❌ Failed to connect to database: {e}")
        sys.exit(1)
        
    async with pool.acquire() as conn:
        # 1. Run schema
        print("📦 Creating tables...")
        schema_path = Path(__file__).parent / 'schema.sql'
        with open(schema_path, 'r', encoding='utf8') as f:
            schema = f.read()
        await conn.execute(schema)
        print("   ✅ Tables created\n")
        
        # 2. Seed default admin user
        print('👤 Creating default users...')
        password_hash = get_password_hash('admin123')
        
        users = [
            {"name": 'Sarah Mitchell', "email": 'sarah.mitchell@canopy.io', "role": 'hro'},
            {"name": 'James Wilson', "email": 'james.wilson@canopy.io', "role": 'chro'},
            {"name": 'Priya Sharma', "email": 'priya.sharma@canopy.io', "role": 'hrbp'},
        ]
        
        user_ids = {}
        for u in users:
            first_name = u["name"].split(' ')[0]
            row = await conn.fetchrow(
                """
                INSERT INTO users (name, first_name, email, role, password_hash, account_status, last_login)
                VALUES ($1, $2, $3, $4, $5, 'active', NOW())
                ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
                RETURNING id
                """,
                u["name"], first_name, u["email"], u["role"], password_hash
            )
            user_ids[u["role"]] = str(row["id"])
            print(f'   ✅ {u["name"]} ({u["role"]}) — password: admin123')
        print('')
        
        # 3. Seed employees
        print('👥 Creating employees...')
        employees = [
            {'id': 'e1', 'name': 'Rahul Kumar', 'email': 'rahul.kumar@canopy.io', 'role': 'Senior Engineer', 'department': 'Engineering', 'empId': 'EMP-1001', 'joinDate': '2023-06-15', 'tenure': '2y 9m', 'manager': 'Priya Sharma', 'sentiment': 42, 'trend': 'declining', 'memory': 78, 'risk': 'concern', 'lastInt': '2026-02-28', 'skills': ['React','Node.js','TypeScript','AWS'], 'projects': ['Platform Rebuild','API Gateway'], 'interests': ['Open source','Tech leadership','System design'], 'aspirations': ['Move into engineering management','Lead a product team']},
            {'id': 'e2', 'name': 'Ananya Patel', 'email': 'ananya.patel@canopy.io', 'role': 'Product Manager', 'department': 'Product', 'empId': 'EMP-1002', 'joinDate': '2022-03-10', 'tenure': '4y 0m', 'manager': 'Vikram Singh', 'sentiment': 85, 'trend': 'positive', 'memory': 92, 'risk': 'stable', 'lastInt': '2026-03-10', 'skills': ['Product Strategy','User Research','Roadmapping','Agile'], 'projects': ['Customer Portal','Mobile App v2'], 'interests': ['UX research','Data-driven decisions'], 'aspirations': ['VP of Product within 3 years']},
            {'id': 'e3', 'name': 'Deepak Verma', 'email': 'deepak.verma@canopy.io', 'role': 'QA Lead', 'department': 'Engineering', 'empId': 'EMP-1003', 'joinDate': '2021-08-22', 'tenure': '4y 7m', 'manager': 'Priya Sharma', 'sentiment': 35, 'trend': 'declining', 'memory': 45, 'risk': 'critical', 'lastInt': '2026-01-05', 'skills': ['Automation Testing','Selenium','CI/CD','Performance Testing'], 'projects': ['QA Framework','Release Pipeline'], 'interests': ['DevOps','Quality culture'], 'aspirations': ['Transition to Engineering Manager role']},
            {'id': 'e4', 'name': 'Meera Nair', 'email': 'meera.nair@canopy.io', 'role': 'UX Designer', 'department': 'Design', 'empId': 'EMP-1004', 'joinDate': '2024-01-10', 'tenure': '2y 2m', 'manager': 'Arjun Rao', 'sentiment': 68, 'trend': 'neutral', 'memory': 55, 'risk': 'watch', 'lastInt': '2026-03-01', 'skills': ['Figma','User Research','Design Systems','Prototyping'], 'projects': ['Design System v2','Customer Portal'], 'interests': ['Accessibility','Design thinking'], 'aspirations': ['Lead a design team','Speak at design conferences']},
            {'id': 'e5', 'name': 'Arjun Menon', 'email': 'arjun.menon@canopy.io', 'role': 'Sales Director', 'department': 'Sales', 'empId': 'EMP-1005', 'joinDate': '2020-11-05', 'tenure': '5y 4m', 'manager': 'Kavitha Das', 'sentiment': 52, 'trend': 'declining', 'memory': 62, 'risk': 'concern', 'lastInt': '2026-02-15', 'skills': ['Enterprise Sales','Negotiation','CRM','Team Leadership'], 'projects': ['Q1 Revenue Target','Partner Channel'], 'interests': ['Mentoring juniors','Golf'], 'aspirations': ['VP Sales','Build APAC sales division']},
            {'id': 'e6', 'name': 'Kavitha Das', 'email': 'kavitha.das@canopy.io', 'role': 'VP Operations', 'department': 'Operations', 'empId': 'EMP-1006', 'joinDate': '2019-04-01', 'tenure': '6y 11m', 'manager': 'CEO', 'sentiment': 78, 'trend': 'positive', 'memory': 88, 'risk': 'stable', 'lastInt': '2026-03-12', 'skills': ['Operations Strategy','Process Optimization','Budgeting','Vendor Management'], 'projects': ['Ops Excellence Program','Cost Optimization'], 'interests': ['Leadership coaching','Running'], 'aspirations': ['COO track']},
            {'id': 'e7', 'name': 'Siddharth Joshi', 'email': 'sid.joshi@canopy.io', 'role': 'Data Analyst', 'department': 'Engineering', 'empId': 'EMP-1007', 'joinDate': '2024-07-20', 'tenure': '1y 8m', 'manager': 'Priya Sharma', 'sentiment': 60, 'trend': 'neutral', 'memory': 38, 'risk': 'watch', 'lastInt': '2026-02-20', 'skills': ['Python','SQL','Tableau','Machine Learning'], 'projects': ['Analytics Dashboard','Data Pipeline'], 'interests': ['AI/ML research','Chess'], 'aspirations': ['Become a lead data scientist']},
            {'id': 'e8', 'name': 'Nisha Reddy', 'email': 'nisha.reddy@canopy.io', 'role': 'Marketing Manager', 'department': 'Marketing', 'empId': 'EMP-1008', 'joinDate': '2022-09-12', 'tenure': '3y 6m', 'manager': 'Vikram Singh', 'sentiment': 74, 'trend': 'positive', 'memory': 72, 'risk': 'stable', 'lastInt': '2026-03-08', 'skills': ['Content Strategy','SEO','Brand Management','Analytics'], 'projects': ['Brand Refresh','Lead Gen Campaign'], 'interests': ['Creative writing','Photography'], 'aspirations': ['Head of Marketing','Build a content studio']},
        ]
        
        emp_db_ids = {}
        for emp in employees:
            j_date = f"{emp['joinDate']}T00:00:00Z"
            l_int = f"{emp['lastInt']}T00:00:00Z"
            row = await conn.fetchrow(
                """
                INSERT INTO employees (name, email, role, department, employee_id, join_date, tenure, reporting_manager, employment_type, sentiment_score, sentiment_trend, memory_score, risk_tier, last_interaction, skills, projects, interests, career_aspirations)
                VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'Full-time',$9,$10,$11,$12,$13,$14,$15,$16,$17)
                ON CONFLICT (email) DO UPDATE SET
                  sentiment_score = EXCLUDED.sentiment_score, risk_tier = EXCLUDED.risk_tier,
                  skills = EXCLUDED.skills, projects = EXCLUDED.projects
                RETURNING id
                """,
                emp['name'], emp['email'], emp['role'], emp['department'], emp['empId'],
                datetime.fromisoformat(emp['joinDate']).date(), emp['tenure'], emp['manager'], emp['sentiment'], emp['trend'],
                emp['memory'], emp['risk'], datetime.fromisoformat(emp['lastInt']).date(), emp['skills'], emp['projects'], emp['interests'], emp['aspirations']
            )
            emp_db_ids[emp['id']] = str(row['id'])
            print(f"   ✅ {emp['name']} ({emp['department']})")
        print('')
        
        # 4. Seed concerns
        print('⚠️  Creating employee concerns...')
        concerns = [
            {'empKey': 'e1', 'text': 'Feeling overworked with Platform Rebuild deadlines', 'date': '2026-02-28', 'ref': 'Check-in Feb 28'},
            {'empKey': 'e1', 'text': 'Concerned about limited growth opportunities', 'date': '2026-01-15', 'ref': 'Performance Review Q1'},
            {'empKey': 'e3', 'text': 'Team is too small for workload', 'date': '2026-01-05', 'ref': 'Check-in Jan 5'},
            {'empKey': 'e3', 'text': 'No recognition for overtime during releases', 'date': '2025-11-20', 'ref': '1-on-1 Nov'},
            {'empKey': 'e3', 'text': 'Frustrated with lack of promotion clarity', 'date': '2025-10-10', 'ref': 'Performance Review Q3'},
            {'empKey': 'e4', 'text': 'Concerned about siloed work between design and engineering', 'date': '2026-03-01', 'ref': 'Check-in Mar 1'},
            {'empKey': 'e5', 'text': 'Sales targets may be unrealistic given market conditions', 'date': '2026-02-15', 'ref': 'Check-in Feb 15'},
            {'empKey': 'e5', 'text': 'Losing experienced team members to competitors', 'date': '2026-01-20', 'ref': '1-on-1 Jan'},
            {'empKey': 'e7', 'text': 'Would like more challenging projects', 'date': '2026-02-20', 'ref': 'Check-in Feb 20'},
        ]
        for c in concerns:
            await conn.execute(
                'INSERT INTO employee_concerns (employee_id, text, date, meeting_ref) VALUES ($1,$2,$3,$4)',
                emp_db_ids[c['empKey']], c['text'], datetime.fromisoformat(c['date']).date(), c['ref']
            )
        print(f"   ✅ {len(concerns)} concerns created\n")

        # 5. Seed sentiment history
        print('📊 Creating sentiment history...')
        sentiment_data = {
            'e1': [{'d': '2025-10-01', 's': 72},{'d': '2025-11-01', 's': 65},{'d': '2025-12-01', 's': 58},{'d': '2026-01-01', 's': 50},{'d': '2026-02-01', 's': 42}],
            'e2': [{'d': '2025-10-01', 's': 80},{'d': '2025-11-01', 's': 82},{'d': '2025-12-01', 's': 78},{'d': '2026-01-01', 's': 84},{'d': '2026-02-01', 's': 85}],
            'e3': [{'d': '2025-10-01', 's': 55},{'d': '2025-11-01', 's': 48},{'d': '2025-12-01', 's': 42},{'d': '2026-01-01', 's': 35},{'d': '2026-02-01', 's': 35}],
            'e4': [{'d': '2025-10-01', 's': 70},{'d': '2025-11-01', 's': 72},{'d': '2025-12-01', 's': 68},{'d': '2026-01-01', 's': 65},{'d': '2026-02-01', 's': 68}],
            'e5': [{'d': '2025-10-01', 's': 65},{'d': '2025-11-01', 's': 60},{'d': '2025-12-01', 's': 58},{'d': '2026-01-01', 's': 55},{'d': '2026-02-01', 's': 52}],
            'e6': [{'d': '2025-10-01', 's': 75},{'d': '2025-11-01', 's': 76},{'d': '2025-12-01', 's': 78},{'d': '2026-01-01', 's': 77},{'d': '2026-02-01', 's': 78}],
            'e7': [{'d': '2025-10-01', 's': 65},{'d': '2025-11-01', 's': 63},{'d': '2025-12-01', 's': 60},{'d': '2026-01-01', 's': 62},{'d': '2026-02-01', 's': 60}],
            'e8': [{'d': '2025-10-01', 's': 70},{'d': '2025-11-01', 's': 72},{'d': '2025-12-01', 's': 73},{'d': '2026-01-01', 's': 74},{'d': '2026-02-01', 's': 74}],
        }
        sent_count = 0
        for empKey, history in sentiment_data.items():
            for h in history:
                await conn.execute('INSERT INTO sentiment_history (employee_id, date, score) VALUES ($1,$2,$3)', emp_db_ids[empKey], datetime.fromisoformat(h['d']).date(), h['s'])
                sent_count += 1
        print(f"   ✅ {sent_count} sentiment records\n")

        # 6. Seed departments
        print('🏢 Creating departments...')
        departments = [
            {'name': 'Engineering', 'count': 45, 'score': 62, 'status': 'burnout_signals', 'delta': -5, 'hrbp': 'Priya Sharma', 'meetings': 8},
            {'name': 'Product', 'count': 18, 'score': 81, 'status': 'stable', 'delta': 3, 'hrbp': 'Vikram Singh', 'meetings': 6},
            {'name': 'Design', 'count': 12, 'score': 70, 'status': 'stable', 'delta': -1, 'hrbp': 'Arjun Rao', 'meetings': 4},
            {'name': 'Sales', 'count': 32, 'score': 55, 'status': 'declining', 'delta': -8, 'hrbp': 'Kavitha Das', 'meetings': 3},
            {'name': 'Marketing', 'count': 15, 'score': 76, 'status': 'stable', 'delta': 2, 'hrbp': 'Vikram Singh', 'meetings': 5},
            {'name': 'Operations', 'count': 22, 'score': 72, 'status': 'stable', 'delta': 1, 'hrbp': 'Kavitha Das', 'meetings': 4},
            {'name': 'Finance', 'count': 10, 'score': 68, 'status': 'low_hr_coverage', 'delta': 0, 'hrbp': None, 'meetings': 1},
        ]
        for d in departments:
            await conn.execute(
                """
                INSERT INTO departments (name, employee_count, engagement_score, sentiment_status, delta, hrbp_assigned, meetings_last_30d)
                VALUES ($1,$2,$3,$4,$5,$6,$7)
                ON CONFLICT (name) DO UPDATE SET engagement_score = EXCLUDED.engagement_score
                """,
                d['name'], d['count'], d['score'], d['status'], d['delta'], d['hrbp'], d['meetings']
            )
        print(f"   ✅ {len(departments)} departments\n")

        # 7. Seed commitments
        print('📋 Creating commitments...')
        commitments = [
            {'empKey': 'e1', 'text': 'Discuss promotion timeline and criteria', 'due': '2026-03-15', 'src': 'Check-in', 'srcDate': '2026-02-28', 'status': 'due_soon', 'resolved': False, 'days': 13},
            {'empKey': 'e3', 'text': 'Review QA team headcount request', 'due': '2026-02-28', 'src': 'Check-in', 'srcDate': '2026-01-05', 'status': 'overdue', 'resolved': False, 'days': 67},
            {'empKey': 'e5', 'text': 'Revisit Q2 sales targets with leadership', 'due': '2026-03-20', 'src': 'Check-in', 'srcDate': '2026-02-15', 'status': 'on_track', 'resolved': False, 'days': 26},
            {'empKey': 'e4', 'text': 'Schedule cross-team workshop with engineering', 'due': '2026-03-10', 'src': 'Check-in', 'srcDate': '2026-03-01', 'status': 'overdue', 'resolved': False, 'days': 12},
            {'empKey': 'e7', 'text': 'Identify stretch project for data science exposure', 'due': '2026-03-25', 'src': 'Check-in', 'srcDate': '2026-02-20', 'status': 'on_track', 'resolved': False, 'days': 21},
            {'empKey': 'e2', 'text': 'Share VP Product career development resources', 'due': '2026-02-20', 'src': 'Performance Review', 'srcDate': '2026-01-15', 'status': 'resolved', 'resolved': True, 'days': 57},
        ]
        for c in commitments:
            emp_name = next(e['name'] for e in employees if e['id'] == c['empKey'])
            await conn.execute(
                """
                INSERT INTO commitments (employee_id, employee_name, text, due_date, source_meeting, source_meeting_date, status, resolved, created_days_ago)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                """,
                emp_db_ids[c['empKey']], emp_name, c['text'], datetime.fromisoformat(c['due']).date(), c['src'], datetime.fromisoformat(c['srcDate']).date(), c['status'], c['resolved'], c['days']
            )
        print(f"   ✅ {len(commitments)} commitments\n")

        # 8. Seed meetings
        print('📅 Creating meetings...')
        meetings = [
            {'empKey': 'e1', 'type': 'check-in', 'date': '2026-03-15', 'time': '10:00 AM'},
            {'empKey': 'e3', 'type': '1-on-1', 'date': '2026-03-16', 'time': '2:00 PM'},
            {'empKey': 'e5', 'type': 'check-in', 'date': '2026-03-17', 'time': '11:30 AM'},
            {'empKey': 'e4', 'type': 'casual', 'date': '2026-03-18', 'time': '3:00 PM'},
        ]
        for m in meetings:
            emp = next(e for e in employees if e['id'] == m['empKey'])
            await conn.execute(
                """
                INSERT INTO meetings (employee_id, employee_name, employee_dept, meeting_type, date, time, ai_status)
                VALUES ($1,$2,$3,$4,$5,$6,'pending')
                """,
                emp_db_ids[m['empKey']], emp['name'], emp['department'], m['type'], datetime.fromisoformat(m['date']).date(), m['time']
            )
        print(f"   ✅ {len(meetings)} meetings\n")

        # 9. Seed transcripts (subset for python port brevity, but maintaining the same structure)
        print('📝 Creating transcripts...')
        t1Content = [
            {'speaker': 'HR Leader', 'text': 'Hi Rahul, thanks for making time today. How have things been since our last chat?'},
            {'speaker': 'Employee', 'text': "Honestly, it's been a bit rough. The Platform Rebuild deadlines are really tight and I feel like I'm carrying a lot of the technical decisions alone."},
            {'speaker': 'HR Leader', 'text': "I understand. That sounds like a lot of pressure. Has your manager been able to support you with the workload?"},
            {'speaker': 'Employee', 'text': "Priya tries, but she's stretched thin too. I think we need more senior engineers on the project."},
            {'speaker': 'HR Leader', 'text': "That's a valid concern. Let me look into the resourcing situation. On another note, you mentioned wanting to move into management — is that still something you're interested in?"},
            {'speaker': 'Employee', 'text': "Definitely. But I don't see a clear path here. I've been a senior engineer for two years now and nobody has talked to me about what it takes to get promoted."},
            {'speaker': 'HR Leader', 'text': "I'll make sure we discuss a promotion timeline and criteria with you in our next session. I want to make sure you feel valued here."},
            {'speaker': 'Employee', 'text': "I appreciate that. I just want clarity — that would go a long way."},
        ]
        t1Analysis = {
            'keyHighlights': ['Employee feels overwhelmed with Platform Rebuild workload', 'Requests more senior engineering support', 'Strong interest in engineering management career path', 'Lacks clarity on promotion criteria — has been waiting 2 years'],
            'sentimentScore': 42, 'sentimentLabel': 'Declining — signs of frustration and burnout',
            'keyTopics': ['Workload', 'Career Growth', 'Promotion', 'Team Resourcing'],
            'careerGoals': ['Engineering management', 'Product team leadership'],
            'concerns': ['Overwork and burnout risk', 'Unclear promotion path', 'Insufficient team support'],
            'actionItems': ['Discuss promotion timeline', 'Review team resourcing for Platform Rebuild', 'Follow up on management track'],
        }

        await conn.execute(
            """
            INSERT INTO transcripts (employee_id, employee_name, employee_dept, meeting_type, date, duration, ai_status, content, ai_analysis)
            VALUES ($1,$2,'Engineering','check-in',$3,'35 min','analysed',$4,$5)
            """,
            emp_db_ids['e1'], 'Rahul Kumar', datetime.fromisoformat('2026-02-28').date(), json.dumps(t1Content), json.dumps(t1Analysis)
        )
        print('   ✅ Transcripts seeded\n')

        # 10. Seed notes
        print('🗒️  Creating HR notes...')
        notes = [
            {'empKey': 'e1', 'content': "Rahul seems genuinely frustrated about the promotion situation. Need to accelerate the conversation with engineering leadership about creating a clear management track for senior engineers.", 'date': '2026-03-01', 'author': 'Sarah Mitchell', 'context': 'Post check-in Feb 28', 'highlights': ['Promotion frustration at tipping point', 'Management track needed for senior engineers']},
            {'empKey': 'e3', 'content': "Deepak's situation is concerning. He's been overlooked for months despite putting in significant overtime. Need to push the headcount request harder.", 'date': '2026-01-08', 'author': 'Sarah Mitchell', 'context': 'Post check-in Jan 5', 'highlights': ['Critical capacity issue in QA', 'Headcount request needs escalation']},
            {'empKey': 'e5', 'content': "The sales team is under heavy pressure. Arjun is putting on a brave face but losing two experienced reps last quarter has clearly impacted morale.", 'date': '2026-02-16', 'author': 'Sarah Mitchell', 'context': None, 'highlights': ['Team attrition impacting morale', 'Targets not adjusted post-attrition']},
        ]
        for n in notes:
            preview = n['content'][:80] + '...'
            emp_name = next(e['name'] for e in employees if e['id'] == n['empKey'])
            await conn.execute(
                """
                INSERT INTO notes (employee_id, employee_name, content, preview, date, author, meeting_context, ai_highlights)
                VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
                """,
                emp_db_ids[n['empKey']], emp_name, n['content'], preview, datetime.fromisoformat(n['date']).date(), n['author'], n['context'], n['highlights']
            )
        print(f"   ✅ {len(notes)} notes\n")

        # 11. Seed notifications
        print('🔔 Creating notifications...')
        notifications = [
            {'source': 'ai', 'summary': 'Deepak Verma flagged as critical retention risk — 67 days without check-in', 'read': False, 'label': 'View Employee', 'link': '/hro/employees/e3'},
            {'source': 'system', 'summary': 'Transcript analysis complete for Rahul Kumar check-in (Feb 28)', 'read': False, 'label': 'View Analysis', 'link': '/hro/transcripts/t1'},
            {'source': 'ai', 'summary': 'New commitment extracted: "Discuss promotion timeline" for Rahul Kumar', 'read': True},
            {'source': 'email', 'summary': 'Leave request from Meera Nair — 3 days starting March 20', 'read': True, 'label': 'Review', 'link': '#'},
            {'source': 'ai', 'summary': 'Burnout signals detected in Engineering department — 4 employees affected', 'read': True, 'label': 'Investigate', 'link': '/hro/risk'},
        ]
        for n in notifications:
            await conn.execute(
                """
                INSERT INTO notifications (user_id, source, summary, read, action_label, action_link)
                VALUES ($1,$2,$3,$4,$5,$6)
                """,
                user_ids.get("hro"), n['source'], n['summary'], n['read'], n.get('label'), n.get('link')
            )
        print(f"   ✅ {len(notifications)} notifications\n")

        # 12. Seed activities
        print('📜 Creating activity log...')
        activities = [
            {'type': 'resignation_flagged', 'desc': 'AI flagged potential resignation risk', 'emp': 'Deepak Verma', 'by': 'AI System', 'ts': '2026-03-13T16:00:00Z'},
            {'type': 'profile_update', 'desc': 'Transcript analysis completed and insights saved', 'emp': 'Rahul Kumar', 'by': 'AI System', 'ts': '2026-03-13T14:30:00Z'},
            {'type': 'leave_approval', 'desc': 'Annual leave approved (Mar 20-22)', 'emp': 'Meera Nair', 'by': 'Sarah Mitchell', 'ts': '2026-03-13T10:15:00Z'},
            {'type': 'promotion', 'desc': 'Promoted from Senior PM to Lead PM', 'emp': 'Ananya Patel', 'by': 'HR Admin', 'ts': '2026-03-10T09:00:00Z'},
            {'type': 'new_hire', 'desc': 'Onboarding initiated for new Data Engineer', 'emp': 'Rohan Mehta', 'by': 'Sarah Mitchell', 'ts': '2026-03-08T11:00:00Z'},
            {'type': 'role_change', 'desc': 'Moved from Engineering to Product team', 'emp': 'Priya Iyer', 'by': 'HR Admin', 'ts': '2026-03-05T14:00:00Z'},
        ]
        for a in activities:
            await conn.execute(
                'INSERT INTO activities (type, description, employee_name, acted_by, timestamp) VALUES ($1,$2,$3,$4,$5)',
                a['type'], a['desc'], a['emp'], a['by'], datetime.fromisoformat(a['ts'].replace('Z', '+00:00'))
            )
        print(f"   ✅ {len(activities)} activities\n")

        print('═══════════════════════════════════════')
        print('🎉 Database seeded successfully!')
        print('═══════════════════════════════════════\n')
        print('Default login credentials:')
        print('  HRO:  sarah.mitchell@canopy.io / admin123')
        print('  CHRO: james.wilson@canopy.io / admin123')
        print('  HRBP: priya.sharma@canopy.io / admin123\n')

    await pool.close()

if __name__ == "__main__":
    asyncio.run(seed())
