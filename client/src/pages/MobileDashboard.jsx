import { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Typography } from 'antd';
import { DollarOutlined, TeamOutlined, UserOutlined, TrophyOutlined, PhoneOutlined } from '@ant-design/icons';
import api from '../utils/api';

const { Title, Text } = Typography;

const cardStyle = {
  background: 'linear-gradient(135deg, rgba(155, 89, 182, 0.1) 0%, rgba(26, 26, 46, 0.9) 100%)',
  border: '1px solid rgba(155, 89, 182, 0.3)',
  borderRadius: 16,
  marginBottom: 16,
};

const statCardStyle = {
  background: 'rgba(26, 26, 46, 0.8)',
  border: '1px solid #333',
  borderRadius: 12,
  textAlign: 'center',
  padding: '16px 8px',
};

export default function MobileDashboard() {
  const [stats, setStats] = useState({
    totalSales: 0,
    totalCustomers: 0,
    totalCadres: 0,
    totalGossip: 0,
    totalBrokers: 0,
    todaySales: 0,
    todayCustomers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [salesRes, customersRes, cadresRes, gossipRes, brokersRes] = await Promise.all([
        api.get('/daily-sales'),
        api.get('/customers'),
        api.get('/cadres'),
        api.get('/gossip'),
        api.get('/brokers'),
      ]);

      const sales = Array.isArray(salesRes.data) ? salesRes.data : [];
      const customers = Array.isArray(customersRes.data) ? customersRes.data : [];
      const cadres = Array.isArray(cadresRes.data) ? cadresRes.data : [];
      const gossip = Array.isArray(gossipRes.data) ? gossipRes.data : [];
      const brokers = Array.isArray(brokersRes.data) ? brokersRes.data : [];

      const today = new Date().toISOString().split('T')[0];
      const todaySales = sales.filter(s => s.日期 === today);
      const totalSales = sales.reduce((sum, s) => sum + (Number(s.業績) || 0), 0);
      const todayRevenue = todaySales.reduce((sum, s) => sum + (Number(s.業績) || 0), 0);

      setStats({
        totalSales,
        totalCustomers: customers.length,
        totalCadres: cadres.length,
        totalGossip: gossip.length,
        totalBrokers: brokers.length,
        todaySales: todayRevenue,
        todayCustomers: new Set(todaySales.map(s => s.客戶名).filter(Boolean)).size,
      });
    } catch (err) {
      console.error('取得統計資料失敗', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      padding: '20px 16px', 
      background: 'linear-gradient(180deg, #0a0a1a 0%, #1a1a2e 100%)', 
      minHeight: '100vh' 
    }}>
      {/* 標題 */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <Title level={2} style={{ 
          color: '#fff', 
          margin: 0,
          fontSize: 24,
          fontWeight: 'bold'
        }}>
          🌟 日月星辰
        </Title>
        <Text style={{ color: '#9b59b6', fontSize: 14 }}>
          KTV 管理儀表板
        </Text>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
          載入中...
        </div>
      ) : (
        <>
          {/* 今日營業統計 */}
          <Card style={{ ...cardStyle, marginBottom: 20 }}>
            <Title level={5} style={{ color: '#9b59b6', margin: '0 0 16px 0', fontSize: 16 }}>
              📊 今日營業
            </Title>
            <Row gutter={[12, 12]}>
              <Col span={12}>
                <div style={statCardStyle}>
                  <Statistic 
                    title={<span style={{ color: '#888', fontSize: 12 }}>總業績</span>} 
                    value={stats.todaySales.toLocaleString()} 
                    prefix={<DollarOutlined style={{ color: '#9b59b6' }} />}
                    valueStyle={{ color: '#fff', fontSize: 20 }}
                  />
                </div>
              </Col>
              <Col span={12}>
                <div style={statCardStyle}>
                  <Statistic 
                    title={<span style={{ color: '#888', fontSize: 12 }}>客戶數</span>} 
                    value={stats.todayCustomers} 
                    prefix={<UserOutlined style={{ color: '#9b59b6' }} />}
                    valueStyle={{ color: '#fff', fontSize: 20 }}
                  />
                </div>
              </Col>
            </Row>
          </Card>

          {/* 系統總覽 */}
          <Card style={{ ...cardStyle, marginBottom: 20 }}>
            <Title level={5} style={{ color: '#9b59b6', margin: '0 0 16px 0', fontSize: 16 }}>
              📈 系統總覽
            </Title>
            <Row gutter={[12, 12]}>
              <Col span={8}>
                <div style={statCardStyle}>
                  <div style={{ color: '#ffd700', fontSize: 24, fontWeight: 'bold' }}>
                    {stats.totalCustomers}
                  </div>
                  <div style={{ color: '#888', fontSize: 11, marginTop: 4 }}>
                    客戶總數
                  </div>
                </div>
              </Col>
              <Col span={8}>
                <div style={statCardStyle}>
                  <div style={{ color: '#ff6b6b', fontSize: 24, fontWeight: 'bold' }}>
                    {stats.totalCadres}
                  </div>
                  <div style={{ color: '#888', fontSize: 11, marginTop: 4 }}>
                    幹部數
                  </div>
                </div>
              </Col>
              <Col span={8}>
                <div style={statCardStyle}>
                  <div style={{ color: '#4ecdc4', fontSize: 24, fontWeight: 'bold' }}>
                    {stats.totalGossip}
                  </div>
                  <div style={{ color: '#888', fontSize: 11, marginTop: 4 }}>
                    公關數
                  </div>
                </div>
              </Col>
            </Row>
          </Card>

          {/* 經紀人統計 */}
          <Card style={{ ...cardStyle, marginBottom: 20 }}>
            <Title level={5} style={{ color: '#9b59b6', margin: '0 0 16px 0', fontSize: 16 }}>
              👔 經紀人
            </Title>
            <div style={statCardStyle}>
              <div style={{ color: '#9b59b6', fontSize: 32, fontWeight: 'bold' }}>
                {stats.totalBrokers}
              </div>
              <div style={{ color: '#888', fontSize: 12, marginTop: 8 }}>
                位經紀人
              </div>
            </div>
          </Card>

          {/* 歷史總業績 */}
          <Card style={{ ...cardStyle, marginBottom: 20 }}>
            <Title level={5} style={{ color: '#9b59b6', margin: '0 0 16px 0', fontSize: 16 }}>
              💰 歷史總業績
            </Title>
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <div style={{ color: '#ffd700', fontSize: 28, fontWeight: 'bold' }}>
                {stats.totalSales.toLocaleString()}
              </div>
              <div style={{ color: '#888', fontSize: 12, marginTop: 8 }}>
                元
              </div>
            </div>
          </Card>
        </>
      )}

      {/* 快捷連結 */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(3, 1fr)', 
        gap: 12,
        marginTop: 20,
        padding: '0 8px'
      }}>
        {[
          { path: '/mobile/daily-sales', icon: '📊', label: '營業表' },
          { path: '/mobile/cadres', icon: '🏆', label: '幹部' },
          { path: '/mobile/customers', icon: '👥', label: '客戶' },
          { path: '/mobile/relations', icon: '📈', label: '關係' },
          { path: '/mobile/gossip', icon: '👠', label: '公關' },
          { path: '/mobile/broker', icon: '👔', label: '經紀人' },
        ].map(item => (
          <a 
            key={item.path}
            href={item.path}
            style={{
              background: 'rgba(26, 26, 46, 0.8)',
              border: '1px solid #333',
              borderRadius: 12,
              padding: '16px 8px',
              textAlign: 'center',
              textDecoration: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span style={{ fontSize: 24 }}>{item.icon}</span>
            <span style={{ color: '#ccc', fontSize: 12 }}>{item.label}</span>
          </a>
        ))}
      </div>

      {/* 頁腳 */}
      <div style={{ textAlign: 'center', padding: '24px 0 16px', color: '#444', fontSize: 11 }}>
        日月星辰 KTV 管理系統
      </div>
    </div>
  );
}
