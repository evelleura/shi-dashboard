# Kesimpulan, Saran, dan Referensi

## Kesimpulan (Simpulan)

Penelitian ini telah berhasil merancang dan mengembangkan fitur dashboard pada sistem project management PT Smart Home Inovasi yang mampu mengolah data daily report menjadi indikator visual status kesehatan proyek. Berikut adalah kesimpulan utama:

### 1. Pencapaian Tujuan Penelitian
✓ **Dashboard dengan RAG Indicators:** Sistem berhasil menampilkan status kesehatan proyek (Green/Amber/Red) berdasarkan perhitungan SPI otomatis dari data daily report

✓ **Early Warning System Otomatis:** Sistem dapat mendeteksi proyek kritis (SPI < 0.85) dan secara otomatis menampilkannya di urutan teratas dashboard, memungkinkan manajer melakukan tindakan preventif

✓ **Akses Langsung Teknisi:** Teknisi lapangan dapat menginput daily report secara mandiri tanpa melalui perantara manajer, meningkatkan efisiensi pelaporan

✓ **Otomasi Perhitungan:** Sistem otomatis menghitung SPI, PV, dan EV tanpa intervensi manual, mengurangi beban administratif manajer

### 2. Manfaat yang Terealisasi

**Peningkatan Objektivitas:**
- Manajer dapat membuat keputusan penanganan proyek berdasarkan indikator terukur (SPI, RAG), bukan intuisi
- Setiap keputusan dapat dipertanggungjawabkan dengan data faktual

**Akselerasi Deteksi Masalah:**
- Proyek yang mengalami keterlambatan otomatis dikenali dan ditampilkan pada posisi teratas
- Manajer dapat mengidentifikasi masalah dalam hitungan detik, bukan jam/hari

**Efisiensi Operasional:**
- Pengurangan lag informasi antara lapangan dan manajemen
- Proses pemantauan proyek menjadi lebih cepat dan tersentalisasi
- Manajer tidak perlu membaca satu per satu daily report manual

**Potensi Peningkatan Kepuasan Pelanggan:**
- Dengan deteksi dini dan tindakan preventif, risiko keterlambatan proyek berkurang
- Komunikasi status proyek lebih transparan dan berbasis data

### 3. Validasi Pendekatan

Penelitian ini menggunakan **pendekatan simple yet effective:**
- **Sederhana:** Perhitungan SPI berbasis perbandingan EV vs PV (tidak kompleks seperti EVM penuh)
- **Efektif:** Mampu mendeteksi keterlambatan dengan akurasi tinggi (sudah dibuktikan Auliansyah 2023, Ernawan 2024)
- **Scalable:** Dapat menangani 100+ proyek secara simultan
- **User-Centric:** Interface intuitif yang tidak memerlukan training teknis kompleks

Pendekatan ini didukung oleh 8 penelitian terdahulu (2023-2025) yang menunjukkan efektivitas dashboard manajemen dalam konteks yang serupa.

### 4. Inovasi Sistem

**Smart System Automation:**
- Otomasi kategorisasi status kesehatan proyek berdasarkan SPI
- Tidak ada user yang harus "manually" mark status sebagai "at risk"
- Status otomatis berubah saat daily report disubmit (real-time)

**Desentralisasi Pelaporan:**
- Paradigma shift dari "manajer mengumpulkan laporan dari teknisi" menjadi "teknisi langsung input data ke sistem"
- Mengurangi information bottleneck

**Computed vs Manual States:**
- Task "overtime" dan "over deadline" adalah computed states (bukan DB status)
- Lebih objektif daripada mengandalkan self-reporting user

---

## Analisis Kritis

### Kekuatan Sistem
1. **Real-time Visibility:** Dashboard memberikan visibilitas real-time terhadap status portofolio proyek
2. **Objective Decision Support:** EWS berbasis SPI menghilangkan subjektivitas dalam prioritasi
3. **Low Implementation Complexity:** Menggunakan perhitungan sederhana, tidak perlu ML atau analytics kompleks
4. **Enterprise Scalability:** Aritektur database dan API dapat menangani 100+ projects
5. **Integration Ready:** REST API mudah diintegrasikan dengan sistem lain

### Limitasi & Trade-offs
1. **SPI Sederhana:** Menggunakan SPI dasar (EV/PV), bukan EVM kompleks yang mempertimbangkan biaya dan resource
2. **Reactive Not Predictive:** Sistem mendeteksi keterlambatan yang sudah terjadi, bukan memprediksi keterlambatan di masa depan (per batasan scope)
3. **Manual Threshold:** Threshold SPI (0.95, 0.85) adalah fixed dan tidak dapat dikustomisasi per project type
4. **Local File Storage:** Evidence files disimpan di local disk, bukan cloud (limited scalability)
5. **No Historical Analysis:** Dashboard tidak menampilkan trend historis antar-proyek (only current metrics)

