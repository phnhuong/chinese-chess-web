// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Cấu hình Firebase của bạn
const firebaseConfig = {
  apiKey: "AIzaSyAMpdgtoA5TGpo9WxayE6BeMFSp61usmLI",
  authDomain: "chinese-chess-web.firebaseapp.com",
  projectId: "chinese-chess-web",
  storageBucket: "chinese-chess-web.firebasestorage.app",
  messagingSenderId: "747776925950",
  appId: "1:747776925950:web:773154b908fc2e911945af"
};

// Khởi tạo Firebase App
const app = initializeApp(firebaseConfig);

// Khởi tạo Firestore Database và Export ra để dùng ở nơi khác
export const db = getFirestore(app);