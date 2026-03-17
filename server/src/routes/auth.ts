import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../utils/db';
import { AuthUser } from '../types';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ success: false, error: 'Email and password are required' });
    return;
  }

  try {
    const result = await query<AuthUser>(
      'SELECT id, name, email, role, password_hash FROM users WHERE email = $1',
      [email]
    );

    if (result.rowCount === 0) {
      res.status(401).json({ success: false, error: 'Invalid credentials' });
      return;
    }

    const user = result.rows[0];
    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      res.status(401).json({ success: false, error: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'secret'
    );

    res.json({
      success: true,
      data: {
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    res.status(400).json({ success: false, error: 'Name, email, and password are required' });
    return;
  }

  const allowedRoles = ['technician', 'manager'];
  const userRole = allowedRoles.includes(role) ? role : 'technician';

  try {
    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rowCount && existing.rowCount > 0) {
      res.status(409).json({ success: false, error: 'Email already in use' });
      return;
    }

    const hash = await bcrypt.hash(password, 10);
    const result = await query<AuthUser>(
      'INSERT INTO users (name, email, role, password_hash) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role, created_at',
      [name, email, userRole, hash]
    );

    const user = result.rows[0];
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'secret'
    );

    res.status(201).json({
      success: true,
      data: { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
