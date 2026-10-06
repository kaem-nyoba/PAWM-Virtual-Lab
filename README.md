# Sportslab

**Sportslab** adalah media pembelajaran interaktif gerak parabola untuk Fisika TPB ITB, dikemas sebagai permainan basket dalam dunia pixel. Pengguna mengatur sudut, kecepatan awal, tinggi pelepasan, dan jarak pemain; mengamati lintasan; mencatat hasil; lalu membandingkan percobaan untuk memahami gerak dua dimensi.

Proyek tugas individu PAWM. Seluruh simulasi berjalan di browser menggunakan HTML, CSS, dan JavaScript. Tidak ada backend, proses build, atau instalasi dependency. Font menggunakan Google Fonts dengan fallback font sistem; seluruh scenery dan sprite dibuat langsung dengan Canvas, tanpa aset gambar eksternal.

## Menjalankan

Buka `index.html` di browser modern, atau gunakan extension Live Server di VS Code. Untuk menguji lewat server lokal jika Python tersedia:

```sh
python -m http.server 8080
```

Buka `http://localhost:8080`. Flask tidak diperlukan karena target pengumpulan adalah web statis pada GitHub Pages.

## GitHub Pages

1. Commit dan push file proyek ke branch `main`.
2. Buka repository di GitHub → **Settings → Pages**.
3. Pilih **Deploy from a branch**, branch **main**, folder **/(root)**, lalu **Save**.
4. Setelah deployment selesai, gunakan URL yang ditampilkan di halaman Pages. Umumnya `https://USERNAME.github.io/PAWM-Virtual-Lab/` (sesuaikan nama repository).

Semua tautan aset memakai path relatif agar bekerja pada project site GitHub Pages.

## Fitur

- **Laboratorium:** sudut 10–80°, kecepatan 3–18 m/s, jarak ring 3–11 m, tinggi pelepasan 1–4.9 m termasuk pijakan.
- **Tantangan:** tiga level jarak 5, 8, dan 10 m; prediksi lintasan dinonaktifkan pada level terakhir.
- Canvas dengan scenery dan pemain pixel; tipografi serta kontrol memakai font biasa.
- Native HTML5 drag-and-drop untuk memindahkan pemain; Pointer Events pada perangkat sentuh; tombol panah dan input jarak sebagai alternatif.
- Drag-and-drop balok ke pemain untuk menambahkan hingga empat pijakan, masing-masing **0.6 m**. Pemain naik bersama pijakan dan tinggi pelepasan fisika ikut berubah. Tombol +/− dan keyboard tersedia sebagai alternatif. Pijakan hanya tersedia di laboratorium; tantangan tetap memakai tinggi awal 1.9 m.
- Lapangan besar dengan kontrol melayang, warna biru cerah, dan buku eksperimen/teori yang dibuka sesuai kebutuhan.
- Lempar, jeda/lanjut, reset, gerak lambat, prediksi lintasan, vektor kecepatan, grid pengukuran, dan Fullscreen API jika didukung.
- Pengukuran waktu terbang, tinggi maksimum, jangkauan teoretis, dan waktu simulasi berjalan.
- Skala kamera menyesuaikan lintasan tinggi/jauh serta dua percobaan yang dibandingkan agar tetap terlihat.
- Buku eksperimen, perbandingan dua lintasan, penyimpanan `localStorage`, serta ekspor CSV lewat Blob API.
- Panduan eksperimen, pertanyaan refleksi, dan penjelasan rumus.
- Semantic HTML (`header`, `nav`, `main`, `section`, `article`, `aside`, `footer`), `fieldset`, `output`, `details/summary`, `dialog`, dan kontrol berlabel.
- Layout responsif, navigasi keyboard, serta pemberitahuan hasil melalui live region.

## Model fisika dan batasnya

Satuan internal adalah SI: meter, detik, dan meter per detik. Gravitasi konstan **9.81 m/s²**, tanpa hambatan udara.

```text
x(t) = x0 + v0 cos(theta) t
y(t) = y0 + v0 sin(theta) t - 0.5 g t²
vx(t) = v0 cos(theta)
vy(t) = v0 sin(theta) - g t
y_max = y0 + (v0 sin(theta))² / (2g)
t_floor = (v0 sin(theta) + sqrt((v0 sin(theta))² + 2g y0)) / g
range = v0 cos(theta) t_floor
```

Tinggi ring **3.05 m**, bukaan ring **0.45 m**, radius bola **0.12 m**. Keberhasilan dinilai ketika pusat bola melewati tinggi ring saat turun dan seluruh lebar bola muat pada bukaan, selama belum terjadi benturan. Kontak tepi ring diperiksa dengan substep tetap dan bisection, terpisah dari frame animasi. Papan dimodelkan sebagai segmen vertikal; lantai disentuh ketika pusat bola berada satu radius di atasnya. Simulasi berhenti saat masuk atau benturan pertama; tidak memodelkan pantulan maupun gerak 3D.

**Waktu dan jangkauan pada panel/tabel adalah nilai teoretis sampai pusat bola mencapai y = 0, seandainya tidak ada ring/papan.** Waktu simulasi sebenarnya berhenti pada kejadian pertama dan dapat lebih pendek. Tinggi maksimum diukur dari lantai. Sudut 45° memberi jangkauan maksimum hanya jika tinggi awal dan akhir sama.

## Berkas

```text
index.html          Struktur semantic dan antarmuka
styles.css          Desain, tipografi, layout responsif
playground.css      Layout arena dan tema biru cerah
physics.js          Perhitungan fisika tanpa DOM
app.js              Canvas, animasi, permainan, dan buku eksperimen
assets/favicon.svg  Identitas Sportslab
verify.cjs          Pemeriksaan numerik model fisika
```

Jalankan pemeriksaan fisika dengan `node verify.cjs`.

## Verifikasi

- **465 assertion fisika:** hasil analitik, akar waktu ke lantai, puncak lintasan, kecepatan horizontal, benturan, tinggi tambahan pijakan, serta tembakan yang dapat memenangkan semua level.
- **Uji browser Microsoft Edge:** desktop 1440 px dan mobile 390 px; lempar/jeda/lanjut; native drag-and-drop pemain serta balok; penambahan/pengurangan empat pijakan; alternatif keyboard dan event sentuh; tiga kemenangan tantangan; penyimpanan setelah reload; batas dua perbandingan; ekspor CSV; konfirmasi hapus; serta lintasan parameter ekstrem. Tidak ditemukan error JavaScript atau overflow horizontal halaman pada viewport tersebut.
- Screenshot hasil tersedia di folder `screenshots/`.

## Pengumpulan

Kumpulkan URL website GitHub Pages, URL repository source code, screenshot mode laboratorium/tantangan/buku eksperimen, dan deskripsi singkat pada paragraf pembuka README ini melalui Google Drive.
