const express = require('express');
const mysql = require('mysql2/promise');
const path = require('path');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const dotenv = require('dotenv');  
const axios = require('axios');
dotenv.config();  // โหลดค่า .env
console.log(process.env.DB_HOST);  // ตรวจสอบค่าจาก .env


const app = express();
app.use(express.json());
app.use(cors());


const pool = mysql.createPool({
  host: process.env.DB_HOST,  // ใช้ค่าจาก .env
  user: process.env.DB_USER,  // ใช้ค่าจาก .env
  password: process.env.DB_PASSWORD,  // ใช้ค่าจาก .env
  database: process.env.DB_NAME,  // ใช้ค่าจาก .env
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// -------------------- Routes --------------------

// ทดสอบการทำงาน
app.get('/', (req, res) => {
  res.send('🚀 Moom Aroi Backend is running!');
});

// Guy edit
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

// Multer error handling
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message });
  } else if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
});
// ------------------------------------------------------------ทุกคนใช้ได้-------------------------------------------
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

    // เพิ่ม base URL ให้กับ image
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const updatedRows = rows.map(item => ({
      ...item,
      image: item.image ? `${baseUrl}${item.image}` : ''
    }));

    connection.release();
    console.log('[%s] MySQL connection released', new Date().toISOString());

    res.json(updatedRows);
  } catch (err) {
    console.error('[%s] Error in GET /api/menu:', new Date().toISOString(), err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/menu/:id', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const { id } = req.params;
    const [rows] = await connection.query('SELECT * FROM menu WHERE id = ?', [id]);
    connection.release();
    if (rows.length === 0) return res.status(404).json({ error: 'Menu item not found' });
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const item = {
      ...rows[0],
      image: rows[0].image ? `${baseUrl}${rows[0].image}` : ''
    };
    res.json(item);
  } catch (err) {
    console.error('Error in GET /api/menu/:id:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ------------------------------------------------------------------ Admin Edit Menu --------------------------------------------------------------------
// POST /api/menu - Add new menu item เหลือทำเรื่อง tags
app.post('/api/admin/menu', (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    console.log('[%s] req.body:', new Date().toISOString(), req.body);
    console.log('[%s] req.file:', new Date().toISOString(), req.file);

    const { category, name_tha, name_eng, short_description, full_description, price_starts_at, tags } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : null;

    if (!category || !name_eng || !short_description || !full_description || !price_starts_at || !tags || !image) {
      console.log('[%s] Missing fields - category:', category, 'name_eng:', name_eng, 'short_description:', short_description, 'full_description:', full_description, 'price_starts_at:', price_starts_at, 'tags:', tags, 'image:', image);
      return res.status(400).json({ error: 'Missing required fields: category, name_eng, short_description, full_description, price_starts_at, tags, and image are required' });
    }

    const priceNum = parseFloat(price_starts_at);
    if (isNaN(priceNum) || priceNum <= 0) {
      return res.status(400).json({ error: 'Price must be a valid positive number' });
    }

    try {
      const connection = await pool.getConnection();
      console.log('[%s] Connecting to MySQL...', new Date().toISOString());
      console.log('[%s] Connected to MySQL', new Date().toISOString());

      console.log('[%s] Executing query: INSERT INTO menu', new Date().toISOString());
      const [result] = await connection.query(
        'INSERT INTO menu (category, name_tha, name_eng, short_description, full_description, price_starts_at, tags, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [category, name_tha || null, name_eng, short_description, full_description, priceNum, tags, image]
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

// DELETE /api/admin/menu/:id - Delete a menu item by ID
app.delete('/api/admin/menu/:id', async (req, res) => {
  const menuId = req.params.id;

  try {
    const connection = await pool.getConnection();
    console.log('[%s] Connecting to MySQL...', new Date().toISOString());

    // 1. หา path ของภาพ
    const [rows] = await connection.query('SELECT image FROM menu WHERE id = ?', [menuId]);
    if (rows.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Menu item not found' });
    }

    const imagePath = rows[0].image;
    console.log('[%s] Image path:', new Date().toISOString(), imagePath);

    // 2. ลบข้อมูลในฐานข้อมูล
    const [result] = await connection.query('DELETE FROM menu WHERE id = ?', [menuId]);
    connection.release();

    // 3. ลบไฟล์ภาพถ้ามี
    if (imagePath) {
      const fullImagePath = path.join(__dirname, 'uploads', path.basename(imagePath));
    
      if (fs.existsSync(fullImagePath)) {
        fs.unlinkSync(fullImagePath);
        console.log('[%s] Image file deleted: %s', new Date().toISOString(), fullImagePath);
      } else {
        console.warn('[%s] Image file not found: %s', new Date().toISOString(), fullImagePath);
      }
    }
    
    res.json({ message: `Menu item with ID ${menuId} deleted successfully` });
  } catch (err) {
    console.error('[%s] Error in DELETE /api/admin/menu/:id:', new Date().toISOString(), err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/admin/menu/:id - Update a menu item
app.patch('/api/admin/menu/:id', (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    const menuId = req.params.id;
    const { category, name_tha, name_eng, short_description, full_description, price_starts_at, tags } = req.body;
    const newImage = req.file ? `/uploads/${req.file.filename}` : null;

    try {
      const connection = await pool.getConnection();
      console.log('[%s] Connecting to MySQL...', new Date().toISOString());

      // ดึงข้อมูลเมนูเดิม
      const [existingRows] = await connection.query('SELECT * FROM menu WHERE id = ?', [menuId]);
      if (existingRows.length === 0) {
        connection.release();
        return res.status(404).json({ error: 'Menu item not found' });
      }

      const existingMenu = existingRows[0];

      // ถ้ามีการอัปโหลดรูปใหม่ → ลบรูปเก่า
      if (newImage && existingMenu.image) {
        const oldImagePath = path.join(__dirname, 'uploads', path.basename(existingMenu.image));
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
          console.log('[%s] Deleted old image: %s', new Date().toISOString(), oldImagePath);
        }
      }

      // เตรียมข้อมูลใหม่
      const updatedFields = {
        category: category || existingMenu.category,
        name_tha: name_tha || existingMenu.name_tha,
        name_eng: name_eng || existingMenu.name_eng,
        short_description: short_description || existingMenu.short_description,
        full_description: full_description || existingMenu.full_description,
        price_starts_at: price_starts_at ? parseFloat(price_starts_at) : existingMenu.price_starts_at,
        tags: tags || existingMenu.tags,
        image: newImage || existingMenu.image
      };

      // อัปเดตเมนู
      await connection.query(
        `UPDATE menu SET category = ?, name_tha = ?, name_eng = ?, short_description = ?, 
         full_description = ?, price_starts_at = ?, tags = ?, image = ? WHERE id = ?`,
        [
          updatedFields.category,
          updatedFields.name_tha,
          updatedFields.name_eng,
          updatedFields.short_description,
          updatedFields.full_description,
          updatedFields.price_starts_at,
          updatedFields.tags,
          updatedFields.image,
          menuId
        ]
      );

      console.log('[%s] Menu updated for ID %s', new Date().toISOString(), menuId);

      // ดึงเมนูอัปเดตกลับมา
      const [updatedRows] = await connection.query('SELECT * FROM menu WHERE id = ?', [menuId]);
      connection.release();

      res.json(updatedRows[0]);
    } catch (error) {
      console.error('[%s] Error in PATCH /api/admin/menu/:id:', new Date().toISOString(), error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
});

// สำหรับการดึงออเดอร์ทั้งหมด 
app.get('/api/admin/orders', async (req, res) => {
  let connection;

  try {
    connection = await pool.getConnection();
    console.log(`เชื่อมต่อสำเร็จ กำลังดึงข้อมูลทุกออเดอร์สำหรับแอดมิน`);

    // 1. ดึงข้อมูลทุกออเดอร์จากตาราง orders โดยจัดรูปแบบ order_time ให้เป็น HH:MM
    const [orderRows] = await connection.query(
      `SELECT o.id, o.order_number, o.status, TIME_FORMAT(o.order_time, '%H:%i') AS order_time
       FROM orders o
       ORDER BY o.order_time DESC`
    );

    console.log('orderRows:', orderRows);

    if (orderRows.length === 0) {
      connection.release();
      console.log(`ไม่พบออเดอร์ใด ๆ ในระบบ`);
      return res.status(404).json({ error: 'ไม่พบออเดอร์ในระบบ' });
    }

    // 2. สำหรับแต่ละออเดอร์ ดึงจำนวนรายการทั้งหมดในออเดอร์นั้น
    for (let order of orderRows) {
      const [orderItems] = await connection.query(
        `SELECT COUNT(*) AS total_items
         FROM order_items oi
         WHERE oi.order_id = ?`,
        [order.id]
      );
      order.total_items = orderItems[0].total_items;
    }

    // 3. ส่งข้อมูลทุกออเดอร์กลับ
    console.log('กำลังส่งข้อมูลทุกออเดอร์:', orderRows);

    res.json({
      orders: orderRows.map(order => ({
        order_number: order.order_number,
        total_items: order.total_items,
        status: order.status,
        order_time: order.order_time
      }))
    });

  } catch (err) {
    if (connection) connection.release();
    console.error('[%s] เกิดข้อผิดพลาดใน GET /api/admin/orders:', new Date().toISOString(), err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' });
  }
});

// ดึงรายละเอียดของแต่ละเมนู
app.get('/api/admin/order/:order_id', async (req, res) => {
  const { order_id } = req.params;
  let connection;

  try {
    connection = await pool.getConnection();
    console.log(`Fetching admin view of order_id ${order_id}`);

    // 1. ดึงข้อมูล order
    const [orderRows] = await connection.query(
      `SELECT o.order_number, o.table_number, o.status, o.order_date,
              TIME_FORMAT(o.order_time, '%H:%i') AS order_time
       FROM orders o
       WHERE o.id = ?`,
      [order_id]
    );

    if (orderRows.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderRows[0];

    // 2. ดึงรายการอาหาร
    const [orderItems] = await connection.query(
      `SELECT oi.id AS order_item_id, oi.menu_id, oi.menu_name,
              oi.option AS meat_option, oi.quantity, oi.price_each
       FROM order_items oi
       WHERE oi.order_id = ?`,
      [order_id]
    );

    if (orderItems.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'No items found for this order' });
    }

    // 3. ดึง addons + คำนวณ total ราคาแต่ละรายการ
    for (let item of orderItems) {
      const [addons] = await connection.query(
        `SELECT addon_name, addon_price
         FROM order_item_addons
         WHERE order_item_id = ?`,
        [item.order_item_id]
      );

      item.addons = addons.map(a => a.addon_name).join(', ');
      const addonTotal = addons.reduce((sum, a) => sum + Number(a.addon_price), 0);
      item.total_price = (item.quantity * Number(item.price_each)) + addonTotal;
      item.image = null; // เผื่ออนาคตมี
    }

    // 4. รวมราคาทั้งหมด
    const grand_total = orderItems.reduce((sum, item) => sum + item.total_price, 0);

    // 5. ส่ง response กลับ
    res.json({
      order_number: order.order_number,
      table_no: order.table_number,
      status: order.status,
      order_date: order.order_date,
      order_time: order.order_time,
      items: orderItems.map(item => ({
        menu_name: item.menu_name,
        quantity: item.quantity,
        total_price: item.total_price,
        addons: item.addons,
        meat_option: item.meat_option || null,
        image: item.image
      })),
      grand_total: grand_total.toFixed(2)
    });

    connection.release();
  } catch (err) {
    if (connection) connection.release();
    console.error('[%s] Error in GET /api/admin/order/:order_id:', new Date().toISOString(), err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// สำหรับอัพเดตปุ่ม
app.put('/api/admin/order/:order_id/:status', async (req, res) => {
  const { order_id, status } = req.params;
  
  // ตรวจสอบว่า status ที่ได้รับมาคือค่าที่ถูกต้องหรือไม่
  const validStatuses = ['orderplaced', 'preparing', 'served'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    console.log(`Updating status to ${status} for order ${order_id}`);

    // อัปเดตสถานะในฐานข้อมูล
    const [result] = await connection.query(
      `UPDATE orders SET status = ? WHERE id = ?`,
      [status, order_id]
    );

    // ตรวจสอบว่าอัปเดตข้อมูลสำเร็จหรือไม่
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // ส่ง response กลับ
    res.json({ message: `Order ${order_id} status updated to ${status}` });

  } catch (err) {
    if (connection) connection.release();
    console.error('[%s] Error in updating order status:', new Date().toISOString(), err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// สำหรับแสดงหน้าโต๊ะ
app.get('/api/admin/tables', async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();

    // ดึงข้อมูลทุกโต๊ะ พร้อมสถานะ และราคารวมของออเดอร์ทั้งหมดในแต่ละโต๊ะ
    const [tables] = await connection.query(`
      SELECT 
        t.table_no,
        t.status,
        COALESCE(SUM(oi.quantity * oi.price_each + IFNULL(addon_total.total_addon, 0)), 0) AS total_price
      FROM tables t
      LEFT JOIN orders o ON o.table_number = t.table_no
      LEFT JOIN order_items oi ON oi.order_id = o.id
      LEFT JOIN (
        SELECT 
          oia.order_item_id,
          SUM(oia.addon_price) AS total_addon
        FROM order_item_addons oia
        GROUP BY oia.order_item_id
      ) addon_total ON addon_total.order_item_id = oi.id
      GROUP BY t.table_no, t.status
      ORDER BY t.table_no;
    `);

    res.json(tables);
  } catch (err) {
    console.error('[%s] Error in GET /api/admin/tables:', new Date().toISOString(), err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    if (connection) connection.release();
  }
});

// สำหรับ แสดงบิลรวมของโต๊ะ
app.get('/api/admin/bills-summary/:table_no', async (req, res) => {
  const { table_no } = req.params;
  let connection;

  try {
    connection = await pool.getConnection();
    console.log(`Admin request: bills summary for table ${table_no}`);

    const [orderRows] = await connection.query(
      `SELECT o.*, t.table_no
       FROM orders o
       JOIN tables t ON o.table_number = t.table_no
       WHERE t.table_no = ?`,
      [table_no]
    );

    if (orderRows.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'No orders found for this table' });
    }

    let bills = [];
    let grandTotal = 0;

    for (let order of orderRows) {
      const [orderItems] = await connection.query(
        `SELECT oi.id AS order_item_id, oi.menu_id, oi.menu_name, oi.option AS meat_option, oi.quantity, oi.price_each
         FROM order_items oi
         WHERE oi.order_id = ?`,
        [order.id]
      );

      for (let item of orderItems) {
        const [addons] = await connection.query(
          `SELECT addon_name, addon_price
           FROM order_item_addons
           WHERE order_item_id = ?`,
          [item.order_item_id]
        );

        const addonTotal = addons.reduce((sum, addon) => sum + Number(addon.addon_price), 0);
        item.total_price = (item.price_each * item.quantity) + addonTotal;
      }

      const subtotal = orderItems.reduce((sum, item) => sum + item.total_price, 0);
      const vat = subtotal * 0.07;
      const total = subtotal + vat;
      grandTotal += total;

      bills.push({
        order_number: order.order_number,
        total: total.toFixed(2)
      });
    }

    if (bills.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'No items found for this table' });
    }

    res.json({
      table_no,
      bills,
      grand_total: grandTotal.toFixed(2)
    });

  } catch (err) {
    console.error(`[${new Date().toISOString()}] Error in GET /api/admin/bills-summary/:table_no:`, err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    if (connection) connection.release();
  }
});

// สำหรับแสดงบิลแต่ละบิล
app.get('/api/admin/bill/:table_no', async (req, res) => {
  const { table_no } = req.params;
  let connection;

  try {
    connection = await pool.getConnection();
    console.log(`Admin request: Fetching bill details for table ${table_no}`);

    const [orderRows] = await connection.query(
      `SELECT o.*, t.table_no
       FROM orders o
       JOIN tables t ON o.table_number = t.table_no
       WHERE t.table_no = ?`,
      [table_no]
    );

    if (orderRows.length === 0) {
      return res.status(404).json({ error: 'No orders found for this table' });
    }

    let bills = [];

    for (let order of orderRows) {
      const [orderItems] = await connection.query(
        `SELECT oi.id AS order_item_id, oi.menu_id, oi.menu_name, oi.option AS meat_option, oi.quantity, oi.price_each
         FROM order_items oi
         WHERE oi.order_id = ?`,
        [order.id]
      );

      for (let item of orderItems) {
        const [addons] = await connection.query(
          `SELECT addon_name, addon_price
           FROM order_item_addons
           WHERE order_item_id = ?`,
          [item.order_item_id]
        );

        item.addons = addons.map(a => a.addon_name).join(', ') || '';
        const addonTotal = addons.reduce((sum, a) => sum + Number(a.addon_price), 0);
        item.total_price = (Number(item.price_each) * item.quantity) + addonTotal;
      }

      const subtotal = orderItems.reduce((sum, item) => sum + item.total_price, 0);
      const vat = subtotal * 0.07;
      const total = subtotal + vat;

      bills.push({
        order_number: order.order_number,
        table_no: order.table_no,
        order_date: order.order_date,
        order_time: order.order_time,
        items: orderItems.map(item => ({
          menu_name: item.menu_name,
          quantity: item.quantity,
          price_each: item.price_each,
          total_price: item.total_price,
          addons: item.addons,
          meat_option: item.meat_option || null,
        })),
        subtotal: subtotal.toFixed(2),
        vat: vat.toFixed(2),
        total: total.toFixed(0),
      });
    }

    if (bills.length === 0) {
      return res.status(404).json({ error: 'No items found for this table' });
    }

    res.json({
      table_no,
      bills
    });

  } catch (err) {
    console.error(`[${new Date().toISOString()}] Error in GET /api/admin/bill/:table_no:`, err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    if (connection) connection.release();
  }
});


// สำหรับกด paid แล้วลบออเดอรืทิ้ง พร้อมกับ ลบตะกร้า ลบทุกอย่างที่เกี่ยวกับโต๊ะนั้น และก็แก้ข้อมูลโต๊ะว่าว่าง
// ลบข้อมูลออเดอร์และตะกร้าทั้งหมดของโต๊ะ และเปลี่ยนสถานะโต๊ะเป็น Available
app.delete('/api/clear-table/:table_no', async (req, res) => {
  const { table_no } = req.params;
  let connection;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    console.log(`Clearing all data related to table ${table_no}`);

    // 1. ลบ addons ของ order items (มี ON DELETE CASCADE แต่เพื่อความชัดเจนสามารถทำได้ชัดๆ)
    const [orders] = await connection.query(
      `SELECT id FROM orders WHERE table_number = ?`,
      [table_no]
    );

    const orderIds = orders.map(order => order.id);

    if (orderIds.length > 0) {
      // ลบ order item addons
      await connection.query(
        `DELETE FROM order_item_addons WHERE order_item_id IN (
          SELECT id FROM order_items WHERE order_id IN (?)
        )`,
        [orderIds]
      );

      // ลบ order items
      await connection.query(
        `DELETE FROM order_items WHERE order_id IN (?)`,
        [orderIds]
      );

      // ลบ orders
      await connection.query(
        `DELETE FROM orders WHERE id IN (?)`,
        [orderIds]
      );
    }

    // 2. ลบ cart item addons
    await connection.query(
      `DELETE FROM cart_item_addons WHERE cart_item_id IN (
        SELECT ci.id FROM cart_items ci
        JOIN carts c ON ci.cart_id = c.id
        WHERE c.table_no = ?
      )`,
      [table_no]
    );

    // 3. ลบ cart items
    await connection.query(
      `DELETE ci FROM cart_items ci
       JOIN carts c ON ci.cart_id = c.id
       WHERE c.table_no = ?`,
      [table_no]
    );

    // 4. ลบ carts
    await connection.query(
      `DELETE FROM carts WHERE table_no = ?`,
      [table_no]
    );

    // 5. อัปเดตสถานะโต๊ะเป็น Available
    await connection.query(
      `UPDATE tables SET status = 'Available', scanned_at = NULL WHERE table_no = ?`,
      [table_no]
    );

    await connection.commit();
    connection.release();

    console.log(`Successfully cleared data and released table ${table_no}`);
    res.json({ message: `Table ${table_no} cleared and set to Available.` });

  } catch (err) {
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    console.error(`[${new Date().toISOString()}] Error in DELETE /api/clear-table/:table_no:`, err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// // 1. GET /admin/orders - สำหรับ Admin ดึงข้อมูลออเดอร์ทั้งหมด
// app.get('/admin/orders', async (req, res) => {
//   let connection;

//   try {
//     connection = await pool.getConnection();

//     // ดึงข้อมูลออเดอร์ทั้งหมดที่มีสถานะต่างๆ
//     const [orders] = await connection.query(
//       'SELECT * FROM orders ORDER BY order_date DESC, order_time DESC'
//     );

//     // ถ้าไม่มีข้อมูลออเดอร์
//     if (orders.length === 0) {
//       return res.status(404).json({ error: 'No orders found' });
//     }

//     connection.release();
//     res.json(orders);

//   } catch (err) {
//     if (connection) {
//       connection.release();
//     }
//     console.error('[%s] Error in GET /admin/orders:', new Date().toISOString(), err);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });

// // 2. GET /admin/orders/:orderId - สำหรับ Admin ดึงข้อมูลออเดอร์ตาม orderId พร้อมรายการ order_item และ addon
// app.get('/admin/orders/:orderId', async (req, res) => {
//   const { orderId } = req.params;
//   let connection;

//   try {
//     connection = await pool.getConnection();

//     // 1. ดึงข้อมูลของออเดอร์
//     const [orderRows] = await connection.query(
//       'SELECT * FROM orders WHERE id = ?',
//       [orderId]
//     );
    
//     // ถ้าไม่พบออเดอร์
//     if (orderRows.length === 0) {
//       return res.status(404).json({ error: 'Order not found' });
//     }

//     const order = orderRows[0];

//     // 2. ดึงข้อมูลของ order_items ที่เชื่อมโยงกับออเดอร์นี้
//     const [orderItems] = await connection.query(
//       'SELECT * FROM order_items WHERE order_id = ?',
//       [orderId]
//     );

//     // ถ้าไม่มีรายการในออเดอร์นี้
//     if (orderItems.length === 0) {
//       return res.status(404).json({ error: 'No items found for this order' });
//     }

//     // 3. สำหรับแต่ละ order_item ดึงข้อมูล addon ที่เชื่อมโยง
//     for (let item of orderItems) {
//       const [addons] = await connection.query(
//         'SELECT * FROM order_item_addons WHERE order_item_id = ?',
//         [item.id]
//       );
//       item.addons = addons;  // เพิ่มข้อมูล addon ให้กับแต่ละ item
//     }

//     // ส่งข้อมูลของ order พร้อม order_items และ addons
//     connection.release();
//     res.json({
//       order,
//       order_items: orderItems
//     });

//   } catch (err) {
//     if (connection) {
//       connection.release();
//     }
//     console.error('[%s] Error in GET /admin/orders/:orderId:', new Date().toISOString(), err);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });

// // Endpoint สำหรับแอดมินในการอัปเดตสถานะของออเดอร์
// app.post('/admin/api/orders/:orderId/update-status', async (req, res) => {
//   const { orderId } = req.params;
//   const { status } = req.body;  // รับสถานะใหม่จาก body ของ request
//   let connection;

//   try {
//     if (!status) {
//       return res.status(400).json({ error: 'Missing status' });
//     }

//     // ตรวจสอบว่า status ที่ส่งมาถูกต้องหรือไม่
//     const validStatuses = ['Order Placed', 'Preparing', 'Served'];
//     if (!validStatuses.includes(status)) {
//       return res.status(400).json({ error: 'Invalid status' });
//     }

//     connection = await pool.getConnection();
//     await connection.beginTransaction();

//     // 1. ดึงข้อมูลออเดอร์จากฐานข้อมูล
//     const [orderRows] = await connection.query(
//       'SELECT * FROM orders WHERE id = ?',
//       [orderId]
//     );
//     if (orderRows.length === 0) {
//       await connection.rollback();
//       connection.release();
//       return res.status(404).json({ error: 'Order not found' });
//     }

//     // ตรวจสอบสถานะก่อนหน้าไม่สามารถกลับไปสถานะก่อนหน้า
//     const currentStatus = orderRows[0].status;
//     if (
//       (currentStatus === 'Preparing' && status === 'Order Placed') ||
//       (currentStatus === 'Served' && status !== 'Served')
//     ) {
//       return res.status(400).json({
//         error: 'Invalid status transition. Cannot revert to previous status.',
//       });
//     }

//     // 2. อัปเดตสถานะในตาราง orders
//     await connection.query(
//       'UPDATE orders SET status = ? WHERE id = ?',
//       [status, orderId]
//     );

//     // 3. อัปเดตสถานะใน order_items ถ้าต้องการ
//     await connection.query(
//       'UPDATE order_items SET status = ? WHERE order_id = ?',
//       [status, orderId]
//     );

//     await connection.commit();
//     connection.release();

//     res.json({ message: 'Order status updated successfully' });

//   } catch (err) {
//     if (connection) {
//       await connection.rollback();
//       connection.release();
//     }
//     console.error('Error in POST /admin/api/orders/:orderId/update-status:', err);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });

// BillDetails



// --------------------------------------------------------------------Get data--------------------------------------------------------
app.get('/api/orders/:orderId', async (req, res) => {
  const { orderId } = req.params;  // รับ orderId จาก URL parameters
  let connection;

  try {
    // เชื่อมต่อฐานข้อมูล
    connection = await pool.getConnection();

    // 1. ดึงข้อมูลออเดอร์หลัก
    const [orderRows] = await connection.query(
      'SELECT * FROM orders WHERE id = ?',
      [orderId]
    );
    if (orderRows.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Order not found' });
    }
    const order = orderRows[0];

    // 2. ดึงรายการ order_items ที่เกี่ยวข้องกับออเดอร์นี้
    const [orderItems] = await connection.query(
      'SELECT * FROM order_items WHERE order_id = ?',
      [orderId]
    );
    
    // สร้างข้อมูลรายการ order_items พร้อม addons ที่เกี่ยวข้อง
    const orderItemsWithAddons = [];

    for (const item of orderItems) {
      // 3. ดึง addons ที่เชื่อมกับ order_item นี้
      const [addons] = await connection.query(
        'SELECT * FROM order_item_addons WHERE order_item_id = ?',
        [item.id]
      );

      const itemWithAddons = {
        ...item,
        addons: addons.map(addon => ({
          addon_name: addon.addon_name,
          addon_price: addon.addon_price
        }))
      };

      orderItemsWithAddons.push(itemWithAddons);
    }

    // 4. ส่งข้อมูลที่ดึงมาให้ผู้ใช้
    res.json({
      order: {
        id: order.id,
        order_number: order.order_number,
        table_number: order.table_number,
        status: order.status,
        order_date: order.order_date,
        order_time: order.order_time,
        total_price: order.total_price
      },
      order_items: orderItemsWithAddons
    });

  } catch (err) {
    console.error('Error in GET /api/orders/:orderId:', err);
    if (connection) {
      connection.release();
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});
// ------------------------------------------------------------------ User Get Options ------------------------------------------------------------------
app.get('/api/options', async (req, res) => {
  try {
    const [meatOptions] = await pool.query('SELECT id, name, extra_price FROM meat_options');
    const [addonOptions] = await pool.query('SELECT id, name, extra_price FROM addon_options');
    console.log('meatOptions:', JSON.stringify(meatOptions, null, 2));
    console.log('addonOptions:', JSON.stringify(addonOptions, null, 2));
    res.json({ meat_options: meatOptions, addon_options: addonOptions });
  } catch (err) {
    console.error('Error in /api/options:', err.message, err.stack);
    res.status(500).json({ error: 'Failed to fetch menu options' });
  }
});

// ------------------------------------------------------------------ Table ------------------------------------------------------------------
app.post('/api/tables/scan', async (req, res) => {
  try {
    let { table_no } = req.body;

    // ✅ Validate table_no ให้มีแค่ '01' ถึง '12' เท่านั้น
    const validTableNumbers = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
    if (!validTableNumbers.includes(table_no)) {
      return res.status(400).json({ error: 'Invalid table number' });
    }

    if (!table_no) {
      return res.status(400).json({ error: 'Table number is required' });
    }

    const connection = await pool.getConnection();

    // ตรวจสอบว่าโต๊ะมีอยู่ในระบบหรือไม่
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

    // อัปเดต status เป็น "Occupied" และอัปเดต scanned_at
    const [result] = await connection.query(
      'UPDATE tables SET status = "Occupied", scanned_at = NOW() WHERE table_no = ?',
      [table_no]
    );

    connection.release();

    if (result.affectedRows === 0) {
      return res.status(500).json({ error: 'Failed to update table status' });
    }

    console.log('[%s] Table %s scanned and occupied', new Date().toISOString(), table_no);
    res.json({ message: `Table ${table_no} status updated to Occupied` });
  } catch (err) {
    console.error('[%s] Error in POST /api/tables/scan:', new Date().toISOString(), err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
// ------------------------------------------------------------------ User -----------------------------------------------------------------------
// Add cart
app.post('/api/cart/add', async (req, res) => {
  let connection;
  try {
    const { table_no, menu_id, meat_option_id, quantity, addon_option_ids } = req.body;

    // ✅ Validate input
    if (!table_no || !menu_id || !quantity) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (quantity < 1) {
      return res.status(400).json({ error: 'Quantity must be at least 1' });
    }

    const validTableNumbers = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
    if (!validTableNumbers.includes(table_no)) {
      return res.status(400).json({ error: 'Invalid table number' });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    // ✅ ตรวจสอบว่าโต๊ะนี้มีอยู่และถูกใช้
    const [tableRows] = await connection.query(
      'SELECT table_no, status FROM tables WHERE table_no = ?',
      [table_no]
    );
    if (tableRows.length === 0 || tableRows[0].status !== 'Occupied') {
      await connection.rollback();
      return res.status(400).json({ error: 'Invalid or unoccupied table' });
    }

    // ✅ ตรวจสอบหรือสร้าง cart
    let [cartRows] = await connection.query('SELECT id FROM carts WHERE table_no = ?', [table_no]);
    let cartId;
    if (cartRows.length === 0) {
      const [cartResult] = await connection.query(
        'INSERT INTO carts (table_no, created_at) VALUES (?, NOW())',
        [table_no]
      );
      cartId = cartResult.insertId;
    } else {
      cartId = cartRows[0].id;
    }

    // ✅ ดึงข้อมูลเมนู
    const [menuRows] = await connection.query(
      'SELECT name_eng, price_starts_at FROM menu WHERE id = ?',
      [menu_id]
    );
    if (menuRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Menu not found' });
    }

    const menuName = menuRows[0].name_eng;  // ใช้ name_eng
    let totalPrice = parseFloat(menuRows[0].price_starts_at);  // ดึงราคาเริ่มต้นจากเมนู

    // ตรวจสอบให้แน่ใจว่าราคาเมนูถูกต้อง
    if (isNaN(totalPrice)) {
      await connection.rollback();
      return res.status(400).json({ error: 'Invalid price for menu item' });
    }

    // ✅ ดึงราคาเนื้อ ถ้ามี
    let meatOptionPrice = 0;
    if (meat_option_id) {
      const [meatRows] = await connection.query(
        'SELECT extra_price FROM meat_options WHERE id = ?',
        [meat_option_id]
      );
      if (meatRows.length === 0) {
        await connection.rollback();
        return res.status(404).json({ error: 'Meat option not found' });
      }
      meatOptionPrice = parseFloat(meatRows[0].extra_price);  // ตรวจสอบให้เป็นตัวเลข
      totalPrice += meatOptionPrice; // เพิ่มราคาเนื้อเข้าไปในราคา
    }

    // ✅ เตรียม addon
    const addons = [];
    if (addon_option_ids && Array.isArray(addon_option_ids)) {
      for (const addonId of addon_option_ids) {
        const [addonRows] = await connection.query(
          'SELECT extra_price FROM addon_options WHERE id = ?',
          [addonId]
        );
        if (addonRows.length === 0) {
          await connection.rollback();
          return res.status(404).json({ error: `Addon option ID ${addonId} not found` });
        }
        const addonPrice = parseFloat(addonRows[0].extra_price);  // ตรวจสอบให้เป็นตัวเลข
        totalPrice += addonPrice;

        addons.push({ addon_option_id: addonId, price: addonPrice.toFixed(2) });  // ราคาเป็นทศนิยม 2 ตำแหน่ง
      }
    }

    // ✅ เพิ่มเข้า cart_items พร้อมทั้ง meat_option_id
    const [cartItemResult] = await connection.query(
      `INSERT INTO cart_items (cart_id, menu_id, menu_name, quantity, total_price, meat_option_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [cartId, menu_id, menuName, quantity, totalPrice.toFixed(2), meat_option_id || null]  // total_price แทน price_each
    );
    const cartItemId = cartItemResult.insertId;

    // ✅ เพิ่ม addon แยก
    for (const addon of addons) {
      await connection.query(
        `INSERT INTO cart_item_addons (cart_item_id, addon_option_id, price)
         VALUES (?, ?, ?)`,
        [cartItemId, addon.addon_option_id, addon.price]
      );
    }

    await connection.commit();
    connection.release();

    res.json({
      message: 'Item added to cart successfully',
      cart_id: cartId,
      menu_name: menuName,
      quantity,
      total_price: totalPrice.toFixed(2),  // ส่งผลลัพธ์ที่เป็นทศนิยม 2 ตำแหน่ง
      addons,
    });

  } catch (err) {
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
// Update quality
app.put('/api/cart/update', async (req, res) => {
  let connection;
  try {
    const { cart_item_id, quantity } = req.body;

    // ✅ Validate input
    if (!cart_item_id || !quantity) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (quantity < 1) {
      return res.status(400).json({ error: 'Quantity must be at least 1' });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    // ✅ ดึงข้อมูล cart_item
    const [cartItemRows] = await connection.query(
      'SELECT ci.menu_id, ci.menu_name, ci.total_price FROM cart_items ci WHERE ci.id = ?',
      [cart_item_id]
    );

    if (cartItemRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Cart item not found' });
    }

    const cartItem = cartItemRows[0];
    const menuId = cartItem.menu_id;

    // ✅ ดึงข้อมูลเมนู
    const [menuRows] = await connection.query(
      'SELECT price_starts_at FROM menu WHERE id = ?',
      [menuId]
    );
    if (menuRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Menu not found' });
    }

    const pricePerItem = parseFloat(menuRows[0].price_starts_at);

    if (isNaN(pricePerItem)) {
      await connection.rollback();
      return res.status(400).json({ error: 'Invalid price' });
    }

    // ✅ คำนวณราคาใหม่ตามจำนวน (quantity)
    const newTotalPrice = pricePerItem * quantity;

    // ✅ อัปเดตตะกร้าสินค้าในฐานข้อมูล
    await connection.query(
      `UPDATE cart_items SET quantity = ?, total_price = ? WHERE id = ?`,
      [quantity, newTotalPrice.toFixed(2), cart_item_id]
    );

    await connection.commit();
    connection.release();

    res.json({
      message: 'Cart item updated successfully',
      cart_item_id,
      quantity,
      total_price: newTotalPrice.toFixed(2),
    });

  } catch (err) {
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/cart/:table_no', async (req, res) => {
  const { table_no } = req.params;
  let connection;

  try {
    connection = await pool.getConnection();

    // 1. ตรวจสอบว่า cart มีอยู่มั้ย
    const [cartRows] = await connection.query(
      'SELECT id FROM carts WHERE table_no = ?',
      [table_no]
    );

    if (cartRows.length === 0) {
      console.log(`Cart not found for table_no: ${table_no}`);
      connection.release();
      return res.status(404).json({ error: `Your cart was not found` });
    }

    const cartId = cartRows[0].id;

    // 2. ดึงข้อมูลรายการในตะกร้าพร้อมรูปภาพจากตาราง menu
    const [items] = await connection.query(
      `SELECT ci.id AS cart_item_id, ci.menu_id, ci.menu_name, ci.quantity, ci.total_price,
              mo.name AS meat_option_name, m.image AS menu_image
       FROM cart_items ci
       LEFT JOIN meat_options mo ON ci.meat_option_id = mo.id
       LEFT JOIN menu m ON ci.menu_id = m.id
       WHERE ci.cart_id = ?`,
      [cartId]
    );

    // 3. ดึง add-ons ของแต่ละ cart_item
    for (let item of items) {
      const [addonRows] = await connection.query(
        `SELECT ao.name, ao.extra_price
         FROM cart_item_addons cia
         JOIN addon_options ao ON cia.addon_option_id = ao.id
         WHERE cia.cart_item_id = ?`,
        [item.cart_item_id]
      );

      item.addons = addonRows.map(addon => addon.name).join(', ');
      item.meat_option = item.meat_option_name || '';
      item.image = item.menu_image || ''; // เพิ่มฟิลด์ image
      item.total_price = parseFloat(item.total_price); // คำนวณราคา

      // ลบฟิลด์ที่ไม่ต้องการ
      delete item.meat_option_name;
      delete item.cart_item_id;
      delete item.menu_image;
      delete item.menu_id;
    }

    // 4. คำนวณยอดรวม
    const grand_total = items.reduce((sum, item) => sum + item.total_price, 0);

    res.json({
      table_no,
      items,
      grand_total,
    });

  } catch (err) {
    if (connection) connection.release();
    console.error('[%s] Error in GET /api/cart/:table_no:', new Date().toISOString(), err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ตอนกด checkout ---------------------------------------------------------------------------
app.post('/api/cart/checkout', async (req, res) => {
  const { table_no } = req.body;
  let connection;

  try {
    if (!table_no) return res.status(400).json({ error: 'Missing table_no' });

    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 1. ดึง cart
    const [cartRows] = await connection.query(
      'SELECT id FROM carts WHERE table_no = ?',
      [table_no]
    );
    if (cartRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Cart not found for table' });
    }
    const cartId = cartRows[0].id;

    // 2. ดึง cart_items
    const [cartItems] = await connection.query(
      'SELECT * FROM cart_items WHERE cart_id = ?',
      [cartId]
    );
    if (cartItems.length === 0) {
      await connection.rollback();
      return res.status(400).json({ error: 'Cart is empty' });
    }

    // 3. สร้าง order
    const orderNumber = `ORD-${Date.now()}`;
    const [orderResult] = await connection.query(
      `INSERT INTO orders (order_number, table_number, status, order_date, order_time, total_price)
       VALUES (?, ?, 'orderplaced', CURDATE(), CURTIME(), 0.00)`,
      [orderNumber, table_no]
    );
    const orderId = orderResult.insertId;

    let totalPrice = 0;

    // 4. Loop cart_items -> order_items
    for (const item of cartItems) {
      let optionText = null;

      if (item.meat_option_id) {
        const [meatRows] = await connection.query(
          'SELECT name FROM meat_options WHERE id = ?',
          [item.meat_option_id]
        );
        optionText = meatRows[0]?.name || null;
      }

      const priceEach = parseFloat(item.total_price) / item.quantity;

      const [orderItemResult] = await connection.query(
        `INSERT INTO order_items (order_id, menu_id, menu_name, \`option\`, quantity, price_each)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          item.menu_id,
          item.menu_name,
          optionText,
          item.quantity,
          priceEach.toFixed(2)
        ]
      );
      const orderItemId = orderItemResult.insertId;
      totalPrice += priceEach * item.quantity;

      // 5. เพิ่ม addon
      const [addons] = await connection.query(
        'SELECT * FROM cart_item_addons WHERE cart_item_id = ?',
        [item.id]
      );

      for (const addon of addons) {
        const [addonDetail] = await connection.query(
          'SELECT name FROM addon_options WHERE id = ?',
          [addon.addon_option_id]
        );
        const addonName = addonDetail[0]?.name || 'Unknown';

        await connection.query(
          `INSERT INTO order_item_addons (order_item_id, addon_name, addon_price)
           VALUES (?, ?, ?)`,
          [orderItemId, addonName, addon.price]
        );

        totalPrice += parseFloat(addon.price);
      }
    }

    // 6. อัปเดตราคาใน orders
    await connection.query(
      'UPDATE orders SET total_price = ? WHERE id = ?',
      [totalPrice.toFixed(2), orderId]
    );

    // 7. ล้าง cart
    await connection.query('DELETE FROM cart_item_addons WHERE cart_item_id IN (SELECT id FROM cart_items WHERE cart_id = ?)', [cartId]);
    await connection.query('DELETE FROM cart_items WHERE cart_id = ?', [cartId]);
    await connection.query('DELETE FROM carts WHERE id = ?', [cartId]);
    await connection.commit();
    connection.release();

    res.json({ message: 'Checkout successful', order_id: orderId, total_price: totalPrice.toFixed(2) });

  } catch (err) {
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    console.error('[%s] Error in POST /api/cart/checkout:', new Date().toISOString(), err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// OrderDetails
app.get('/api/order/:table_no', async (req, res) => {
  const { table_no } = req.params;
  let connection;

  try {
    connection = await pool.getConnection();
    console.log(`Connection successful. Fetching orders for table ${table_no}`);

    // 1. Fetch orders for the given table number
    const [orderRows] = await connection.query(
      `SELECT o.*, t.table_no
       FROM orders o
       JOIN tables t ON o.table_number = t.table_no
       WHERE t.table_no = ?`,
      [table_no]
    );

    console.log('orderRows:', orderRows);

    if (orderRows.length === 0) {
      connection.release();
      console.log(`No orders found for table ${table_no}`);
      return res.status(404).json({ error: 'Order not found for this table' });
    }

    // 2. Fetch order items based on order_id
    const [orderItems] = await connection.query(
      `SELECT oi.id AS order_item_id, oi.menu_id, oi.menu_name, oi.option AS meat_option, oi.quantity, oi.price_each
       FROM order_items oi
       WHERE oi.order_id = ?`,
      [orderRows[0].id]
    );

    console.log('orderItems:', orderItems);

    if (orderItems.length === 0) {
      connection.release();
      console.log(`No items found for order ${orderRows[0].id}`);
      return res.status(404).json({ error: 'No items found for this order' });
    }

    // 3. Fetch order item addons and calculate total price including addon price
    for (let item of orderItems) {
      const [addons] = await connection.query(
        `SELECT oia.addon_name, oia.addon_price
         FROM order_item_addons oia
         WHERE oia.order_item_id = ?`,
        [item.order_item_id]
      );

      console.log(`addons for item ${item.order_item_id}:`, addons);

      // Convert addons to a string separated by commas
      item.addons = addons.length > 0 ? addons.map(addon => addon.addon_name).join(', ') : '';

      // Calculate total price: (price_each * quantity) + sum(addon_price)
      const addonTotal = addons.reduce((sum, addon) => sum + Number(addon.addon_price), 0);
      item.total_price = (Number(item.price_each) * item.quantity) + addonTotal;
      item.image = null; // Assuming no image data for now
    }

    // 4. Calculate grand total by summing up the total_price of each item
    const grand_total = orderItems.reduce((sum, item) => sum + item.total_price, 0);

    // 5. Send response in the desired structure, including orders table data
    console.log('Returning order and items data:', {
      order_number: orderRows[0].order_number,
      table_no: orderRows[0].table_no,
      status: orderRows[0].status,
      order_date: orderRows[0].order_date,
      order_time: orderRows[0].order_time,
      items: orderItems.map(item => ({
        menu_name: item.menu_name,
        quantity: item.quantity,
        total_price: item.total_price,
        addons: item.addons,
        meat_option: item.meat_option || null,
        image: item.image
      })),
      grand_total
    });

    res.json({
      order_number: orderRows[0].order_number,
      table_no: orderRows[0].table_no,
      status: orderRows[0].status,
      order_date: orderRows[0].order_date,
      order_time: orderRows[0].order_time,
      items: orderItems.map(item => ({
        menu_name: item.menu_name,
        quantity: item.quantity,
        total_price: item.total_price,
        addons: item.addons,
        meat_option: item.meat_option || null,
        image: item.image
      })),
      grand_total
    });

  } catch (err) {
    if (connection) connection.release();
    console.error('[%s] Error in GET /api/orders/:table_no:', new Date().toISOString(), err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Order Status 
app.get('/api/order-status/:table_no', async (req, res) => {
  const { table_no } = req.params;
  let connection;

  try {
    connection = await pool.getConnection();
    console.log(`เชื่อมต่อสำเร็จ กำลังดึงสถานะคำสั่งซื้อสำหรับโต๊ะ ${table_no}`);

    // 1. ดึงข้อมูลคำสั่งซื้อทั้งหมดสำหรับหมายเลขโต๊ะที่กำหนด
    const [orderRows] = await connection.query(
      `SELECT o.id AS order_id, o.order_number, o.status
       FROM orders o
       JOIN tables t ON o.table_number = t.table_no
       WHERE t.table_no = ?`,
      [table_no]
    );

    console.log('orderRows:', orderRows);

    if (orderRows.length === 0) {
      connection.release();
      console.log(`ไม่พบคำสั่งซื้อสำหรับโต๊ะ ${table_no}`);
      return res.status(404).json({ error: 'ไม่พบคำสั่งซื้อสำหรับโต๊ะนี้' });
    }

    // 2. สำหรับแต่ละคำสั่งซื้อ ดึงจำนวนรายการทั้งหมดในคำสั่งซื้อนั้น
    for (let order of orderRows) {
      const [orderItems] = await connection.query(
        `SELECT COUNT(*) AS total_items
         FROM order_items oi
         WHERE oi.order_id = ?`,
        [order.order_id]
      );
      order.total_items = orderItems[0].total_items;
    }

    // 3. ส่งข้อมูลสถานะคำสั่งซื้อกลับ
    console.log('กำลังส่งข้อมูลสถานะคำสั่งซื้อ:', orderRows);

    res.json({
      table_no: table_no,
      orders: orderRows.map(order => ({
        order_id: order.order_id,
        order_number: order.order_number,
        total_items: order.total_items,
        status: order.status
      }))
    });

  } catch (err) {
    if (connection) connection.release();
    console.error('[%s] เกิดข้อผิดพลาดใน GET /api/order-status/:table_no:', new Date().toISOString(), err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' });
  }
});

// BillDetails
app.get('/api/bill/:table_no', async (req, res) => {
  const { table_no } = req.params;
  let connection;

  try {
    connection = await pool.getConnection();
    console.log(`Connection successful. Fetching bills for table ${table_no}`);

    // 1. Fetch all orders for the given table number
    const [orderRows] = await connection.query(
      `SELECT o.*, t.table_no
       FROM orders o
       JOIN tables t ON o.table_number = t.table_no
       WHERE t.table_no = ?`,
      [table_no]
    );

    console.log('orderRows:', orderRows);

    if (orderRows.length === 0) {
      connection.release();
      console.log(`No orders found for table ${table_no}`);
      return res.status(404).json({ error: 'Order not found for this table' });
    }

    // 2. Initialize array to store all bills
    let bills = [];

    // 3. Loop through each order and calculate bill details
    for (let order of orderRows) {
      // Fetch order items for this order
      const [orderItems] = await connection.query(
        `SELECT oi.id AS order_item_id, oi.menu_id, oi.menu_name, oi.option AS meat_option, oi.quantity, oi.price_each
         FROM order_items oi
         WHERE oi.order_id = ?`,
        [order.id]
      );

      console.log(`orderItems for order ${order.id}:`, orderItems);

      if (orderItems.length === 0) continue; // Skip if no items in this order

      // 4. Fetch addons and calculate total price for each item
      for (let item of orderItems) {
        const [addons] = await connection.query(
          `SELECT oia.addon_name, oia.addon_price
           FROM order_item_addons oia
           WHERE oia.order_item_id = ?`,
          [item.order_item_id]
        );

        console.log(`addons for item ${item.order_item_id}:`, addons);

        // Convert addons to a string separated by commas
        item.addons = addons.length > 0 ? addons.map(addon => addon.addon_name).join(', ') : '';

        // Calculate total price for the item: (price_each * quantity) + sum(addon_price)
        const addonTotal = addons.reduce((sum, addon) => sum + Number(addon.addon_price), 0);
        item.total_price = (Number(item.price_each) * item.quantity) + addonTotal;
      }

      // 5. Calculate subtotal for this order
      const subtotal = orderItems.reduce((sum, item) => sum + item.total_price, 0);

      // 6. Calculate VAT (7%) and total for this order
      const vatRate = 0.07;
      const vat = subtotal * vatRate;
      const total = subtotal + vat;

      // 7. Add bill details to the bills array
      bills.push({
        order_number: order.order_number,
        table_no: order.table_no,
        order_date: order.order_date,
        order_time: order.order_time,
        items: orderItems.map(item => ({
          menu_name: item.menu_name,
          quantity: item.quantity,
          price_each: item.price_each,
          total_price: item.total_price,
          addons: item.addons,
          meat_option: item.meat_option || null,
        })),
        subtotal: subtotal.toFixed(2),
        vat: vat.toFixed(2),
        total: total.toFixed(0),
      });
    }

    if (bills.length === 0) {
      connection.release();
      console.log(`No items found for table ${table_no}`);
      return res.status(404).json({ error: 'No items found for this table' });
    }

    // 8. Send response with all bills for the table
    console.log('Returning bills data for table:', { table_no, bills });

    res.json({
      table_no: table_no,
      bills: bills,
    });

  } catch (err) {
    if (connection) connection.release();
    console.error(`[${new Date().toISOString()}] Error in GET /api/bill/:table_no:`, err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Bills Summary
app.get('/api/bills-summary/:table_no', async (req, res) => {
  const { table_no } = req.params;
  let connection;

  try {
    connection = await pool.getConnection();
    console.log(`Connection successful. Fetching bills summary for table ${table_no}`);

    // 1. Fetch all orders for the given table number
    const [orderRows] = await connection.query(
      `SELECT o.*, t.table_no
       FROM orders o
       JOIN tables t ON o.table_number = t.table_no
       WHERE t.table_no = ?`,
      [table_no]
    );

    console.log('orderRows:', orderRows);

    if (orderRows.length === 0) {
      connection.release();
      console.log(`No orders found for table ${table_no}`);
      return res.status(404).json({ error: 'Order not found for this table' });
    }

    // 2. Initialize array to store bills summary and grand total
    let bills = [];
    let grandTotal = 0;

    // 3. Loop through each order and calculate its total
    for (let order of orderRows) {
      // Fetch order items for this order
      const [orderItems] = await connection.query(
        `SELECT oi.id AS order_item_id, oi.menu_id, oi.menu_name, oi.option AS meat_option, oi.quantity, oi.price_each
         FROM order_items oi
         WHERE oi.order_id = ?`,
        [order.id]
      );

      console.log(`orderItems for order ${order.id}:`, orderItems);

      if (orderItems.length === 0) continue; // Skip if no items in this order

      // 4. Fetch addons and calculate total price for each item
      for (let item of orderItems) {
        const [addons] = await connection.query(
          `SELECT oia.addon_name, oia.addon_price
           FROM order_item_addons oia
           WHERE oia.order_item_id = ?`,
          [item.order_item_id]
        );

        console.log(`addons for item ${item.order_item_id}:`, addons);

        // Calculate total price for the item: (price_each * quantity) + sum(addon_price)
        const addonTotal = addons.reduce((sum, addon) => sum + Number(addon.addon_price), 0);
        item.total_price = (Number(item.price_each) * item.quantity) + addonTotal;
      }

      // 5. Calculate subtotal for this order
      const subtotal = orderItems.reduce((sum, item) => sum + item.total_price, 0);

      // 6. Calculate VAT (7%) and total for this order
      const vatRate = 0.07;
      const vat = subtotal * vatRate;
      const total = subtotal + vat;

      // 7. Add to grand total (use total directly since it already includes VAT)
      grandTotal += total;

      // 8. Add bill summary to the bills array
      bills.push({
        order_number: order.order_number,
        total: total.toFixed(2),
      });
    }

    if (bills.length === 0) {
      connection.release();
      console.log(`No items found for table ${table_no}`);
      return res.status(404).json({ error: 'No items found for this table' });
    }

    // 9. Send response with bills summary and grand total
    console.log('Returning bills summary for table:', {
      table_no,
      bills,
      grand_total: grandTotal.toFixed(2),
    });

    res.json({
      table_no: table_no,
      bills: bills,
      grand_total: grandTotal.toFixed(2),
    });

  } catch (err) {
    if (connection) connection.release();
    console.error(`[${new Date().toISOString()}] Error in GET /api/bills-summary/:table_no:`, err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ----------------------------------------------------------- Table ------------------------------------------------------------
// POST /api/tables/scan - อัปเดตสถานะโต๊ะเมื่อสแกน QR Code
app.post('/api/tables/scan', async (req, res) => {
  try {
    let { table_no } = req.body;

    if (!table_no) {
      return res.status(400).json({ error: 'Table number is required' });
    }

    const connection = await pool.getConnection();

    // ตรวจสอบว่าโต๊ะมีอยู่ในระบบหรือไม่
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

    // อัปเดต status เป็น "Occupied" และอัปเดต scanned_at
    const [result] = await connection.query(
      'UPDATE tables SET status = "Occupied", scanned_at = NOW() WHERE table_no = ?',
      [table_no]
    );

    connection.release();

    if (result.affectedRows === 0) {
      return res.status(500).json({ error: 'Failed to update table status' });
    }

    console.log('[%s] Table %s scanned and occupied', new Date().toISOString(), table_no);
    res.json({ message: `Table ${table_no} status updated to Occupied` });
  } catch (err) {
    console.error('Error:', err);
    console.error('[%s] Error in POST /api/tables/scan:', new Date().toISOString(), err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// แนะนำเมนู
app.post('/recommend', async (req, res) => {
  try {
    const { user_input, table_id } = req.body;
    if (!user_input) {
      console.error('❌ Missing user_input in request body:', req.body);
      return res.status(400).json({ error: 'user_input is required' });
    }
    if (!table_id) {
      console.error('❌ Missing table_id in request body:', req.body);
      return res.status(400).json({ error: 'table_id is required' });
    }

    const connection = await pool.getConnection();
    try {
      const [results] = await connection.query('SELECT * FROM menu');
      if (!results || results.length === 0) {
        console.warn('⚠️ No menus found in database');
        return res.status(404).json({ error: 'No menus available in database' });
      }

      console.log('\n🔍 Menus sent to Python service:');
      results.forEach(item => {
        console.log(`- ${item.name_eng}: tags=${item.tags}, category=${item.category}`);
      });

      const menu_data = results.map(item => ({
        id: item.id,
        name_eng: item.name_eng,
        short_description: item.short_description,
        price_starts_at: item.price_starts_at,
        combined_text: `${item.tags || ''} ${item.full_description || ''}`,
        category: item.category,
        tags: item.tags,
      }));

      console.log('📤 Sending to FastAPI:', { user_input, table_id, menu_data_length: menu_data.length });

      const response = await axios.post('http://172.20.10.3:8000/recommend', {
        user_input,
        table_id,
        menu_data,
      });

      console.log('✅ Python service response:', response.data);
      res.json(response.data);
    } catch (error) {
      console.error('❌ Error in recommendation endpoint:', error.message, error.response?.data);
      res.status(500).json({
        error: 'Failed to generate recommendations',
        details: error.message,
        fastapi_response: error.response?.data,
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('❌ Error in recommendation endpoint:', error.message);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// เริ่มเซิร์ฟเวอร์
const PORT = 3000;
app.listen(3000, '0.0.0.0', () => {
  console.log("Server running on http://0.0.0.0:3000");
});