# TATA KELOLA AI & ALUR KERJA RINGKAS (MODE LITE): [NAMA_PROYEK]

Berkas otoritatif aturan kerja, enum status, triase, dan checkpoint untuk proyek Mode LITE.

---

## 1. KONVENSI & ENUM STATUS
1. Format Waktu: Wajib format nyata (ISO 8601) atau fallback Aturan Jam X1: `YYYY-MM-DD jam: ?`. Dilarang mengarang/halusinasi jam.
2. Enum Status Tunggal:
   `PENDING | READY | IN_PROGRESS | BLOCKED | DONE`
   - `PENDING`: Menunggu dependensi selesai.
   - `READY`: Semua dependensi DONE, siap dikerjakan.
   - `IN_PROGRESS`: Sedang dikerjakan (**MAKSIMAL 1 TASK**).
   - `BLOCKED`: Terhenti; alasan wajib dicatat di WAL/Catatan.
   - `DONE`: Semua AC terpenuhi + Bukti Verifikasi riil + Disetujui: ya.

---

## 2. ATURAN KERJA UTAMA (QUALITY GATES)
1. **[R4 - Single Task]:** Hanya boleh ada MAKSIMAL SATU task berstatus `IN_PROGRESS` pada satu waktu.
2. **[R5 - Quality Gate Bukti Verifikasi]:** Status task dilarang diubah ke `DONE` tanpa bukti nyata (output terminal, log pengujian, atau commit SHA terverifikasi).
3. **[R7 - Triase Revisi]:**
   - **Level S (<= 1 berkas, <= 20 baris, tanpa perubahan skema/kontrak/AC):** Eksekusi langsung di task aktif, commit `[MINOR]`.
   - **Level M Dependen (Terkait task aktif):** Scope change pada task aktif. Ubah AC dan minta persetujuan pengguna. Dilarang preempt.
   - **Level M Independen (Fitur baru):** Daftarkan sebagai task baru berstatus `PENDING` di antrean matriks.
4. **[X1 - Anti-Ekstrapolasi Waktu]:** Gunakan fallback `'YYYY-MM-DD jam: ?'` jika jam waktu nyata tidak diketahui pasti.

---

## 3. CHECKPOINT BLOCK KANONIK (AI TANPA WRITE-ACCESS)
Di akhir setiap respons yang mengubah status kerja atau menyelesaikan langkah WAL, cetak blok kanonik berikut:

```zlce-checkpoint
TASK: <TASK-ID>
STATUS: <IN_PROGRESS | BLOCKED | DONE>
BASE_COMMIT: <git-sha-7>
STEP_COMPLETED: <ringkasan langkah yang tuntas>
EVIDENCE: <output perintah uji konkret / exit code>
NEXT_STEP: <langkah persis berikutnya>
VERIFICATION_CMD: <perintah shell verifikasi>
TIMESTAMP: <YYYY-MM-DD (HH:MM TZ | jam: ?)>
```

---

## 4. PROTOKOL PEMULIHAN SESI TERPUTUS (RECOVERY)
Hierarki evaluasi kondisi saat recovery: **D > C > B > A**
- **Kasus D:** Ada perubahan di luar WAL -> Tahan tindakan, tandai task `BLOCKED`, minta konfirmasi manusia.
- **Kasus C:** Ada commit baru di git yang belum tercatat -> Selaraskan `SESSION_STATE.md` dengan commit.
- **Kasus B:** Ada uncommitted diff yang cocok dengan berkas WAL -> Nilai AC, jalankan verifikasi, commit jika lolos.
- **Kasus A:** Working tree bersih dan `HEAD == Base Commit` -> Lanjutkan langkah WAL yang belum tersimpan.
