<!-- @format -->

# CIA Photobooth

**Photobooth AI untuk CIA — Civil In Action, Teknik Sipil.**

Pengunjung berdiri di depan kamera, menunjukkan hand sign, dan kamera memotret sendiri. Setelah itu pengunjung memilih desain photocard bertema teknik sipil, lalu mengambil hasilnya lewat **QR** di HP atau mencetaknya ukuran **4R**. Aplikasi bisa dijalankan di laptop booth atau **di-deploy sebagai website** (Vercel).

## Daftar Isi

- [Fitur](#fitur)
- [Teknologi](#teknologi)
- [Menjalankan di Laptop Booth](#menjalankan-di-laptop-booth)
- [Deploy ke Vercel](#deploy-ke-vercel)
- [Konfigurasi QR & Environment](#konfigurasi-qr--environment)
- [Alur Penggunaan](#alur-penggunaan)
- [AI Hand Tracking](#ai-hand-tracking)
- [Desain Photocard](#desain-photocard)
- [Cetak 4R](#cetak-4r)
- [Operasional Booth](#operasional-booth)
- [Penyimpanan dan Privasi](#penyimpanan-dan-privasi)
- [Struktur Proyek](#struktur-proyek)
- [Troubleshooting](#troubleshooting)

## Fitur

| Fitur                    | Keterangan                                                                                                       |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| Capture berbasis gesture | AI membaca 9 hand sign, menunggu tangan diam ± 1 detik, lalu hitungan mundur 3–2–1.                              |
| AI di Web Worker         | Inferensi MediaPipe berjalan di thread terpisah, jadi video, countdown, dan flash tetap mulus.                   |
| Petunjuk pintar          | Peringatan cahaya kurang, tangan terpotong di tepi, terlalu jauh, atau tangan masih bergerak.                    |
| 13 desain photocard      | 10 desain CIA (Poster, Gambar Kerja, Site Pass, Proyek Berjalan, Struktur Baja, Jembatan, Survey, Beton Ekspos, Photostrip, Sampul) + 3 desain HMS-FT Unismuh Makassar (Lencana, Pengairan, Strip) berlogo resmi HMS. |
| Filter foto              | Original, Soft, Clean, Cool, Film, dan B&W tanpa mengubah grafis desain.                                         |
| Output siap cetak        | JPG 1200 × 1800 piksel, metadata 300 dpi, ukuran kertas 4R.                                                      |
| QR untuk simpan foto     | Wi-Fi lokal, tunnel publik, atau domain website yang di-deploy. Link aktif 24 jam.                               |
| Siap deploy              | Penyimpanan otomatis pindah ke Vercel Blob saat di-deploy; upload dilindungi kunci booth.                        |

## Teknologi

| Komponen            | Teknologi                                                  |
| ------------------- | ---------------------------------------------------------- |
| Framework           | Next.js 16.3.6 (App Router, Turbopack)                     |
| Antarmuka           | React 19.2.8, JavaScript, CSS Modules                      |
| Pengenalan gesture  | MediaPipe Tasks Vision (WebAssembly) di Web Worker         |
| Komposisi photocard | Canvas API, logo CIA vektor (Path2D), logo HMS-FT (PNG)    |
| QR                  | qrcode.react                                               |
| Penyimpanan sesi    | IndexedDB di browser booth                                 |
| Penyimpanan JPG     | Folder `storage/photos` (laptop) atau Vercel Blob (deploy) |
| Tipografi           | Barlow Condensed (judul) dan Barlow (teks)                 |

Warna diambil langsung dari logo: merah `#F00C1C` di atas hitam `#000000`, huruf "i" abu arang.

## Menjalankan di Laptop Booth

Prasyarat: Node.js **20.9+**, Chrome atau Edge, webcam, dan (opsional) printer foto 4R.

```sh
git clone https://github.com/Rangga-WebDev/DTCPhotoSBooth.git
cd DTCPhotoSBooth
npm install
copy .env.example .env.local   # lalu isi NEXT_PUBLIC_LOCAL_URL
npm run dev -- --hostname 0.0.0.0
```

Buka [http://localhost:3000](http://localhost:3000) di laptop booth dan izinkan akses kamera. Untuk acara, pakai build produksi:

```sh
npm run build
npm run start -- --hostname 0.0.0.0
```

> Kamera butuh secure context: buka antarmuka booth lewat `http://localhost:3000` atau HTTPS. Alamat IP LAN (`http://192.168…`) dipakai HP untuk mengunduh foto, bukan untuk membuka kamera.

Aset AI (model `public/models/gesture_recognizer.task`, WASM, dan `vision_bundle.js` untuk worker) disalin otomatis ke `public/mediapipe/` oleh [scripts/copy-mediapipe-wasm.mjs](scripts/copy-mediapipe-wasm.mjs) sebelum `dev` dan `build`, jadi booth tetap jalan tanpa internet.

## Deploy ke Vercel

📘 **Tutorial lengkap langkah demi langkah** (GitHub → Vercel → Blob → aktivasi booth → uji coba → checklist hari H → troubleshooting): [docs/TUTORIAL-DEPLOY.md](docs/TUTORIAL-DEPLOY.md).

Dengan deploy, booth cukup membuka domain website di Chrome laptop (HTTPS, kamera langsung jalan), dan QR bisa dibuka pengunjung dari mana saja memakai data seluler. Ringkasnya:

1. Gabungkan kode ke branch **`main`** (Vercel men-deploy Production dari `main`), lalu **import** repo di [vercel.com/new](https://vercel.com/new). Framework terdeteksi otomatis sebagai Next.js; build command tidak perlu diubah.
2. **Buat Blob store**: tab **Storage** → **Blob**, region **Singapore**, akses **Private**, lalu **Connect to Project**. Kredensial Blob (`BLOB_STORE_ID` untuk OIDC dan `BLOB_READ_WRITE_TOKEN`) ditambahkan otomatis.
3. **Environment Variables** (Settings → Environment Variables):

   | Variabel               | Nilai                                                                                 |
   | ---------------------- | ------------------------------------------------------------------------------------- |
   | `BOOTH_ACCESS_KEY`     | Kunci acak. **Wajib**: tanpa kunci ini upload foto ditolak di website publik.         |
   | `CRON_SECRET`          | Rahasia acak untuk cron pembersih foto kedaluwarsa.                                   |
   | `NEXT_PUBLIC_SITE_URL` | Disarankan: domain produksi, mis. `https://cia-photobooth.vercel.app`.                |
   | `BLOB_ACCESS`          | Opsional. `private` (default) atau `public`, sesuai akses Blob store.                 |

4. **Redeploy**, lalu di laptop booth buka `https://domain-kamu/?key=KUNCI_BOOTH` **satu kali**. Kunci disimpan di browser itu dan langsung dihapus dari address bar.
5. Buka panel **Cek perangkat** di halaman kamera: Link QR = `WEBSITE`, Penyimpanan = `VERCEL BLOB`, Kunci booth = `OK`.

Di Vercel, mode QR otomatis `site` dan memakai `NEXT_PUBLIC_SITE_URL` (atau domain yang sedang dibuka). [vercel.json](vercel.json) menjalankan fungsi server di Singapura (`sin1`, terdekat dari Makassar) dan menjadwalkan `/api/cleanup` sekali sehari untuk menghapus foto yang sudah lewat 24 jam.

> Buka booth dan bagikan QR hanya lewat domain produksi. Deployment Preview dan URL deployment panjang (`nama-abc123-akun.vercel.app`) dilindungi login Vercel, jadi tidak bisa dibuka HP pengunjung.

## Konfigurasi QR & Environment

Semua variabel ada di [.env.example](.env.example). Nilai dibaca saat runtime; restart server setelah mengubahnya.

| Variabel                    | Fungsi                                                                                                   |
| --------------------------- | -------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_DOWNLOAD_MODE` | `local`, `public`, atau `site`. Default: `site` di Vercel, `local` di laptop.                            |
| `NEXT_PUBLIC_LOCAL_URL`     | Origin laptop yang bisa diakses HP di Wi-Fi yang sama, mis. `http://192.168.1.10:3000`.                  |
| `NEXT_PUBLIC_PUBLIC_URL`    | Origin HTTPS tunnel (Cloudflare Tunnel, dsb.) ke `http://localhost:3000`, untuk mode `public`.           |
| `NEXT_PUBLIC_SITE_URL`      | Domain website untuk mode `site`. Kosong = domain yang sedang dibuka. Di Vercel isi domain produksi.     |
| `BLOB_READ_WRITE_TOKEN`     | Token Vercel Blob (di Vercel juga `BLOB_STORE_ID` + OIDC, otomatis). Kalau ada, foto disimpan di Blob.  |
| `BLOB_ACCESS`               | `private` (default) atau `public`.                                                                       |
| `PHOTO_STORAGE`             | Paksa `local` atau `blob`.                                                                               |
| `BOOTH_ACCESS_KEY`          | Kunci upload; browser booth membuka `/?key=KUNCI` sekali. Wajib di mode `site` (tanpa kunci, upload ditolak). |
| `CRON_SECRET`               | Rahasia untuk `/api/cleanup` (header `Authorization: Bearer …`).                                         |

**Mode local**: HP dan laptop harus satu Wi-Fi; pastikan firewall mengizinkan port aplikasi dan router tidak memakai client isolation. Jangan memakai `localhost` sebagai alamat QR.

**Mode public**: server memeriksa apakah URL tunnel benar-benar mengarah ke proses booth ini. Kalau tunnel putus, QR baru otomatis memakai alamat Wi-Fi lokal. Lewat tunnel, internet hanya bisa membuka halaman unduhan (dibatasi oleh [src/proxy.js](src/proxy.js)).

**Mode site**: website memang publik, jadi upload foto **wajib** dilindungi `BOOTH_ACCESS_KEY`; tanpa kunci, server menolak upload.

## Alur Penggunaan

```text
Beranda → Tutorial → Kamera → Pilih Desain + Filter → Scan QR / Cetak → Sesi Berikutnya
```

1. Pilih jumlah foto (1–6).
2. Baca tutorial singkat, lalu nyalakan kamera.
3. Tunjukkan hand sign dan tahan diam sampai bar penuh; hitungan mundur berjalan sendiri.
4. Pilih desain photocard dan filter dengan pratinjau langsung.
5. Photocard dibuat dan diunggah otomatis; scan QR dengan kamera HP, atau pilih **Cetak 4R** / **Simpan ke laptop**.
6. Setelah pengunjung menerima fotonya, tekan **Mulai sesi baru**.

## AI Hand Tracking

- **Web Worker**: MediaPipe GestureRecognizer berjalan di [public/workers/gesture-worker.js](public/workers/gesture-worker.js). Frame kamera dikirim sebagai `ImageBitmap` (tanpa menyalin piksel di main thread), satu frame sekaligus. Kalau worker gagal, sistem otomatis pindah ke main thread.
- **Hemat CPU**: AI membaca maksimal 2 tangan (cukup untuk pose hati; palm detection, bagian termahal, tidak berjalan terus-menerus), lebar analisis tetap 960 px, ± 22 analisis per detik saat ada tangan dan lebih jarang saat booth kosong.
- **Pindai & zoom tangan** ([src/lib/handRoi.js](src/lib/handRoi.js)): telapak kecil di frame penuh sering terlewat, jadi saat kosong AI memindai area tengah–kiri–tengah–kanan yang di-zoom (tengah dikunjungi tiap dua langkah). Tangan yang muncul biasanya tertangkap dalam < 0,5 detik; tangan jauh diikuti dengan zoom.
- **Klasifikasi gabungan** ([src/lib/gestureClassifier.js](src/lib/gestureClassifier.js)): model bawaan MediaPipe + sudut tekuk jari 3D dari `worldLandmarks`, sehingga tetap akurat di berbagai jarak dan rotasi. Telapak terbuka dan kepalan hanya dihitung kalau tangan diangkat, supaya tangan santai di samping badan tidak memicu foto.
- **Pelacak tangan** ([src/lib/handTracker.js](src/lib/handTracker.js)): ID tetap per tangan, landmark dihaluskan One Euro filter, dan kecepatan gerak diukur untuk syarat "tahan diam".
- **Penghalusan waktu** ([src/lib/gestureSmoothing.js](src/lib/gestureSmoothing.js)): bukti gestur naik-turun dengan histeresis, jadi kedip deteksi tidak mereset hitungan.
- **Capture tanpa patah-patah**: frame dibekukan dengan `drawImage`, lalu JPEG di-encode async (`toBlob`); HUD React diperbarui maksimal 5× per detik.

## Desain Photocard

Semua desain otomatis menyesuaikan 1–6 foto dan dikelompokkan di halaman pilih desain.

**Civil In Action**: [src/lib/photocard/designs/civil.js](src/lib/photocard/designs/civil.js), berjudul besar **CIVIL IN ACTION**:

| Desain          | Tema                                                           |
| --------------- | -------------------------------------------------------------- |
| Poster          | Hitam-merah, judul besar, pita pembatas proyek.                |
| Gambar Kerja    | Kertas gambar teknik: zona lembar, garis ukur, kop gambar.     |
| Site Pass       | Kartu akses area proyek dengan data pemegang dan barcode.      |
| Proyek Berjalan | Pita "area konstruksi" dan huruf stensil.                      |
| Struktur Baja   | Balok WF, baut, dan pelat baja di tiap foto.                   |
| Jembatan        | Rangka jembatan Pratt dan garis bentang.                       |
| Survey          | Garis kontur, arah utara, dan koordinat tiap titik foto.       |
| Beton Ekspos    | Dinding beton dengan lubang tie dan stempel QC.                |
| Photostrip      | Dua strip 2 × 6 inci dalam satu lembar 4R.                     |
| Sampul          | Sampul majalah teknik sipil.                                   |

**HMS-FT Unismuh Makassar**: [src/lib/photocard/designs/hms.js](src/lib/photocard/designs/hms.js), berlogo resmi HMS dan berwarna logo (biru `#0099CB`, merah `#DA251C`):

| Desain        | Tema                                                                          |
| ------------- | ----------------------------------------------------------------------------- |
| HMS Lencana   | Latar biru, lencana HMS besar, judul HMS-FT, pita UNISMUH MAKASSAR, dinding bata. |
| HMS Pengairan | Kertas gambar: potongan saluran irigasi, muka air, stasiun (STA), data hidrolis. |
| HMS Strip     | Dua photostrip 2 × 6 inci berkepala biru dan berlogo HMS.                     |

Logo CIA digambar sebagai vektor dari [src/data/brand.js](src/data/brand.js), jadi tajam di ukuran apa pun. Logo HMS-FT berupa PNG transparan 768 × 768 px di `public/logo/hms-ft-unismuh.png`; untuk menggantinya, timpa file itu dengan nama yang sama. Kalau logo gagal dimuat, desain HMS memakai lencana cadangan.

## Cetak 4R

| Parameter     | Nilai                    |
| ------------- | ------------------------ |
| Ukuran kertas | 4R / 4 × 6 inci          |
| Resolusi file | 1200 × 1800 piksel       |
| Density JPG   | 300 dpi pada kedua sumbu |

**Cetak 4R** membuka dialog cetak browser dengan halaman 4 × 6 inci tanpa margin. Pilih ukuran kertas yang sama di driver printer, matikan header/footer, dan pakai skala 100%. Photostrip menghasilkan dua strip; potong di garis tengah.

## Operasional Booth

Pemeriksaan sebelum acara (server sudah berjalan):

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\preflight.ps1
```

Lengkapi dengan uji manual: kamera, cahaya, suara countdown, satu sesi penuh, scan QR dari HP, dan satu cetakan 4R.

Pembersihan foto kedaluwarsa di laptop (dry run dulu, lalu `-Delete`):

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\cleanup-expired-photos.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\cleanup-expired-photos.ps1 -Delete
```

Di Vercel, pembersihan berjalan otomatis lewat cron harian.

## Penyimpanan dan Privasi

- Foto mentah disimpan di IndexedDB browser booth dan dihapus saat **Mulai sesi baru**.
- Photocard final disimpan di `storage/photos/` (laptop) atau Vercel Blob (deploy), dengan ID acak 20 karakter.
- Link unduhan berlaku 24 jam sejak dibuat; setelah itu server menolak aksesnya. QR bukan autentikasi: siapa pun yang punya link bisa membuka fotonya.
- Jangan commit foto pengunjung atau `.env.local`; keduanya sudah ada di [.gitignore](.gitignore).

## Struktur Proyek

```text
docs/
  TUTORIAL-DEPLOY.md       Tutorial lengkap deploy ke Vercel
public/
  logo/cia-logo.jpg        Logo resmi CIA (latar hitam)
  logo/hms-ft-unismuh.png  Logo HMS-FT Unismuh Makassar (transparan)
  models/                  Model gesture MediaPipe
  workers/                 Web Worker AI gestur
  mediapipe/               WASM + vision_bundle.js (otomatis, tidak di-commit)
scripts/                   Preflight, salin aset MediaPipe, cleanup foto
src/
  app/                     Halaman, API foto, status QR, cleanup
  components/              Booth, desain, hasil/QR, unduhan, kiosk
  data/                    Brand (warna + logo vektor), format, gestur
  hooks/                   Stream gestur & state machine capture
  lib/
    gestureEngine.js       Worker AI + cadangan main thread
    gestureClassifier.js   Klasifikasi gabungan model + geometri 3D
    handTracker.js         ID tangan, One Euro filter, gerak
    photocard/             Layout 4R, desain, filter, ekspor
    photoServer.js         Penyimpanan lokal / Vercel Blob
    shareConfig.js         Alamat QR (local / public / site)
  proxy.js                 Pembatasan route lewat tunnel publik
```

Perintah pengembangan: `npm run dev`, `npm run build`, `npm run start`, `npm run lint`.

## Troubleshooting

| Gejala                                  | Pemeriksaan                                                                                         |
| --------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Kamera tidak terbuka                    | Pakai localhost atau HTTPS, izinkan kamera, tutup aplikasi lain yang memakai webcam.                |
| Gesture tidak terbaca                   | Ikuti petunjuk di layar (cahaya, jarak, tepi). Tangan utuh terlihat, telapak menghadap kamera.      |
| "AI offline"                            | Cek `public/models/` dan `public/mediapipe/` (jalankan `npm run dev`/`build` sekali), atau internet. |
| QR lokal tidak terbuka di HP            | Cek IPv4 laptop, Wi-Fi yang sama, firewall, dan client isolation router.                            |
| Upload gagal "Booth belum diaktifkan"   | Buka `/?key=KUNCI` sekali di browser booth (sama dengan `BOOTH_ACCESS_KEY`).                        |
| Upload gagal di Vercel                  | Pastikan Blob store terhubung (`BLOB_READ_WRITE_TOKEN`) dan `BLOB_ACCESS` sesuai akses store.       |
| HP diminta login Vercel saat buka QR    | QR memakai URL deployment yang dilindungi. Isi `NEXT_PUBLIC_SITE_URL` dengan domain produksi, deploy ulang. |
| Editor: sesi tidak ditemukan            | Pakai browser yang sama dengan saat foto diambil; sesi tersimpan di IndexedDB perangkat itu.        |
| Hasil cetak mengecil / ada margin       | Cek ukuran kertas 4 × 6 inci, skala 100%, margin, header/footer, dan opsi borderless.               |
