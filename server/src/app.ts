import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

import authRouter from './routes/auth';
import projectsRouter from './routes/projects';
import dailyReportsRouter from './routes/dailyReports';
import dashboardRouter from './routes/dashboard';
import usersRouter from './routes/users';
import clientsRouter from './routes/clients';
import tasksRouter from './routes/tasks';
import evidenceRouter from './routes/evidence';
import materialsRouter from './routes/materials';
import budgetRouter from './routes/budget';
import activitiesRouter from './routes/activities';
import escalationsRouter from './routes/escalations';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use((req, _res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Static file serving for uploads (with auth check via route-level middleware)
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Routes
app.use('/api/auth', authRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/daily-reports', dailyReportsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/users', usersRouter);
app.use('/api/clients', clientsRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/evidence', evidenceRouter);
app.use('/api/materials', materialsRouter);
app.use('/api/budget', budgetRouter);
app.use('/api/activities', activitiesRouter);
app.use('/api/escalations', escalationsRouter);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});

export default app;
