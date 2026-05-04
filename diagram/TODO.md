# TODO — Sequence Diagram (4.3.1.3 Model Sequence Diagram)

Class diagram done. Section ini fokus 4 sequence diagram (restructured dari 5 → 4).

**Output dir:** `diagram/ai/Sequence/`
**File format:** drawio (`SD_*.drawio`), satu file per diagram.
**Caption numbering:** lanjut dari Activity (Gambar 4.5–4.9). Sequence = **Gambar 4.10–4.13**.
**Standar visual:** ikut `diagram/STANDARD.md` (hitam-putih, fillColor=#FFFFFF, strokeColor=#000000).
**Sumber narasi:** `naskah/09_activity_diagram.md` (halaman 49–54 — Activity narrative; sequence mirror activity, beda granularitas method/endpoint). Index: `naskah/INDEX.md`.

**Lifeline order convention (mirror activity swimlanes):**
`User (Role) | Sistem | Database`
Drop Browser/API Backend separation — collapsed to single `Sistem` object.
Lihat `diagram/STANDARD.md` section "Lifeline rule (mirror activity layout)".

**Symbol checklist (Tabel 2.3 + UML standar):**
- Lifeline: garis putus-putus vertikal
- Aktor: stickman
- Object: kotak `[NamaObjek]`
- Activation box: persegi tipis di atas lifeline
- Sync message: panah solid penuh `——>` (label = endpoint/method)
- Return message: panah putus-putus `<----` (label = nilai balik / status code)
- Self-message: panah balik ke lifeline sendiri
- Combined fragment: `alt`, `loop`, `opt`, `par` dengan label kondisi di pojok kiri atas

---

## 1. SD Autentikasi (Login & Logout) — Gambar 4.10

**Ref naskah:** halaman 49–50 (narasi Gambar 4.5).
**Endpoint:** `POST /api/auth/login`, `POST /api/auth/logout`.
**Files:** `server/src/routes/auth.ts`, `tb_user`, `tb_session`.

**Lifelines:**
| # | Partisipan | Tipe |
|---|---|---|
| 1 | User | Actor |
| 2 | Sistem | Object |
| 3 | Database | Object |

**Flow Login:**
```
User -> Browser: input email + password
Browser -> Backend: POST /api/auth/login {email, password}
Backend -> Database: SELECT * FROM tb_user WHERE email = ?
Database --> Backend: user row | null
Backend -> Backend: bcrypt.compare(password, passwordHash)
alt [credential valid]
  Backend -> Backend: generate JWT (payload: id, role)
  Backend -> Database: INSERT tb_session (userId, token, expiresAt)
  Database --> Backend: ok
  Backend --> Browser: 200 OK { token, user, role }
  Browser --> User: redirect dashboard sesuai role
else [credential invalid]
  Backend --> Browser: 401 Unauthorized { message }
  Browser --> User: tampil pesan kesalahan login
end
```

**Flow Logout:**
```
User -> Browser: klik tombol logout
Browser -> Backend: POST /api/auth/logout (Authorization: Bearer)
Backend -> Database: DELETE FROM tb_session WHERE token = ?
Database --> Backend: ok
Backend --> Browser: 200 OK
Browser --> User: clear local storage + redirect /login
```

**Fragment yang wajib ada:** `alt` (valid/invalid login).

---

## 2. SD Pengelolaan Proyek (Smart Scheduling) — Gambar 4.11

**Ref naskah:** halaman 51–52 (narasi Gambar 4.7).
**Endpoints:**
- `GET /api/clients` (dropdown klien)
- `GET /api/users/technicians/available?start=&end=` (filter konflik jadwal)
- `POST /api/projects` (atomic: project + tasks + assignments + initial health)

**Lifelines:**
| # | Partisipan | Tipe |
|---|---|---|
| 1 | User (Manager) | Actor |
| 2 | Sistem | Object |
| 3 | Database | Object |

**Flow:**
```
User (Manager) -> Sistem: akses menu "Tambah Proyek"
Browser -> Backend: GET /api/clients
Backend -> Database: SELECT id, name FROM tb_client ORDER BY name
Database --> Backend: list klien
Backend --> Browser: 200 OK { clients }

Manajer -> Browser: input nama, deskripsi, klien, startDate, endDate, projectValue
Browser -> Backend: GET /api/users/technicians/available?start=...&end=...
Backend -> Database: SELECT u.* FROM tb_user u
                     WHERE u.role='technician'
                     AND u.id NOT IN (
                       SELECT pa.user_id FROM tb_project_assignment pa
                       JOIN tb_project p ON p.id=pa.project_id
                       WHERE p.start_date <= ? AND p.end_date >= ?
                     )
Database --> Backend: teknisi available
Backend --> Browser: 200 OK { technicians }
Browser --> Manajer: render rekomendasi teknisi (no-conflict)

Manajer -> Browser: pilih teknisi + susun daftar task (title, dueDate, assignee)
Manajer -> Browser: klik "Simpan Proyek"
Browser -> Backend: POST /api/projects { project, tasks[], assignments[] }
Backend -> Backend: BEGIN TRANSACTION
Backend -> Database: INSERT tb_project (...) RETURNING id
Database --> Backend: projectId
loop [setiap task di tasks[]]
  Backend -> Database: INSERT tb_task (project_id=projectId, ...)
end
loop [setiap assignment]
  Backend -> Database: INSERT tb_project_assignment (project_id, user_id, role)
end
Backend -> Database: INSERT tb_project_health (project_id, spi=1.0, status='green', total_tasks=N, completed_tasks=0)
Backend -> Backend: COMMIT
Database --> Backend: ok
Backend --> Browser: 201 Created { project }
Browser --> Manajer: pesan sukses + redirect detail proyek

opt [notifikasi async ke teknisi yang di-assign]
  Backend -> Backend: dispatch notification job
end
```

**Fragment wajib:** `loop` (insert tasks + assignments), `opt` (notifikasi async).

---

## 3. SD Dashboard Early Warning System — Gambar 4.12

**Ref naskah:** halaman 53 (narasi Gambar 4.8).
**Endpoint:** `GET /api/dashboard/summary`, dan chart endpoints.
**Logic kunci:** SPI thresholding (≥0.95 green / ≥0.85 amber / <0.85 red), sort by criticality DESC.

**Lifelines:**
| # | Partisipan | Tipe |
|---|---|---|
| 1 | User (Manager) | Actor |
| 2 | Sistem | Object |
| 3 | Database | Object |

**Flow:**
```
Manajer -> Browser: akses halaman dashboard
Browser -> Backend: GET /api/dashboard/summary
Backend -> Database: SELECT p.*, ph.spi_value, ph.status, ph.completed_tasks, ph.total_tasks
                     FROM tb_project p
                     JOIN tb_project_health ph ON ph.project_id=p.id
                     WHERE p.status='active'
Database --> Backend: rows
Backend -> Backend: map status warna (green/amber/red) per threshold SPI
Backend -> Backend: ORDER BY status_priority (red=1, amber=2, green=3) — kritis di atas
Backend --> Browser: 200 OK { projects[], summaryStats }

par [fetch chart data paralel]
  Browser -> Backend: GET /api/dashboard/chart/status-distribution
  Backend -> Database: SELECT status, COUNT(*) FROM tb_task GROUP BY status
  Database --> Backend: counts
  Backend --> Browser: 200 OK
and
  Browser -> Backend: GET /api/dashboard/chart/overdue-tasks
  Backend -> Database: SELECT * FROM tb_task WHERE due_date < NOW() AND status != 'done'
  Database --> Backend: overdue
  Backend --> Browser: 200 OK
and
  Browser -> Backend: GET /api/dashboard/chart/earned-value
  Backend -> Database: SELECT project agg + cumulative EV
  Database --> Backend: series
  Backend --> Browser: 200 OK
end

Browser -> Browser: render Recharts (Pie ProjectHealth, Bar TasksByStatus, Line EarnedValue, dst.)
Browser --> Manajer: dashboard tampil — proyek kritis (red) di urutan teratas

loop [TanStack Query polling / refetch on focus]
  Browser -> Backend: GET /api/dashboard/summary (re-fetch)
  Backend --> Browser: 200 OK { updated data }
end

Manajer -> Browser: klik proyek kritis untuk drill-down (lanjut ke detail proyek)
```

**Fragment wajib:** `par` (parallel chart fetches), `loop` (polling).

---

## 4. SD Upload Evidence — Gambar 4.13

**Ref naskah:** AD_UPLOAD_EVIDENCE flow. Teknisi uploads photo/doc evidence per task.
**Endpoints:**
- `GET /api/tasks/:id` (load task detail)
- `POST /api/tasks/:id/evidence` (multipart upload via multer)
- `PATCH /api/tasks/:id` (auto-set status to working_on_it)

**Lifelines:**
| # | Partisipan | Tipe |
|---|---|---|
| 1 | User (Teknisi) | Actor |
| 2 | Sistem | Object |
| 3 | Database | Object |

**Flow:**
```
Teknisi -> Sistem: buka papan Kanban — klik task detail
Sistem -> Database: SELECT * FROM tb_task WHERE id = ?
Database --> Sistem: task row (title, status, due_date)
Sistem --> Teknisi: 200 OK { task, evidence[] } — render task detail modal

Teknisi -> Sistem: klik "Upload Evidence" — pilih file (foto/dokumen)
alt [file valid (type & size OK)]
  Sistem -> Sistem: simpan file ke server/uploads/{taskId}/
  Sistem -> Database: INSERT tb_task_evidence (task_id, file_path, file_name, uploaded_by)
  Database --> Sistem: evidenceId
  Sistem -> Database: UPDATE tb_task SET status='working_on_it' WHERE id=? AND status='to_do'
  Database --> Sistem: ok
  Sistem --> Teknisi: 201 Created { evidence } — konfirmasi upload berhasil
else [file tidak valid (tipe/ukuran)]
  Sistem --> Teknisi: 400 Bad Request { error } — tampil pesan validasi
end
```

**Fragment wajib:** `alt` (valid/invalid file).

---

## Checklist Eksekusi

Per sequence:
- [x] Buat folder `diagram/ai/Sequence/`.
- [x] Generate file `SD_AUTENTIKASI.drawio` (Gambar 4.10) — 3 lifelines, page 700.
- [x] Generate file `SD_PENGELOLAAN_PROYEK.drawio` (Gambar 4.11) — loop fragments, 3 lifelines, page 700.
- [x] Generate file `SD_DASHBOARD_EWS.drawio` (Gambar 4.12) — par fragment, 3 lifelines, page 700.
- [x] Generate file `SD_UPLOAD_EVIDENCE.drawio` (Gambar 4.13) — alt fragment, 3 lifelines, page 700.
- [x] Delete SD_REVIEW_GATE.drawio (obsolete).
- [x] Delete SD_ESKALASI.drawio (obsolete).

Pasca-generate:
- [x] Update `diagram/STANDARD.md` — section "Sequence Diagram" added (lifeline / message / fragment styles + generator ref).
- [x] Verifikasi caption format: italic (`fontStyle=2`), fontSize=11, "Gambar 4.X Sequence Diagram [Nama]." (titik akhir).
- [x] Update `diagram/STANDARD.md` — section "Lifeline rule (mirror activity layout)" added.
- [x] Cross-check dengan narasi naskah (`naskah/09_activity_diagram.md`).
- [x] Lifeline order mirror activity swimlanes: User (Role) | Sistem | Database.
- [ ] Render semua ke PNG/SVG (jika thesis perlu) — buka di drawio.com / VS Code Draw.io extension, File → Export → PNG/SVG.

Generator: `diagram/ai/Sequence/_gen.py` — edit spec di sana, run `python _gen.py` untuk regenerate semua 4 file.
