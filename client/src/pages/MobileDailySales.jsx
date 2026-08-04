import { useState, useEffect } from 'react';
import { Card, Row, Col, Tag, Typography, Space } from 'antd';
import { UserOutlined, PhoneOutlined, EnvironmentOutlined, CalendarOutlined } from '@ant-design/icons';
import api from '../utils/api';
import { formatDate } from '../utils/formatDate';

const { Title, Text } = Typography;

const cardStyle = {
  background: 'rgba(26, 26, 46, 0.8)',
  border: '1px solid #333',
  borderRadius: 12,
  marginBottom: 12,
};

export default function MobileDailySales() {
  const [dataSource, setDataSource] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filteredData, setFilteredData] = useState([]);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/daily-sales');
      const data = Array.isArray(res.data) ? res.data : [];
      setDataSource(data);
      setFilteredData(data);
    } catch (err) {
      console.error('取得營業資料失敗', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    setSearchText(value);
    if (!value) {
      setFilteredData(dataSource);
      return;
    }
    const filtered = dataSource.filter(item =>
      (item.幹部 || '').toLowerCase().includes(value.toLowerCase()) ||
      (item.客戶名 || '').toLowerCase().includes(value.toLowerCase()) ||
      (item.房號 || '').toLowerCase().includes(value.toLowerCase())
    );
    setFilteredData(filtered);
  };

  const stats = {
    總業績: dataSource.reduce((sum, item) => sum + (Number(item.業績) || 0), 0),
    總人數: dataSource.reduce((sum, item) => sum + (Number(item.人數) || 0), 0),
    總營業額: dataSource.reduce((sum, item) => sum + (Number(item.現金) || Number(item.信用) || Number(item.簽帳) || 0), 0),
    紀錄數: dataSource.length
  };

  return (
    <div style={{ padding: 16, background: '#0a0a1a', minHeight: '100vh' }}>
      <Title level={3} style={{ color: '#9b59b6', textAlign: 'center', marginBottom: 20 }}>
        📊 每日營業表
      </Title>

      {/* 統計卡片 */}
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card style={{ ...cardStyle, textAlign: 'center' }}>
            <div style={{ color: '#9b59b6', fontSize: 12 }}>總業績</div>
            <div style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>
              {stats.總業績.toLocaleString()}
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ ...cardStyle, textAlign: 'center' }}>
            <div style={{ color: '#9b59b6', fontSize: 12 }}>總人數</div>
            <div style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>
              {stats.總人數}
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ ...cardStyle, textAlign: 'center' }}>
            <div style={{ color: '#9b59b6', fontSize: 12 }}>總營收</div>
            <div style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>
              {stats.總營業額.toLocaleString()}
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ ...cardStyle, textAlign: 'center' }}>
            <div style={{ color: '#9b59b6', fontSize: 12 }}>紀錄</div>
            <div style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>
              {stats.紀錄數}
            </div>
          </Card>
        </Col>
      </Row>

      {/* 搜尋 */}
      <input
        type="text"
        placeholder="搜尋幹部/客戶/房號..."
        value={searchText}
        onChange={(e) => handleSearch(e.target.value)}
        style={{
          width: '100%',
          padding: '12px 16px',
          background: 'rgba(26, 26, 46, 0.8)',
          border: '1px solid #333',
          borderRadius: 8,
          color: '#fff',
          fontSize: 14,
          marginBottom: 16,
          boxSizing: 'border-box',
        }}
      />

      {/* 紀錄列表 */}
      <div style={{ marginBottom: 16 }}>
        {filteredData.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#666', padding: 40 }}>
            暫無營業紀錄
          </div>
        ) : (
          filteredData.map((item, idx) => (
            <Card
              key={idx}
              style={cardStyle}
              size="small"
              styles={{ body: { padding: '12px' } }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ color: '#9b59b6', fontWeight: 'bold' }}>
                  {item.日期 ? formatDate(item.日期) : '-'}
                </Text>
                <Tag color="purple">{item.時段 || '晚場'}</Tag>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <Space size="large">
                  <Text style={{ color: '#ccc' }}>
                    <UserOutlined style={{ color: '#9b59b6', marginRight: 4 }} />
                    {item.幹部 || '-'}
                  </Text>
                  <Text style={{ color: '#ccc' }}>
                    <EnvironmentOutlined style={{ color: '#9b59b6', marginRight: 4 }} />
                    {item.房號 || '-'}
                  </Text>
                </Space>
              </div>
              <div style={{ marginBottom: 6 }}>
                <Text style={{ color: '#ccc' }}>
                  客戶: {item.客戶名 || '-'}
                </Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: '#666', fontSize: 12 }}>
                  人數: {item.人數 || 0}
                </Text>
                <Text style={{ color: '#9b59b6', fontWeight: 'bold', fontSize: 16 }}>
                  {Number(item.業績 || 0).toLocaleString()} 元
                </Text>
              </div>
              {item.公關 && (
                <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid #333' }}>
                  <Text style={{ color: '#888', fontSize: 12 }}>
                    👠 公關: {item.公關} | 公關費用: {Number(item.公關費用 || 0).toLocaleString()}
                  </Text>
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
