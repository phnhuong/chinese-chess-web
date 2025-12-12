// src/utils/rules.js

// --- 1. HÀM HỖ TRỢ CƠ BẢN ---
const getPieceAt = (x, y, pieces) => {
  return pieces.find(p => p.x === x && p.y === y);
};

const countObstacles = (x1, y1, x2, y2, pieces) => {
  let count = 0;
  if (x1 === x2) { // Dọc
    const min = Math.min(y1, y2);
    const max = Math.max(y1, y2);
    for (let y = min + 1; y < max; y++) {
      if (getPieceAt(x1, y, pieces)) count++;
    }
  } else if (y1 === y2) { // Ngang
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

// --- 2. LUẬT DI CHUYỂN TỪNG QUÂN ---
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

// --- 3. KIỂM TRA LỘ MẶT TƯỚNG ---
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

// --- 4. HÀM KIỂM TRA HỢP LỆ (MAIN) ---
export const isValidMove = (piece, targetX, targetY, pieces) => {
  const { x, y, type, color } = piece;
  
  // 1. Vị trí trùng
  if (x === targetX && y === targetY) return false;

  // 2. [SỬA LỖI QUAN TRỌNG]: Không được ăn quân cùng màu
  const targetPiece = getPieceAt(targetX, targetY, pieces);
  if (targetPiece && targetPiece.color === color) {
    return false;
  }

  // 3. Luật cơ bản
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

  // 4. Lộ mặt tướng
  if (causesFlyingGeneral(piece, targetX, targetY, pieces)) return false;

  return true;
};

// --- 5. KIỂM TRA CHIẾU TƯỚNG ---
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

// --- 6. KIỂM TRA TỰ LÀM MẤT TƯỚNG ---
export const willCauseSelfCheck = (piece, targetX, targetY, currentPieces) => {
  const myColor = piece.color;
  const opponentColor = myColor === 'r' ? 'b' : 'r';

  const simPieces = currentPieces
    .filter(p => !(p.x === targetX && p.y === targetY))
    .map(p => {
      if (p.id === piece.id) return { ...p, x: targetX, y: targetY };
      return p;
    });

  if (isCheck(simPieces, opponentColor)) return true;
  return false;
};

// --- 7. KIỂM TRA HẾT CỜ ---
export const isGameOver = (pieces, turn) => {
  const myPieces = pieces.filter(p => p.color === turn);

  for (let piece of myPieces) {
    for (let x = 0; x < 9; x++) {
      for (let y = 0; y < 10; y++) {
        if (isValidMove(piece, x, y, pieces)) {
          if (!willCauseSelfCheck(piece, x, y, pieces)) {
            // Gợi ý nước đi cứu thua (chỉ để debug)
            console.log(`>>> GỢI Ý CỨU THUA: Quân ${piece.type} (${piece.id}) -> (${x},${y})`);
            return false;
          }
        }
      }
    }
  }
  return true;
};