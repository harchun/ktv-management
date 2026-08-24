require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'mysql',
  user: process.env.DB_USER || 'appuser',
  password: process.env.DB_PASSWORD || 'ktv2026',
  database: process.env.DB_NAME || 'ktv_management',
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4'
});

const JWT_SECRET = process.env.JWT_SECRET || 'ktv-secret-2026';

function authenticate(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: '未授權' });
  try {
    req.user = jwt.verify(auth.replace('Bearer ', ''), JWT_SECRET);
    next();
  } catch { res.status(401).json({ error: 'token 過期' }); }
}

// ==================== AUTH ====================
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password, 帳號, 密碼 } = req.body;
    const user_name = 帳號 || username;
    const user_pass = 密碼 || password;
    if (!user_name || !user_pass) {
      return res.status(400).json({ error: '帳號或密碼不能為空' });
    }
    const [rows] = await pool.execute('SELECT * FROM users WHERE 帳號 = ?', [user_name]);
    if (!rows.length || !bcrypt.compareSync(user_pass, rows[0].密碼)) {
      return res.status(401).json({ error: '帳號或密碼錯誤' });
    }
    const token = jwt.sign({ id: rows[0].用戶編號, username: rows[0].帳號, role: rows[0].角色 }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: rows[0].用戶編號, 帳號: rows[0].帳號, 角色: rows[0].角色 } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ==================== CADRES ====================
