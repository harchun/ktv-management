import { useState, useEffect } from 'react';
import { Table, Card, Select, Space, Row, Col, Statistic } from 'antd';
import axios from 'axios';

const API = axios.create({ baseURL: '/api' });
API.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const { Option } = Select;

export default function TableUsage() {
  const [data, setData] = useState([]);
  const [months, setMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('');
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

  const fetchData = async (month) => {
    setLoading(true);
    try {
      const params = month ? { month } : {};
      const res = await API.get('/stats/table-usage', { params });
      setData(res.data);
    } catch (e) { message.error('載入失敗'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchMonths();
  }, []);

  useEffect(() => {
    if (selectedMonth) {
      fetchData(selectedMonth);
    }
  }, [selectedMonth]);

  const totalConsumption = data.reduce((sum, row) => sum + (row.總消費 || 0), 0);
  const totalVisits = data.reduce((sum, row) => sum + (row.次數 || 0), 0);
  const uniqueCustomers = new Set(data.map(r => r.客戶名).filter(Boolean)).size;

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
    { title: '等級', dataIndex: '等級', key: '等級', width: 80 },
    { title: '公關', dataIndex: '公關', key: '公關', width: 80, render: (val) => val || '-' },
    { title: '客戶名', dataIndex: '客戶名', key: '客戶名', width: 100, render: (val) => val || '-' },
    { title: '消費金額', dataIndex: '總消費', key: '總消費', width: 120, render: (val) => `NT$ ${val?.toLocaleString('zh-TW', {minimumFractionDigits: 0, maximumFractionDigits: 0})}` },
    { title: '次數', dataIndex: '次數', key: '次數', width: 80 },
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
              {months.map(m => (
                <Option key={m} value={m}>{m}</Option>
              ))}
            </Select>
            <span style={{ color: '#aaa', marginLeft: 16 }}>等級: 公關</span>
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
              title="獨到客戶數" 
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
          loading={loading} 
          rowKey={(record) => `${record.幹部}-${record.客戶名}`}
          pagination={{ pageSize: 50, showSizeChanger: false }}
          scroll={{ x: 800 }}
          size="small"
          className="table-striped"
        />
      </Card>
    </div>
  );
}
