import { useState, useEffect } from 'react';
import {
  Table, Button, DatePicker, Space, message, Card, Statistic, Row, Col, Typography,
} from 'antd';
import zhTW from 'antd/locale/zh_TW';
import { DownloadOutlined } from '@ant-design/icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../utils/api';
import { formatDate } from '../utils/formatDate';
import dayjs from 'dayjs';

const { Title } = Typography;

const cardStyle = {
  background: 'rgba(26, 26, 46, 0.8)',
  border: '1px solid #333',
  borderRadius: 12,
};

const COLORS = ['#f39c12', '#e74c3c', '#3498db', '#2ecc71', '#9b59b6', '#f1c40f'];

export default function Revenue() {
  const [monthlyData, setMonthlyData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(dayjs());
  const [summary, setSummary] = useState(null);

  const fetchMonthly = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedMonth) {
        params.year = selectedMonth.year();
        params.month = selectedMonth.month() + 1;
      }
      const res = await api.get('/reports/monthly', { params });
      const data = Array.isArray(res.data) ? res.data : [];
      setMonthlyData(data);

      // Summary
      const totalRevenue = data.reduce((s, d) => s + Number(d['總業績'] || 0), 0);
      const totalCost = data.reduce((s, d) => s + Number(d['總支出'] || 0), 0);
      setSummary({ totalRevenue, totalCost, profit: totalRevenue - totalCost, records: data.length });
    } catch (err) {
      message.error('取得營業報表失敗');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonthly();
  }, [selectedMonth]);

  const handleExport = () => {
    const headers = ['月份', '營收', '成本', '利潤', '訂桌數'];
    const rows = monthlyData.map((d) => [
      d.month || '',
      d.revenue || 0,
      d.cost || 0,
      d.profit || 0,
      d.bookings || 0,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `營業報表_${selectedMonth.format('YYYYMM')}.csv`;
    link.click();
    message.success('匯出成功');
  };

  const pieData = monthlyData.slice(0, 6).map((d) => ({
    name: d.month || '未分類',
    value: d.revenue || 0,
  }));

  const barData = monthlyData.map((d) => ({
    month: d.month || '',
    revenue: d.revenue || 0,
    cost: d.cost || 0,
    profit: d.profit || 0,
  }));

  const columns = [
    {
      title: '月份',
      dataIndex: '年月',
      key: '年月',
      width: 100,
      render: formatDate,
    },
    {
      title: '營收',
      dataIndex: '總業績',
      key: '總業績',
      width: 120,
      render: (v) => v ? `NT$ ${Number(v).toLocaleString()}` : '-',
    },
    {
      title: '成本',
      dataIndex: '總支出',
      key: '總支出',
      width: 120,
      render: (v) => v ? `NT$ ${Number(v).toLocaleString()}` : '-',
    },
    {
      title: '利潤',
      dataIndex: '淨利',
      key: '淨利',
      width: 120,
      render: (v) => v ? `NT$ ${Number(v).toLocaleString()}` : '-',
    },
    {
      title: '訂桌數',
      dataIndex: 'bookings',
      key: 'bookings',
      width: 100,
    },
    {
      title: '成長率',
      dataIndex: '備註',
      key: '備註',
      width: 100,
      render: () => '-',
    },
  ];

  return (
    <div>
      <Title level={3} style={{ color: '#f39c12', marginBottom: 24 }}>
        📊 營業報表
      </Title>

      {/* Summary */}
      {summary && (
        <div className="stat-grid" style={{ marginBottom: 24 }}>
          <Card style={{ ...cardStyle, borderColor: '#f39c12' }}>
            <Statistic
              title={<span style={{ color: '#aaa', fontSize: 12 }}>總營收</span>}
              value={summary.totalRevenue}
              valueStyle={{ color: '#f39c12', fontSize: 22 }}
              precision={0}
              prefix="NT$"
            />
          </Card>
          <Card style={{ ...cardStyle, borderColor: '#e74c3c' }}>
            <Statistic
              title={<span style={{ color: '#aaa', fontSize: 12 }}>總成本</span>}
              value={summary.totalCost}
              valueStyle={{ color: '#e74c3c', fontSize: 22 }}
              precision={0}
              prefix="NT$"
            />
          </Card>
          <Card style={{ ...cardStyle, borderColor: '#2ecc71' }}>
            <Statistic
              title={<span style={{ color: '#aaa', fontSize: 12 }}>總利潤</span>}
              value={summary.profit}
              valueStyle={{ color: '#2ecc71', fontSize: 22 }}
              precision={0}
              prefix="NT$"
            />
          </Card>
        </div>
      )}

      {/* Controls */}
      <Card style={cardStyle} bodyStyle={{ padding: 20, marginBottom: 24 }}>
        <Space style={{ marginBottom: 20 }}>
          <DatePicker
            picker="month"
            value={selectedMonth}
            onChange={setSelectedMonth}
            format="YYYY/MM"
            locale={zhTW}
          />
          <Button icon={<DownloadOutlined />} onClick={handleExport}>
            匯出報表
          </Button>
        </Space>

        {/* Bar Chart */}
        <div className="chart-container"><ResponsiveContainer width="100%" height={300}>
          <BarChart data={barData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="month" stroke="#888" />
            <YAxis stroke="#888" />
            <Tooltip
              contentStyle={{ background: '#1a1a2e', border: '1px solid #333', borderRadius: 8 }}
            />
            <Bar dataKey="revenue" fill="#f39c12" name="營收" radius={[4, 4, 0, 0]} />
            <Bar dataKey="cost" fill="#e74c3c" name="成本" radius={[4, 4, 0, 0]} />
            <Bar dataKey="profit" fill="#2ecc71" name="利潤" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        </div>
      </Card>

      {/* Table + Pie */}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 300px", minWidth: 0 }}>
          <Card style={cardStyle} bodyStyle={{ padding: 0 }}>
            <div style={{ padding: 20 }}>
              <div className="table-responsive"><Table
                dataSource={monthlyData}
                columns={columns}
                rowKey={(r) => r.id || r.month}
                loading={loading}
                pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 筆` }}
                scroll={{ y: 300 }}
              /></div>
            </div>
          </Card>
        </div>
        <div style={{ flex: "0 0 300px", minWidth: 280 }}>
          <Card style={cardStyle} bodyStyle={{ padding: 16 }} title={<span style={{ color: '#f39c12' }}>營收分布</span>}>
            <div className="chart-container"><ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid #333', borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
