// 1. Import module Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";

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
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 2. Konfigurasi Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBlmZWoyE6iLeqGor_ri9h9GhcUCUqzt1w",
  authDomain: "rpl2528-a444d.firebaseapp.com",
  projectId: "rpl2528-a444d",
  storageBucket: "rpl2528-a444d.firebasestorage.app",
  messagingSenderId: "524778921414",
  appId: "1:524778921414:web:095b9f8ab73bd49e84e6c7"
};

// 3. Inisialisasi Firebase dan Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const medsosCollection = collection(db, "medsos");

// 4. Fungsi menambahkan status
async function postingStatus() {
  const input = document.getElementById("isiStatus");
  
  if (!input) return;
  
  const teks = input.value.trim();
  
  if (teks === "") {
    alert("Status tidak boleh kosong!");
    return;
  }
  
  try {
    await addDoc(medsosCollection, {
      konten: teks,
      likes: 0,
      waktu: serverTimestamp()
    });
    
    input.value = "";
    
    alert("Status berhasil ditambahkan!");
  } catch (error) {
    console.error(error);
    alert("Gagal menambahkan status. Silakan coba lagi.");
  }
}

// 5. Memuat timeline
function muatTimeline() {
  const timeline = document.getElementById("timeline");
  
  if (!timeline) return;
  
  const q = query(
    medsosCollection,
    orderBy("waktu", "desc")
  );
  
  const daftarLikes =
    JSON.parse(localStorage.getItem("SUDAH_LIKE")) || [];
  
  onSnapshot(q, (snapshot) => {
    let output = "";
    
    if (snapshot.empty) {
      output = "<p>Belum ada postingan.</p>";
    } else {
      snapshot.forEach((item) => {
        const data = item.data();
        const id = item.id;
        
        const sudahLike = daftarLikes.includes(id) ?
          "liked" :
          "";
        
        output += `
          <div class="post-card">
            <div class="post-content">
              ${data.konten}
            </div>

            <button
              id="btn-like-${id}"
              class="btn-like ${sudahLike}"
              onclick="sukaStatus('${id}')"
            >
              ❤️ ${data.likes || 0} suka
            </button>
          </div>
        `;
      });
    }
    
    timeline.innerHTML = output;
  });
}

// 6. Fungsi like
async function sukaStatus(idDokumen) {
  const daftarLikes =
    JSON.parse(localStorage.getItem("SUDAH_LIKE")) || [];
  
  if (daftarLikes.includes(idDokumen)) {
    alert("Anda sudah menyukai status ini.");
    return;
  }
  
  try {
    await updateDoc(
      doc(db, "medsos", idDokumen),
      {
        likes: increment(1)
      }
    );
    
    daftarLikes.push(idDokumen);
    
    localStorage.setItem(
      "SUDAH_LIKE",
      JSON.stringify(daftarLikes)
    );
    
    const tombolLike =
      document.getElementById(`btn-like-${idDokumen}`);
    
    if (tombolLike) {
      tombolLike.classList.add("liked");
    }
    
    alert("Terima kasih telah menyukai status ini!");
  } catch (error) {
    console.error(error);
    alert("Gagal menyukai status.");
  }
}

// 7. Memuat daftar postingan admin
function muatDaftarAdmin() {
  const daftarAdmin =
    document.getElementById("daftarAdmin");
  
  if (!daftarAdmin) return;
  
  const q = query(
    medsosCollection,
    orderBy("waktu", "desc")
  );
  
  onSnapshot(q, (snapshot) => {
    let output = "";
    
    if (snapshot.empty) {
      output = `
        <p style="color:#8e8e8e;font-size:14px;">
          Belum ada postingan.
        </p>
      `;
    } else {
      snapshot.forEach((item) => {
        const data = item.data();
        const id = item.id;
        
        output += `
          <div class="post-card">
            <div class="post-content">
              ${data.konten}
            </div>

            <button
              class="btn-delete"
              onclick="hapusStatus('${id}')"
            >
              🗑️ Hapus Post
            </button>
          </div>
        `;
      });
    }
    
    daftarAdmin.innerHTML = output;
  });
}

// 8. Menghapus status
async function hapusStatus(idDokumen) {
  if (
    !confirm(
      "Apakah Anda yakin ingin menghapus postingan ini?"
    )
  ) {
    return;
  }
  
  try {
    await deleteDoc(
      doc(db, "medsos", idDokumen)
    );
    
    alert("🗑️ Postingan berhasil dihapus!");
  } catch (error) {
    console.error(error);
    alert("❌ Gagal menghapus postingan.");
  }
}

// 9. Masukkan fungsi ke window
window.postingStatus = postingStatus;
window.sukaStatus = sukaStatus;
window.hapusStatus = hapusStatus;

// 10. Jalankan fungsi
muatTimeline();
muatDaftarAdmin();