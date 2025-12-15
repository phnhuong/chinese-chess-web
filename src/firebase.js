import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Dán config của bạn vào đây (nếu bị mất)
const firebaseConfig = {
  apiKey: "AIzaSyAMpdgtoA5TGpo9WxayE6BeMFSp61usmLI",
  authDomain: "chinese-chess-web.firebaseapp.com",
  projectId: "chinese-chess-web",
  storageBucket: "chinese-chess-web.firebasestorage.app",
  messagingSenderId: "747776925950",
  appId: "1:747776925950:web:773154b908fc2e911945af"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Khởi tạo Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();