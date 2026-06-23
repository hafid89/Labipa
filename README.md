# Plant Monitoring System - PHP + MySQL Edition

Versi rombakan dari project Next.js + Supabase menjadi PHP murni + MySQL,
supaya bisa langsung dijalankan di server lokal (XAMPP/Laragon/MAMP) tanpa
proses build/run terpisah.

## Fitur
- Login admin (sesi PHP)
- Dashboard daftar Research (proyek riset)
- Buat Research baru + daftar Plant (tanaman) sekaligus
- Halaman detail Research:
  - 2 tab kamera live (iframe, URL diatur di `config.php`)
  - Embed YouTube live stream opsional (jika diisi saat buat research)
  - Kontrol relay (toggle ON/OFF) untuk sensor soil moisture
  - Pilih plant yang sedang aktif disensor
  - Log soil moisture realtime (polling 2 detik)
  - Grid semua plant + status kelembapan terbaru tiap plant
  - Tambah / edit nama / hapus plant
  - Modal detail per plant dengan grafik Chart.js (soil moisture & suhu/kelembapan ruangan), filter Today/7 Hari/30 Hari
- Widget melayang suhu & kelembapan ruangan (DHT11) di semua halaman + history + hapus data
- Endpoint API untuk ESP32 (tanpa login): kirim data DHT11, kirim data soil moisture, baca status relay

## Realtime
PHP tidak punya realtime native seperti Supabase. Di sini dipakai **AJAX polling
setiap 2 detik** (bisa diubah di `config.php` -> `POLLING_INTERVAL_MS`) sehingga
data terasa instan tanpa perlu refresh manual.

## Instalasi

1. Copy folder ini ke server lokal (htdocs XAMPP / www Laragon, dsb).
2. Buka `config.php`, sesuaikan:
   - `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASS`
   - `CAMERA_1_URL`, `CAMERA_2_URL` (URL stream go2rtc/DVR/Tapo Anda)
3. Pastikan MySQL aktif, lalu buka `http://localhost/<folder>/install.php`
   di browser. Isi username & password admin, klik **Install Sekarang**.
   Ini akan otomatis membuat database, semua tabel, dan akun admin.
   (Alternatif manual: import `sql/schema.sql` lewat phpMyAdmin, lalu buat
   akun admin sendiri lewat query INSERT dengan `password_hash()`.)
4. **Hapus atau rename `install.php`** setelah instalasi selesai (alasan keamanan).
5. Buka `login.php`, login dengan akun admin tadi.

## Struktur Folder

```
config.php          Konfigurasi DB, kamera, interval polling
db.php               Koneksi PDO
auth.php             Helper login/session
install.php          Installer (buat tabel + admin pertama)
login.php / logout.php
index.php            Dashboard daftar research
research_new.php     Form buat research + plants baru
research_detail.php  Halaman detail (kamera, kontrol relay, plants, dst)
includes/            navbar, footer, widget DHT11 (dipakai semua halaman)
assets/css/style.css
assets/js/           dht11.js, research_new.js, research_detail.js
api/                 Endpoint JSON (dipakai AJAX & ESP32)
sql/schema.sql        Skema database MySQL
```

## Endpoint untuk ESP32

- `POST /api/room_dht11.php` body `{"temperature":27.5,"humidity":65}`
- `POST /api/soil_moisture.php` body `{"moisture_value":"71","status":"WET"}`
  (otomatis tersimpan untuk plant yang sedang aktif)
- `GET /api/sensor_status.php` -> `{"status":"HIGH","relay":1}` (baca status relay)

Endpoint ini sengaja **tanpa login** karena dipanggil oleh perangkat keras (ESP32),
bukan dari dashboard.

## Catatan Keamanan
- Selalu hapus `install.php` setelah instalasi awal.
- Ganti password admin default secepatnya lewat database jika perlu.
- Jika dashboard diakses dari luar jaringan lokal, gunakan HTTPS.
