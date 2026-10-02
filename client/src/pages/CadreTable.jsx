import { useState, useEffect } from 'react';
import { Table, Card, Select, Row, Col, Statistic, Spin, Space, Button, message } from 'antd';
import axios from 'axios';

const API = axios.create({ baseURL: '/api' });
API.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const { Option } = Select;

const LEVELS = ['全部', '一線', '常董', '公關', '管理層', '行政', '場部', '一般'];

export default function CadreTable() {
  const [data, setData] = useState([]);
  const [months, setMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('全部');
  const [loading, setLoading] = useState(false);

  const fetchMonths = async () => {
    try {
      const res = await API.get('/stats/months');
      setMonths(res.data);
      if (res.data.length > 0 && !selectedMonth) {
        setSelectedMonth(res.data[0]);
      }
    } catch (e) { console.error('載入月份失敗', e); }
  };

  const fetchData = async (month, level) => {
    setLoading(true);
    try {
      const params = { month };
      if (level && level !== '全部') params.level = level;
      const res = await API.get('/stats/cadre-table', { params });
      setData(res.data);
    } catch (e) { message.error('載入失敗'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchMonths();
  }, []);

  useEffect(() => {
    if (selectedMonth) {
      fetchData(selectedMonth, selectedLevel);
    }
  }, [selectedMonth, selectedLevel]);

  const totalConsumption = data.reduce((sum, row) => sum + (Number(row.總消費) || 0), 0);
  const totalRecords = data.reduce((sum, r) => sum + (Number(r.紀錄數) || 0), 0);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('請允許彈出視窗以列印');
      return;
    }
    const monthStr = selectedMonth || '全部';
    const levelStr = selectedLevel || '全部';
    // Group rows into blocks of 28 so each block starts with its own header;
    // block padding carries the page edge safety margin (same pattern as TableUsage).
    const ROWS_PER_BLOCK = 28;
    const blocks = [];
    for (let i = 0; i < data.length; i += ROWS_PER_BLOCK) {
      const chunk = data.slice(i, i + ROWS_PER_BLOCK);
      const rows = chunk.map((row, idx) => `
        <tr>
          <td style="text-align:center">${i + idx + 1}</td>
          <td>${row.公關 || '-'}</td>
          <td style="text-align:right">NT$ ${Math.round(row.總消費 || 0).toLocaleString('zh-TW')}</td>
          <td style="text-align:center">${row.紀錄數 || 0}</td>
        </tr>`).join('\n');
      blocks.push(`
      <div class="ct-block">
        <table>
          <thead>
            <tr>
              <th style="width:8%">排名</th>
              <th style="width:32%">公關</th>
              <th style="width:35%">消費金額</th>
              <th style="width:15%">紀錄數</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`);
    }
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>幹桌統計 ${monthStr}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { size: A4; margin: 0; }
    html, body {
      font-family: "Microsoft JhengHei", "PingFang TC", sans-serif;
      background: white;
      color: #000;
      font-size: 12px;
    }
    h1 {
      text-align: center;
      font-size: 18px;
      margin-bottom: 4px;
      border-bottom: 2px solid #000;
      padding: 15mm 12mm 8px;
    }
    .subtitle {
      text-align: center;
      font-size: 11px;
      color: #666;
      padding: 0 12mm;
      margin-bottom: 4mm;
    }
    .ct-block {
      padding: 15mm 12mm 8mm;
      page-break-inside: avoid;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }
    th, td {
      border: 1px solid #000;
      padding: 5px 8px;
      text-align: left;
      overflow-wrap: break-word;
      word-break: break-word;
      font-size: 11px;
    }
    th {
      background: #f0f0f0;
      font-weight: bold;
      text-align: center;
    }
    .footer {
      margin-top: 5mm;
      text-align: center;
      font-size: 10px;
      color: #999;
      border-top: 1px solid #eee;
      padding: 8px 12mm 15mm;
    }
  </style>
</head>
<body>
  <h1>幹桌統計</h1>
  <div class="subtitle">月份：${monthStr} | 等級：${levelStr} | 總消費：NT$ ${totalConsumption.toLocaleString('zh-TW')} | 紀錄數：${totalRecords}</div>
  ${blocks.join('\n')}
  <div class="footer">日月星辰酒店 KTV　|　列印日期：${new Date().toLocaleDateString('zh-TW')}</div>
  <script>
    window.onload = function() { window.print(); window.close(); };
  </script>
</body>
</html>`;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const columns = [
    { title: '排名', dataIndex: 'rank', key: 'rank', width: 70, render: (val) => (
      <span style={{
        fontWeight: 'bold',
        color: val <= 3 ? '#f39c12' : '#fff',
        background: val <= 3 ? 'rgba(243,156,18,0.2)' : 'transparent',
        padding: '2px 8px',
        borderRadius: 4
      }}>{val}</span>
    )},
    { title: '公關', dataIndex: '公關', key: '公關', width: 100, render: (val) => val || '-' },
    { title: '消費金額', dataIndex: '總消費', key: '總消費', width: 120, render: (val) => `NT$ ${Math.round(val || 0).toLocaleString('zh-TW')}` },
    { title: '紀錄數', dataIndex: '紀錄數', key: '紀錄數', width: 80 },
  ];

  const tableData = data.map((row, idx) => ({ ...row, rank: idx + 1 }));

  return (
    <div>
      <Card
        title="幹桌統計"
        extra={
          <Space>
            <Button onClick={handlePrint}>HTML 列印</Button>
            <span style={{ color: '#aaa' }}>選擇月份:</span>
            <Select
              value={selectedMonth}
              onChange={setSelectedMonth}
              style={{ width: 140 }}
              placeholder="選擇月份"
            >
              {months.map(m => <Option key={m} value={m}>{m}</Option>)}
            </Select>
            <span style={{ color: '#aaa', marginLeft: 16 }}>等級:</span>
            <Select
              value={selectedLevel}
              onChange={setSelectedLevel}
              style={{ width: 120 }}
            >
              {LEVELS.map(l => <Option key={l} value={l}>{l}</Option>)}
            </Select>
          </Space>
        }
      >
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col span={8}>
            <Statistic 
              title="總消費金額" 
              value={totalConsumption} 
              prefix="NT$" 
              precision={0}
              valueStyle={{ color: '#f39c12' }}
            />
          </Col>
          <Col span={8}>
            <Statistic 
              title="總紀錄數" 
              value={data.reduce((sum, r) => sum + (r.紀錄數 || 0), 0)} 
              valueStyle={{ color: '#27ae60' }}
            />
          </Col>
          <Col span={8}>
            <Statistic 
              title="統計月份" 
              value={selectedMonth || '全部'} 
              valueStyle={{ color: '#fff' }}
            />
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={tableData}
          rowKey={(record) => record.公關}
          loading={loading}
          pagination={{ pageSize: 50, showSizeChanger: false }}
          scroll={{ x: 600 }}
          size="small"
          className="table-striped"
        />
      </Card>
    </div>
  );
}
