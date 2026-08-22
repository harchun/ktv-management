import { useState, useEffect } from 'react';
import { Table, Card, Select, Row, Col, Statistic, Space } from 'antd';
import axios from 'axios';

const API = axios.create({ baseURL: '/api' });
API.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const { Option } = Select;

export default function CompanyTable() {
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
      const params = { month };
      const res = await API.get('/stats/company-table', { params });
      setData(res.data);
    } catch (e) { console.error('載入失敗', e); }
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

  const totalConsumption = data.reduce((sum, row) => sum + (Number(row.總消費) || 0), 0);
  const totalCompanyAmount = data.reduce((sum, row) => sum + (Number(row.公司吸收額) || 0), 0);

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
    { title: '客戶', dataIndex: '客戶', key: '客戶', width: 150, render: (val) => val || '-' },
    { title: '公司吸收額', dataIndex: '公司吸收額', key: '公司吸收額', width: 120, render: (val) => `NT$ ${Math.round(val || 0).toLocaleString('zh-TW')}` },
    { title: '總消費金額', dataIndex: '總消費', key: '總消費', width: 130, render: (val) => `NT$ ${Math.round(val || 0).toLocaleString('zh-TW')}` },
    { title: '紀錄數', dataIndex: '紀錄數', key: '紀錄數', width: 80 },
  ];

  const tableData = data.map((row, idx) => ({ ...row, rank: idx + 1 }));

  return (
    <div>
      <Card
        title="公司桌統計"
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
              title="公司吸收額總計"
              value={totalCompanyAmount}
              prefix="NT$"
              precision={0}
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
          rowKey={(record) => record.客戶}
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
