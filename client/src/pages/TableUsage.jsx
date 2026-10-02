import { useState, useEffect } from 'react';
import { Table, Card, Select, Space, Row, Col, Statistic, Spin, Button } from 'antd';
import { PrinterOutlined } from '@ant-design/icons';
import axios from 'axios';

const API = axios.create({ baseURL: '/api' });
API.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const { Option } = Select;

const LEVELS = ['全部', '一線', '常董', '公關', '管理層', '行政', '場部', '一般'];

export default function TableUsage() {
  const [data, setData] = useState([]);
  const [months, setMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('全部');
  const [loading, setLoading] = useState(false);
  const [expandedRows, setExpandedRows] = useState({});
  const [loadingDetails, setLoadingDetails] = useState({});

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
      const res = await API.get('/stats/table-usage', { params });
      setData(res.data);
      setExpandedRows({});
    } catch (e) { message.error('載入失敗'); }
    finally { setLoading(false); }
  };

  const fetchDetails = async (cadre) => {
    if (expandedRows[cadre]) return;
    setLoadingDetails(prev => ({ ...prev, [cadre]: true }));
    try {
      const params = { cadre };
      if (selectedMonth) params.month = selectedMonth;
      const res = await API.get('/stats/table-usage-details', { params });
      setExpandedRows(prev => ({ ...prev, [cadre]: res.data }));
    } catch (e) { message.error('載入明細失敗'); }
    finally { setLoadingDetails(prev => ({ ...prev, [cadre]: false })); }
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
  const totalVisits = data.reduce((sum, row) => sum + (Number(row.次數) || 0), 0);
  const uniqueCustomers = new Set(data.map(r => r.客戶列表?.split(', ')).flat().filter(Boolean)).size;

  const handlePrint = async () => {
    // Fetch details for every cadre (parallel) so the print includes 明細
    const detailsMap = {};
    await Promise.all(data.map(async (row) => {
      try {
        const params = { cadre: row.幹部 };
        if (selectedMonth) params.month = selectedMonth;
        const res = await API.get('/stats/table-usage-details', { params });
        detailsMap[row.幹部] = res.data || [];
      } catch (e) {
        detailsMap[row.幹部] = [];
      }
    }));

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('請允許彈出視窗以列印');
      return;
    }

    const monthStr = selectedMonth || '全部';
    const levelStr = selectedLevel || '全部';
    const bodySections = data.map((row, idx) => {
      const details = detailsMap[row.幹部] || [];
      const detailRows = details.map(d => `
        <tr>
          <td>${d.日期 ? String(d.日期).slice(0, 10) : '-'}</td>
          <td>${d.客戶名 || '-'}</td>
          <td style="text-align:right">NT$ ${Math.round(d.總消費 || 0).toLocaleString('zh-TW')}</td>
        </tr>`).join('\n');
      const detailTable = details.length > 0 ? `
      <table class="detail-table">
        <thead>
          <tr>
            <th style="width:20%">日期</th>
            <th style="width:40%">客戶名</th>
            <th style="width:40%">消費金額</th>
          </tr>
        </thead>
        <tbody>${detailRows}</tbody>
      </table>` : '';
      return `
      <div class="cadre-block">
        <div class="cadre-summary">
          <table>
            <thead>
              <tr>
                <th style="width:8%">排名</th>
                <th style="width:14%">幹部</th>
                <th style="width:38%">客戶列表</th>
                <th style="width:24%">消費金額</th>
                <th style="width:16%">桌數</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="text-align:center">${idx + 1}</td>
                <td>${row.幹部 || '-'}</td>
                <td>${row.客戶列表 || '-'}</td>
                <td style="text-align:right">NT$ ${Math.round(row.總消費 || 0).toLocaleString('zh-TW')}</td>
                <td style="text-align:center">${row.次數 || 0}</td>
              </tr>
            </tbody>
          </table>
        </div>
        ${details.length > 0 ? `<div class="detail-label">明細（${details.length} 筆）</div>` : ''}
        ${detailTable}
      </div>`;
    }).join('\n');

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>自訂桌統計 ${monthStr}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { size: A4; margin: 15mm 12mm; }
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
      padding-bottom: 8px;
    }
    .subtitle {
      text-align: center;
      font-size: 11px;
      color: #666;
      margin-bottom: 12px;
    }
    .cadre-block {
      margin: 10mm 0;
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
    .detail-table {
      margin-top: 4px;
      font-size: 11px;
    }
    .detail-table thead {
      display: table-header-group;
    }
    .detail-table tr {
      page-break-inside: avoid;
    }
    .detail-table th, .detail-table td {
      border: 1px solid #ccc;
      padding: 3px 8px;
      font-size: 10px;
    }
    .detail-table th {
      background: #f5f5f5;
      font-size: 10px;
    }
    .detail-label {
      font-size: 11px;
      font-weight: bold;
      color: #333;
      margin: 6px 0 2px;
      page-break-after: avoid;
    }
    .footer {
      margin-top: 15px;
      text-align: center;
      font-size: 10px;
      color: #999;
      border-top: 1px solid #eee;
      padding-top: 8px;
    }
  </style>
</head>
<body>
  <h1>自訂桌統計</h1>
  <div class="subtitle">月份：${monthStr} | 等級：${levelStr} | 總消費：NT$ ${totalConsumption.toLocaleString('zh-TW')} | 桌數：${totalVisits} | 客戶數：${uniqueCustomers}</div>
  ${bodySections}
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
    { title: '排名', dataIndex: 'rank', key: 'rank', width: 60, render: (val) => (
      <span style={{
        fontWeight: 'bold',
        color: val <= 3 ? '#f39c12' : '#fff',
        background: val <= 3 ? 'rgba(243,156,18,0.2)' : 'transparent',
        padding: '2px 8px',
        borderRadius: 4
      }}>{val}</span>
    )},
    { title: '幹部', dataIndex: '幹部', key: '幹部', width: 100 },
    { title: '客戶列表', dataIndex: '客戶列表', key: '客戶列表', width: 150, render: (val) => val || '-' },
    { title: '消費金額', dataIndex: '總消費', key: '總消費', width: 120, render: (val) => `NT$ ${Math.round(val || 0).toLocaleString('zh-TW')}` },
    { title: '桌數', dataIndex: '次數', key: '次數', width: 70 },
  ];

  const tableData = data.map((row, idx) => ({ ...row, rank: idx + 1 }));

  return (
    <div>
      <Card 
        title="自訂桌統計" 
        extra={
          <Space>
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
            <Button icon={<PrinterOutlined />} onClick={handlePrint} style={{ background: '#e74c3c', borderColor: '#e74c3c', color: '#fff', marginLeft: 8 }}>
              列印
            </Button>
          </Space>
        }
      >
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Statistic 
              title="總消費金額" 
              value={totalConsumption} 
              prefix="NT$" 
              precision={0}
              valueStyle={{ color: '#f39c12' }}
            />
          </Col>
          <Col span={6}>
            <Statistic 
              title="總來訪次數" 
              value={totalVisits} 
              valueStyle={{ color: '#27ae60' }}
            />
          </Col>
          <Col span={6}>
            <Statistic 
              title="客戶數" 
              value={uniqueCustomers} 
              valueStyle={{ color: '#3498db' }}
            />
          </Col>
          <Col span={6}>
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
          rowKey={(record) => record.幹部}
          loading={loading}
          pagination={{ pageSize: 50, showSizeChanger: false }}
          scroll={{ x: 900 }}
          size="small"
          className="table-striped"
          expandable={{
            expandedRowRender: (record) => {
              const cadre = record.幹部;
              const details = expandedRows[cadre];
              const isLoading = loadingDetails[cadre];
              
              if (isLoading) {
                return (
                  <div style={{ textAlign: 'center', padding: 16 }}>
                    <Spin />
                  </div>
                );
              }
              
              if (!details || details.length === 0) {
                return (
                  <div style={{ color: '#888', padding: 16, textAlign: 'center' }}>
                    暫無明細資料
                  </div>
                );
              }

              const detailColumns = [
                { title: '日期', dataIndex: '日期', width: 110, render: (val) => val ? new Date(val).toISOString().slice(0, 10) : '-' },
                { title: '客戶名', dataIndex: '客戶名', width: 100 },
                { title: '消費金額', dataIndex: '總消費', width: 100, render: (val) => `NT$ ${Math.round(val || 0).toLocaleString('zh-TW')}` },
              ];

              return (
                <Table
                  columns={detailColumns}
                  dataSource={details}
                  rowKey={(r) => r.營業編號}
                  pagination={false}
                  size="small"
                  bordered
                  className="detail-table"
                />
              );
            },
            rowExpandable: (record) => true,
            onExpand: (expanded, record) => {
              if (expanded) {
                fetchDetails(record.幹部);
              }
            }
          }}
        />
      </Card>
    </div>
  );
}
