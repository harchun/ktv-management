import { Card, Row, Col, Statistic, Table, Tag, Space, Typography, Spin } from 'antd';
import {
  UserOutlined, DollarOutlined, CalendarOutlined, TrophyOutlined,
  RiseOutlined, TeamOutlined,
} from '@ant-design/icons';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../utils/api';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';

const { Title } = Typography;

// Dark neon card style
const cardStyle = {
  background: 'rgba(26, 26, 46, 0.8)',
  border: '1px solid #333',
  borderRadius: 12,
  boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
};

const statCardStyle = {
  background: 'linear-gradient(135deg, rgba(26,26,46,0.9), rgba(22,33,62,0.9))',
  border: '1px solid #333',
  borderRadius: 12,
  boxShadow: '0 4px 20px rgba(243,156,18,0.1)',
};

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch dashboard data from multiple endpoints
      const [hostsRes, bookingsRes, performanceRes] = await Promise.all([
        api.get('/hosts').catch(() => ({ data: [] })),
        api.get('/bookings').catch(() => ({ data: [] })),
        api.get('/performance/daily').catch(() => ({ data: [] })),
      ]);

      const hosts = hostsRes.data || [];
      const bookings = bookingsRes.data || [];
      const perfData = performanceRes.data || [];

      setStats({
        totalHosts: hosts.length,
        activeHosts: hosts.filter((h) => h.狀態 !== '離職' && h.狀態 !== '停業').length,
        totalBookings: bookings.length,
        todayBookings: bookings.filter((b) => b.日期 === dayjs().format('YYYY-MM-DD')).length,
        monthlyRevenue: perfData.reduce((sum, p) => sum + (Number(p.檯費營收) || 0), 0),
        avgRevenue: perfData.length > 0 ? perfData.reduce((sum, p) => sum + (Number(p.檯費營收) || 0), 0) / perfData.length : 0,
      });

      // Prepare chart data (last 7 days)
      const last7 = [];
      for (let i = 6; i >= 0; i--) {
        const d = dayjs().subtract(i, 'day');
        const dayPerf = perfData.find((p) => p.日期?.startsWith(d.format('YYYY-MM-DD')));
        last7.push({
          date: d.format('MM/DD'),
          revenue: dayPerf ? Number(dayPerf.檯費營收) || 0 : 0,
          bookings: bookings.filter((b) => b.日期 === d.format('YYYY-MM-DD')).length,
        });
      }
      setChartData(last7);

      // Recent activity (latest bookings)
      setRecentActivity(bookings.slice(-5).reverse());
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const activityColumns = [
    {
      title: '時間',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (v) => v ? dayjs(v).format('MM/DD HH:mm') : '-',
      width: 140,
    },
    {
      title: '客戶',
      dataIndex: 'customer_name',
      key: 'customer_name',
      width: 120,
    },
    {
      title: '房型',
      dataIndex: 'room_type',
      key: 'room_type',
      width: 100,
    },
    {
      title: '人數',
      dataIndex: 'guest_count',
      key: 'guest_count',
      width: 80,
    },
    {
      title: '狀態',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        const map = { confirmed: ['成功', 'green'], pending: ['待確認', 'orange'], cancelled: ['已取消', 'red'], completed: ['已完成', 'blue'] };
        const [label, color] = map[status] || ['未知', 'default'];
        return <Tag color={color}>{label}</Tag>;
      },
    },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <Spin size="large" tip="載入中..." />
      </div>
    );
  }

  return (
    <div>
      <Title level={3} style={{ color: '#f39c12', marginBottom: 24 }}>
        📊 儀表板總覽
      </Title>

      {/* Stat Cards */}
      <div className="stat-grid" style={{ marginBottom: 24 }}>
        <Card style={statCardStyle} bodyStyle={{ padding: '16px 12px' }}>
          <Statistic
            title={<span style={{ color: '#aaa', fontSize: 12 }}>公關總數</span>}
            value={stats?.totalHosts || 0}
            prefix={<UserOutlined style={{ color: '#f39c12', fontSize: 16 }} />}
            valueStyle={{ color: '#f39c12', fontSize: 22 }}
          />
        </Card>
        <Card style={statCardStyle} bodyStyle={{ padding: '16px 12px' }}>
          <Statistic
            title={<span style={{ color: '#aaa', fontSize: 12 }}>在職公關</span>}
            value={stats?.activeHosts || 0}
            prefix={<TeamOutlined style={{ color: '#2ecc71', fontSize: 16 }} />}
            valueStyle={{ color: '#2ecc71', fontSize: 22 }}
          />
        </Card>
        <Card style={statCardStyle} bodyStyle={{ padding: '16px 12px' }}>
          <Statistic
            title={<span style={{ color: '#aaa', fontSize: 12 }}>訂桌總數</span>}
            value={stats?.totalBookings || 0}
            prefix={<CalendarOutlined style={{ color: '#3498db', fontSize: 16 }} />}
            valueStyle={{ color: '#3498db', fontSize: 22 }}
          />
        </Card>
        <Card style={statCardStyle} bodyStyle={{ padding: '16px 12px' }}>
          <Statistic
            title={<span style={{ color: '#aaa', fontSize: 12 }}>今日訂桌</span>}
            value={stats?.todayBookings || 0}
            prefix={<CalendarOutlined style={{ color: '#e74c3c', fontSize: 16 }} />}
            valueStyle={{ color: '#e74c3c', fontSize: 22 }}
          />
        </Card>
        <Card style={statCardStyle} bodyStyle={{ padding: '16px 12px' }}>
          <Statistic
            title={<span style={{ color: '#aaa', fontSize: 12 }}>本月營收</span>}
            value={stats?.monthlyRevenue || 0}
            prefix={<DollarOutlined style={{ color: '#f1c40f', fontSize: 16 }} />}
            valueStyle={{ color: '#f1c40f', fontSize: 22 }}
            precision={0}
            suffix={'$'}
          />
        </Card>
        <Card style={statCardStyle} bodyStyle={{ padding: '16px 12px' }}>
          <Statistic
            title={<span style={{ color: '#aaa', fontSize: 12 }}>平均營收</span>}
            value={stats?.avgRevenue || 0}
            prefix={<RiseOutlined style={{ color: '#9b59b6', fontSize: 16 }} />}
            valueStyle={{ color: '#9b59b6', fontSize: 22 }}
            precision={0}
            suffix={'$'}
          />
        </Card>
      </div>

      {/* Chart */}
      <Card style={cardStyle} bodyStyle={{ padding: 16 }} title={<span style={{ color: '#f39c12', fontSize: 16 }}>📈 近7日營收趨勢</span>}>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="date" stroke="#888" />
            <YAxis stroke="#888" />
            <Tooltip
              contentStyle={{ background: '#1a1a2e', border: '1px solid #333', borderRadius: 8 }}
              labelStyle={{ color: '#f39c12' }}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#f39c12"
              fill="url(#colorRevenue)"
              strokeWidth={2}
            />
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f39c12" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f39c12" stopOpacity={0} />
              </linearGradient>
            </defs>
          </AreaChart>
        </ResponsiveContainer>
        </div>
      </Card>

      {/* Recent Activity */}
      <Card
        style={{ ...cardStyle, marginTop: 24 }}
        bodyStyle={{ padding: 20 }}
        title={<span style={{ color: '#f39c12', fontSize: 16 }}>🕐 最近活動</span>}
      >
        <div className="table-responsive">
        <Table
          dataSource={recentActivity}
          columns={activityColumns}
          rowKey={(r) => r.id}
          pagination={false}
          size="small"
          locale={{ emptyText: '暫無活動紀錄' }}
          rowClassName={() => 'row-hover'}
          style={{
            '--row-hover-bg': 'rgba(243,156,18,0.05)',
          }}
        />
        </div>
      </Card>
    </div>
  );
}
