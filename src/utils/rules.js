// src/utils/rules.js

// HÀM HỖ TRỢ: Lấy quân cờ tại vị trí (x, y)
// Trả về object quân cờ nếu có, hoặc undefined nếu không có
const getPieceAt = (x, y, pieces) => {
  return pieces.find(p => p.x === x && p.y === y);
};

// HÀM HỖ TRỢ QUAN TRỌNG: Đếm số vật cản trên đường đi thẳng
// Trả về số lượng quân cờ nằm GIỮA điểm đi và điểm đến (không tính điểm đầu và cuối)
const countObstacles = (x1, y1, x2, y2, pieces) => {
  let count = 0;

  // 1. Nếu đi theo chiều dọc (cùng X)
  if (x1 === x2) {
    const min = Math.min(y1, y2);
    const max = Math.max(y1, y2);
    // Duyệt qua các ô nằm giữa
    for (let y = min + 1; y < max; y++) {
      if (getPieceAt(x1, y, pieces)) {
        count++;
      }
    }
  } 
  // 2. Nếu đi theo chiều ngang (cùng Y)
  else if (y1 === y2) {
    const min = Math.min(x1, x2);
    const max = Math.max(x1, x2);
    // Duyệt qua các ô nằm giữa
    for (let x = min + 1; x < max; x++) {
      if (getPieceAt(x, y1, pieces)) {
        count++;
      }
    }
  }

  return count;
};

// --- LUẬT CỦA TỪNG QUÂN ---

// 1. LUẬT QUÂN XE (ROOK)
// - Đi thẳng (ngang hoặc dọc).
// - Không có vật cản ở giữa (count == 0).
const validateRook = (px, py, tx, ty, pieces) => {
  // Xe phải đi thẳng: hoặc x bằng nhau, hoặc y bằng nhau
  if (px !== tx && py !== ty) return false;

  // Đếm vật cản
  const obstacles = countObstacles(px, py, tx, ty, pieces);
  
  // Xe chỉ đi được nếu không có vật cản (obstacles === 0)
  return obstacles === 0;
};

// 2. LUẬT QUÂN PHÁO (CANNON)
// - Đi thẳng.
// - Nếu đi nước thường (không ăn): Không vật cản (count == 0).
// - Nếu ăn quân: Phải có ĐÚNG 1 vật cản (count == 1).
const validateCannon = (px, py, tx, ty, pieces) => {
  // Pháo cũng phải đi thẳng
  if (px !== tx && py !== ty) return false;

  const obstacles = countObstacles(px, py, tx, ty, pieces);
  const targetPiece = getPieceAt(tx, ty, pieces);

  // Trường hợp 1: Ô đích có quân (Tức là hành động ĂN quân)
  if (targetPiece) {
    // Pháo muốn ăn phải nhảy qua đúng 1 quân (Ngòi)
    return obstacles === 1;
  } 
  
  // Trường hợp 2: Ô đích trống (Di chuyển bình thường)
  else {
    // Pháo đi thường giống Xe, không được có vật cản nào
    return obstacles === 0;
  }
};


// --- HÀM TỔNG HỢP: KIỂM TRA LUẬT CHUNG ---
// Hàm này sẽ được App.jsx gọi để quyết định có cho đi hay không
export const isValidMove = (piece, targetX, targetY, pieces) => {
  // Lấy thông tin quân đang đi
  const { x, y, type } = piece;

  // Nếu vị trí đích trùng vị trí hiện tại -> Không đi (tránh lỗi click nhầm)
  if (x === targetX && y === targetY) return false;

  switch (type) {
    case 'r': // Xe (Rook)
      return validateRook(x, y, targetX, targetY, pieces);
    
    case 'c': // Pháo (Cannon)
      return validateCannon(x, y, targetX, targetY, pieces);
    
    // Các quân khác (Mã, Tượng, Sĩ, Tướng, Tốt) tạm thời chưa check
    // Cho phép đi thoải mái (return true) để test game không bị tắc
    // Chúng ta sẽ bổ sung dần ở các ngày tiếp theo
    default:
      return true; 
  }
};