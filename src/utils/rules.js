// src/utils/rules.js

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

// --- CÁC LUẬT CŨ (XE, PHÁO) ---
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

// --- CÁC LUẬT MỚI (MÃ, TƯỢNG) ---

// 3. LUẬT QUÂN MÃ (KNIGHT)
// - Đi hình chữ L: |dx|=1 & |dy|=2 HOẶC |dx|=2 & |dy|=1
// - Phải check "Cản chân" (Block)
const validateKnight = (px, py, tx, ty, pieces) => {
  const dx = Math.abs(tx - px);
  const dy = Math.abs(ty - py);

  // Trường hợp 1: Nhảy dọc (Đi dọc 2 ô, ngang 1 ô)
  if (dx === 1 && dy === 2) {
    // Chân Mã nằm ở ô phía trước theo chiều dọc
    // Ví dụ: Từ (3,3) nhảy lên (4,5) thì chân ở (3,4)
    // Tính tọa độ chân: Giữ nguyên x, y cộng thêm 1 hướng về phía đích
    const blockY = py + (ty > py ? 1 : -1); 
    const blockPiece = getPieceAt(px, blockY, pieces);
    
    // Nếu có quân ở chân -> Bị cản -> Không đi được
    if (blockPiece) return false; 
    
    return true;
  }

  // Trường hợp 2: Nhảy ngang (Đi ngang 2 ô, dọc 1 ô)
  if (dx === 2 && dy === 1) {
    // Chân Mã nằm ở ô bên cạnh theo chiều ngang
    const blockX = px + (tx > px ? 1 : -1);
    const blockPiece = getPieceAt(blockX, py, pieces);
    
    if (blockPiece) return false;

    return true;
  }

  // Không phải hình chữ L
  return false;
};

// 4. LUẬT QUÂN TƯỢNG (ELEPHANT)
// - Đi chéo đúng 2 ô: |dx|=2 & |dy|=2
// - Không được qua sông.
// - Check "Cản mắt" (Block center).
const validateElephant = (piece, tx, ty, pieces) => {
  const { x: px, y: py, color } = piece;
  const dx = Math.abs(tx - px);
  const dy = Math.abs(ty - py);

  // 1. Phải đi chéo đúng 2 ô
  if (dx !== 2 || dy !== 2) return false;

  // 2. Kiểm tra qua sông
  // Sông nằm giữa y=4 và y=5.
  // Đỏ (ở dưới) chỉ được đi y >= 5. Đen (ở trên) chỉ được đi y <= 4.
  if (color === 'r' && ty < 5) return false; // Đỏ vượt rào
  if (color === 'b' && ty > 4) return false; // Đen vượt rào

  // 3. Kiểm tra cản mắt tượng (Điểm chính giữa)
  // Tọa độ mắt tượng là trung bình cộng của đi và đến
  const eyeX = (px + tx) / 2;
  const eyeY = (py + ty) / 2;
  
  if (getPieceAt(eyeX, eyeY, pieces)) return false; // Có quân chặn mắt

  return true;
};


// --- HÀM TỔNG HỢP ---
export const isValidMove = (piece, targetX, targetY, pieces) => {
  const { x, y, type } = piece;
  if (x === targetX && y === targetY) return false;

  switch (type) {
    case 'r': return validateRook(x, y, targetX, targetY, pieces);
    case 'c': return validateCannon(x, y, targetX, targetY, pieces);
    
    case 'n': // Mã (Knight)
      return validateKnight(x, y, targetX, targetY, pieces);
      
    case 'b': // Tượng (Elephant/Bishop) - Lưu ý: trong code ta đặt type là 'b'
      return validateElephant(piece, targetX, targetY, pieces);

    default:
      return true; // Sĩ, Tướng, Tốt vẫn đi tự do
  }
};