app.get('/api/cadres', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM cadres ORDER BY CAST(幹部編號 AS UNSIGNED)');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/cadres', authenticate, async (req, res) => {
  try {
    const { 姓名, 暱稱, 等級, 聯絡方式, 電子信箱, 地址, 備註 } = req.body;
    const 幹部編號 = 'K' + Date.now().toString().slice(-8);
    await pool.execute(
      'INSERT INTO cadres (`幹部編號`, `姓名`, `暱稱`, `等級`, `聯絡方式`, `電子信箱`, `地址`, `備註`) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [幹部編號, 姓名, 暱稱 || null, 等級 || '一般', 聯絡方式 || null, 電子信箱 || null, 地址 || null, 備註 || null]
    );
    const [rows] = await pool.execute('SELECT * FROM cadres WHERE `幹部編號` = ?', [幹部編號]);
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/cadres/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { 姓名, 等級, 聯絡方式, 暱稱 } = req.body;
    await pool.execute(
      'UPDATE cadres SET `姓名`=?, `等級`=?, `聯絡方式`=?, `暱稱`=? WHERE `幹部編號`=?',
      [姓名, 等級 || '一般', 聯絡方式 || null, 暱稱 || null, id]
    );
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/cadres/:id', authenticate, async (req, res) => {
  try {
    await pool.execute('DELETE FROM cadres WHERE `幹部編號` = ?', [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ==================== CUSTOMERS ====================
app.get('/api/customers', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM customer_contacts ORDER BY `客戶編號`');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/customers', authenticate, async (req, res) => {
  try {
    const { 客戶姓名, 暱稱, 類別, 電話, 行動電話, LINE_ID, 生日, 特徵, 備註 } = req.body;
    const 客戶編號 = 'C' + Date.now().toString().slice(-8);
    await pool.execute(
      'INSERT INTO customer_contacts (`客戶編號`, `客戶姓名`, `暱稱`, `類別`, `電話`, `行動電話`, `LINE_ID`, `生日`, `特徵`, `備註`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [客戶編號, 客戶姓名, 暱稱 || null, 類別 || '一般', 電話 || null, 行動電話 || null, LINE_ID || null, 生日 || null, 特徵 || null, 備註 || null]
    );
    res.json({ 客戶編號, 客戶姓名, 暱稱, 類別: 類別 || '一般', 電話, 行動電話, LINE_ID, 生日, 特徵, 備註 });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/customers/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { 客戶姓名, 暱稱, 類別, 電話, 行動電話, LINE_ID, 生日, 特徵, 備註 } = req.body;
    await pool.execute(
      'UPDATE customer_contacts SET `客戶姓名`=?, `暱稱`=?, `類別`=?, `電話`=?, `行動電話`=?, `LINE_ID`=?, `生日`=?, `特徵`=?, `備註`=? WHERE `客戶編號`=?',
      [客戶姓名, 暱稱 || null, 類別 || '一般', 電話 || null, 行動電話 || null, LINE_ID || null, 生日 || null, 特徵 || null, 備註 || null, id]
    );
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/customers/:id', authenticate, async (req, res) => {
  try {
    await pool.execute('DELETE FROM customer_contacts WHERE `客戶編號` = ?', [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Customer visit history
app.get('/api/customers/:id/visits', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const [visits] = await pool.execute(
      'SELECT ds.*, cad.`姓名` as 幹部姓名, g.`暱稱` as 公關暱稱, g.`姓名` as 公關姓名 FROM daily_sales ds LEFT JOIN cadres cad ON ds.`幹部編號` = cad.`幹部編號` LEFT JOIN gossip g ON ds.`公關訂桌` = g.`公關編號` WHERE ds.`客戶編號` = ? ORDER BY ds.`日期` DESC',
      [id]
    );
    const lastVisit = visits[0]?.日期 || null;
    const daysSince = lastVisit ? Math.floor((Date.now() - new Date(lastVisit).getTime()) / 86400000) : null;
    res.json({ visits, daysSinceLastVisit: daysSince });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ==================== DAILY SALES ====================
app.get('/api/daily-sales', authenticate, async (req, res) => {
  try {
    const { start, end, cadre, customer } = req.query;
    let sql = `SELECT ds.*, c.\`客戶姓名\` as 客戶姓名, cad.\`姓名\` as 幹部姓名 
               FROM daily_sales ds 
               LEFT JOIN customer_contacts c ON ds.\`客戶編號\` = c.\`客戶編號\` 
               LEFT JOIN cadres cad ON ds.\`幹部編號\` = cad.\`幹部編號\` 
               WHERE 1=1`;
    const params = [];
    if (start) { sql += ' AND ds.`日期` >= ?'; params.push(start); }
    if (end) { sql += ' AND ds.`日期` <= ?'; params.push(end); }
    if (cadre) { sql += ' AND (cad.`姓名` LIKE ? OR cad.`暱稱` LIKE ?)'; params.push(`%${cadre}%`, `%${cadre}%`); }
    if (customer) { sql += ' AND (c.`客戶姓名` LIKE ? OR c.`暱稱` LIKE ?)'; params.push(`%${customer}%`, `%${customer}%`); }
    sql += ' ORDER BY ds.`日期` DESC';
    const [rows] = await pool.execute(sql, params);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/daily-sales', authenticate, async (req, res) => {
  try {
    const {
      日期, 幹部編號, 幹部, 房號, 客戶編號, 客戶名, 人數,
      公司吸收額, 幹部吸收額, 餐酒, 包廂費, 坐檯費, 公關費用, 公關訂桌,
      進出全, 小潔, 服務費, 稅額, 業績, 現金, 信用, 簽帳, 其它, 備註
    } = req.body;
    const 營業編號 = 'DS' + Date.now().toString().slice(-8);
    await pool.execute(
      'INSERT INTO daily_sales (`營業編號`, `日期`, `幹部編號`, `幹部`, `房號`, `客戶編號`, `客戶名`, `人數`, `公關訂桌`, `公司吸收額`, `幹部吸收額`, `餐酒`, `包廂費`, `坐檯費`, `公關費用`, `進出全`, `小潔`, `服務費`, `稅額`, `業績`, `現金`, `信用`, `簽帳`, `其它`, `備註`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [營業編號, 日期, 幹部編號 || null, 幹部 || null, 房號 || null, 客戶編號 || null, 客戶名 || null, 人數 !== undefined && 人數 !== null ? 人數 : 1,
       公關訂桌 || null,
       Number(公司吸收額) || 0, Number(幹部吸收額) || 0, Number(餐酒) || 0, Number(包廂費) || 0, Number(坐檯費) || 0,
       Number(公關費用) || 0, Number(進出全) || 0, Number(小潔) || 0, Number(服務費) || 0, Number(稅額) || 0,
       Number(業績) || 0, Number(現金) || 0, Number(信用) || 0, Number(簽帳) || 0, Number(其它) || 0, 備註 || null]
    );
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/daily-sales/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      日期, 幹部編號, 幹部, 房號, 客戶編號, 客戶名, 人數,
      公司吸收額, 幹部吸收額, 餐酒, 包廂費, 坐檯費, 公關費用, 公關訂桌,
      進出全, 小潔, 服務費, 稅額, 業績, 現金, 信用, 簽帳, 其它, 備註
    } = req.body;
    await pool.execute(
      'UPDATE daily_sales SET `日期`=?, `幹部編號`=?, `幹部`=?, `房號`=?, `客戶編號`=?, `客戶名`=?, `人數`=?, `公關訂桌`=?, `公司吸收額`=?, `幹部吸收額`=?, `餐酒`=?, `包廂費`=?, `坐檯費`=?, `公關費用`=?, `進出全`=?, `小潔`=?, `服務費`=?, `稅額`=?, `業績`=?, `現金`=?, `信用`=?, `簽帳`=?, `其它`=?, `備註`=? WHERE `營業編號`=?',
      [日期, 幹部編號 || null, 幹部 || null, 房號 || null, 客戶編號 || null, 客戶名 || null, 人數 !== undefined && 人數 !== null ? 人數 : 1,
       公關訂桌 || null,
       Number(公司吸收額) || 0, Number(幹部吸收額) || 0, Number(餐酒) || 0, Number(包廂費) || 0, Number(坐檯費) || 0,
       Number(公關費用) || 0, Number(進出全) || 0, Number(小潔) || 0, Number(服務費) || 0, Number(稅額) || 0,
       Number(業績) || 0, Number(現金) || 0, Number(信用) || 0, Number(簽帳) || 0, Number(其它) || 0, 備註 || null, id]
    );
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/daily-sales/:id', authenticate, async (req, res) => {
  try {
    await pool.execute('DELETE FROM daily_sales WHERE 營業編號 = ?', [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Stats
app.get('/api/stats/months', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT DISTINCT LEFT(`日期`, 7) as month FROM daily_sales ORDER BY month DESC'
    );
    res.json(rows.map(r => r.month));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/stats/table-usage', authenticate, async (req, res) => {
  try {
    const { month, level } = req.query;
    let sql = `SELECT
      cad.\`幹部編號\`,
      cad.\`姓名\` as 幹部,
      cad.\`等級\`,
      COUNT(ds.\`營業編號\`) as 次數,
      SUM(ds.\`業績\`) as 總消費,
      GROUP_CONCAT(DISTINCT ds.\`客戶名\`) as 客戶列表
      FROM daily_sales ds
      LEFT JOIN cadres cad ON ds.\`幹部編號\` = cad.\`幹部編號\`
      WHERE 1=1`;
    const params = [];
    if (month) { sql += ' AND LEFT(ds.\`日期\`, 7) = ?'; params.push(month); }
    if (level && level !== '全部') { sql += ' AND cad.\`等級\` = ?'; params.push(level); }
    sql += ' GROUP BY cad.\`幹部編號\`, cad.\`姓名\`, cad.\`等級\` ORDER BY 總消費 DESC';
    const [rows] = await pool.execute(sql, params);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/stats/cadre-table', authenticate, async (req, res) => {
  try {
    const { month, level } = req.query;
    let sql = `SELECT
      ds.\`公關訂桌\` as 公關,
      COUNT(ds.\`營業編號\`) as 紀錄數,
      SUM(ds.\`業績\`) as 總消費
      FROM daily_sales ds
      LEFT JOIN cadres cad ON ds.\`幹部編號\` = cad.\`幹部編號\`
      WHERE ds.\`公關訂桌\` IS NOT NULL AND ds.\`公關訂桌\` != ''`;
    const params = [];
    if (month) { sql += ' AND LEFT(ds.\`日期\`, 7) = ?'; params.push(month); }
    if (level && level !== '全部') { sql += ' AND cad.\`等級\` = ?'; params.push(level); }
    sql += ' GROUP BY ds.\`公關訂桌\` ORDER BY 總消費 DESC';
    const [rows] = await pool.execute(sql, params);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/stats/summary', authenticate, async (req, res) => {
  try {
    const { start, end } = req.query;
    let sql = 'SELECT SUM(業績) as total, SUM(現金) as cash, SUM(信用) as credit, SUM(簽帳) as sign, SUM(餐酒) as meal, SUM(包廂費) as room FROM daily_sales WHERE 1=1';
    const params = [];
    if (start) { sql += ' AND `日期` >= ?'; params.push(start); }
    if (end) { sql += ' AND `日期` <= ?'; params.push(end); }
    const [rows] = await pool.execute(sql, params);
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Cadre performance report
app.get('/api/stats/cadre-performance', authenticate, async (req, res) => {
  try {
    const { start, end } = req.query;
    let sql = `SELECT 
      cad.\`幹部編號\`, cad.\`姓名\`, cad.\`等級\`, cad.\`聯絡方式\`,
      COUNT(ds.\`營業編號\`) as 接待次數,
      SUM(ds.\`業績\`) as 總業績,
      SUM(ds.\`現金\`) as 現金,
      SUM(ds.\`信用\`) as 信用,
      SUM(ds.\`簽帳\`) as 簽帳,
      SUM(ds.\`餐酒\`) as 餐酒,
      SUM(ds.\`包廂費\`) as 包廂費,
      SUM(ds.\`公司吸收額\`) as 公司吸收額,
      SUM(ds.\`幹部吸收額\`) as 幹部吸收額,
      MAX(ds.\`日期\`) as 最近來客
      FROM daily_sales ds 
      LEFT JOIN cadres cad ON ds.\`幹部編號\` = cad.\`幹部編號\` 
      WHERE 1=1`;
    const params = [];
    if (start) { sql += ' AND ds.\`日期\` >= ?'; params.push(start); }
    if (end) { sql += ' AND ds.\`日期\` <= ?'; params.push(end); }
    sql += ' GROUP BY cad.\`幹部編號\` ORDER BY 總業績 DESC';
    const [rows] = await pool.execute(sql, params);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Daily revenue summary
app.get('/api/stats/daily-summary', authenticate, async (req, res) => {
  try {
    const { start, end } = req.query;
    let sql = `SELECT 
      \`日期\`,
      COUNT(*) as 筆數,
      SUM(業績) as 總業績,
      SUM(現金) as 現金,
      SUM(信用) as 信用,
      SUM(簽帳) as 簽帳,
      SUM(餐酒) as 餐酒,
      SUM(包廂費) as 包廂費
      FROM daily_sales WHERE 1=1`;
    const params = [];
    if (start) { sql += ' AND \`日期\` >= ?'; params.push(start); }
    if (end) { sql += ' AND \`日期\` <= ?'; params.push(end); }
    sql += ' GROUP BY \`日期\` ORDER BY \`日期\` DESC';
    const [rows] = await pool.execute(sql, params);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ==================== USERS ====================
app.get('/api/users', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT `用戶編號`, `帳號`, `角色`, `顯示名稱`, `是否啟用`, `最後登入時間`, `建立時間` FROM users ORDER BY `建立時間` DESC'
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/users', authenticate, async (req, res) => {
  try {
    const { 帳號, username, 密碼, password, 角色, 顯示名稱, displayName, 是否啟用, enabled } = req.body;
    const acct = 帳號 || username;
    const pwd = 密碼 || password;
    const disp = 顯示名稱 || displayName;
    const role = 角色 || '管理員';
    const en = (typeof enabled === 'number') ? enabled : ((typeof enabled === 'string') ? (enabled === '1' || enabled === 'true' ? 1 : 0) : 1);
    const hash = bcrypt.hashSync(pwd, 10);
    const [result] = await pool.execute(
      'INSERT INTO users (`帳號`, `密碼`, `角色`, `顯示名稱`, `是否啟用`) VALUES (?, ?, ?, ?, ?)',
      [acct, hash, role, disp || acct, en]
    );
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/users/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { 帳號, username, 角色, 顯示名稱, displayName, 是否啟用, enabled, 密碼, password, new_password } = req.body;
    const fields = [];
    const params = [];
    if (username || 帳號) { fields.push('`帳號`=?'); params.push(username || 帳號); }
    if (new_password || 密碼) {
      const pwd = new_password || 密碼;
      fields.push('`密碼`=?'); params.push(bcrypt.hashSync(pwd, 10));
    }
    if (role || 角色) { fields.push('`角色`=?'); params.push(role || 角色); }
    if (displayName || 顯示名稱) { fields.push('`顯示名稱`=?'); params.push(displayName || 顯示名稱); }
    if (enabled !== undefined || 是否啟用 !== undefined) {
      const val = enabled !== undefined ? enabled : 是否啟用;
      fields.push('`是否啟用`=?'); params.push(Number(val));
    }
    if (fields.length) {
      fields.push('`最後登入時間`=NOW()');
      params.push(id);
      await pool.execute(`UPDATE users SET ${fields.join(', ')} WHERE \`用戶編號\`=?`, params);
    }
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/users/:id', authenticate, async (req, res) => {
  try {
    if (req.user.id === req.params.id) return res.status(400).json({ error: '無法刪除自己的帳號' });
    await pool.execute('DELETE FROM users WHERE `用戶編號`=?', [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ==================== SETTINGS ====================
app.get('/api/settings', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM system_settings');
    const settings = {};
    rows.forEach(row => { settings[row.設定鍵] = row.設定值; });
    res.json(settings);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/settings', authenticate, async (req, res) => {
  try {
    const { settings } = req.body;
    for (const [key, value] of Object.entries(settings)) {
      await pool.execute(
        'INSERT INTO system_settings (`設定鍵`, `設定值`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `設定值`=?',
        [key, String(value), String(value)]
      );
    }
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ==================== CUSTOMER RELATIONS ====================
app.get('/api/customer-relations', authenticate, async (req, res) => {
  try {
    const { start, end } = req.query;
    // Calculate date range: default to last 60 days if not specified
    const dateFilter = start ? `ds.\`日期\` >= '${start}'` : `ds.\`日期\` >= DATE_SUB(CURDATE(), INTERVAL 60 DAY)`;
    const dateFilterEnd = end ? `AND ds.\`日期\` <= '${end}'` : '';

    // Get cadre summary (only 一線)
    const [cadres] = await pool.execute(`SELECT cad.\`幹部編號\`, cad.\`姓名\`, cad.\`暱稱\`, COUNT(ds.\`營業編號\`) as 來訪次數, SUM(ds.\`人數\`) as 總人數 FROM daily_sales ds LEFT JOIN cadres cad ON ds.\`幹部\` = cad.\`姓名\` WHERE cad.\`等級\` = '一線' AND ${dateFilter} ${dateFilterEnd} GROUP BY cad.\`幹部編號\`, cad.\`姓名\`, cad.\`暱稱\` ORDER BY 來訪次數 DESC`);

    if (cadres.length === 0) {
      return res.json([]);
    }

    const cadreNames = cadres.map(c => c.姓名);
    const placeholders = cadreNames.map(() => '?').join(',');

    // Get all customers (min 3 visits in date range, last visit within 40 days)
    // JOIN customer_contacts to resolve null 客戶名 from 客戶編號
    const [customers] = await pool.execute(
      `SELECT ds.\`幹部\`,
        COALESCE(ds.\`客戶名\`, cc.\`客戶姓名\`) as 客戶名,
        COUNT(*) as 來訪次數, SUM(ds.\`人數\`) as 總人數,
        MAX(ds.\`日期\`) as 最後來訪, MAX(ds.\`公關訂桌\`) as 公關訂桌編號,
        MAX(g.\`姓名\`) as 公關訂桌
       FROM daily_sales ds
       LEFT JOIN customer_contacts cc ON ds.\`客戶編號\` = cc.\`客戶編號\`
       LEFT JOIN gossip g ON ds.\`公關訂桌\` = g.\`公關編號\`
       WHERE ds.\`幹部\` IN (${placeholders})
         AND ${dateFilter} ${dateFilterEnd}
       GROUP BY ds.\`幹部\`, COALESCE(ds.\`客戶名\`, cc.\`客戶姓名\`)
       HAVING COUNT(*) >= 3
         AND MAX(ds.\`日期\`) >= DATE_SUB(CURDATE(), INTERVAL 40 DAY)
       ORDER BY ds.\`幹部\`, 來訪次數 DESC`,
      cadreNames
    );

    // Calculate 來訪次數 from filtered customers (those meeting criteria)
    const cadreVisits = {};
    customers.forEach(c => {
      cadreVisits[c.幹部] = (cadreVisits[c.幹部] || 0) + c.來訪次數;
    });

    // Build result with public relations name priority
    const result = cadres.map(cadre => ({
      幹部編號: cadre.幹部編號,
      幹部: cadre.姓名 || '未知',
      幹部暱稱: cadre.暱稱 || null,
      來訪次數: cadreVisits[cadre.姓名] || 0,
      客戶列表: customers.filter(c => c.幹部 === cadre.姓名).map(c => ({
        ...c,
        公關訂桌: c.公關訂桌 || c.公關訂桌編號 || null
      }))
    }));

    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ==================== INACTIVE CUSTOMERS ====================
app.get('/api/inactive-customers', authenticate, async (req, res) => {
  try {
    // Get cadre list (only 一線)
    const [cadres] = await pool.execute("SELECT `幹部編號`, `姓名`, `暱稱` FROM cadres WHERE `等級` = '一線' ORDER BY `幹部編號`");

    if (cadres.length === 0) {
      return res.json([]);
    }

    const cadreNames = cadres.map(c => c.姓名);
    const placeholders = cadreNames.map(() => '?').join(',');

    // Get inactive customers grouped by cadre
    // Second section: 60+ days since last visit (not 40 days)
    const [rows] = await pool.execute(
      `SELECT ds.\`幹部\`,
        COALESCE(ds.\`客戶名\`, cc.\`客戶姓名\`) as 客戶名,
        COUNT(*) as 來訪次數,
        MAX(ds.\`日期\`) as 最後來訪,
        MAX(ds.\`公關訂桌\`) as 公關訂桌編號,
        MAX(g.\`姓名\`) as 公關訂桌
       FROM daily_sales ds
       LEFT JOIN customer_contacts cc ON ds.\`客戶編號\` = cc.\`客戶編號\`
       LEFT JOIN gossip g ON ds.\`公關訂桌\` = g.\`公關編號\`
       WHERE ds.\`幹部\` IN (${placeholders})
       GROUP BY ds.\`幹部\`, COALESCE(ds.\`客戶名\`, cc.\`客戶姓名\`)
       HAVING MAX(ds.\`日期\`) < DATE_SUB(CURDATE(), INTERVAL 60 DAY)
          OR MAX(ds.\`日期\`) IS NULL
       ORDER BY ds.\`幹部\`, 來訪次數 DESC`,
      cadreNames
    );

    // Group by cadre
    const result = cadres.map(cadre => ({
      幹部編號: cadre.幹部編號,
      幹部: cadre.姓名 || '未知',
      幹部暱稱: cadre.暱稱 || null,
      客戶列表: rows.filter(r => r.幹部 === cadre.姓名).map(r => ({
        客戶名: r.客戶名,
        來訪次數: r.來訪次數,
        最後來訪: r.最後來訪,
        公關訂桌編號: r.公關訂桌編號,
        公關訂桌: r.公關訂桌 || null
      }))
    })).filter(c => c.客戶列表.length > 0);

    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ==================== BROKERS ====================
app.get('/api/brokers', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM brokers ORDER BY 經紀人編號');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/brokers', authenticate, async (req, res) => {
  try {
    const { 經紀人, 手機, 備註, 所屬公司 } = req.body;
    const [result] = await pool.execute(
      'INSERT INTO brokers (`經紀人`, `手機`, `備註`, `所屬公司`) VALUES (?, ?, ?, ?)',
      [經紀人 || null, 手機 || null, 備註 || null, 所屬公司 || null]
    );
    res.json({ 經紀人編號: result.insertId, 經紀人, 手機, 備註, 所屬公司 });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/brokers/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { 經紀人, 手機, 備註, 所屬公司 } = req.body;
    await pool.execute(
      'UPDATE brokers SET `經紀人`=?, `手機`=?, `備註`=?, `所屬公司`=? WHERE `經紀人編號`=?',
      [經紀人 || null, 手機 || null, 備註 || null, 所屬公司 || null, id]
    );
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/brokers/:id', authenticate, async (req, res) => {
  try {
    await pool.execute('DELETE FROM brokers WHERE `經紀人編號` = ?', [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ==================== GOSSIP ====================
app.get('/api/gossip', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM gossip ORDER BY 公關編號');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/gossip', authenticate, async (req, res) => {
  try {
    const { 暱稱, 姓名, 經紀人, 公關費用, 手機, LINE_ID, 生日, 報到日期, 備註 } = req.body;
    const [result] = await pool.execute(
      'INSERT INTO gossip (`暱稱`, `姓名`, `經紀人`, `公關費用`, `手機`, `LINE_ID`, `生日`, `報到日期`, `備註`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [暱稱 || null, 姓名 || null, 經紀人 || null, 公關費用 || null, 手機 || null, LINE_ID || null, 生日 || null, 報到日期 || null, 備註 || null]
    );
    const [rows] = await pool.execute('SELECT * FROM gossip WHERE `公關編號` = ?', [result.insertId]);
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/gossip/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { 暱稱, 姓名, 經紀人, 公關費用, 手機, LINE_ID, 生日, 報到日期, 備註 } = req.body;
    await pool.execute(
      'UPDATE gossip SET `暱稱`=?, `姓名`=?, `經紀人`=?, `公關費用`=?, `手機`=?, `LINE_ID`=?, `生日`=?, `報到日期`=?, `備註`=? WHERE `公關編號`=?',
      [暱稱 || null, 姓名 || null, 經紀人 || null, 公關費用 || null, 手機 || null, LINE_ID || null, 生日 || null, 報到日期 || null, 備註 || null, id]
    );
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/gossip/:id', authenticate, async (req, res) => {
  try {
    await pool.execute('DELETE FROM gossip WHERE `公關編號` = ?', [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 KTV Backend running on port ${PORT}`));
