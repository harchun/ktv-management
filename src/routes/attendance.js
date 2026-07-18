// ==================== ATTENDANCE (出勤管理) ====================
app.get('/attendance', authenticate, async (req, res) => {
  try {
    const { start, end, host } = req.query;
    let sql = 'SELECT * FROM attendance WHERE 1=1';
    const params = [];
    if (start) { sql += ' AND 日期 >= ?'; params.push(start); }
    if (end) { sql += ' AND 日期 <= ?'; params.push(end); }
    if (host) { sql += ' AND 公關編號 = ?'; params.push(host); }
    sql += ' ORDER BY 日期 DESC, 簽到時間 DESC';
    const [rows] = await pool.execute(sql, params);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/attendance', authenticate, async (req, res) => {
  try {
    const { 公關編號, 日期, 上班時段, 簽到時間, 簽退時間, 備註 } = req.body;
    await pool.execute(
      'INSERT INTO attendance (公關編號, 日期, 上班時段, 簽到時間, 簽退時間, 狀態, 備註) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [公關編號, 日期, 上班時段 || '晚場', 簽到時間 || null, 簽退時間 || null, 狀態 || '正常', 備註 || null]
    );
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/attendance/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { 公關編號, 日期, 上班時段, 簽到時間, 簽退時間, 工作小時數, 狀態, 請假事由, 備註 } = req.body;
    await pool.execute(
      'UPDATE attendance SET 公關編號=?, 日期=?, 上班時段=?, 簽到時間=?, 簽退時間=?, 工作小時數=?, 狀態=?, 請假事由=?, 備註=? WHERE 出勤編號=?',
      [公關編號, 日期, 上班時段 || '晚場', 簽到時間 || null, 簽退時間 || null, 工作小時數 || null, 狀態 || '正常', 請假事由 || null, 備註 || null, id]
    );
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/attendance/:id', authenticate, async (req, res) => {
  try {
    await pool.execute('DELETE FROM attendance WHERE 出勤編號 = ?', [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

