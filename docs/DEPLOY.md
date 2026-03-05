# NWEPP Deployment Guide (Sumopod & Docker)

Berikut adalah panduan lengkap step-by-step untuk mendeploy NWEPP (Frontend Next.js + Backend Go + Database PostgreSQL) di server Sumopod menggunakan Docker Compose. Sistem di-bind pada _Raw IP_ (tanpa domain) sehingga semuanya diletakkan di satu server.

Frontend berjalan di Port **`3000`** dan Backend di Port **`8081`**.

---

## 🛠 Langkah 1: Siapkan Server Sumopod

Login ke server Sumopod menggunakan SSH:
```bash
ssh user@ip_server_sumopod_anda
```

Install Docker & Git (jika belum ada). Jalankan command berikut:
```bash
sudo apt update
sudo apt install -y docker.io docker-compose-v2 git
sudo systemctl enable docker
sudo usermod -aG docker $USER
```
*(Setelah command terakhir, ketuk `exit` untuk keluar SSH, lalu login kembali agar permission Docker aktif tanpa `sudo`)*

---

## 📥 Langkah 2: Setup Environment & Konfigurasi

1. Clone source code NWEPP ke server (direkomendasikan di home directory):
   ```bash
   cd ~
   git clone <URL_REPO_NWEPP>
   cd nwepp
   ```

2. Buat file konfigurasi `.env` dari template:
   ```bash
   cp .env.example .env
   ```

3. Edit file `.env` (misal menggunakan `nano .env`) dan sesuaikan parameter berikut:
   ```env
   # GANTI DENGAN IP PUBLIK SERVER SUMOPOD ANDA! (Contoh: http://103.1.2.3)
   PUBLIC_APP_URL=http://<IP_SUMOPOD>:3000
   NEXT_PUBLIC_API_URL=http://<IP_SUMOPOD>:8081/api/v1
   
   # Ganti password database (opsional tapi sangat disarankan)
   DB_PASSWORD=nwepp_super_secret_db_pass
   
   # JWT Secret = string panjang dan acak untuk security token login
   JWT_SECRET=R4h4s1a_Svp3r_P4nj4ng_D4n_Ku4t_123!
   
   # CORS Origin sesuaikan dengan port Frontend:
   CORS_ORIGINS=http://<IP_SUMOPOD>:3000
   ```

---

## 🚀 Langkah 3: Build & Jalankan Aplikasi

**Pastikan Aturan Firewall (Port) Anda Terbuka:**  
Di sisi OS server Linux (Ubuntu/Debian) yang biasa dipakai Sumopod, Anda bisa menggunakan UFW untuk mengecek dan membuka port:

```bash
# Cek status firewall saat ini
sudo ufw status

# Buka akses port yang dibutuhkan aplikasi
sudo ufw allow 3000/tcp   # Frontend UI
sudo ufw allow 8081/tcp   # Backend API
sudo ufw allow 5432/tcp   # Database DB (Opsional, jika mau remote query)
sudo ufw allow 22/tcp     # Memastikan port SSH tetap terbuka agar tidak terlock!

# Reload atau hidupkan firewall
sudo ufw enable
sudo ufw reload
```

*(Catatan: Selain UFW di Linux, pastikan juga di Dashboard/Panel Sumopod jika ada menu "Security Groups" atau "Firewall", port-port di atas (3000, 8081) juga statusnya sudah "Allow" atau "Inbound Rules" nya dibuka).*

Jalankan perintah ini untuk mem-build image & menjalankan containers:
```bash
docker compose up -d --build
```
*(Build pertama kali memakan waktu lebih lama karena harus setup golang, alpine, nodejs, serta build project Next.js dan Go).*

---

## ✅ Langkah 4: Verifikasi & Testing

Cek apakah semua container berhasil menyala:
```bash
docker compose ps
```
Bila sistem berjalan normal, Service `nwepp-db`, `nwepp-api`, dan `nwepp-frontend` statusnya akan menjadi `Up` atau `Healthy`.

Silakan akses via browser:
- **Tampilan User Interface (Frontend):** `http://<IP_SUMOPOD>:3000`
- **Cek Health Check API (Backend):** `http://<IP_SUMOPOD>:8081/api/v1/health`

### 🔧 Troubleshooting
Jika ada kendala, cek log masing-masing service:
```bash
# Log Frontend Next.js
docker compose logs -f frontend

# Log Backend Go API
docker compose logs -f backend

# Log Database PostgreSQL
docker compose logs -f postgres

# Matikan semua service (jika ingin restart/ganti config)
docker compose down -v
```

---

## 👤 Manajemen Data Awal (Seeding)
Karena database berjalan *fresh*, jika membutuhkan user awal (misal Instructor), Anda bisa menambahkan data dummy via command ini (jalankan di dalam direktori `backend`):

```bash
# Generate password hash (misal untuk password "password123")
hash=$(go run cmd/hash/main.go) 

# Insert ke dalam Postgres container
docker exec nwepp-db psql -U nwepp -d nwepp_db -c "INSERT INTO users (email, password_hash, full_name, role) VALUES ('instructor@demo.com', '$hash', 'Demo Instructor', 'instructor');"
```
