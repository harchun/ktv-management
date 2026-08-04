import { useState, useEffect } from 'react';
import { Card, Typography, Row, Col, Statistic } from 'antd';
import { UserOutlined, PhoneOutlined, BuildingOutlined } from '@ant-design/icons';
import api from '../utils/api';

const { Title, Text } = Typography;

const cardStyle = {
  background: 'rgba(26, 26, 46, 0.8)',
  border: '1px solid #333',
  borderRadius: 12,
  marginBottom: 12,
};

export default function MobileBroker() {
  const [dataSource, setDataSource] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ total: 0, withCompany: 0, withPhone: 0 });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/brokers');
      const data = Array.isArray(res.data) ? res.data : [];
      setDataSource(data);
      setStats({
        total: data.length,
        withCompany: data.filter(d => d.所屬公司).length,
        withPhone: data.filter(d => d.手機).length,
      });
    } catch (err) {
      console.error('取得經紀人資料失敗', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 16, background: '#0a0a1a', minHeight: '100vh' }}>
      <Title level={3} style={{ color: '#9b59b6', textAlign: 'center', marginBottom: 20 }}>
        👔 經紀人管理
      </Title>

      {/* 統計 */}
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card style={{ ...cardStyle, textAlign: 'center' }}>
            <Statistic 
              title={<Text style={{ color: '#888', fontSize: 10 }}>總數</Text>} 
              value={stats.total}
              valueStyle={{ color: '#fff', fontSize: 18 }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card style={{ ...cardStyle, textAlign: 'center' }}>
            <Statistic 
              title={<Text style={{ color: '#888', fontSize: 10 }}>有公司</Text>} 
              value={stats.withCompany}
              valueStyle={{ color: '#9b59b6', fontSize: 18 }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card style={{ ...cardStyle, textAlign: 'center' }}>
            <Statistic 
              title={<Text style={{ color: '#888', fontSize: 10 }}>有手機</Text>} 
              value={stats.withPhone}
              valueStyle={{ color: '#ffd700', fontSize: 18 }}
            />
          </Card>
        </Col>
      </Row>

      {/* 列表 */}
      <div style={{ marginBottom: 16 }}>
        {dataSource.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#666', padding: 40 }}>
            暫無經紀人資料
          </div>
        ) : (
          dataSource.map((item, idx) => (
            <Card key={idx} style={cardStyle} size="small" styles={{ body: { padding: '10px 12px' } }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>
                  {item.經紀人}
                </Text>
              </div>
              {item.所屬公司 && (
                <div style={{ marginTop: 6, fontSize: 12, color: '#888' }}>
                  <BuildingOutlined style={{ color: '#9b59b6', marginRight: 4 }} />
                  {item.所屬公司}
                </div>
              )}
              {item.手機 && (
                <div style={{ marginTop: 4, fontSize: 12, color: '#666' }}>
                  <PhoneOutlined style={{ color: '#9b59b6', marginRight: 4 }} />
                  {item.手機}
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
