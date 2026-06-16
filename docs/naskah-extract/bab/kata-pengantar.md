# KATA PENGANTAR

_Pages 5-7 of Naskah TA Final 4.pdf_


<!-- page 5 -->

 
 iv 
 
KATA PENGANTAR 
 
Segala puji dan syukur penulis panjatkan ke hadirat Allah SWT yang telah 
melimpahkan rahmat dan karunia-Nya, sehingga laporan Tugas Akhir yang berjudul 
“Pengembangan Fitur Dashboard Pada Sistem Manajemen Proyek Berdasarkan Data 
Laporan Harian (Studi Kasus : PT Smart Home Inovasi Yogyakarta)” dapat disusun 
dan diselesaikan dengan baik. Dalam penyusunan laporan Tugas Akhir ini, penulis 
memperoleh banyak dukungan dan arahan dari berbagai pihak. Oleh karena itu, dengan 
penuh rasa hormat, izinkan penulis menyampaikan ucapan terima kasih yang tulus 
kepada:  
 
1. Bapak Dr. Bambang Moertono S., Dr., MM., Akt., CA., selaku Rektor 
Universitas Teknologi Yogyakarta. 
2. Ibu Prof. Dr. Ar. Endy Marlina, S.T., M.T., IAI. selaku Dekan Universitas 
Teknologi Yogyakarta, Universitas Teknologi Yogyakarta. 
3. Bapak Adityo Permana Wibowo, S.Kom, M.Cs., selaku Kepala Program 
Studi Sarjana Sistem Informasi sekaligus Dosen Pembimbing. 
4. Bapak Amin Iswandi yang telah memberikan kesempatan serta fasilitas 
untuk menjadikan kegiatan ini sebagai objek studi kasus Tugas Akhir ini. 
 
Penulis menyadari bahwa laporan Tugas Akhir ini tidak luput dari berbagai 
kekurangan. Penulis mengharapkan masukan, kritik, dan saran yang membangun demi 
kesempurnaan dan perbaikannya agar bisa menjadi pembelajaran dan menjadi lebih 
baik lagi. Penulis berharap laporan ini mampu membantu memberi manfaat bagi pihak 
perusahaan dalam pengelolaan penjadwalan dan pemantauan proyek, berkontribusi 
bagi pengembangan bidang pendidikan, penerapan di lapangan, serta dapat 
dikembangkan lebih lanjut. 
 
Sleman, ………………………..2026 
Penulis 
 
 
 
 
 
     Dian Putri Iswandi

<!-- page 6 -->

 
 v 
 
ABSTRAK 
Pengelolaan proyek di PT Smart Home Inovasi Yogyakarta menghadapi kendala 
keterlambatan deteksi masalah akibat pelaporan progres harian yang tidak langsung 
dan ketiadaan visualisasi data secara terpusat. Penelitian ini bertujuan merancang fitur 
dashboard pada sistem manajemen proyek berbasis web untuk memproses data laporan 
harian keseluruhan proyek menjadi indikator status kesehatan secara otomatis. 
Pengembangan sistem menggunakan metode System Development Life Cycle (SDLC) 
model Waterfall dan diimplementasikan dengan framework Next.js. Sistem 
menerapkan Role-Based Access Control (RBAC) sebagai gerbang validasi persetujuan 
manajer yang memungkinkan teknisi menginput laporan lapangan secara mandiri, serta 
mengautomasi perhitungan Schedule Performance Index (SPI). Hasil penelitian berupa 
dashboard terintegrasi yang menyajikan analitik performa multidimensional dan fitur 
Early Warning System (EWS) dengan indikator Red-Amber-Green (RAG) berdasarkan 
ambang batas nilai SPI. Kesimpulannya, implementasi fitur dashboard ini berhasil 
mengeliminasi manipulasi data progres manual, mempercepat identifikasi proyek kritis 
secara objektif dan real-time, serta memberikan visibilitas manajerial yang 
komprehensif untuk memantau kelancaran operasional proyek secara faktual. 
 
Kata Kunci: Dashboard, Laporan Harian, Sistem Manajemen Proyek, Schedule 
Performance Index, Next.js

<!-- page 7 -->

 
 vi 
 
ABSTRACT 
Project management at PT Smart Home Inovasi Yogyakarta faces delayed problem 
detection due to indirect daily progress reporting and a lack of centralized data 
visualization. This research aims to design a dashboard feature on a web-based project 
management system to automatically process overall project daily report data into 
health status indicators. The system was developed using the System Development Life 
Cycle (SDLC) Waterfall model and implemented with the Next.js framework. The 
system applies Role-Based Access Control (RBAC) as a manager approval review gate, 
enabling technicians to input field reports independently, and automates Schedule 
Performance Index (SPI) calculations. The result is an integrated dashboard 
presenting multidimensional performance analytics and an Early Warning System 
(EWS) feature with Red-Amber-Green (RAG) indicators based on SPI thresholds. In 
conclusion, the dashboard implementation successfully eliminates manual progress 
data manipulation, accelerates objective and real-time critical project identification, 
and provides comprehensive managerial visibility to monitor actual project 
operational fluency. 
Keywords: Dashboard, Daily Report, Project Management System, Schedule 
Performance Index, Next.js