### Rekomendasi Improvement di Masa Depan

**Phase 2 Enhancement:**
1. **Predictive Analytics:** Implementasi ML untuk forecast project delay berdasarkan trend historis
2. **Customizable Thresholds:** Izinkan admin untuk customize SPI threshold per project type
3. **Cloud Integration:** Migrate file storage ke S3/GCP untuk scalability
4. **Advanced Reports:** Historical dashboard menampilkan trend SPI over time
5. **Mobile App:** Native mobile app untuk technician (iOS/Android)
6. **Notification System:** Push notifications, email alerts saat status berubah
7. **Audit Trail:** Lengkap audit log untuk setiap perubahan data kritis
8. **API Versioning:** v1, v2 untuk backward compatibility

---

## Saran (Rekomendasi)

### Untuk PT Smart Home Inovasi

#### 1. Implementasi & Deployment
- **Staging Testing:** Lakukan extended testing (2-3 minggu) dengan real project data sebelum production
- **User Training:** Siapkan training material dan workshop untuk Manajer dan Technician
- **Change Management:** Komunikasikan benefits dashboard secara jelas untuk mendorong adoption
- **Support Plan:** Persiapkan support team untuk handle user issues di awal implementasi

#### 2. Data Quality & Governance
- **Validation Rules:** Implementasikan validasi untuk memastikan daily report data akurat
  - Progress percentage harus reasonable (tidak loncat dari 10% ke 90% overnight)
  - Due dates harus lebih besar dari task start date
- **Data Reconciliation:** Weekly reconciliation antara daily report vs actual task progress
- **Documentation:** Dokumentasikan business rules untuk perhitungan SPI dan RAG status

#### 3. Monitoring & Optimization
- **Performance Monitoring:** Monitor dashboard load time, API response time, database query performance
- **User Analytics:** Track feature usage (which charts are most viewed, how often dashboard accessed)
- **Feedback Loop:** Establish regular feedback session dengan Manajer (monthly) untuk improvement suggestions
- **SPI Calibration:** Setelah 3-6 bulan, evaluasi apakah threshold SPI (0.95, 0.85) sesuai dengan realitas operasional

#### 4. Continuous Improvement
- **Backlog Management:** Maintain product backlog untuk enhancement requests
- **Quarterly Updates:** Planned release quarterly untuk bug fixes dan minor features
- **User Documentation:** Keep documentation updated seiring dengan changes sistem

### Untuk Peneliti Lanjutan

#### 1. Tema Research Lanjutan
- **Predictive Project Performance:** Develop ML model untuk predict project delay 2-4 minggu sebelumnya
- **Resource Optimization:** Dashboard yang track resource utilization dan recommend reallocation
- **Multi-Project Portfolio Analysis:** Advanced analytics untuk manage large portfolio dari 200+ projects
- **Integration with ERP:** Research tentang integration dashboard dengan ERP system (SAP, Oracle) untuk end-to-end visibility

#### 2. Validasi & Generalisasi
- **Comparative Study:** Bandingkan efektivitas SPI sederhana vs EVM kompleks dalam konteks IoT project
- **Cross-Industry Analysis:** Validasi dashboard di industri lain (construction, manufacturing, software development)
- **User Experience Study:** Deep dive into UX aspects, usability testing dengan broader user base

#### 3. Technical Enhancement
- **Distributed Dashboard:** Explore centralized dashboard untuk enterprise dengan multiple offices/branches
- **Real-time Sync:** Investigasi WebSocket vs polling untuk true real-time updates
- **Offline Capability:** Research offline-first architecture untuk technician in field with poor connectivity
- **Data Visualization:** Advanced visualization techniques (3D charts, interactive projections, AR/VR for site visualization)

---

## Daftar Pustaka (References)

### Referensi Penelitian Terdahulu

1. Azkia, R., Yekti, Y. N. D., & Caesaron, D. (2024). Perancangan dashboard monitoring dan controlling kinerja proyek pada PT. XYZ menggunakan metode agile and lean development. *Action Research Literate*, 8(9), 2660–2676.

2. Luthan, P. L. A., Sitanggang, N., & Syafriandi, S. (2023). Reinventing formulas for construction project delay index due to management and production. *HighTech and Innovation Journal*, 4(4), 768–778. https://doi.org/10.28991/HIJ-2023-04-04-06

3. Ernawan. (2024). Pemanfaatan management dashboard dalam pengambilan keputusan strategis pada perusahaan bisnis konstruksi (Studi kasus PT. XYZ). *Jurnal Mirai Management*, 9(2), 124–139.

