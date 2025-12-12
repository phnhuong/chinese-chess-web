// src/utils/rules.js

// --- HÀM HỖ TRỢ CƠ BẢN ---
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

// --- KIỂM TRA LỘ MẶT TƯỚNG ---
const causesFlyingGeneral = (piece, targetX, targetY, currentPieces) => {
  const simPieces = currentPieces.map(p => {
    if (p.id === piece.id) return { ...p, x: targetX, y: targetY };
    return p;
  }).filter(p => !(p.x === targetX && p.y === targetY && p.id !== piece.id));

  const redKing = simPieces.find(p => p.type === 'k' && p.color === 'r');
  const blackKing = simPieces.find(p => p.type === 'k' && p.color === 'b');

  if (!redKing || !blackKing) return false;
  if (redKing.x !== blackKing.x) return false; 

  const obstacles = countObstacles(redKing.x, redKing.y, blackKing.x, blackKing.y, simPieces);
  return obstacles === 0;
};

// --- HÀM KIỂM TRA DI CHUYỂN HỢP LỆ (GỐC) ---
export const isValidMove = (piece, targetX, targetY, pieces) => {
  const { x, y, type } = piece;
  if (x === targetX && y === targetY) return false;

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

  if (!isBasicMoveValid) return false;

  if (causesFlyingGeneral(piece, targetX, targetY, pieces)) {
    return false;
  }

  return true;
};

// --- KIỂM TRA CHIẾU TƯỚNG (CHECK) ---
export const isCheck = (board, currentTurn) => {
  const attackerColor = currentTurn;
  const defenderColor = currentTurn === 'r' ? 'b' : 'r';

  const defenderKing = board.find(p => p.type === 'k' && p.color === defenderColor);
  if (!defenderKing) return false;

  const attackers = board.filter(p => p.color === attackerColor);

  for (let piece of attackers) {
    if (isValidMove(piece, defenderKing.x, defenderKing.y, board)) {
      return true;
    }
  }
  return false;
};

// --- HÀM MỚI (NGÀY 13): KIỂM TRA "TỰ LÀM MẤT TƯỚNG" ---
// Trả về true nếu nước đi này khiến Tướng mình bị chiếu
export const willCauseSelfCheck = (piece, targetX, targetY, currentPieces) => {
  const myColor = piece.color;
  const opponentColor = myColor === 'r' ? 'b' : 'r';

  // 1. Giả lập nước đi
  const simPieces = currentPieces
    .filter(p => !(p.x === targetX && p.y === targetY)) // Loại bỏ quân bị ăn
    .map(p => {
      if (p.id === piece.id) {
        return { ...p, x: targetX, y: targetY }; // Di chuyển quân mình
      }
      return p;
    });

  // 2. Kiểm tra trên bàn cờ giả lập: Đối phương có đang chiếu Tướng mình không?
  if (isCheck(simPieces, opponentColor)) {
    return true; // Nguy hiểm!
  }

  return false; // An toàn
};