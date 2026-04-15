# PT Smart Home Inovasi Dashboard - Thesis Documentation

**Author:** Dian Putri Iswandi (5220311118)  
**Institution:** Universitas Teknologi Yogyakarta  
**Program:** Sistem Informasi, Program Sarjana  
**Year:** 2026

---

## 📋 Documentation Summary

This directory contains complete thesis documentation for the dashboard development project. All content has been extracted from the PDF thesis and organized into logical, cross-referenced markdown files.

### Directory Structure

```
thesis/
├── 00_INDEX.md                    # Start here - Navigation & reading guide
├── 01_OVERVIEW.md                 # Executive summary & project vision
├── 02_PROBLEM_STATEMENT.md        # Business problem & research objectives
├── 03_ARCHITECTURE.md             # System design & technical framework
├── 04_DATA_MODEL.md               # Database schema & entity relationships
├── 05_UML_DIAGRAMS.md             # Process models & system structure
├── 06_IMPLEMENTATION.md           # Development phases & execution details
├── 07_CONCLUSIONS_AND_REFERENCES.md  # Findings & bibliography
├── DIAGRAMS_MANIFEST.md           # Guide for creating .drawio diagrams
├── README.md                      # This file
└── DIAGRAMS/                      # [To be created] .drawio diagram files
    ├── USE_CASE.drawio
    ├── ACTIVITY_DIAGRAM.drawio
    ├── SEQUENCE_DIAGRAM.drawio
    ├── CLASS_DIAGRAM.drawio
    ├── STATECHART_TASK.drawio
    ├── DATABASE_ERD.drawio
    └── DEPLOYMENT_DIAGRAM.drawio
```

---

## 🚀 Quick Start

### For First-Time Readers
1. **Start with:** `00_INDEX.md` (navigation guide)
2. **Then read:** `01_OVERVIEW.md` (15 minutes)
3. **Follow with:** `02_PROBLEM_STATEMENT.md` (20 minutes)

**Total time:** ~35 minutes for high-level understanding

### For Technical Details
1. **Architecture:** `03_ARCHITECTURE.md`
2. **Database:** `04_DATA_MODEL.md`
3. **Diagrams:** `05_UML_DIAGRAMS.md`
4. **Implementation:** `06_IMPLEMENTATION.md`

**Total time:** ~2 hours for complete technical review

### For Thesis Reviewers
1. Executive Summary: `01_OVERVIEW.md`
2. Problem & Objectives: `02_PROBLEM_STATEMENT.md`
3. Methodology & Design: `03_ARCHITECTURE.md` + `05_UML_DIAGRAMS.md`
4. Implementation Results: `06_IMPLEMENTATION.md`
5. Conclusions & References: `07_CONCLUSIONS_AND_REFERENCES.md`

**Total time:** ~2.5 hours for thesis review

---

## 📊 Content Statistics

| Metric | Count |
|--------|-------|
| **Total Documentation** | ~114 KB of markdown |
| **Pages (equivalent)** | ~100 pages |
| **Code Examples** | 15+ (SQL, TypeScript, React) |
| **Database Tables** | 10 core tables |
| **API Endpoints** | 52 endpoints documented |
| **UML Diagrams** | 7 diagram types (18+ diagrams) |
| **References** | 24 academic citations |
| **User Roles** | 3 (Technician, Manager, Admin) |

---

## 🎯 Key Takeaways

### The Problem
PT Smart Home Inovasi lacks:
- Direct field technician access to reporting system
- Visual dashboard for project health monitoring
- Early detection system for at-risk projects
- Objective decision-making criteria for prioritization

### The Solution
A smart dashboard that:
1. **Empowers Technicians:** Direct daily report submission (no intermediaries)
2. **Automates Metrics:** Schedule Performance Index (SPI) calculated automatically
3. **Visualizes Health:** Red-Amber-Green (RAG) status indicators for instant comprehension
4. **Enables Early Warning:** EWS automatically surfaces critical projects
5. **Supports Decisions:** Objective metrics replace subjective judgment

### The Technology
- **Frontend:** React 19 + Next.js + TanStack Query + Recharts
- **Backend:** Node.js + Express + TypeScript
- **Database:** PostgreSQL with 10 optimized tables
- **Architecture:** REST API (52 endpoints) + Real-time dashboard sync
- **Scale:** Enterprise-ready (100+ projects)

---

## 📖 Document Overview

### 00_INDEX.md
**Purpose:** Navigation and reading guide  
**Sections:**
- Document index with reading paths for different audiences
- SPI calculation quick reference
- Data flow diagram
- Version control tracking