4. Gledson, B., Rogage, K., Thompson, A., & Ponton, H. (2024). Reporting on the development of a web-based prototype dashboard for construction design managers, achieved through design science research methodology (DSRM). *Buildings*, 14(2), 335. https://doi.org/10.3390/buildings14020335

5. Hakim, A. L., & Pradibta, H. (2025). Pengembangan fitur dashboard dan report pada aplikasi Project Management PT Intelix untuk optimalisasi pemantauan proyek. *Jurnal Kendali Teknik dan Sains*, 3(4), 111–127. https://doi.org/10.59581/jkts-widyakarya.v3i3.5519

6. Auliansyah, C. R., Irawan, J. D., & Ariwibisono, F. X. (2023). Rancang bangun sistem monitoring manajemen proyek konstruksi menggunakan kurva-S. *JATI (Jurnal Mahasiswa Teknik Informatika)*, 6(2), 1106–1114. https://doi.org/10.36040/jati.v6i2.5324

7. Iqbal, M., Emilia, E., Ramadhani, Z., Ariska, D., Rahayu, S., & Oktarina, S. (2024). Sistem manajemen proyek pada startup jasa pembuatan aplikasi. *Klik: Jurnal Ilmu Komputer*, 5(2), 44–52. https://doi.org/10.56869/klik.v5i2.592

### Referensi Teori & Konsep

8. Chaerul, R., Putra, W., & Hanggara, B. (2021). Utilizing of the Trello API within the development of a monitoring information system recording of project activities using a website-based kanban system (Case study: Electrical project of PT. XYZ). *Journal of Information Technology and Computer Science*, 6(2), 146–157. https://doi.org/10.25126/jitecs.202162289

9. Silmina, E. P., & Azmi, A. F. (2025). Perancangan dashboard operations berbasis web di PT XYZ Indonesia menggunakan metode prototyping. *JATI (Jurnal Mahasiswa Teknik Informatika)*, 9(2).

10. Reddy, A. (2025). Dashboard Real-Time Monitoring of Construction Projects. *INTERNATIONAL JOURNAL OF SCIENTIFIC RESEARCH IN ENGINEERING AND MANAGEMENT*. https://doi.org/10.55041/ijsrem47451

11. Alawiyah, T., Mulyani, Y. S., Gunawan, M. A., Setiaji, R., & Nurdin, H. (2022). Sistem informasi manajemen proyek (SIMAPRO) berbasis web (Studi kasus: PT. Arya Bakti Saluyu). *Jurnal Khatulistiwa Informatika*, 10(2), 129–135.

12. Fonseca, S., Benito, A., & Ramírez, C. (2025). Development and Application of an Innovative Planning and Monitoring Tool to Optimize Construction Projects. *Buildings*. https://doi.org/10.3390/buildings15020160

13. Umana, A., Afrihyia, E., Appoh, M., Frempong, D., Akinboboye, O., Okoli, I., Umar, M., & Omolayo, O. (2022). Data-Driven Project Monitoring: Leveraging Dashboards and KPIs to Track Performance in Technology Implementation Projects. *Journal of Frontiers in Multidisciplinary Research*. https://doi.org/10.54660/.ijfmr.2022.3.2.35-48

14. Radman, K., Jelodar, M., & Lovreglio, R. (2025). RealCONs: A Digital Framework for Construction Reporting Accuracy and Early Delay Detection. *J. Inf. Technol. Constr.*, 30, 745-777. https://doi.org/10.36680/j.itcon.2025.031

### Referensi Metodologi & Framework

15. Maggi, P., Booch, G., Jacobson, I., & Rumbaugh, J. (2020). Unified modeling language: Definitions. In *Encyclopedia of Information Science and Technology* (pp.). CRC Press. https://doi.org/10.1201/9781420036336.ch3

16. Al-Fedaghi, S. (2021). Classes in object-oriented modeling (UML): Further understanding and abstraction. *IJCSNS International Journal of Computer Science and Network Security*, 21(5), 21–32. https://doi.org/10.22937/IJCSNS.2021.21.5.21

17. Ahmad, N. K. (2022). *Analisa & perancangan sistem informasi berorientasi objek*. Widina Media Utama.

18. Suriya, D., & S., N. (2023). Design of UML diagrams for WEBMED - Healthcare service system services. *EAI Endorsed Trans. e Learn.*, 8, e5. https://doi.org/10.4108/eetel.v8i1.3015

19. Khomokhoana, P., Fouché, R., & Nkalai, T. (2025). Semiotic analysis of UML class diagrams in pedagogy: a case of first-year BCIS students. *Discover Education*, 4. https://doi.org/10.1007/s44217-025-00817-8

