// src/utils/rules.js

// --- HÀM HỖ TRỢ ---
const getPieceAt = (x, y, pieces) => {
  return pieces.find(p => p.x === x && p.y === y);
};

const countObstacles = (x1, y1, x2, y2, pieces) => {
  let count = 0;
  if (x1 === x2) {
    const min = Math.min(y1, y2);
    const max = Math.max(y1, y2);
    for (let y = min + 1; y < max; y++) {
      if (getPieceAt(x1, y, pieces)) count++;
    }
  } else if (y1 === y2) {
    const min = Math.min(x1, x2);
    const max = Math.max(x1, x2);
    for (let x = min + 1; x < max; x++) {
      if (getPieceAt(x, y1, pieces)) count++;
    }
  }
  return count;
};

// Hàm kiểm tra xem một tọa độ (x, y) có nằm trong Cung (Palace) hay không?
// Cung Đỏ: x từ 3-5, y từ 7-9
// Cung Đen: x từ 3-5, y từ 0-2
const isInPalace = (x, y, color) => {
  if (x < 3 || x > 5) return false; // X phải nằm giữa
  if (color === 'r') return y >= 7 && y <= 9; // Cung Đỏ (Dưới)
  if (color === 'b') return y >= 0 && y <= 2; // Cung Đen (Trên)
  return false;
};

// --- CÁC LUẬT ĐÃ CÓ (XE, PHÁO, MÃ, TƯỢNG) ---
const validateRook = (px, py, tx, ty, pieces) => {
  if (px !== tx && py !== ty) return false;
  return countObstacles(px, py, tx, ty, pieces) === 0;
};

const validateCannon = (px, py, tx, ty, pieces) => {
  if (px !== tx && py !== ty) return false;
  const obstacles = countObstacles(px, py, tx, ty, pieces);
  const targetPiece = getPieceAt(tx, ty, pieces);
  if (targetPiece) return obstacles === 1;
  else return obstacles === 0;
};

const validateKnight = (px, py, tx, ty, pieces) => {
  const dx = Math.abs(tx - px);
  const dy = Math.abs(ty - py);
  if (dx === 1 && dy === 2) {
    const blockY = py + (ty > py ? 1 : -1); 
    if (getPieceAt(px, blockY, pieces)) return false; 
    return true;
  }
  if (dx === 2 && dy === 1) {
    const blockX = px + (tx > px ? 1 : -1);
    if (getPieceAt(blockX, py, pieces)) return false;
    return true;
  }
  return false;
};

const validateElephant = (piece, tx, ty, pieces) => {
  const { x: px, y: py, color } = piece;
  const dx = Math.abs(tx - px);
  const dy = Math.abs(ty - py);
  if (dx !== 2 || dy !== 2) return false;
  if (color === 'r' && ty < 5) return false; 
  if (color === 'b' && ty > 4) return false; 
  const eyeX = (px + tx) / 2;
  const eyeY = (py + ty) / 2;
  if (getPieceAt(eyeX, eyeY, pieces)) return false; 
  return true;
};

// --- CÁC LUẬT MỚI (SĨ, TƯỚNG, TỐT) ---

// 5. LUẬT QUÂN SĨ (ADVISOR)
// - Đi chéo 1 ô: |dx|=1 & |dy|=1
// - Bắt buộc ở trong Cung
const validateAdvisor = (piece, tx, ty) => {
  const { x: px, y: py, color } = piece;
  const dx = Math.abs(tx - px);
  const dy = Math.abs(ty - py);

  // Phải đi chéo 1 ô
  if (dx !== 1 || dy !== 1) return false;

  // Phải ở trong cung
  if (!isInPalace(tx, ty, color)) return false;

  return true;
};

// 6. LUẬT QUÂN TƯỚNG (GENERAL/KING)
// - Đi ngang/dọc 1 ô: |dx| + |dy| = 1
// - Bắt buộc ở trong Cung
// - (Luật "Lộ mặt tướng" sẽ xử lý ở phần Check Game sau)
const validateGeneral = (piece, tx, ty) => {
  const { x: px, y: py, color } = piece;
  const dx = Math.abs(tx - px);
  const dy = Math.abs(ty - py);

  // Phải đi ngang hoặc dọc 1 ô
  if (dx + dy !== 1) return false;

  // Phải ở trong cung
  if (!isInPalace(tx, ty, color)) return false;

  return true;
};

// 7. LUẬT QUÂN TỐT (SOLDIER/PAWN)
// - Đi từng bước một.
// - Không bao giờ đi lùi.
// - Chưa qua sông: Chỉ đi thẳng.
// - Đã qua sông: Đi thẳng hoặc đi ngang.
const validateSoldier = (piece, tx, ty) => {
  const { x: px, y: py, color } = piece;
  const dx = Math.abs(tx - px);
  const dy = Math.abs(ty - py);

  // Chỉ được đi 1 ô mỗi lần
  if (dx + dy !== 1) return false;

  // Logic riêng cho từng màu
  if (color === 'r') { // QUÂN ĐỎ (Đi từ dưới lên - y giảm)
    // 1. Cấm đi lùi (tức là y tăng -> ty > py)
    if (ty > py) return false;

    // 2. Kiểm tra qua sông
    // Sông ở giữa y=4 và y=5. Đỏ qua sông khi y <= 4.
    if (py > 4) { 
      // Chưa qua sông: Chỉ được đi thẳng (dx = 0), Cấm đi ngang
      if (dx !== 0) return false;
    } else {
      // Đã qua sông: Được đi ngang, nhưng vẫn cấm đi lùi (đã check ở trên)
      // Không cần check gì thêm
    }
  } else { // QUÂN ĐEN (Đi từ trên xuống - y tăng)
    // 1. Cấm đi lùi (tức là y giảm -> ty < py)
    if (ty < py) return false;

    // 2. Kiểm tra qua sông
    // Đen qua sông khi y >= 5.
    if (py < 5) {
      // Chưa qua sông: Chỉ đi thẳng
      if (dx !== 0) return false;
    }
  }

  return true;
};


// --- HÀM TỔNG HỢP ---
export const isValidMove = (piece, targetX, targetY, pieces) => {
  const { x, y, type } = piece;
  if (x === targetX && y === targetY) return false;

  switch (type) {
    case 'r': return validateRook(x, y, targetX, targetY, pieces);
    case 'c': return validateCannon(x, y, targetX, targetY, pieces);
    case 'n': return validateKnight(x, y, targetX, targetY, pieces);
    case 'b': return validateElephant(piece, targetX, targetY, pieces);
    
    case 'a': // Sĩ (Advisor)
      return validateAdvisor(piece, targetX, targetY);
      
    case 'k': // Tướng (King/General)
      return validateGeneral(piece, targetX, targetY);
      
    case 'p': // Tốt (Pawn)
      return validateSoldier(piece, targetX, targetY);

    default:
      return true;
  }
};