const express = require('express');
const mysql = require('mysql2');
const path = require('path');
const multer = require('multer');
const cors = require('cors');


const app = express();
app.use(express.json());
app.use(cors());
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
































// Multer configuration for menu images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only JPEG, JPG, and PNG files are allowed'));
    }
  },
}).single('image');

app.use('/uploads', express.static('uploads'));

// MySQL connection pool
const pool = mysql.createPool({
  host: 'localhost',
  user: 'food2_user',
  password: 'food2_secure_password',
  database: 'food2',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Multer error handling
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message });
  } else if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
});

// GET /api/menu - Fetch menu items with optional category filter
app.get('/api/menu', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    console.log('[%s] Connecting to MySQL...', new Date().toISOString());
    console.log('[%s] Connected to MySQL', new Date().toISOString());

    const { category } = req.query;
    console.log('[%s] Received category:', new Date().toISOString(), category);

    let query = 'SELECT * FROM menu';
    let queryParams = [];

    if (category) {
      query += ' WHERE category = ?';
      queryParams.push(category);
    }

    console.log('[%s] Executing query: %s with params: %s', new Date().toISOString(), query, queryParams);
    const [rows] = await connection.query(query, queryParams);
    console.log('[%s] Select query executed successfully, rows: %d', new Date().toISOString(), rows.length);

    connection.release();
    console.log('[%s] MySQL connection released', new Date().toISOString());

    res.json(rows);
  } catch (err) {
    console.error('[%s] Error in GET /api/menu:', new Date().toISOString(), err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/menu - Add new menu item
app.post('/api/menu', (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return;
    }

    const { name, subtitle, category, basePrice, description } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : null;

    if (!name || !category || !basePrice || !image) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const basePriceNum = parseFloat(basePrice);
    if (isNaN(basePriceNum) || basePriceNum <= 0) {
      return res.status(400).json({ error: 'Base price must be a valid positive number' });
    }

    try {
      const connection = await pool.getConnection();
      console.log('[%s] Connecting to MySQL...', new Date().toISOString());
      console.log('[%s] Connected to MySQL', new Date().toISOString());

      console.log('[%s] Executing query: INSERT INTO menu', new Date().toISOString());
      const [result] = await connection.query(
        'INSERT INTO menu (name, subtitle, category, base_price, description, image, orders) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [name, subtitle, category, basePriceNum, description, image, 0]
      );
      console.log('[%s] Insert query executed successfully, inserted ID: %d', new Date().toISOString(), result.insertId);

      console.log('[%s] Executing query: SELECT * FROM menu WHERE id = %d', new Date().toISOString(), result.insertId);
      const [rows] = await connection.query('SELECT * FROM menu WHERE id = ?', [result.insertId]);
      console.log('[%s] Select query executed successfully', new Date().toISOString());

      connection.release();
      console.log('[%s] MySQL connection released', new Date().toISOString());

      res.status(201).json(rows[0]);
    } catch (err) {
      console.error('[%s] Error in POST /api/menu:', new Date().toISOString(), err);
      res.status(500).json({ error: err.message || 'Internal server error' });
    }
  });
});

