# BACKLOG TASK PENGEMBANGAN: ZLCE Studio

Definisi task. **Status task tidak ditulis di sini**; status ada di `SESSION_STATE.md`. Enum dan aturan: `AI_WORKFLOW.md`.

---

## 1. PETA FASE

* **FASE 0: Pondasi & Spesifikasi Kontrol** (`TASK-001`)
* **FASE 1: Engine Validator & Parser** (`TASK-002`)
* **FASE 2: Antarmuka UI Studio, Recovery, & Test Parity** (`TASK-003`)
* **FASE 3: Integrasi & Penguatan Lanjutan** (`TASK-004`)

---

## 2. FORMAT TASK

### TASK-001: Inisialisasi Arsitektur & Dokumen Kontrol ZLCE Studio
* **Fase:** FASE 0
* **Deskripsi:** Setup lingkungan kerja React 19, Vite, Tailwind CSS v4, TypeScript, pustaka template ZLCE, dan berkas kontrol standar.
* **Dependensi:** -
* **File:** `package.json`, `vite.config.ts`, `templates/*`, `AI_WORKFLOW.md`, `SESSION_STATE.md`, `TASKS.md`
* **Docs Terkait (Tier 1):** `templates/BLUEPRINT.template.md`, `AI_WORKFLOW.md`
* **Docs Impact:** `README.md`, `CHANGELOG.md`
* **Acceptance Criteria:**
  1. Struktur repositori terpasang bersih dengan Vite + React + Tailwind v4.
  2. Linter dan compiler TypeScript berjalan tanpa error.
  3. Dokumen kontrol baku ZLCE tersedia lengkap.
* **Test Case:** `npm run build && npm run lint`
* **Metode Verifikasi:** Jalankan lint dan compile applet; output 0 error.

---

### TASK-002: Implementasi Engine Validator, Parser Markdown & Token Gauge
* **Fase:** FASE 1
* **Deskripsi:** Membangun parser `SESSION_STATE.md`, validator aturan ZLCE (R1–R12, Aturan Jam X1, exact approval), dan token counter.
* **Dependensi:** `TASK-001`
* **File:** `src/utils/zlceValidator.ts`, `src/utils/markdownParser.ts`, `scripts/zlce/zlce-check.py`
* **Docs Terkait:** `AI_WORKFLOW.md`
* **Docs Impact:** `SESSION_STATE.md`
* **Acceptance Criteria:**
  1. Validator mendeteksi pelanggaran enum, duplikasi task, dan desinkronisasi WAL.
  2. Paritas 100% antara implementasi TypeScript dan Python.
  3. Aturan jam anti-ekstrapolasi X1 (`YYYY-MM-DD jam: ?`) tervalidasi.
* **Test Case:** `python3 tests/test_parity.py`
* **Metode Verifikasi:** Jalankan automated parity suite; seluruh pengujian valid dan invalid lulus.

---

### TASK-003: UI Studio, Tab Recovery, Wizard Mode, & Automated Test Parity
* **Fase:** FASE 2
* **Deskripsi:** Membangun antarmuka tab lengkap (Session State editor, Recovery wizard, Test Harness, Templates pack, Landing Wizard) dan test runner otomatis.
* **Dependensi:** `TASK-002`
* **File:** `src/components/*`, `src/hooks/useSessionPersistence.ts`, `tests/*`
* **Docs Terkait:** `AI_WORKFLOW.md`, `docs/USAGE.md`
* **Docs Impact:** `CHANGELOG.md`, `README.md`
* **Acceptance Criteria:**
  1. Editor markdown interaktif dengan live linting dan atomic envelope persistence.
  2. Simulator pemulihan Kasus A–D dengan snapshot generator.
  3. Skrip `npm test` terintegrasi di package.json.
* **Test Case:** `npm test && npm run build`
* **Metode Verifikasi:** Jalankan `npm test`; build produksi sukses.

---

### TASK-004: Integrasi Workspace & Penguatan Ekosistem
* **Fase:** FASE 3
* **Deskripsi:** Fitur lanjutan untuk ekspor/impor workspace multi-proyek dan sinkronisasi eksternal.
* **Dependensi:** `TASK-003`
* **File:** `src/components/SettingsModal.tsx`, `src/utils/exportImport.ts`
* **Docs Terkait:** `AI_WORKFLOW.md`
* **Docs Impact:** `SESSION_STATE.md`
* **Acceptance Criteria:**
  1. Fitur ekspor/impor JSON envelope berfungsi tanpa kehilangan data riwayat.
* **Test Case:** `tests/test_export.ts`
* **Metode Verifikasi:** Unit test ekspor/impor envelope.
