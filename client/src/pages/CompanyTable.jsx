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
  const [expandedRows, setExpandedRows] = useState({});
  const [loadingDetails, setLoadingDetails] = useState({});

  const fetchMonths = async () => {
    try {
      const res = await API.get('/stats/months');
      setMonths(res.data);
      setSelectedMonth('全部');
    } catch (e) { console.error('載入月份失敗', e); }
  };

  const fetchData = async (month) => {
    setLoading(true);
    try {
      const params = { month };
      const res = await API.get('/stats/company-table', { params });
      setData(res.data);
      setExpandedRows({});
    } catch (e) { console.error('載入失敗', e); }
    finally { setLoading(false); }
  };

  const fetchDetails = async (customer) => {
    if (expandedRows[customer]) return;
    setLoadingDetails(prev => ({ ...prev, [customer]: true }));
    try {
      const params = { customer };
      if (selectedMonth) params.month = selectedMonth;
      const res = await API.get('/stats/company-table-details', { params });
      setExpandedRows(prev => ({ ...prev, [customer]: res.data }));
    } catch (e) { console.error('載入明細失敗', e); }
    finally { setLoadingDetails(prev => ({ ...prev, [customer]: false })); }
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
    { title: '日期', dataIndex: '日期', key: '日期', width: 110, render: (val) => val || '-' },
    { title: '客戶', dataIndex: '客戶', key: '客戶', width: 150, render: (val) => val || '-' },
    { title: '公司吸收額', dataIndex: '公司吸收額', key: '公司吸收額', width: 120, render: (val) => `NT$ ${Math.round(val || 0).toLocaleString('zh-TW')}` },
    { title: '總消費金額', dataIndex: '總消費', key: '總消費', width: 130, render: (val) => `NT$ ${Math.round(val || 0).toLocaleString('zh-TW')}` },
    { title: '備註', dataIndex: '備註', key: '備註', width: 150, render: (val) => val || '-' },
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
              <Option value="全部">全部</Option>
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
          expandable={{
            expandedRowRender: (record) => {
              const customer = record.客戶;
              const details = expandedRows[customer];
              const isLoading = loadingDetails[customer];
              
              if (isLoading) {
                return (
                  <div style={{ textAlign: 'center', padding: 16 }}>
                    載入中...
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
                { title: '日期', dataIndex: '日期', width: 110, render: (val) => val ? val.split('T')[0] : '-' },
                { title: '房號', dataIndex: '房號', width: 80 },
                { title: '客戶名', dataIndex: '客戶名', width: 100 },
                { title: '消費金額', dataIndex: '總消費', width: 120, render: (val) => `NT$ ${Math.round(val || 0).toLocaleString('zh-TW')}` },
                { title: '備註', dataIndex: '備註', width: 150, render: (val) => val || '-' },
              ];

              return (
                <Table
                  columns={detailColumns}
                  dataSource={details}
                  rowKey={(r, idx) => `${r.日期}-${idx}`}
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
                fetchDetails(record.客戶);
              }
            }
          }}
        />
      </Card>
    </div>
  );
}
