import React from 'react';
import Piece from './Piece';

const Board = ({ pieces, onPieceClick, onSquareClick, selectedPiece, isFlipped, boardWidth, lastMove, checkedKingPos }) => { 
  
  // TÍNH TOÁN KÍCH THƯỚC ĐỘNG
  const boardHeight = boardWidth * 1.1; 
  const padding = boardWidth * 0.08; 
  const gridWidth = boardWidth - (padding * 2);
  const cellSize = gridWidth / 8;
  const finalGridHeight = cellSize * 9;
  const finalBoardHeight = finalGridHeight + (padding * 2);

  const getPos = (x, y) => {
    const finalX = isFlipped ? (8 - x) : x;
    const finalY = isFlipped ? (9 - y) : y;
    return {
      left: finalX * cellSize,
      top: finalY * cellSize
    };
  };

  // VẼ Ô HIGHLIGHT (Nước vừa đi)
  const renderHighlights = () => {
      if (!lastMove) return null;
      
      const sourcePos = getPos(lastMove.fromX, lastMove.fromY);
      const targetPos = getPos(lastMove.toX, lastMove.toY);

      return (
          <>
            {/* Ô bắt đầu */}
            <div className="absolute rounded-full last-move-source z-0 pointer-events-none" 
                 style={{ left: sourcePos.left, top: sourcePos.top, width: cellSize, height: cellSize, transform: 'translate(-50%, -50%)' }} 
            />
            {/* Ô kết thúc */}
            <div className="absolute rounded-full last-move-target z-0 pointer-events-none" 
                 style={{ left: targetPos.left, top: targetPos.top, width: cellSize, height: cellSize, transform: 'translate(-50%, -50%)' }} 
            />
          </>
      );
  };

  // VẼ HIỆU ỨNG CHIẾU TƯỚNG (Vòng đỏ nhấp nháy)
  const renderCheckEffect = () => {
      if (!checkedKingPos) return null;
      const pos = getPos(checkedKingPos.x, checkedKingPos.y);
      return (
          <div className="absolute rounded-full check-danger z-0 pointer-events-none"
               style={{ left: pos.left, top: pos.top, width: cellSize, height: cellSize, transform: 'translate(-50%, -50%)' }}
          />
      );
  };

  const renderIntersections = () => {
    const intersections = [];
    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 9; x++) {
        const pos = getPos(x, y);
        intersections.push(
          <div 
            key={`${x}-${y}`}
            onClick={() => onSquareClick(x, y)}
            className="absolute z-10 cursor-pointer"
            style={{
              left: pos.left, top: pos.top, width: cellSize, height: cellSize, transform: 'translate(-50%, -50%)',
            }}
          />
        );
      }
    }
    return intersections;
  };

  const renderCoordinates = () => {
    const coords = [];
    const letters = isFlipped ? ['i', 'h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'] : ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'];
    const fontSize = cellSize * 0.4;
    for (let i = 0; i < 9; i++) {
      coords.push(<span key={`top-${i}`} className="absolute font-bold font-mono uppercase select-none text-[#3e2723]" style={{ left: i * cellSize, top: -padding * 0.6, fontSize, transform: 'translateX(-50%)' }}>{letters[i]}</span>);
      coords.push(<span key={`bottom-${i}`} className="absolute font-bold font-mono uppercase select-none text-[#3e2723]" style={{ left: i * cellSize, bottom: -padding * 0.6, fontSize, transform: 'translateX(-50%)' }}>{letters[i]}</span>);
    }
    for (let i = 0; i < 10; i++) {
      const label = isFlipped ? i : 9 - i; 
      coords.push(<span key={`left-${i}`} className="absolute font-bold font-mono select-none text-[#3e2723]" style={{ top: i * cellSize, left: -padding * 0.6, fontSize, transform: 'translateY(-50%)' }}>{label}</span>);
      coords.push(<span key={`right-${i}`} className="absolute font-bold font-mono select-none text-[#3e2723]" style={{ top: i * cellSize, right: -padding * 0.6, fontSize, transform: 'translateY(-50%)' }}>{label}</span>);
    }
    return coords;
  };

  return (
    <div className="bg-[#eecfa1] rounded-lg shadow-2xl relative border-4 border-[#eecfa1] transition-all duration-300" style={{ width: boardWidth, height: finalBoardHeight, padding: padding }}>
      <div className="relative border-2 border-[#5d4037]" style={{ width: gridWidth, height: finalGridHeight }}>
        <svg width="100%" height="100%" className="absolute top-0 left-0 z-0 pointer-events-none">
            {Array.from({ length: 10 }).map((_, i) => (<line key={`h-${i}`} x1="0" y1={i * cellSize} x2={gridWidth} y2={i * cellSize} stroke="#5d4037" strokeWidth="1" />))}
            {Array.from({ length: 9 }).map((_, i) => {
                if (i === 0 || i === 8) return (<line key={`v-${i}`} x1={i * cellSize} y1="0" x2={i * cellSize} y2={finalGridHeight} stroke="#5d4037" strokeWidth="2" />);
                return (<React.Fragment key={`v-${i}`}><line x1={i * cellSize} y1="0" x2={i * cellSize} y2={cellSize * 4} stroke="#5d4037" strokeWidth="1" /><line x1={i * cellSize} y1={cellSize * 5} x2={i * cellSize} y2={finalGridHeight} stroke="#5d4037" strokeWidth="1" /></React.Fragment>);
            })}
            <line x1={3*cellSize} y1="0" x2={5*cellSize} y2={2*cellSize} stroke="#5d4037" strokeWidth="1" /><line x1={5*cellSize} y1="0" x2={3*cellSize} y2={2*cellSize} stroke="#5d4037" strokeWidth="1" />
            <line x1={3*cellSize} y1={7*cellSize} x2={5*cellSize} y2={9*cellSize} stroke="#5d4037" strokeWidth="1" /><line x1={5*cellSize} y1={7*cellSize} x2={3*cellSize} y2={9*cellSize} stroke="#5d4037" strokeWidth="1" />
        </svg>

        {renderCoordinates()}
        
        {/* HIỆU ỨNG */}
        {renderHighlights()}
        {renderCheckEffect()}

        <div className="absolute flex justify-around items-center text-[#3e2723] font-bold z-0 pointer-events-none" style={{ top: cellSize * 4, left: 2, width: gridWidth - 4, height: cellSize, fontSize: cellSize * 0.5 }}>
            <span>SỞ HÀ</span><span>HÁN GIỚI</span>
        </div>

        {renderIntersections()}

        {pieces && pieces.map((piece) => {
            const isSelected = selectedPiece && selectedPiece.id === piece.id;
            const pos = getPos(piece.x, piece.y);
            return (
              <Piece 
                key={piece.id} 
                piece={piece} 
                customStyle={{ left: pos.left, top: pos.top, width: cellSize * 0.8, height: cellSize * 0.8, fontSize: cellSize * 0.4 }}
                onClick={() => onPieceClick(piece)}
                isSelected={isSelected}
              />
            );
        })}
      </div>
    </div>
  );
};

export default Board;