20. Pulungan, S., Febrianti, R., Lestari, T., Gurning, N., & Fitriana, N. (2023). Analisis teknik entity-relationship diagram dalam perancangan database. *Jurnal Ekonomi Manajemen dan Bisnis (JEMB)*, 1(2). https://doi.org/10.47233/jemb.v1i2.533

21. 'Afiifah, K., Azzahra, Z., & Anggoro, A. (2022). Analisis teknik entity-relationship diagram dalam perancangan database: Sebuah literature review. *INTECH*. https://doi.org/10.54895/intech.v3i1.1261

22. Hadiprakoso, R. (2021). *Sistem basis data*. RBH.

23. Khan, W., Kumar, T., Cheng, Z., Raj, K., Roy, A., & Luo, B. (2023). SQL and NoSQL database software architecture performance analysis and assessments - A systematic literature review. *Big Data Cogn. Comput.*, 7, 97. https://doi.org/10.3390/bdcc7020097

24. Genne, S. (2025). Optimizing enterprise web performance through server-side rendering: A Next.js framework implementation. *European Modern Studies Journal*. https://doi.org/10.59573/emsj.9(3).2025.21

### Referensi Teknis (Framework & Tools)

- **Next.js 15:** https://nextjs.org/docs
- **React 19:** https://react.dev/
- **TanStack Query 5:** https://tanstack.com/query/latest
- **Recharts 3:** https://recharts.org/
- **Tailwind CSS 4:** https://tailwindcss.com/
- **Express 5:** https://expressjs.com/
- **PostgreSQL 15:** https://www.postgresql.org/docs/15/
- **TypeScript 5.3:** https://www.typescriptlang.org/

---

## Lampiran (Appendix)

### A. Diagram Index

| Diagram | Type | File |
|---------|------|------|
| Use Case Diagram | UML | `DIAGRAMS/USE_CASE.drawio` |
| Activity Diagrams (6x) | UML | `DIAGRAMS/ACTIVITY_DIAGRAM.drawio` |
| Sequence Diagrams (6x) | UML | `DIAGRAMS/SEQUENCE_DIAGRAM.drawio` |
| Class Diagram | UML | `DIAGRAMS/CLASS_DIAGRAM.drawio` |
| Task Statechart | UML | `DIAGRAMS/STATECHART_TASK.drawio` |
| Entity Relationship Diagram | Data Model | `DIAGRAMS/DATABASE_ERD.drawio` |
| System Deployment | Architecture | `DIAGRAMS/DEPLOYMENT_DIAGRAM.drawio` |

### B. API Endpoint Quick Reference

**Total:** 52 Endpoints

- Auth: 4 endpoints
- Users: 4 endpoints
- Clients: 5 endpoints
- Projects: 8 endpoints
- Tasks: 8 endpoints
- Evidence: 4 endpoints
- Dashboard: 7 endpoints
- Materials: 4 endpoints
- Budget: 4 endpoints

### C. Database Table Summary

| Table | Rows | Purpose | Key Index |
|-------|------|---------|-----------|
| users | ~50 | User authentication | email |
| clients | ~20 | Customer master data | id |
| projects | 100+ | Active projects | status, created_at |
| tasks | 1000+ | Task items | project_id, status |
| daily_reports | 5000+ | Progress tracking | project_id, report_date |
| project_health | 100+ | Cached metrics | spi_value, status |
| task_evidence | 500+ | Uploaded files | task_id |
| materials | 500+ | Component tracking | project_id |
| budget_items | 300+ | Budget lines | project_id |
| project_assignments | 300+ | User-project mapping | (project_id, user_id) |

### D. Project Deliverables Checklist

**Documentation:**
- [x] Thesis document (this file)
- [x] User stories & requirements
- [x] UML diagrams (use case, sequence, class, activity)
- [x] Database design & ERD
- [x] API documentation
- [x] User manual (for Technician & Manager)
- [x] Developer guide (for future maintenance)

**Code:**
- [x] Backend API (52 endpoints)
- [x] Frontend Dashboard (9 pages)
- [x] Database schema + migrations
- [x] Unit tests
- [x] Integration tests

**Artifacts:**
- [x] Design mockups
- [x] .drawio diagram files
- [x] Deployment scripts
- [x] Environment configuration templates

---

## Status Penelitian: COMPLETE

**Total Development Time:** 1 research cycle (4-week sprint)

**Output Summary:**
- 52 API endpoints implemented & tested
- 9 frontend pages with React components
- 10 database tables with proper relationships
- 8 dashboard chart types
- 2 user roles with proper access control
- Early Warning System with automatic categorization
- Real-time data sync via TanStack Query

**Ready for:** User Acceptance Testing (UAT) dan Production Deployment

