-- Canopy HR Platform Database Schema
-- Run this file to initialize all tables

-- ============================================
-- USERS TABLE (HR platform users)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('hro', 'chro', 'hrbp')),
  department VARCHAR(100) DEFAULT 'Human Resources',
  phone VARCHAR(50),
  avatar TEXT,
  password_hash VARCHAR(255) NOT NULL,
  account_status VARCHAR(20) DEFAULT 'active' CHECK (account_status IN ('active', 'disabled')),
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- EMPLOYEES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(255),
  department VARCHAR(100),
  employee_id VARCHAR(50) UNIQUE,
  avatar TEXT,
  join_date DATE,
  tenure VARCHAR(50),
  reporting_manager VARCHAR(255),
  employment_type VARCHAR(20) DEFAULT 'Full-time' CHECK (employment_type IN ('Full-time', 'Part-time', 'Contract')),
  sentiment_score INTEGER DEFAULT 50,
  sentiment_trend VARCHAR(20) DEFAULT 'neutral' CHECK (sentiment_trend IN ('positive', 'neutral', 'negative', 'declining')),
  memory_score INTEGER DEFAULT 0,
  risk_tier VARCHAR(20) DEFAULT 'stable' CHECK (risk_tier IN ('critical', 'concern', 'watch', 'stable')),
  last_interaction DATE,
  skills TEXT[] DEFAULT '{}',
  projects TEXT[] DEFAULT '{}',
  interests TEXT[] DEFAULT '{}',
  career_aspirations TEXT[] DEFAULT '{}',
  hrms_id VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- EMPLOYEE CONCERNS
-- ============================================
CREATE TABLE IF NOT EXISTS employee_concerns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  date DATE,
  meeting_ref VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SENTIMENT HISTORY
-- ============================================
CREATE TABLE IF NOT EXISTS sentiment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  score INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DEPARTMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  employee_count INTEGER DEFAULT 0,
  engagement_score INTEGER DEFAULT 0,
  sentiment_status VARCHAR(30) DEFAULT 'stable' CHECK (sentiment_status IN ('stable', 'declining', 'burnout_signals', 'low_hr_coverage')),
  delta INTEGER DEFAULT 0,
  hrbp_assigned VARCHAR(255),
  meetings_last_30d INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MEETINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  employee_name VARCHAR(255),
  employee_dept VARCHAR(100),
  meeting_type VARCHAR(30) CHECK (meeting_type IN ('check-in', 'performance', 'disciplinary', 'casual', '1-on-1')),
  date DATE NOT NULL,
  time VARCHAR(20),
  duration VARCHAR(20),
  transcript TEXT,
  summary TEXT,
  sentiment INTEGER,
  ai_status VARCHAR(20) DEFAULT 'pending' CHECK (ai_status IN ('analysed', 'pending', 'not_analysed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TRANSCRIPTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  employee_name VARCHAR(255),
  employee_dept VARCHAR(100),
  meeting_type VARCHAR(30),
  date DATE NOT NULL,
  duration VARCHAR(20),
  ai_status VARCHAR(20) DEFAULT 'pending',
  content JSONB DEFAULT '[]',
  ai_analysis JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- COMMITMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS commitments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  employee_name VARCHAR(255),
  text TEXT NOT NULL,
  due_date DATE,
  source_meeting VARCHAR(255),
  source_meeting_date DATE,
  status VARCHAR(20) DEFAULT 'on_track' CHECK (status IN ('overdue', 'due_soon', 'on_track', 'resolved')),
  resolved BOOLEAN DEFAULT false,
  assigned_hrbp VARCHAR(255),
  created_days_ago INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- NOTES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  employee_name VARCHAR(255),
  content TEXT NOT NULL,
  preview TEXT,
  date DATE DEFAULT CURRENT_DATE,
  author VARCHAR(255) NOT NULL,
  meeting_context VARCHAR(255),
  ai_highlights TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  source VARCHAR(20) CHECK (source IN ('email', 'ai', 'system')),
  summary TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  read BOOLEAN DEFAULT false,
  action_label VARCHAR(100),
  action_link VARCHAR(500),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- RECENT CHANGES LOG TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS recent_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(50) NOT NULL,
  description TEXT,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  employee_name VARCHAR(255),
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- HR TEAM TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS hr_team (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(50),
  department VARCHAR(100),
  avatar TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department);
CREATE INDEX IF NOT EXISTS idx_employees_risk_tier ON employees(risk_tier);
CREATE INDEX IF NOT EXISTS idx_employees_hrms_id ON employees(hrms_id);
CREATE INDEX IF NOT EXISTS idx_meetings_employee ON meetings(employee_id);
CREATE INDEX IF NOT EXISTS idx_meetings_date ON meetings(date);
CREATE INDEX IF NOT EXISTS idx_transcripts_employee ON transcripts(employee_id);
CREATE INDEX IF NOT EXISTS idx_commitments_employee ON commitments(employee_id);
CREATE INDEX IF NOT EXISTS idx_commitments_status ON commitments(status);
CREATE INDEX IF NOT EXISTS idx_notes_employee ON notes(employee_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_sentiment_history_employee ON sentiment_history(employee_id);

-- ============================================
-- OTP CODES TABLE (for 2FA)
-- ============================================
CREATE TABLE IF NOT EXISTS otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_otp_codes_user ON otp_codes(user_id);
