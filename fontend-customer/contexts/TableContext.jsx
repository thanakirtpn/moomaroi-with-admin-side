import React, { createContext, useContext, useState } from 'react';

// สร้าง Context
const TableContext = createContext();

// สร้าง Provider เพื่อห่อแอป
export const TableProvider = ({ children }) => {
  const [tableId, setTableId] = useState('01'); // ค่าเริ่มต้นเป็น '01'

  return (
    <TableContext.Provider value={{ tableId, setTableId }}>
      {children}
    </TableContext.Provider>
  );
};

// Hook สำหรับใช้งาน Context
export const useTable = () => {
  const context = useContext(TableContext);
  if (!context) {
    throw new Error('useTable must be used within a TableProvider');
  }
  return context;
};