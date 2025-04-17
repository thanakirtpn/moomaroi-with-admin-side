const express = require('express');
const mysql = require('mysql2');

const app = express();
app.use(express.json());

// 🔐 ตั้งค่าการเชื่อมต่อ MySQL แบบใส่ตรง ๆ
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Kate071046',
    database: 'MoomAroiDB'
  });

connection.connect((err) => {
  if (err) {
    console.error('❌ MySQL connection failed:', err.stack);
    return;
  }
  console.log('✅ Connected to MySQL as id ' + connection.threadId);
});

// -------------------- Routes --------------------

// ทดสอบการทำงาน
app.get('/', (req, res) => {
  res.send('🚀 Moom Aroi Backend is running!');
});

// GET: ดึงเมนูทั้งหมด
app.get('/menu', (req, res) => {
  connection.query('SELECT * FROM menu', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// POST: เพิ่มเมนูใหม่
app.post('/menu', (req, res) => {
  const { name_tha, name_eng, category, short_description, full_description, tags } = req.body;
  const sql = 'INSERT INTO menu (name_tha, name_eng, category, short_description, full_description, tags) VALUES (?, ?, ?, ?, ?, ?)';
  connection.query(sql, [name_tha, name_eng, category, short_description, full_description, tags], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: '✅ Menu item added', id: result.insertId });
  });
});

// เริ่มเซิร์ฟเวอร์
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🌐 Server is running on port ${PORT}`);
});
