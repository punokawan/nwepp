# PRODUCT REQUIREMENT DOCUMENT (PRD)

## Product Name

**Nutrition Workforce Education & Placement Platform (NWEPP)**

## Document Version

v1.0

## Date

March 2026

---

# 1. Background

Program **Makan Bergizi Gratis (MBG)** membutuhkan tenaga kerja dalam jumlah besar untuk menjalankan operasional dapur, distribusi makanan, serta pengawasan kualitas gizi.

Estimasi kebutuhan tenaga kerja nasional:

* 30.000+ dapur produksi
* 400.000+ tenaga operasional
* 30.000+ tenaga ahli gizi

Saat ini terdapat beberapa tantangan:

1. Tidak semua tenaga kerja memiliki pemahaman gizi.
2. Distribusi tenaga ahli gizi tidak merata.
3. Tidak ada sistem standar nasional untuk training tenaga MBG.
4. Rekrutmen dan penempatan masih terfragmentasi.

Untuk itu dibutuhkan sebuah platform nasional yang mampu:

* Melatih tenaga kerja
* Menstandarisasi kompetensi
* Menyaring kandidat terbaik
* Menempatkan kandidat pada posisi yang sesuai

---

# 2. Product Vision

Membangun **platform nasional untuk edukasi, sertifikasi, dan manajemen tenaga kerja gizi** guna mendukung implementasi program MBG secara efektif dan terstandarisasi.

---

# 3. Product Goals

1. Menyediakan sistem edukasi untuk ahli gizi dan non-ahli gizi.
2. Menstandarisasi kompetensi tenaga kerja MBG.
3. Membangun database nasional tenaga kerja MBG.
4. Menyediakan sistem seleksi berbasis kompetensi.
5. Mengotomatisasi proses penempatan tenaga kerja.

---

# 4. Target Users

### Primary Users

1. Ahli gizi
2. Tenaga operasional dapur
3. Supervisor dapur
4. Manajer regional program

### Secondary Users

1. Institusi pemerintah
2. Operator dapur MBG
3. Lembaga pelatihan
4. Tim monitoring program

---

# 5. Product Scope

Platform akan memiliki empat modul utama:

1. Learning Management System (LMS)
2. Certification & Assessment System
3. Talent Database & Ranking
4. Workforce Placement System

---

# 6. Key Features

## 6.1 Learning Platform

Platform menyediakan modul pelatihan yang dapat diakses secara online.

### Training Tracks

**Track 1 – Ahli Gizi**

Materi:

* Perencanaan menu
* Perhitungan nutrisi
* Audit gizi
* Monitoring status gizi

**Track 2 – Non-Ahli Gizi**

Materi:

* Dasar gizi
* Food safety
* Operasional dapur
* Distribusi makanan

**Track 3 – Manajemen**

Materi:

* Manajemen dapur besar
* Supply chain pangan
* Monitoring program
* Manajemen tim

---

## 6.2 Certification System

Peserta yang menyelesaikan pelatihan dapat mengikuti ujian sertifikasi.

### Certification Levels

| Level | Name |
|-------|------|
| 1 | Nutrition Awareness |
| 2 | Food Service Operator |
| 3 | Kitchen Supervisor |
| 4 | Nutrition Manager |
| 5 | Regional Nutrition Director |

Sertifikasi terdiri dari:

* Ujian teori
* Ujian praktik
* Evaluasi kompetensi

---

## 6.3 Talent Database

Platform akan menyimpan data kandidat dalam bentuk **national nutrition workforce database**.

Data yang disimpan:

* Profil kandidat
* Sertifikasi
* Nilai ujian
* Pengalaman kerja
* Lokasi domisili

---

## 6.4 Talent Ranking System

Kandidat akan diberikan skor berdasarkan beberapa faktor:

**Score Formula:**

| Component | Weight |
|-----------|--------|
| Exam score | 40% |
| Practical assessment | 30% |
| Experience | 20% |
| Soft skills evaluation | 10% |

Ranking digunakan untuk menentukan kandidat terbaik.

---

## 6.5 Workforce Placement System

Sistem akan mencocokkan kandidat dengan kebutuhan tenaga kerja di dapur MBG.

Matching mempertimbangkan:

* Sertifikasi kandidat
* Skor ranking
* Lokasi kandidat
* Kebutuhan dapur

Contoh posisi yang tersedia:

**Struktural**: Regional Manager, Nutrition Supervisor, Kitchen Manager

**Operasional**: Cook, Food Packer, Distribution Staff

---

# 7. User Journey

1. **Registration** — User membuat akun di platform.
2. **Training** — User memilih jalur pelatihan yang sesuai.
3. **Assessment** — User mengikuti ujian sertifikasi.
4. **Certification** — User memperoleh sertifikat kompetensi.
5. **Talent Pool** — User masuk ke database kandidat nasional.
6. **Placement** — Sistem mencocokkan kandidat dengan posisi yang tersedia.

---

# 8. Technology Architecture

| Component | Technology |
|-----------|-----------|
| Backend | Golang API Service |
| Frontend | React / Next.js |
| Database | PostgreSQL |
| Infrastructure | Cloud-based deployment |

### Optional AI Layer

* Candidate matching
* Menu recommendation
* Workforce demand prediction

---

# 9. Success Metrics

1. Jumlah tenaga kerja tersertifikasi
2. Waktu rata-rata penempatan tenaga kerja
3. Tingkat kelulusan pelatihan
4. Tingkat kepuasan dapur MBG
5. Konsistensi standar gizi nasional

---

# 10. Future Expansion

* National Nutrition Workforce Platform
* Sistem monitoring gizi nasional
* Sistem perencanaan menu berbasis AI
* Platform supply chain pangan nasional

---

# 11. Risks

| Risk | Impact |
|------|--------|
| Ketersediaan tenaga ahli gizi terbatas | High |
| Kualitas training tidak merata | Medium |
| Keterbatasan infrastruktur digital di daerah | High |
| Resistensi dari institusi lokal | Medium |

---

# 12. Implementation Phases

### Phase 1 — MVP

* LMS
* Certification system
* Basic talent database

### Phase 2

* Talent ranking
* Workforce placement

### Phase 3

* AI matching
* National monitoring dashboard

---

# 13. Expected Impact

Platform ini diharapkan mampu:

* Meningkatkan kualitas operasional dapur MBG
* Menstandarisasi kompetensi tenaga kerja
* Mempercepat rekrutmen tenaga kerja
* Memastikan kualitas gizi makanan tetap terjaga