### 01_OVERVIEW.md
**Purpose:** Executive summary and project context  
**Sections:**
- Author and institutional information
- Project vision and goals
- Solution architecture overview
- Tech stack summary
- Benefits and scope boundaries

### 02_PROBLEM_STATEMENT.md
**Purpose:** Business problem definition and research objectives  
**Sections:**
- Latar belakang (4 main problems identified)
- Rumusan masalah (research question)
- Batasan masalah (6 scope boundaries)
- Tujuan dan manfaat penelitian
- Kriteria keberhasilan (5 success criteria)

### 03_ARCHITECTURE.md
**Purpose:** System design and technical framework  
**Sections:**
- System architecture layers
- Tech stack details (frontend, backend, database)
- User roles and permissions (Technician, Manager, Admin)
- Core business logic (SPI formula, RAG thresholds)
- Early Warning System mechanism
- 8 dashboard chart types
- Performance and security considerations

### 04_DATA_MODEL.md
**Purpose:** Database design and entity relationships  
**Sections:**
- Entity Relationship Diagram (logical view)
- 10 core tables with detailed specifications
- Key relationships (1:N, 1:1, N:N)
- SQL queries for critical operations
- Indexing strategy (7 indexes on hot paths)
- Data integrity constraints
- Normalization analysis

### 05_UML_DIAGRAMS.md
**Purpose:** Process modeling and system structure  
**Sections:**
- Use Case Diagram (18 use cases, 3 actors)
- Activity Diagrams (6 workflows)
- Sequence Diagrams (6 message flows)
- Class Diagram (8 entities with methods)
- Statechart Diagram (task lifecycle)
- Reference to .drawio files location

### 06_IMPLEMENTATION.md
**Purpose:** Development phases and technical execution  
**Sections:**
- 8-phase prototyping approach
- Database setup and schema
- 52 API endpoints (grouped by domain)
- Backend business logic (SPI calculation)
- Frontend architecture (9 pages, 8 chart types)
- Component structure (Dashboard, Kanban, Forms)
- Data fetching with TanStack Query
- Testing strategy (unit, integration, black-box)
- Deployment phases (dev, staging, production)

### 07_CONCLUSIONS_AND_REFERENCES.md
**Purpose:** Research findings and bibliography  
**Sections:**
- Kesimpulan (4 main conclusions)
- Analisis kritis (strengths, limitations, trade-offs)
- Saran (recommendations for implementation and future research)
- Daftar pustaka (24 references, categorized)
- Lampiran (appendices with endpoint/table summaries)

### DIAGRAMS_MANIFEST.md
**Purpose:** Guide for creating and managing UML diagrams  
**Sections:**
- Detailed specifications for 7 diagram types
- Element descriptions (actors, use cases, entities, relationships)
- Creation instructions (draw.io web, desktop, VS Code)
- Export guidelines (PNG for print, SVG for web, .drawio for editing)
- Completeness checklist
- Naming conventions

---

## 🔄 Cross-References

### How Documents Link Together

```
01_OVERVIEW
    ├─→ Introduces problem solved by 02_PROBLEM_STATEMENT
    ├─→ Tech stack explained in 03_ARCHITECTURE
    └─→ References solution details in 06_IMPLEMENTATION

02_PROBLEM_STATEMENT
    ├─→ Defines scope boundaries (details in 04_DATA_MODEL)
    ├─→ Mentions SPI calculation (explained in 03_ARCHITECTURE)
    └─→ Success criteria validated by 06_IMPLEMENTATION

03_ARCHITECTURE
    ├─→ Data flow details in 04_DATA_MODEL
    ├─→ User roles explained in 02_PROBLEM_STATEMENT
    ├─→ Process flows in 05_UML_DIAGRAMS
    └─→ Implementation in 06_IMPLEMENTATION

04_DATA_MODEL
    ├─→ ERD shown in 05_UML_DIAGRAMS (database_ERD.drawio)
    ├─→ Entities mapped from 05_UML_DIAGRAMS (CLASS_DIAGRAM)
    └─→ Queries explained in 06_IMPLEMENTATION

05_UML_DIAGRAMS
    ├─→ Use cases derive from 02_PROBLEM_STATEMENT
    ├─→ Activity flows show 03_ARCHITECTURE data flow
    ├─→ Sequence diagrams show 06_IMPLEMENTATION APIs
    └─→ Class diagram maps to 04_DATA_MODEL

06_IMPLEMENTATION
    ├─→ Phases validate approach in 02_PROBLEM_STATEMENT
    ├─→ APIs implement 03_ARCHITECTURE design
    ├─→ Database matches 04_DATA_MODEL schema
    └─→ Testing validates 05_UML_DIAGRAMS workflows

07_CONCLUSIONS_AND_REFERENCES
    └─→ References all prior documents
```

