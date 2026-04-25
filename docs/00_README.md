# PT Smart Home Inovasi Dashboard - Project Documentation

**Thesis Project:** Dashboard Development for Project Management System Based on Daily Reports  
**Author:** Dian Putri Iswandi (5220311118)  
**Institution:** Universitas Teknologi Yogyakarta  
**Year:** 2026

---

## Table of Contents

1. [Project Overview](01_OVERVIEW.md)
2. [System Architecture](02_ARCHITECTURE.md)
3. [Data Model & Database Schema](03_DATA_MODEL.md)
4. [API Endpoints Reference](04_API_REFERENCE.md)
5. [Frontend Components](05_FRONTEND.md)
6. [Business Logic & Formulas](06_BUSINESS_LOGIC.md)
7. [User Workflows](07_USER_WORKFLOWS.md)
8. [Deployment & Setup](08_DEPLOYMENT.md)

---

## Quick Reference

### Tech Stack
- **Frontend:** Vite + React 19 + Next.js 15 + TanStack Query 5 + Recharts 3 + Tailwind CSS v4
- **Backend:** Node.js + Express 5 + TypeScript
- **Database:** PostgreSQL 18
- **File Storage:** Local disk (server/uploads/)

### Core Metrics
- **Schedule Performance Index (SPI):** `(completed_tasks / total_tasks) / (elapsed_days / total_project_days)`
- **Health Status:**
  - 🟢 Green: SPI ≥ 0.95 (on track)
  - 🟡 Amber: 0.85 ≤ SPI < 0.95 (warning)
  - 🔴 Red: SPI < 0.85 (critical)

### Key Features
- ✅ Task management with Kanban + table views
- ✅ Client management (CRUD)
- ✅ Budget and materials tracking
- ✅ Evidence upload per task
- ✅ Real-time SPI calculation
- ✅ 8 dashboard chart types
- ✅ Role-based access control
- ✅ Audit logging with field-level changes
- ✅ Dark/light theme support
- ✅ Project timeline visualization

### User Roles
1. **Field Technician:** Manage assigned tasks, upload evidence
2. **Project Manager:** Full CRUD for projects/tasks, approve tasks, analytics
3. **Admin:** User management, system-wide access, audit logs

---

## How to Use This Documentation

- **For Integration:** Start with [System Architecture](02_ARCHITECTURE.md), then [API Endpoints](04_API_REFERENCE.md)
- **For Feature Understanding:** Read [Business Logic](06_BUSINESS_LOGIC.md) and [User Workflows](07_USER_WORKFLOWS.md)
- **For Thesis Comparison:** Cross-reference each section with your thesis chapters
- **For Deployment:** Follow [Deployment & Setup](08_DEPLOYMENT.md)

---

## Project Scope

### Included ✅
- Task-level management with multiple views
- Client and project lifecycle management
- Budget and materials tracking
- Evidence upload per task (photos, documents, screenshots)
- Two-phase project lifecycle (survey → execution)
- SPI calculation from task completion
- 8 chart types for analytics
- Role-based access control
- Real-time dashboard updates
- Audit logging
- Dark/light mode

### Excluded ❌
- Gantt charts
- Drag-and-drop Kanban (click-to-change instead)
- Cloud file storage
- Complex approval workflows beyond survey gate
- Predictive analytics
- Custom SPI threshold configuration

---

## Document Generation Date
Generated: April 25, 2026

## Version
v1.0 - Complete system documentation for thesis comparison
