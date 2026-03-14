const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/postgres');
const logger = require('../utils/logger');

/**
 * POST /api/auth/register
 */
async function register(req, res) {
  try {
    const { name, email, password, role = 'hro' } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    // Check if user exists
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: 'User with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const firstName = name.split(' ')[0];

    const result = await db.query(
      `INSERT INTO users (name, first_name, email, role, password_hash)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, first_name, email, role, department, avatar, account_status, created_at`,
      [name, firstName, email, role, passwordHash]
    );

    const user = result.rows[0];
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    logger.info('User registered', { email, role });

    res.status(201).json({
      user: {
        id: user.id,
        name: user.name,
        firstName: user.first_name,
        email: user.email,
        role: user.role,
        department: user.department,
        avatar: user.avatar || '',
        accountStatus: user.account_status,
      },
      token,
    });
  } catch (error) {
    logger.error('Registration failed', { error: error.message });
    res.status(500).json({ message: 'Registration failed' });
  }
}

/**
 * POST /api/auth/login
 */
async function login(req, res) {
  try {
    const { email, password, role } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // For demo mode: if no password provided, find or create user
    let user;
    if (!password) {
      const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
      if (result.rows.length === 0) {
        // Auto-create demo user
        const name = email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        const hash = await bcrypt.hash('demo123', 12);
        const insert = await db.query(
          `INSERT INTO users (name, first_name, email, role, password_hash)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING *`,
          [name, name.split(' ')[0], email, role || 'hro', hash]
        );
        user = insert.rows[0];
      } else {
        user = result.rows[0];
      }
    } else {
      const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
      if (result.rows.length === 0) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      user = result.rows[0];
      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
    }

    // Update last login
    await db.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    logger.info('User logged in', { email: user.email, role: user.role });

    res.json({
      user: {
        id: user.id,
        name: user.name,
        firstName: user.first_name,
        email: user.email,
        role: user.role,
        department: user.department || 'Human Resources',
        avatar: user.avatar || '',
        phone: user.phone || '',
        lastLogin: user.last_login,
        accountStatus: user.account_status,
      },
      token,
    });
  } catch (error) {
    logger.error('Login failed', { error: error.message });
    res.status(500).json({ message: 'Login failed' });
  }
}

/**
 * GET /api/auth/me  |  GET /api/auth/profile
 */
async function getProfile(req, res) {
  try {
    const result = await db.query(
      `SELECT id, name, first_name, email, role, department, avatar, phone, last_login, account_status, created_at
       FROM users WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const u = result.rows[0];
    res.json({
      id: u.id,
      name: u.name,
      firstName: u.first_name,
      email: u.email,
      role: u.role,
      department: u.department,
      avatar: u.avatar || '',
      phone: u.phone || '',
      lastLogin: u.last_login,
      accountStatus: u.account_status,
    });
  } catch (error) {
    logger.error('Get profile failed', { error: error.message });
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
}

/**
 * POST /api/auth/logout
 */
function logout(req, res) {
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
}

module.exports = { register, login, getProfile, logout };
