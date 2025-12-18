# ♟️ KỲ VƯƠNG ONLINE (Chinese Chess Web)

Game Cờ Tướng Online thời gian thực, hỗ trợ chơi 2 người (PvP) và luyện tập với AI. 
Xây dựng từ con số 0 trong hành trình "50 Ngày Lập Trình".

🔗 **Chơi ngay tại:** [https://chinese-chess-web.web.app/](https://chinese-chess-web.web.app/)

## 🚀 Tính năng nổi bật

### 1. Chế độ chơi
*   **Online (PvP):** Tạo phòng, mời bạn bè vào chơi qua link/mã phòng. Đồng bộ nước đi thời gian thực (Realtime).
*   **Luyện tập (PvE):** Đấu với máy (AI Minimax + AlphaBeta Pruning + Opening Book). Máy biết khai cuộc chuẩn và tính trước 4-6 nước.
*   **Khán giả (Spectator):** Người thứ 3 có thể vào xem trận đấu và chat.

### 2. Trải nghiệm người dùng
*   **Giao diện:** Thiết kế Responsive, chơi tốt trên cả Máy tính và Điện thoại.
*   **PWA (App):** Có thể cài đặt trực tiếp lên điện thoại như ứng dụng native (Android/iOS/PC).
*   **Âm thanh:** Hiệu ứng tiếng đi quân, ăn quân, chiếu tướng, nhạc thắng/thua.
*   **Hỗ trợ:** Tính năng Xin thua, Cầu hòa, Chat trong phòng.

### 3. Hệ thống
*   **Tài khoản:** Đăng nhập bằng Google.
*   **Xếp hạng:** Lưu lịch sử Thắng/Thua và hiển thị Bảng Xếp Hạng (Leaderboard) realtime.
*   **Lịch sử:** Ghi lại biên bản ván đấu, hỗ trợ tua lại (Replay) sau khi kết thúc.

## 🛠️ Công nghệ sử dụng
*   **Frontend:** ReactJS, Vite.
*   **Styling:** Tailwind CSS.
*   **Backend & Hosting:** Google Firebase (Firestore, Authentication, Hosting).
*   **AI Engine:** Minimax Algorithm (Custom built in JS).

## 📦 Cài đặt & Chạy thử (Development)

1.  Clone dự án về máy:
    ```bash
    git clone https://github.com/your-username/chinese-chess-web.git
    cd chinese-chess-web
    ```

2.  Cài đặt thư viện:
    ```bash
    npm install
    ```

3.  Chạy server ảo (Localhost):
    ```bash
    npm run dev
    ```

## 🌐 Triển khai (Deploy)

Dự án được deploy tự động lên Firebase Hosting:
```bash
npm run build
firebase deploy
```

---
© 2025 Developed by Pham Hong
```