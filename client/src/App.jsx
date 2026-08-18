import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, message, Avatar, Button } from 'antd';
import {
  DashboardOutlined, TrophyOutlined, ContactsOutlined,
  UserOutlined, LogoutOutlined, MenuFoldOutlined,
  MenuUnfoldOutlined, SettingOutlined, FileTextOutlined,
} from '@ant-design/icons';
import Login from './pages/Login';
import DailySales from './pages/DailySales';
import Cadres from './pages/Cadres';
import Customers from './pages/Customers';
import CustomerRelations from './pages/CustomerRelations';
import GossipManagement from './pages/GossipManagement';
import BrokerManagement from './pages/BrokerManagement';
import Settings from './pages/Settings';
import TableUsage from './pages/TableUsage';
import CadreTable from './pages/CadreTable';
import TableAnalysis from './pages/TableAnalysis';
import MobileDailySales from './pages/MobileDailySales';
import MobileCadres from './pages/MobileCadres';
import MobileCustomers from './pages/MobileCustomers';
import MobileRelations from './pages/MobileRelations';
import MobileGossip from './pages/MobileGossip';
import MobileBroker from './pages/MobileBroker';
import MobileDashboard from './pages/MobileDashboard';

const { Header, Sider, Content } = Layout;

function AppContent() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [collapsed, setCollapsed] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Determine mobile mode based on URL path
  const isMobile = location.pathname.startsWith('/mobile');

  useEffect(() => {
    if (token) {
      try {
        const decoded = JSON.parse(atob(token.split('.')[1]));
        setUser(decoded);
      } catch (e) {
        localStorage.removeItem('token');
        setToken(null);
        navigate('/login');
      }
    }
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    navigate('/login');
    message.success('已登出');
  };

  const userMenu = {
    items: [{ key: 'logout', icon: <LogoutOutlined />, label: '登出', onClick: handleLogout }],
  };

  const menuItems = [
    { key: isMobile ? '/mobile/daily-sales' : '/daily-sales', icon: <FileTextOutlined />, label: '每日營業表' },
    { key: isMobile ? '/mobile/cadres' : '/cadres', icon: <TrophyOutlined />, label: '幹部管理' },
    { key: isMobile ? '/mobile/customers' : '/customers', icon: <ContactsOutlined />, label: '客戶管理' },
    { key: isMobile ? '/mobile/relations' : '/customer-relations', icon: <ContactsOutlined />, label: '客戶關係' },
    { key: isMobile ? '/mobile/table-usage' : '/table-usage', icon: <TrophyOutlined />, label: '自訂桌統計' },
    { key: isMobile ? '/mobile/cadre-table' : '/cadre-table', icon: <TrophyOutlined />, label: '幹桌統計' },
    { key: '/table-analysis', icon: <TrophyOutlined />, label: '訂桌分析' },
    { key: isMobile ? '/mobile/gossip' : '/gossip-management', icon: <UserOutlined />, label: '公關管理' },
    { key: isMobile ? '/mobile/broker' : '/broker-management', icon: <UserOutlined />, label: '經紀人管理' },
    { key: '/settings', icon: <SettingOutlined />, label: '系統設定' },
  ];

  if (!token) {
    return <Login onLogin={(t) => { setToken(t); localStorage.setItem('token', t); }} />;
  }

  const siderWidth = isMobile ? 200 : (collapsed ? 80 : 200);
  const siderStyle = {
    background: '#0c0c1d',
    overflow: 'auto',
    height: '100vh',
    position: 'fixed',
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 1001,
    ...(isMobile && collapsed ? { transform: 'translateX(-100%)' } : {}),
  };

  const contentMargin = 0;

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="dark"
        style={{
          ...siderStyle,
          width: siderWidth,
        }}
        width={200}
      >
        <div style={{ padding: '16px 12px', textAlign: 'center', borderBottom: '1px solid #333' }}>
          <h1 style={{
            margin: 0,
            fontSize: collapsed ? 12 : (isMobile ? 14 : 18),
            background: 'linear-gradient(90deg, #f39c12, #e74c3c)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 'bold',
          }}>
            {collapsed ? 'MC' : '日月星辰'}
          </h1>
        </div>
        <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={({ key }) => { navigate(key); if (isMobile) setCollapsed(true); }}
        inlineCollapsed={collapsed && !isMobile}
        style={{ touchAction: 'manipulation' }}
        />
      </Sider>

      {/* Overlay when sidebar open on mobile */}
      {isMobile && !collapsed && (
        <div
          onClick={() => setCollapsed(true)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 1000,
          }}
        />
      )}

      <Layout style={{ marginLeft: contentMargin }}>
        <Header style={{
          padding: '0 12px',
          background: '#0c0c1d',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #333',
          height: 48,
          lineHeight: '48px',
          ...(isMobile ? { paddingLeft: collapsed ? 12 : 56 } : {}),
        }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ color: '#fff', fontSize: 16, padding: '0 4px' }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#f39c12', width: 28, height: 28, fontSize: 12 }} />
            <span className="hide-mobile" style={{ fontSize: isMobile ? 13 : undefined }}>{user?.username || '管理員'}</span>
          </div>
        </Header>
        <Content style={{
          margin: isMobile ? 8 : 16,
          padding: isMobile ? 8 : 16,
          background: '#1a1a2e',
          minHeight: 280,
          borderRadius: 8,
        }}>
          <Routes>
            {/* Mobile routes first */}
            <Route path="/mobile" element={<MobileDashboard />} />
            <Route path="/mobile/daily-sales" element={<MobileDailySales />} />
            <Route path="/mobile/cadres" element={<MobileCadres />} />
            <Route path="/mobile/customers" element={<MobileCustomers />} />
            <Route path="/mobile/relations" element={<MobileCustomers />} />
            <Route path="/mobile/table-usage" element={<TableUsage />} />
            <Route path="/mobile/cadre-table" element={<CadreTable />} />
            <Route path="/mobile/gossip" element={<MobileGossip />} />
            <Route path="/mobile/broker" element={<MobileBroker />} />
            {/* Desktop routes */}
            <Route path="/daily-sales" element={<DailySales />} />
            <Route path="/cadres" element={<Cadres />} />
            <Route path="/customer-relations" element={<MobileCustomers />} />
            <Route path="/table-usage" element={<TableUsage />} />
            <Route path="/cadre-table" element={<CadreTable />} />
            <Route path="/table-analysis" element={<TableAnalysis />} />
            <Route path="/gossip-management" element={<GossipManagement />} />
            <Route path="/broker-management" element={<BrokerManagement />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="*" element={<Navigate to="/daily-sales" replace />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
}

export default function App() {
  return <BrowserRouter><AppContent /></BrowserRouter>;
}
