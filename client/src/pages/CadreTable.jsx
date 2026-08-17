import { useState, useEffect } from 'react';
import { Table, Card, Select, Row, Col, Statistic } from 'antd';
import axios from 'axios';

const API = axios.create({ baseURL: '/api' });
API.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const { Option } = Select;

export default function CadreTable() {
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
      fetchData(selectedMonth);
    }
  }, [selectedMonth]);

  const totalConsumption = data.reduce((sum, row) => sum + (row.總消費 || 0), 0);

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
    { title: '幹部', dataIndex: '幹部', key: '幹部', width: 100 },
    { title: '客戶名', dataIndex: '客戶名', key: '客戶名', width: 100 },
    { title: '消費金額', dataIndex: '總消費', key: '總消費', width: 120, render: (val) => `NT$ ${Math.round(val || 0).toLocaleString('zh-TW')}` },
  ];

  const tableData = data.map((row, idx) => ({ ...row, rank: idx + 1 }));

  return (
    <div>
      <Card 
        title="幹桌統計" 
        extra={
          <Select 
            value={selectedMonth} 
            onChange={setSelectedMonth}
            style={{ width: 140 }}
            placeholder="選擇月份"
          >
            {months.map(m => <Option key={m} value={m}>{m}</Option>)}
          </Select>
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
              title="紀錄數" 
              value={data.length} 
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
          rowKey={(record, index) => `${record.幹部}-${record.客戶名}-${index}`}
          loading={loading}
          pagination={{ pageSize: 100, showSizeChanger: false }}
          scroll={{ x: 600 }}
          size="small"
          className="table-striped"
        />
      </Card>
    </div>
  );
}
