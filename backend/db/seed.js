/**
 * Database Seed Script
 * Run: node db/seed.js
 *
 * Creates all tables and populates with the same data the frontend uses,
 * so the dashboards work immediately.
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: process.env.POSTGRES_URL?.includes('sslmode=require')
    ? { rejectUnauthorized: false }
    : false,
});

async function seed() {
  console.log('🌱 Starting database setup...\n');

  // 1. Run schema
  console.log('📦 Creating tables...');
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await pool.query(schema);
  console.log('   ✅ Tables created\n');

  // 2. Seed default admin user
  console.log('👤 Creating default users...');
  const passwordHash = await bcrypt.hash('admin123', 12);

  const users = [
    { name: 'Sarah Mitchell', email: 'sarah.mitchell@canopy.io', role: 'hro' },
    { name: 'James Wilson', email: 'james.wilson@canopy.io', role: 'chro' },
    { name: 'Priya Sharma', email: 'priya.sharma@canopy.io', role: 'hrbp' },
  ];

  const userIds = {};
  for (const u of users) {
    const res = await pool.query(
      `INSERT INTO users (name, first_name, email, role, password_hash, account_status, last_login)
       VALUES ($1, $2, $3, $4, $5, 'active', NOW())
       ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [u.name, u.name.split(' ')[0], u.email, u.role, passwordHash]
    );
    userIds[u.role] = res.rows[0].id;
    console.log(`   ✅ ${u.name} (${u.role}) — password: admin123`);
  }
  console.log('');

  // 3. Seed employees
  console.log('👥 Creating employees...');
  const employees = [
    { id: 'e1', name: 'Rahul Kumar', email: 'rahul.kumar@canopy.io', role: 'Senior Engineer', department: 'Engineering', empId: 'EMP-1001', joinDate: '2023-06-15', tenure: '2y 9m', manager: 'Priya Sharma', sentiment: 42, trend: 'declining', memory: 78, risk: 'concern', lastInt: '2026-02-28', skills: ['React','Node.js','TypeScript','AWS'], projects: ['Platform Rebuild','API Gateway'], interests: ['Open source','Tech leadership','System design'], aspirations: ['Move into engineering management','Lead a product team'] },
    { id: 'e2', name: 'Ananya Patel', email: 'ananya.patel@canopy.io', role: 'Product Manager', department: 'Product', empId: 'EMP-1002', joinDate: '2022-03-10', tenure: '4y 0m', manager: 'Vikram Singh', sentiment: 85, trend: 'positive', memory: 92, risk: 'stable', lastInt: '2026-03-10', skills: ['Product Strategy','User Research','Roadmapping','Agile'], projects: ['Customer Portal','Mobile App v2'], interests: ['UX research','Data-driven decisions'], aspirations: ['VP of Product within 3 years'] },
    { id: 'e3', name: 'Deepak Verma', email: 'deepak.verma@canopy.io', role: 'QA Lead', department: 'Engineering', empId: 'EMP-1003', joinDate: '2021-08-22', tenure: '4y 7m', manager: 'Priya Sharma', sentiment: 35, trend: 'declining', memory: 45, risk: 'critical', lastInt: '2026-01-05', skills: ['Automation Testing','Selenium','CI/CD','Performance Testing'], projects: ['QA Framework','Release Pipeline'], interests: ['DevOps','Quality culture'], aspirations: ['Transition to Engineering Manager role'] },
    { id: 'e4', name: 'Meera Nair', email: 'meera.nair@canopy.io', role: 'UX Designer', department: 'Design', empId: 'EMP-1004', joinDate: '2024-01-10', tenure: '2y 2m', manager: 'Arjun Rao', sentiment: 68, trend: 'neutral', memory: 55, risk: 'watch', lastInt: '2026-03-01', skills: ['Figma','User Research','Design Systems','Prototyping'], projects: ['Design System v2','Customer Portal'], interests: ['Accessibility','Design thinking'], aspirations: ['Lead a design team','Speak at design conferences'] },
    { id: 'e5', name: 'Arjun Menon', email: 'arjun.menon@canopy.io', role: 'Sales Director', department: 'Sales', empId: 'EMP-1005', joinDate: '2020-11-05', tenure: '5y 4m', manager: 'Kavitha Das', sentiment: 52, trend: 'declining', memory: 62, risk: 'concern', lastInt: '2026-02-15', skills: ['Enterprise Sales','Negotiation','CRM','Team Leadership'], projects: ['Q1 Revenue Target','Partner Channel'], interests: ['Mentoring juniors','Golf'], aspirations: ['VP Sales','Build APAC sales division'] },
    { id: 'e6', name: 'Kavitha Das', email: 'kavitha.das@canopy.io', role: 'VP Operations', department: 'Operations', empId: 'EMP-1006', joinDate: '2019-04-01', tenure: '6y 11m', manager: 'CEO', sentiment: 78, trend: 'positive', memory: 88, risk: 'stable', lastInt: '2026-03-12', skills: ['Operations Strategy','Process Optimization','Budgeting','Vendor Management'], projects: ['Ops Excellence Program','Cost Optimization'], interests: ['Leadership coaching','Running'], aspirations: ['COO track'] },
    { id: 'e7', name: 'Siddharth Joshi', email: 'sid.joshi@canopy.io', role: 'Data Analyst', department: 'Engineering', empId: 'EMP-1007', joinDate: '2024-07-20', tenure: '1y 8m', manager: 'Priya Sharma', sentiment: 60, trend: 'neutral', memory: 38, risk: 'watch', lastInt: '2026-02-20', skills: ['Python','SQL','Tableau','Machine Learning'], projects: ['Analytics Dashboard','Data Pipeline'], interests: ['AI/ML research','Chess'], aspirations: ['Become a lead data scientist'] },
    { id: 'e8', name: 'Nisha Reddy', email: 'nisha.reddy@canopy.io', role: 'Marketing Manager', department: 'Marketing', empId: 'EMP-1008', joinDate: '2022-09-12', tenure: '3y 6m', manager: 'Vikram Singh', sentiment: 74, trend: 'positive', memory: 72, risk: 'stable', lastInt: '2026-03-08', skills: ['Content Strategy','SEO','Brand Management','Analytics'], projects: ['Brand Refresh','Lead Gen Campaign'], interests: ['Creative writing','Photography'], aspirations: ['Head of Marketing','Build a content studio'] },
  ];

  const empDbIds = {};

  for (const emp of employees) {
    const res = await pool.query(
      `INSERT INTO employees (name, email, role, department, employee_id, join_date, tenure, reporting_manager, employment_type, sentiment_score, sentiment_trend, memory_score, risk_tier, last_interaction, skills, projects, interests, career_aspirations)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'Full-time',$9,$10,$11,$12,$13,$14,$15,$16,$17)
       ON CONFLICT (email) DO UPDATE SET
         sentiment_score = EXCLUDED.sentiment_score, risk_tier = EXCLUDED.risk_tier,
         skills = EXCLUDED.skills, projects = EXCLUDED.projects
       RETURNING id`,
      [emp.name, emp.email, emp.role, emp.department, emp.empId, emp.joinDate, emp.tenure, emp.manager, emp.sentiment, emp.trend, emp.memory, emp.risk, emp.lastInt, emp.skills, emp.projects, emp.interests, emp.aspirations]
    );
    empDbIds[emp.id] = res.rows[0].id;
    console.log(`   ✅ ${emp.name} (${emp.department})`);
  }
  console.log('');

  // 4. Seed concerns
  console.log('⚠️  Creating employee concerns...');
  const concerns = [
    { empKey: 'e1', text: 'Feeling overworked with Platform Rebuild deadlines', date: '2026-02-28', ref: 'Check-in Feb 28' },
    { empKey: 'e1', text: 'Concerned about limited growth opportunities', date: '2026-01-15', ref: 'Performance Review Q1' },
    { empKey: 'e3', text: 'Team is too small for workload', date: '2026-01-05', ref: 'Check-in Jan 5' },
    { empKey: 'e3', text: 'No recognition for overtime during releases', date: '2025-11-20', ref: '1-on-1 Nov' },
    { empKey: 'e3', text: 'Frustrated with lack of promotion clarity', date: '2025-10-10', ref: 'Performance Review Q3' },
    { empKey: 'e4', text: 'Concerned about siloed work between design and engineering', date: '2026-03-01', ref: 'Check-in Mar 1' },
    { empKey: 'e5', text: 'Sales targets may be unrealistic given market conditions', date: '2026-02-15', ref: 'Check-in Feb 15' },
    { empKey: 'e5', text: 'Losing experienced team members to competitors', date: '2026-01-20', ref: '1-on-1 Jan' },
    { empKey: 'e7', text: 'Would like more challenging projects', date: '2026-02-20', ref: 'Check-in Feb 20' },
  ];
  for (const c of concerns) {
    await pool.query(
      'INSERT INTO employee_concerns (employee_id, text, date, meeting_ref) VALUES ($1,$2,$3,$4)',
      [empDbIds[c.empKey], c.text, c.date, c.ref]
    );
  }
  console.log(`   ✅ ${concerns.length} concerns created\n`);

  // 5. Seed sentiment history
  console.log('📊 Creating sentiment history...');
  const sentimentData = {
    e1: [{ d: '2025-10-01', s: 72 },{ d: '2025-11-01', s: 65 },{ d: '2025-12-01', s: 58 },{ d: '2026-01-01', s: 50 },{ d: '2026-02-01', s: 42 }],
    e2: [{ d: '2025-10-01', s: 80 },{ d: '2025-11-01', s: 82 },{ d: '2025-12-01', s: 78 },{ d: '2026-01-01', s: 84 },{ d: '2026-02-01', s: 85 }],
    e3: [{ d: '2025-10-01', s: 55 },{ d: '2025-11-01', s: 48 },{ d: '2025-12-01', s: 42 },{ d: '2026-01-01', s: 35 },{ d: '2026-02-01', s: 35 }],
    e4: [{ d: '2025-10-01', s: 70 },{ d: '2025-11-01', s: 72 },{ d: '2025-12-01', s: 68 },{ d: '2026-01-01', s: 65 },{ d: '2026-02-01', s: 68 }],
    e5: [{ d: '2025-10-01', s: 65 },{ d: '2025-11-01', s: 60 },{ d: '2025-12-01', s: 58 },{ d: '2026-01-01', s: 55 },{ d: '2026-02-01', s: 52 }],
    e6: [{ d: '2025-10-01', s: 75 },{ d: '2025-11-01', s: 76 },{ d: '2025-12-01', s: 78 },{ d: '2026-01-01', s: 77 },{ d: '2026-02-01', s: 78 }],
    e7: [{ d: '2025-10-01', s: 65 },{ d: '2025-11-01', s: 63 },{ d: '2025-12-01', s: 60 },{ d: '2026-01-01', s: 62 },{ d: '2026-02-01', s: 60 }],
    e8: [{ d: '2025-10-01', s: 70 },{ d: '2025-11-01', s: 72 },{ d: '2025-12-01', s: 73 },{ d: '2026-01-01', s: 74 },{ d: '2026-02-01', s: 74 }],
  };
  let sentCount = 0;
  for (const [empKey, history] of Object.entries(sentimentData)) {
    for (const h of history) {
      await pool.query('INSERT INTO sentiment_history (employee_id, date, score) VALUES ($1,$2,$3)', [empDbIds[empKey], h.d, h.s]);
      sentCount++;
    }
  }
  console.log(`   ✅ ${sentCount} sentiment records\n`);

  // 6. Seed departments
  console.log('🏢 Creating departments...');
  const departments = [
    { name: 'Engineering', count: 45, score: 62, status: 'burnout_signals', delta: -5, hrbp: 'Priya Sharma', meetings: 8 },
    { name: 'Product', count: 18, score: 81, status: 'stable', delta: 3, hrbp: 'Vikram Singh', meetings: 6 },
    { name: 'Design', count: 12, score: 70, status: 'stable', delta: -1, hrbp: 'Arjun Rao', meetings: 4 },
    { name: 'Sales', count: 32, score: 55, status: 'declining', delta: -8, hrbp: 'Kavitha Das', meetings: 3 },
    { name: 'Marketing', count: 15, score: 76, status: 'stable', delta: 2, hrbp: 'Vikram Singh', meetings: 5 },
    { name: 'Operations', count: 22, score: 72, status: 'stable', delta: 1, hrbp: 'Kavitha Das', meetings: 4 },
    { name: 'Finance', count: 10, score: 68, status: 'low_hr_coverage', delta: 0, hrbp: null, meetings: 1 },
  ];
  for (const d of departments) {
    await pool.query(
      `INSERT INTO departments (name, employee_count, engagement_score, sentiment_status, delta, hrbp_assigned, meetings_last_30d)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (name) DO UPDATE SET engagement_score = EXCLUDED.engagement_score`,
      [d.name, d.count, d.score, d.status, d.delta, d.hrbp, d.meetings]
    );
  }
  console.log(`   ✅ ${departments.length} departments\n`);

  // 7. Seed commitments
  console.log('📋 Creating commitments...');
  const commitments = [
    { empKey: 'e1', text: 'Discuss promotion timeline and criteria', due: '2026-03-15', src: 'Check-in', srcDate: '2026-02-28', status: 'due_soon', resolved: false, days: 13 },
    { empKey: 'e3', text: 'Review QA team headcount request', due: '2026-02-28', src: 'Check-in', srcDate: '2026-01-05', status: 'overdue', resolved: false, days: 67 },
    { empKey: 'e5', text: 'Revisit Q2 sales targets with leadership', due: '2026-03-20', src: 'Check-in', srcDate: '2026-02-15', status: 'on_track', resolved: false, days: 26 },
    { empKey: 'e4', text: 'Schedule cross-team workshop with engineering', due: '2026-03-10', src: 'Check-in', srcDate: '2026-03-01', status: 'overdue', resolved: false, days: 12 },
    { empKey: 'e7', text: 'Identify stretch project for data science exposure', due: '2026-03-25', src: 'Check-in', srcDate: '2026-02-20', status: 'on_track', resolved: false, days: 21 },
    { empKey: 'e2', text: 'Share VP Product career development resources', due: '2026-02-20', src: 'Performance Review', srcDate: '2026-01-15', status: 'resolved', resolved: true, days: 57 },
  ];
  for (const c of commitments) {
    await pool.query(
      `INSERT INTO commitments (employee_id, employee_name, text, due_date, source_meeting, source_meeting_date, status, resolved, created_days_ago)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [empDbIds[c.empKey], employees.find(e => e.id === c.empKey).name, c.text, c.due, c.src, c.srcDate, c.status, c.resolved, c.days]
    );
  }
  console.log(`   ✅ ${commitments.length} commitments\n`);

  // 8. Seed meetings
  console.log('📅 Creating meetings...');
  const meetings = [
    { empKey: 'e1', type: 'check-in', date: '2026-03-15', time: '10:00 AM' },
    { empKey: 'e3', type: '1-on-1', date: '2026-03-16', time: '2:00 PM' },
    { empKey: 'e5', type: 'check-in', date: '2026-03-17', time: '11:30 AM' },
    { empKey: 'e4', type: 'casual', date: '2026-03-18', time: '3:00 PM' },
  ];
  for (const m of meetings) {
    const emp = employees.find(e => e.id === m.empKey);
    await pool.query(
      `INSERT INTO meetings (employee_id, employee_name, employee_dept, meeting_type, date, time, ai_status)
       VALUES ($1,$2,$3,$4,$5,$6,'pending')`,
      [empDbIds[m.empKey], emp.name, emp.department, m.type, m.date, m.time]
    );
  }
  console.log(`   ✅ ${meetings.length} meetings\n`);

  // 9. Seed transcripts
  console.log('📝 Creating transcripts...');
  const t1Content = [
    { speaker: 'HR Leader', text: 'Hi Rahul, thanks for making time today. How have things been since our last chat?' },
    { speaker: 'Employee', text: "Honestly, it's been a bit rough. The Platform Rebuild deadlines are really tight and I feel like I'm carrying a lot of the technical decisions alone." },
    { speaker: 'HR Leader', text: "I understand. That sounds like a lot of pressure. Has your manager been able to support you with the workload?" },
    { speaker: 'Employee', text: "Priya tries, but she's stretched thin too. I think we need more senior engineers on the project." },
    { speaker: 'HR Leader', text: "That's a valid concern. Let me look into the resourcing situation. On another note, you mentioned wanting to move into management — is that still something you're interested in?" },
    { speaker: 'Employee', text: "Definitely. But I don't see a clear path here. I've been a senior engineer for two years now and nobody has talked to me about what it takes to get promoted." },
    { speaker: 'HR Leader', text: "I'll make sure we discuss a promotion timeline and criteria with you in our next session. I want to make sure you feel valued here." },
    { speaker: 'Employee', text: "I appreciate that. I just want clarity — that would go a long way." },
  ];
  const t1Analysis = {
    keyHighlights: ['Employee feels overwhelmed with Platform Rebuild workload', 'Requests more senior engineering support', 'Strong interest in engineering management career path', 'Lacks clarity on promotion criteria — has been waiting 2 years'],
    sentimentScore: 42, sentimentLabel: 'Declining — signs of frustration and burnout',
    keyTopics: ['Workload', 'Career Growth', 'Promotion', 'Team Resourcing'],
    careerGoals: ['Engineering management', 'Product team leadership'],
    concerns: ['Overwork and burnout risk', 'Unclear promotion path', 'Insufficient team support'],
    actionItems: ['Discuss promotion timeline', 'Review team resourcing for Platform Rebuild', 'Follow up on management track'],
  };

  await pool.query(
    `INSERT INTO transcripts (employee_id, employee_name, employee_dept, meeting_type, date, duration, ai_status, content, ai_analysis)
     VALUES ($1,$2,'Engineering','check-in','2026-02-28','35 min','analysed',$3,$4)`,
    [empDbIds['e1'], 'Rahul Kumar', JSON.stringify(t1Content), JSON.stringify(t1Analysis)]
  );

  const t2Content = [
    { speaker: 'HR Leader', text: 'Deepak, good to see you. How has the new year started?' },
    { speaker: 'Employee', text: "Not great, to be honest. We had three releases back to back in December and I worked overtime every single week. No one even acknowledged it." },
    { speaker: 'HR Leader', text: "I'm sorry to hear that. Recognition is important. Have you raised this with your manager?" },
    { speaker: 'Employee', text: 'I tried, but the response was basically "that\'s just how release cycles work." I don\'t think that\'s acceptable.' },
    { speaker: 'HR Leader', text: "You're right to feel that way. Let me escalate this. What would meaningful recognition look like for you?" },
    { speaker: 'Employee', text: 'Even just a mention in the all-hands or a bonus for the extra hours would help. Right now I feel invisible.' },
  ];
  const t2Analysis = {
    keyHighlights: ['Significant overtime during December releases — no recognition received', 'Employee feeling invisible and undervalued', 'Manager dismissed the concern as normal release cycle behavior', 'Employee wants public recognition or compensation for extra effort'],
    sentimentScore: 35, sentimentLabel: 'Negative — significant frustration and disengagement risk',
    keyTopics: ['Recognition', 'Overtime', 'Management Response', 'Morale'],
    careerGoals: ['Engineering Manager transition'],
    concerns: ['Lack of recognition', 'Excessive overtime', 'Poor management response', 'Flight risk'],
    actionItems: ['Review QA team headcount', 'Address recognition gap', 'Escalate management response concern'],
  };

  await pool.query(
    `INSERT INTO transcripts (employee_id, employee_name, employee_dept, meeting_type, date, duration, ai_status, content, ai_analysis)
     VALUES ($1,$2,'Engineering','check-in','2026-01-05','28 min','analysed',$3,$4)`,
    [empDbIds['e3'], 'Deepak Verma', JSON.stringify(t2Content), JSON.stringify(t2Analysis)]
  );
  console.log('   ✅ 2 transcripts with AI analysis\n');

  // 10. Seed notes
  console.log('🗒️  Creating HR notes...');
  const notes = [
    { empKey: 'e1', content: "Rahul seems genuinely frustrated about the promotion situation. He's been patient for two years but I can sense he's reaching a tipping point. Need to accelerate the conversation with engineering leadership about creating a clear management track for senior engineers.", date: '2026-03-01', author: 'Sarah Mitchell', context: 'Post check-in Feb 28', highlights: ['Promotion frustration at tipping point', 'Management track needed for senior engineers'] },
    { empKey: 'e3', content: "Deepak's situation is concerning. He's been overlooked for months despite putting in significant overtime. The QA team genuinely needs more people — this isn't just a morale issue, it's a capacity problem. Need to push the headcount request harder.", date: '2026-01-08', author: 'Sarah Mitchell', context: 'Post check-in Jan 5', highlights: ['Critical capacity issue in QA', 'Headcount request needs escalation'] },
    { empKey: 'e5', content: "The sales team is under heavy pressure. Arjun is putting on a brave face but losing two experienced reps last quarter has clearly impacted morale. The targets were set before the attrition happened and haven't been adjusted.", date: '2026-02-16', author: 'Sarah Mitchell', context: null, highlights: ['Team attrition impacting morale', 'Targets not adjusted post-attrition'] },
  ];
  for (const n of notes) {
    const preview = n.content.substring(0, 80) + '...';
    await pool.query(
      `INSERT INTO notes (employee_id, employee_name, content, preview, date, author, meeting_context, ai_highlights)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [empDbIds[n.empKey], employees.find(e => e.id === n.empKey).name, n.content, preview, n.date, n.author, n.context, n.highlights]
    );
  }
  console.log(`   ✅ ${notes.length} notes\n`);

  // 11. Seed notifications
  console.log('🔔 Creating notifications...');
  const notifications = [
    { source: 'ai', summary: 'Deepak Verma flagged as critical retention risk — 67 days without check-in', read: false, label: 'View Employee', link: '/hro/employees/e3' },
    { source: 'system', summary: 'Transcript analysis complete for Rahul Kumar check-in (Feb 28)', read: false, label: 'View Analysis', link: '/hro/transcripts/t1' },
    { source: 'ai', summary: 'New commitment extracted: "Discuss promotion timeline" for Rahul Kumar', read: true },
    { source: 'email', summary: 'Leave request from Meera Nair — 3 days starting March 20', read: true, label: 'Review', link: '#' },
    { source: 'ai', summary: 'Burnout signals detected in Engineering department — 4 employees affected', read: true, label: 'Investigate', link: '/hro/risk' },
  ];
  for (const n of notifications) {
    await pool.query(
      `INSERT INTO notifications (user_id, source, summary, read, action_label, action_link)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [userIds.hro, n.source, n.summary, n.read, n.label || null, n.link || null]
    );
  }
  console.log(`   ✅ ${notifications.length} notifications\n`);

  // 12. Seed activities
  console.log('📜 Creating activity log...');
  const activities = [
    { type: 'resignation_flagged', desc: 'AI flagged potential resignation risk', emp: 'Deepak Verma', by: 'AI System', ts: '2026-03-13T16:00:00Z' },
    { type: 'profile_update', desc: 'Transcript analysis completed and insights saved', emp: 'Rahul Kumar', by: 'AI System', ts: '2026-03-13T14:30:00Z' },
    { type: 'leave_approval', desc: 'Annual leave approved (Mar 20-22)', emp: 'Meera Nair', by: 'Sarah Mitchell', ts: '2026-03-13T10:15:00Z' },
    { type: 'promotion', desc: 'Promoted from Senior PM to Lead PM', emp: 'Ananya Patel', by: 'HR Admin', ts: '2026-03-10T09:00:00Z' },
    { type: 'new_hire', desc: 'Onboarding initiated for new Data Engineer', emp: 'Rohan Mehta', by: 'Sarah Mitchell', ts: '2026-03-08T11:00:00Z' },
    { type: 'role_change', desc: 'Moved from Engineering to Product team', emp: 'Priya Iyer', by: 'HR Admin', ts: '2026-03-05T14:00:00Z' },
  ];
  for (const a of activities) {
    await pool.query(
      'INSERT INTO activities (type, description, employee_name, acted_by, timestamp) VALUES ($1,$2,$3,$4,$5)',
      [a.type, a.desc, a.emp, a.by, a.ts]
    );
  }
  console.log(`   ✅ ${activities.length} activities\n`);

  console.log('═══════════════════════════════════════');
  console.log('🎉 Database seeded successfully!');
  console.log('═══════════════════════════════════════\n');
  console.log('Default login credentials:');
  console.log('  HRO:  sarah.mitchell@canopy.io / admin123');
  console.log('  CHRO: james.wilson@canopy.io / admin123');
  console.log('  HRBP: priya.sharma@canopy.io / admin123\n');

  await pool.end();
  process.exit(0);
}

seed().catch(err => {
  console.error('\n❌ Seeding failed:', err.message);
  console.error('\nMake sure POSTGRES_URL in .env is set to a valid PostgreSQL connection string.');
  console.error('Example: postgresql://user:password@host:5432/canopy_hr\n');
  pool.end();
  process.exit(1);
});
