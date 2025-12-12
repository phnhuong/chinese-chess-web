// File này chỉ chứa vị trí ban đầu của các quân cờ
// Giúp code chính gọn gàng hơn

export const initialBoardState = [
    // --- QUÂN ĐEN (Ở trên, y = 0 đến 4) ---
    { id: 'b_r1', type: 'r', color: 'b', x: 0, y: 0 }, // Xe
    { id: 'b_n1', type: 'n', color: 'b', x: 1, y: 0 }, // Mã
    { id: 'b_b1', type: 'b', color: 'b', x: 2, y: 0 }, // Tượng
    { id: 'b_a1', type: 'a', color: 'b', x: 3, y: 0 }, // Sĩ
    { id: 'b_k',  type: 'k', color: 'b', x: 4, y: 0 }, // TƯỚNG
    { id: 'b_a2', type: 'a', color: 'b', x: 5, y: 0 }, // Sĩ
    { id: 'b_b2', type: 'b', color: 'b', x: 6, y: 0 }, // Tượng
    { id: 'b_n2', type: 'n', color: 'b', x: 7, y: 0 }, // Mã
    { id: 'b_r2', type: 'r', color: 'b', x: 8, y: 0 }, // Xe
    { id: 'b_c1', type: 'c', color: 'b', x: 1, y: 2 }, // Pháo
    { id: 'b_c2', type: 'c', color: 'b', x: 7, y: 2 }, // Pháo
    { id: 'b_p1', type: 'p', color: 'b', x: 0, y: 3 }, // Tốt
    { id: 'b_p2', type: 'p', color: 'b', x: 2, y: 3 },
    { id: 'b_p3', type: 'p', color: 'b', x: 4, y: 3 },
    { id: 'b_p4', type: 'p', color: 'b', x: 6, y: 3 },
    { id: 'b_p5', type: 'p', color: 'b', x: 8, y: 3 },
  
    // --- QUÂN ĐỎ (Ở dưới, y = 5 đến 9) ---
    { id: 'r_r1', type: 'r', color: 'r', x: 0, y: 9 }, // Xe
    { id: 'r_n1', type: 'n', color: 'r', x: 1, y: 9 }, // Mã
    { id: 'r_b1', type: 'b', color: 'r', x: 2, y: 9 }, // Tượng
    { id: 'r_a1', type: 'a', color: 'r', x: 3, y: 9 }, // Sĩ
    { id: 'r_k',  type: 'k', color: 'r', x: 4, y: 9 }, // TƯỚNG (Soái)
    { id: 'r_a2', type: 'a', color: 'r', x: 5, y: 9 }, // Sĩ
    { id: 'r_b2', type: 'b', color: 'r', x: 6, y: 9 }, // Tượng
    { id: 'r_n2', type: 'n', color: 'r', x: 7, y: 9 }, // Mã
    { id: 'r_r2', type: 'r', color: 'r', x: 8, y: 9 }, // Xe
    { id: 'r_c1', type: 'c', color: 'r', x: 1, y: 7 }, // Pháo
    { id: 'r_c2', type: 'c', color: 'r', x: 7, y: 7 }, // Pháo
    { id: 'r_p1', type: 'p', color: 'r', x: 0, y: 6 }, // Tốt
    { id: 'r_p2', type: 'p', color: 'r', x: 2, y: 6 },
    { id: 'r_p3', type: 'p', color: 'r', x: 4, y: 6 },
    { id: 'r_p4', type: 'p', color: 'r', x: 6, y: 6 },
    { id: 'r_p5', type: 'p', color: 'r', x: 8, y: 6 },
  ];