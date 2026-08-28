 // 1. Impor module yang diperlukan dari firebase dan firestore
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js"
import {
    getFirestore,
    collection,
    addDoc,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp,
    doc,
    updateDoc,
    deleteDoc,
    increment
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js"

// 2. Konfigurasi Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBlmZWoyE6iLeqGor_ri9h9GhcUCUqzt1w",
  authDomain: "rpl2528-a444d.firebaseapp.com",
  projectId: "rpl2528-a444d",
  storageBucket: "rpl2528-a444d.firebasestorage.app",
  messagingSenderId: "524778921414",
  appId: "1:524778921414:web:095b9f8ab73bd49e84e6c7"
};

// 3. Inisialisasi aplikasi Firebase dan Firestore
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)
const medsosCollection = collection(db, "medsos")

// Fungsi Helper untuk menampilkan popup Toast
function tampilToast(pesan) {
    const toast = document.getElementById("toast")
    if (!toast) return

    toast.innerText = pesan
    toast.classList.add("show")

    // Hilangkan toast secara otomatis setelah 2.5 detik
    setTimeout(() => {
        toast.classList.remove("show")
    }, 2500)
}

// 4. Fungsi untuk menambahkan status ke Firestore
// (digunakan di halaman admin.html)
async function postingStatus() {
    // buat variabel untuk mengambil isi status
    let teks = document.getElementById("isiStatus").value.trim()

    // abaikan jika teks kosong
    // langsung keluar dari fungsi ini
    if (teks === "") return

    try {
        // buat dokumen baru di Firestore
        await addDoc(medsosCollection, {
            konten: teks,
            likes: 0,
            waktu: serverTimestamp()
        })

        // kosongkan input teks setelah berhasil menambahkan status
        document.getElementById("isiStatus").value = ""

        // tampilkan pesan sukses
        tampilToast("Status berhasil ditambahkan!")
    } catch (error) {
        // tampilkan pesan error jika gagal menambahkan status
        tampilToast("❌ Gagal menambahkan status. Silakan coba lagi.")
    }
}

// 5, Fungsi untuk memuat timeline dari Firestore
// (digunakan di halaman index.html)
 // Suara ketika ada postingan baru


function muatTimeline() {
    // Cek dulu apakah elemen 'timeline' ada di halaman ini
    if (!document.getElementById("timeline")) return

    const q = query(medsosCollection, orderBy("waktu", "desc"))
    const daftarLike = JSON.parse(localStorage.getItem("SUDAH_LIKE")) || []

    // Siapkan suara notifikasi
    const suaraPostinganBaru = new Audio("noti.mp3")

    let jumlahPostinganSebelumnya = null

    onSnapshot(q, (snapshot) => {
        // Jika bukan pertama kali mengambil data
        if (
            jumlahPostinganSebelumnya !== null &&
            snapshot.size > jumlahPostinganSebelumnya
        ) {
            suaraPostinganBaru.play().catch((error) => {
                console.log("Suara tidak dapat diputar:", error)
            })
        }

        jumlahPostinganSebelumnya = snapshot.size

        let output = ""

        snapshot.forEach((doc) => {
            let data = doc.data()
            let id = doc.id
            let sudahLike = daftarLike.includes(id) ? "liked" : ""

            output += `
                <div class="post-card">
                    <div class="post-content">${data.konten}</div>
                    <button id="btn-like-${id}" class="btn-like ${sudahLike}" onclick="sukaStatus('${id}')">
                        ❤️ ${data.likes} Likes
                    </button>
                </div>
            `
        })

        document.getElementById("timeline").innerHTML = output
    })
}
// 6. Fungsi untuk menambahkan like pada status
async function sukaStatus(idDokumen) {
    let daftarLike = JSON.parse(localStorage.getItem("SUDAH_LIKE")) || []

    // Jika sudah di-like, munculkan peringatan
    if (daftarLike.includes(idDokumen)) {
        tampilToast("⚠️ Kamu sudah menyukai status ini!")
        return
    }

    try {
        // 1. Update jumlah like di Firestore
        await updateDoc(doc(db, "medsos", idDokumen), {
            likes: increment(1)
        })

        // 2. Simpan ID dokumen ke LocalStorage
        daftarLike.push(idDokumen)
        localStorage.setItem("SUDAH_LIKE", JSON.stringify(daftarLike))

         const suaraLike = new Audio("like.mp3")
         
        // 3. 🚀 TAMBAHKAN CLASS 'liked' SECARA INSTAN KE TOMBOL
        const tombol = document.getElementById(`btn-like-${idDokumen}`)
        if (tombol) {
            tombol.classList.add("liked")
        }
        suaraLike.play()
        // 4. Tampilkan notifikasi toast
        tampilToast("❤️ Terima kasih sudah memberi Like!")

    } catch (error) {
        console.error(error)
        tampilToast("❌ Gagal memberikan like.")
    }
}

// 7. Fungsi untuk memuat daftar postingan di admin.html beserta tombol Hapus
function muatDaftarAdmin() {
    if (!document.getElementById("daftarAdmin")) return

    const q = query(medsosCollection, orderBy("waktu", "desc"))

    onSnapshot(q, (snapshot) => {
        let output = ""
        if (snapshot.empty) {
            output = "<p style='color: #8e8e8e; font-size: 14px;'>Belum ada postingan.</p>"
        } else {
            snapshot.forEach((doc) => {
                let data = doc.data()
                let id = doc.id

                output += `
                    <div class="post-card">
                        <div class="post-content">${data.konten}</div>
                        <button class="btn-delete" onclick="hapusStatus('${id}')">
                            🗑️ Hapus Post
                        </button>
                    </div>
                `
            })
        }
        document.getElementById("daftarAdmin").innerHTML = output
    })
}

// 8. Fungsi untuk menghapus status dari Firestore
async function hapusStatus(idDokumen) {
    // Konfirmasi sebelum menghapus
    if (!confirm("Apakah Anda yakin ingin menghapus postingan ini?")) return

    try {
        await deleteDoc(doc(db, "medsos", idDokumen))
        tampilToast("🗑️ Postingan berhasil dihapus!")
    } catch (error) {
        console.error(error)
        tampilToast("❌ Gagal menghapus postingan.")
    }
}


// Daftarkan fungsi ke window scope agar bisa diakses dari HTML
window.postingStatus = postingStatus
window.sukaStatus = sukaStatus
window.hapusStatus = hapusStatus

// Panggil fungsi muatTimeline dan muatDaftarAdmin saat halaman dimuat
muatTimeline()
muatDaftarAdmin()