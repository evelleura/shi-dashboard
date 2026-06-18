# iso-logs — log lengkap stack terisolasi (run.py --iso)

Dibuat: 2026-06-18 13:31:44. Folder ini berisi SELURUH log sistem untuk diserahkan ke sesi berikutnya.

| File | Isi | Sumber |
|---|---|---|
| `next-dev.log` | Log server Next.js: kompilasi, **request API** (GET/POST /api/...), `console.*` di handler, error server | run.py tee stdout `next dev` |
| `postgres.log` | **Setiap query SQL** + koneksi (log_statement=all) | follower `docker logs` DB iso |
| `browser-console.log` | **Console frontend** (semua level) + page error, per langkah | walkthrough.py |
| `api-calls.log` | **Setiap panggilan /api/** dari browser: method, URL, status, ms | walkthrough.py |
| `actions-timeline.log` | **TIMELINE aksi** — tiap langkah diberi garis pemisah jelas, lalu API/console yang terjadi di langkah itu | walkthrough.py |
| `_console-errors.json` | error/warning ringkas (mesin-baca) | walkthrough.py |

## Cara baca
Mulai dari `actions-timeline.log` (ada garis `==== STEP NN ====` per aksi). Tiap baris ber-**timestamp**, jadi bisa dikorelasikan ke `next-dev.log` & `postgres.log` (samakan jam:menit:detik) untuk lihat API + query DB yang dipicu aksi itu.

## Regenerasi
```
python run.py --new --iso          # nyalakan (tulis next-dev.log + postgres.log)
cd docs/hasil-uji && python walkthrough.py   # tulis browser/api/timeline
python run.py --iso --stop          # hentikan
```
