// src/utils/rules.js

// --- HÀM HỖ TRỢ CƠ BẢN ---
const getPieceAt = (x, y, pieces) => {
  return pieces.find(p => p.x === x && p.y === y);
};

const countObstacles = (x1, y1, x2, y2, pieces) => {
  let count = 0;
  // Đi dọc
  if (x1 === x2) {
    const min = Math.min(y1, y2);
    const max = Math.max(y1, y2);
    for (let y = min + 1; y < max; y++) {
      if (getPieceAt(x1, y, pieces)) count++;
    }
  } 
  // Đi ngang
  else if (y1 === y2) {
    const min = Math.min(x1, x2);
    const max = Math.max(x1, x2);
    for (let x = min + 1; x < max; x++) {
      if (getPieceAt(x, y1, pieces)) count++;
    }
  }
  return count;
};

const isInPalace = (x, y, color) => {
  if (x < 3 || x > 5) return false;
  if (color === 'r') return y >= 7 && y <= 9;
  if (color === 'b') return y >= 0 && y <= 2;
  return false;
};

// --- CÁC LUẬT DI CHUYỂN CƠ BẢN ---
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

const validateAdvisor = (piece, tx, ty) => {
  const { x: px, y: py, color } = piece;
  const dx = Math.abs(tx - px);
  const dy = Math.abs(ty - py);
  if (dx !== 1 || dy !== 1) return false;
  if (!isInPalace(tx, ty, color)) return false;
  return true;
};

const validateGeneral = (piece, tx, ty) => {
  const { x: px, y: py, color } = piece;
  const dx = Math.abs(tx - px);
  const dy = Math.abs(ty - py);
  if (dx + dy !== 1) return false;
  if (!isInPalace(tx, ty, color)) return false;
  return true;
};

const validateSoldier = (piece, tx, ty) => {
  const { x: px, y: py, color } = piece;
  const dx = Math.abs(tx - px);
  const dy = Math.abs(ty - py);
  if (dx + dy !== 1) return false;
  if (color === 'r') {
    if (ty > py) return false;
    if (py > 4 && dx !== 0) return false;
  } else {
    if (ty < py) return false;
    if (py < 5 && dx !== 0) return false;
  }
  return true;
};

// --- LOGIC MỚI: KIỂM TRA LỘ MẶT TƯỚNG (FLYING GENERAL) ---
const causesFlyingGeneral = (piece, targetX, targetY, currentPieces) => {
  // 1. GIẢ LẬP NƯỚC ĐI: Tạo ra một bàn cờ ảo sau khi quân đã di chuyển
  const simPieces = currentPieces.map(p => {
    // Di chuyển quân mình đến vị trí mới
    if (p.id === piece.id) {
      return { ...p, x: targetX, y: targetY };
    }
    return p;
  }).filter(p => {
    // Nếu tại ô đích có quân địch (ăn quân), thì loại quân địch đó ra khỏi bàn cờ ảo
    // Logic: Nếu quân p đang ở vị trí đích VÀ không phải là quân vừa di chuyển tới -> Bị ăn
    return !(p.x === targetX && p.y === targetY && p.id !== piece.id);
  });

  // 2. TÌM VỊ TRÍ 2 TƯỚNG TRÊN BÀN CỜ ẢO
  const redKing = simPieces.find(p => p.type === 'k' && p.color === 'r');
  const blackKing = simPieces.find(p => p.type === 'k' && p.color === 'b');

  // (Phòng hờ trường hợp không tìm thấy tướng - dù hiếm khi xảy ra)
  if (!redKing || !blackKing) return false;

  // 3. KIỂM TRA XEM CÓ CÙNG CỘT KHÔNG
  if (redKing.x !== blackKing.x) return false; // Khác cột -> An toàn

  // 4. ĐẾM SỐ VẬT CẢN Ở GIỮA
  const obstacles = countObstacles(redKing.x, redKing.y, blackKing.x, blackKing.y, simPieces);

  // Nếu không có vật cản (obstacles === 0) -> Lộ mặt tướng -> Nước đi PHẠM LUẬT
  return obstacles === 0;
};


// --- HÀM TỔNG HỢP (Main Validator) ---
export const isValidMove = (piece, targetX, targetY, pieces) => {
  const { x, y, type } = piece;
  if (x === targetX && y === targetY) return false;

  // BƯỚC 1: Kiểm tra luật di chuyển cơ bản của từng quân
  let isBasicMoveValid = false;
  switch (type) {
    case 'r': isBasicMoveValid = validateRook(x, y, targetX, targetY, pieces); break;
    case 'c': isBasicMoveValid = validateCannon(x, y, targetX, targetY, pieces); break;
    case 'n': isBasicMoveValid = validateKnight(x, y, targetX, targetY, pieces); break;
    case 'b': isBasicMoveValid = validateElephant(piece, targetX, targetY, pieces); break;
    case 'a': isBasicMoveValid = validateAdvisor(piece, targetX, targetY); break;
    case 'k': isBasicMoveValid = validateGeneral(piece, targetX, targetY); break;
    case 'p': isBasicMoveValid = validateSoldier(piece, targetX, targetY); break;
    default: isBasicMoveValid = true;
  }

  // Nếu đi sai luật cơ bản (VD: Mã đi thẳng) -> Loại ngay
  if (!isBasicMoveValid) return false;

  // BƯỚC 2: Kiểm tra luật "Lộ mặt tướng" (MỚI)
  // Dù đi đúng luật cơ bản, nhưng nếu để hở mặt tướng -> Vẫn tính là Sai
  if (causesFlyingGeneral(piece, targetX, targetY, pieces)) {
    console.log("Không được để lộ mặt tướng!");
    return false;
  }

  return true;
};