---

## 📈 Project Summary

### What Was Built
- **Backend API:** 52 REST endpoints (Node.js + Express + TypeScript)
- **Frontend Dashboard:** 9 pages with React 19 + Next.js
- **Database:** PostgreSQL with 10 optimized tables
- **Visualization:** 8 chart types using Recharts
- **Smart System:** Automatic SPI calculation + RAG status categorization
- **Real-time Sync:** TanStack Query for near-real-time dashboard updates

### Key Metrics
- **Health Status Thresholds:**
  - Green: SPI ≥ 0.95 (on track)
  - Amber: 0.85 ≤ SPI < 0.95 (warning)
  - Red: SPI < 0.85 (critical)

- **Performance Targets:**
  - Dashboard load: < 2 seconds (100 projects)
  - API response: < 500ms (p95)
  - Chart rendering: < 1 second

### Users Supported
1. **Technician:** Input daily reports, manage tasks, upload evidence
2. **Manager:** Monitor dashboard, approve tasks, manage projects
3. **Admin:** User management, system configuration

---

## 🎓 Research Contribution

### Innovation
1. **Smart System Automation:** Automatic SPI calculation without user intervention
2. **Desentralized Reporting:** Technician → System directly (no intermediary)
3. **Computed States:** Overtime/Over-Deadline derived from data (objective, not self-reported)
4. **Scalable Architecture:** Handles 100+ projects efficiently

### Validation
- Supported by 8 prior research papers (2023-2025)
- Prototyping methodology with user feedback
- Black-box and integration testing
- Database integrity validation

### Difference from Prior Work
- Simpler than EVM (Azkia, Ernawan)
- Different from Kurva-S (Auliansyah)
- Operational focus vs strategic (Ernawan)
- Task-level tracking vs project-level (Iqbal)

---

## 📝 How to Use This Documentation

### For Implementation
1. Read `03_ARCHITECTURE.md` for system design
2. Use `04_DATA_MODEL.md` for database schema
3. Reference `06_IMPLEMENTATION.md` for API endpoints
4. Study `05_UML_DIAGRAMS.md` for component design

### For Maintenance
1. Update `04_DATA_MODEL.md` for schema changes
2. Keep `05_UML_DIAGRAMS.md` synchronized with code
3. Document new features in `06_IMPLEMENTATION.md`

### For Training
1. Share `01_OVERVIEW.md` with stakeholders
2. Use `03_ARCHITECTURE.md` for technical team
3. Reference diagrams from `05_UML_DIAGRAMS.md` in presentations

### For Academic Reference
1. Cite `02_PROBLEM_STATEMENT.md` for problem definition
2. Reference `07_CONCLUSIONS_AND_REFERENCES.md` for bibliography
3. Use `03_ARCHITECTURE.md` + `04_DATA_MODEL.md` for methodology

---

## ✅ Completeness Checklist

- [x] All thesis chapters converted to markdown
- [x] Cross-references between sections
- [x] Code examples included (SQL, TypeScript, React)
- [x] Tables for reference (endpoints, schemas, thresholds)
- [x] Diagrams manifest with creation instructions
- [x] Quick navigation index (00_INDEX.md)
- [x] Reading guides for different audiences
- [x] Complete bibliography (24 references)
- [ ] Diagram files (.drawio) - To be created separately

---

## 🔗 Related Files

**Main Codebase:** `/Users/user/Documents/COLLEGE/Mata Kuliah/8/Tugas Akhir/coding/project_ta_dian_putri_iswandi/`

**Key Directories:**
- `frontend/` - React/Next.js application
- `server/` - Node.js/Express backend
- `server/database/` - Migration and seed scripts
- `docs/` - Additional documentation

**Original Thesis PDF:**
- `Naskah TA 04-04-26.pdf` - Source PDF (converted to text)

---

## 📞 Questions & Support

For questions about specific sections:
- **Architecture/Design:** See `03_ARCHITECTURE.md`
- **Database/Schema:** See `04_DATA_MODEL.md`
- **Diagrams/Flows:** See `05_UML_DIAGRAMS.md`
- **Implementation:** See `06_IMPLEMENTATION.md`
- **Academic Reference:** See `07_CONCLUSIONS_AND_REFERENCES.md`

---

## 📅 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-04-15 | Initial thesis documentation extraction complete |

---

## 📄 License & Attribution

**Author:** Dian Putri Iswandi  
**Student ID:** 5220311118  
**Year:** 2026  
**Institution:** Universitas Teknologi Yogyakarta

---

**Last Updated:** 2026-04-15  
**Status:** Ready for Review & Implementation  
**Next Step:** Create .drawio diagram files in DIAGRAMS/ directory