app.get('/api/options', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [meatRows] = await connection.query('SELECT name, extra_price FROM meat_options');
    const [addonRows] = await connection.query('SELECT name, extra_price FROM addon_options');
    connection.release();
    res.json({
      meat_options: meatRows,
      addon_options: addonRows,
    });
  } catch (err) {
    console.error('[%s] Error in GET /api/options:', new Date().toISOString(), err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/orders - Create a new order
app.post('/api/orders', async (req, res) => {
  const { table_no, items } = req.body;
  const status = 'Order Placed';
  const created_at = new Date();
  const order_date = created_at.toISOString().split('T')[0];
  const order_time = created_at.toTimeString().split(' ')[0];

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // คำนวณ total_price
    let total_price = 0;
    for (const item of items) {
      total_price += parseFloat(item.price) * item.quantity;
    }

    // Insert order
    const [orderResult] = await connection.query(
      'INSERT INTO orders (table_no, order_date, order_time, total_price, status, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [table_no, order_date, order_time, total_price.toFixed(2), status, created_at]
    );
    const order_id = orderResult.insertId;

    // Insert order items
    for (const item of items) {
      await connection.query(
        'INSERT INTO order_items (order_id, menu_id, quantity, price, meat, add_on) VALUES (?, ?, ?, ?, ?, ?)',
        [order_id, item.menu_id, item.quantity, parseFloat(item.price).toFixed(2), item.meat || null, item.add_on || null]
      );
    }

    // Select order with items
    const selectQuery = `
      SELECT 
        o.id, o.table_no, 
        DATE_FORMAT(o.order_date, '%Y-%m-%d') AS order_date,
        TIME_FORMAT(o.order_time, '%H:%i:%s') AS order_time,
        o.total_price, o.status,
        oi.id AS order_item_id, oi.menu_id, oi.quantity, oi.price, oi.meat, oi.add_on,
        m.name AS menu_name, m.subtitle, m.image AS menu_image
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN menu m ON oi.menu_id = m.id
      WHERE o.id = ?
    `;
    const [rows] = await connection.query(selectQuery, [order_id]);

    const order = {
      id: rows[0].id,
      table_no: rows[0].table_no,
      order_date: rows[0].order_date,
      order_time: rows[0].order_time,
      total_price: Number(rows[0].total_price),
      status: rows[0].status,
      items: []
    };

    rows.forEach(row => {
      if (row.order_item_id) {
        order.items.push({
          id: row.order_item_id,
          menu_id: row.menu_id,
          menu_name: row.menu_name,
          subtitle: row.subtitle,
          menu_image: row.menu_image || '/uploads/placeholder.jpg',
          quantity: row.quantity,
          price: Number(row.price),
          meat: row.meat,
          add_on: row.add_on
        });
      }
    });

    await connection.commit();
    console.log('[%s] Order created:', new Date().toISOString(), JSON.stringify(order, null, 2));
    res.status(201).json(order);
  } catch (err) {
    if (connection) await connection.rollback();
    console.error('[%s] Error in POST /api/orders:', new Date().toISOString(), err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    if (connection) connection.release();
  }
});


app.get('/api/orders', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const query = `
      SELECT 
        o.id, o.table_no, 
        DATE_FORMAT(o.order_date, '%Y-%m-%d') AS order_date, 
        TIME_FORMAT(o.order_time, '%H:%i:%s') AS order_time, 
        o.total_price, o.status,
        oi.id AS order_item_id, oi.menu_id, oi.quantity, oi.price, oi.meat, oi.add_on,
        m.name AS menu_name, m.subtitle, m.image AS menu_image
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN menu m ON oi.menu_id = m.id
      ORDER BY o.created_at DESC LIMIT 100
    `;
    const [rows] = await connection.query(query);

    const orders = [];
    const orderMap = new Map();
    rows.forEach(row => {
      if (!orderMap.has(row.id)) {
        orderMap.set(row.id, {
          id: row.id,
          table_no: row.table_no,
          order_date: row.order_date,
          order_time: row.order_time,
          total_price: Number(row.total_price),
          status: row.status,
          items: [], // เริ่มต้นด้วย array ว่าง
        });
      }
      if (row.order_item_id) {
        orderMap.get(row.id).items.push({
          id: row.order_item_id,
          menu_id: row.menu_id,
          menu_name: row.menu_name,
          subtitle: row.subtitle,
          menu_image: row.menu_image ? row.menu_image.replace('/Uploads/', '/uploads/') : '/uploads/placeholder.jpg',
          quantity: row.quantity,
          price: Number(row.price),
          meat: row.meat,
          add_on: row.add_on,
        });
      }
    });
    orders.push(...orderMap.values());

    connection.release();
    console.log('[%s] Orders sent: %d orders', new Date().toISOString(), orders.length);
    res.json(orders);
  } catch (err) {
    console.error('[%s] Error in GET /api/orders:', new Date().toISOString(), err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
// PATCH /api/orders/:id/status - Update order status
app.patch('/api/orders/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // ตรวจสอบว่ามี status ใน body
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const connection = await pool.getConnection();
    const query = `
      UPDATE orders 
      SET status = ?, updated_at = NOW()
      WHERE id = ?
    `;
    const [result] = await connection.query(query, [status, id]);

    connection.release();

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    console.log('[%s] Order %s status updated to: %s', new Date().toISOString(), id, status);
    res.json({ message: 'Status updated successfully' });
  } catch (err) {
    console.error('[%s] Error in PATCH /api/orders/:id/status:', new Date().toISOString(), err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
































// GET /api/tables - ดึงสถานะทุกโต๊ะและราคารวม
app.get('/api/tables', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    
    // ดึงสถานะโต๊ะ
    const [tables] = await connection.query('SELECT table_no, status FROM tables');
    
    // ดึงราคารวมของแต่ละโต๊ะ
    const tableStatus = await Promise.all(tables.map(async (table) => {
      const [orders] = await connection.query(
        'SELECT SUM(total_price) AS total_price FROM orders WHERE table_no = ? AND status != "Complete"',
        [table.table_no]
      );
      const totalPrice = orders[0].total_price ? Number(orders[0].total_price) : 0;
      return {
        table_no: table.table_no,
        status: table.status,
        total_price: totalPrice
      };
    }));
    
    connection.release();
    console.log('[%s] Tables sent: %d tables', new Date().toISOString(), tableStatus.length);
    res.json(tableStatus);
  } catch (err) {
    console.error('[%s] Error in GET /api/tables:', new Date().toISOString(), err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/tables/scan - อัปเดตสถานะโต๊ะเมื่อสแกน QR Code
app.post('/api/tables/scan', async (req, res) => {
  try {
    let { table_no } = req.body;
    
    if (!table_no) {
      return res.status(400).json({ error: 'Table number is required' });
    }
    
    // แปลง "table 1" เป็น "01"
    const match = table_no.match(/table (\d+)/i);
    if (!match) {
      return res.status(400).json({ error: 'Invalid table format. Expected format: "table <number>"' });
    }
    const tableNumber = match[1].padStart(2, '0'); // แปลง "1" เป็น "01"
    table_no = tableNumber; // อัปเดต table_no ให้เป็น "01", "02", ...

    const connection = await pool.getConnection();
    
    // ตรวจสอบสถานะโต๊ะ
    const [existing] = await connection.query(
      'SELECT status FROM tables WHERE table_no = ?',
      [table_no]
    );
    
    if (existing.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Table not found' });
    }
    
    if (existing[0].status === 'Occupied') {
      connection.release();
      return res.status(400).json({ error: 'Table is already occupied' });
    }
    
    const [result] = await connection.query(
      'UPDATE tables SET status = "Occupied" WHERE table_no = ?',
      [table_no]
    );
    
    if (result.affectedRows === 0) {
      connection.release();
      return res.status(404).json({ error: 'Table not found' });
    }
    
    connection.release();
    console.log('[%s] Table %s scanned', new Date().toISOString(), table_no);
    res.json({ message: 'Table status updated to Occupied' });
  } catch (err) {
    console.error('[%s] Error in POST /api/tables/scan:', new Date().toISOString(), err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/tables/:table_no/orders - ดึงออเดอร์ของโต๊ะ
app.get('/api/tables/:table_no/orders', async (req, res) => {
  try {
    const { table_no } = req.params;
    
    const connection = await pool.getConnection();
    const query = `
      SELECT 
        o.id, o.table_no, 
        DATE_FORMAT(o.order_date, '%Y-%m-%d') AS order_date, 
        TIME_FORMAT(o.order_time, '%H:%i:%s') AS order_time, 
        o.total_price, o.status,
        oi.id AS order_item_id, oi.menu_id, oi.quantity, oi.price, oi.meat, oi.add_on,
        m.name AS menu_name, m.subtitle, m.image AS menu_image
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN menu m ON oi.menu_id = m.id
      WHERE o.table_no = ? AND o.status != 'Complete'
      ORDER BY o.created_at DESC
    `;
    const [rows] = await connection.query(query, [table_no]);
    
    const orders = [];
    const orderMap = new Map();
    rows.forEach(row => {
      if (!orderMap.has(row.id)) {
        orderMap.set(row.id, {
          id: row.id,
          table_no: row.table_no,
          order_date: row.order_date,
          order_time: row.order_time,
          total_price: Number(row.total_price),
          status: row.status,
          items: []
        });
      }
      if (row.order_item_id) {
        orderMap.get(row.id).items.push({
          id: row.order_item_id,
          menu_id: row.menu_id,
          menu_name: row.menu_name,
          subtitle: row.subtitle,
          menu_image: row.menu_image ? row.menu_image.replace('/Uploads/', '/uploads/') : '/uploads/placeholder.jpg',
          quantity: row.quantity,
          price: Number(row.price),
          meat: row.meat,
          add_on: row.add_on
        });
      }
    });
    orders.push(...orderMap.values());
    
    // คำนวณราคารวมและ VAT
    const totalPrice = orders.reduce((sum, order) => sum + order.total_price, 0);
    const vat = totalPrice * 0.07;
    const totalWithVat = totalPrice + vat;
    
    connection.release();
    console.log('[%s] Orders for table %s sent: %d orders', new Date().toISOString(), table_no, orders.length);
    res.json({
      orders,
      summary: {
        subtotal: totalPrice,
        vat: vat,
        total: totalWithVat
      }
    });
  } catch (err) {
    console.error('[%s] Error in GET /api/tables/:table_no/orders:', new Date().toISOString(), err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/tables/:table_no/complete - เปลี่ยนสถานะออเดอร์เป็น Complete และรีเซ็ตโต๊ะ
app.post('/api/tables/:table_no/complete', async (req, res) => {
  try {
    const { table_no } = req.params;
    
    const connection = await pool.getConnection();
    
    // อัปเดตสถานะออเดอร์
    const [updateResult] = await connection.query(
      'UPDATE orders SET status = "Complete" WHERE table_no = ? AND status != "Complete"',
      [table_no]
    );
    
    // รีเซ็ตสถานะโต๊ะ
    const [tableResult] = await connection.query(
      'UPDATE tables SET status = "Available" WHERE table_no = ?',
      [table_no]
    );
    
    if (tableResult.affectedRows === 0) {
      connection.release();
      return res.status(404).json({ error: 'Table not found' });
    }
    
    connection.release();
    console.log('[%s] Table %s marked as complete', new Date().toISOString(), table_no);
    res.json({ message: 'Table orders completed and reset to Available' });
  } catch (err) {
    console.error('[%s] Error in POST /api/tables/:table_no/complete:', new Date().toISOString(), err);
    res.status(500).json({ error: 'Internal server error' });
  }
});




















// เริ่มเซิร์ฟเวอร์
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🌐 Server is running on port ${PORT}`);
});
