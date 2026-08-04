import { useState, useEffect } from 'react';
import { Card, Typography, Row, Col, Statistic } from 'antd';
import { UserOutlined, PhoneOutlined } from '@ant-design/icons';
import api from '../utils/api';

const { Title, Text } = Typography;

const cardStyle = {
  background: 'rgba(26, 26, 46, 0.8)',
  border: '1px solid #333',
  borderRadius: 12,
  marginBottom: 12,
};

export default function MobileGossip() {
  const [dataSource, setDataSource] = useState([]);
  const [loading, setLoading] = useState(false);
  const [brokers, setBrokers] = useState([]);
  const [stats, setStats] = useState({ total: 0, withBroker: 0 });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [gossipRes, brokerRes] = await Promise.all([
        api.get('/gossip'),
        api.get('/brokers')
      ]);
      const gossipData = Array.isArray(gossipRes.data) ? gossipRes.data : [];
      const brokerData = brokerRes.data || [];
      setDataSource(gossipData);
      setBrokers(brokerData);
      setStats({
        total: gossipData.length,
        withBroker: gossipData.filter(d => d.經紀人).length,
      });
    } catch (err) {
      console.error('取得公關資料失敗', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 16, background: '#0a0a1a', minHeight: '100vh' }}>
      <Title level={3} style={{ color: '#9b59b6', textAlign: 'center', marginBottom: 20 }}>
        👠 公關管理
      </Title>

      {/* 統計 */}
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col span={12}>
          <Card style={{ ...cardStyle, textAlign: 'center' }}>
            <Statistic 
              title={<Text style={{ color: '#888', fontSize: 11 }}>公關總數</Text>} 
              value={stats.total}
              valueStyle={{ color: '#fff', fontSize: 20 }}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card style={{ ...cardStyle, textAlign: 'center' }}>
            <Statistic 
              title={<Text style={{ color: '#888', fontSize: 11 }}>有經紀人</Text>} 
              value={stats.withBroker}
              valueStyle={{ color: '#9b59b6', fontSize: 20 }}
            />
          </Card>
        </Col>
      </Row>

      {/* 列表 */}
      <div style={{ marginBottom: 16 }}>
        {dataSource.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#666', padding: 40 }}>
            暫無公關資料
          </div>
        ) : (
          dataSource.slice(0, 15).map((item, idx) => (
            <Card key={idx} style={cardStyle} size="small" styles={{ body: { padding: '10px 12px' } }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>
                    {item.姓名}
                  </Text>
                  {item.暱稱 && (
                    <Text style={{ color: '#9b59b6', fontSize: 12, marginLeft: 6 }}>
                      {item.暱稱}
                    </Text>
                  )}
                </div>
              </div>
              {item.經紀人 && (
                <div style={{ marginTop: 6, fontSize: 12, color: '#888' }}>
                  <UserOutlined style={{ color: '#9b59b6', marginRight: 4 }} />
                  {item.經紀人}
                  {brokers.find(b => b.經紀人 === item.經紀人)?.所屬公司 && (
                    <span style={{ color: '#666' }}>
                      [{brokers.find(b => b.經紀人 === item.經紀人)?.所屬公司}]
                    </span>
                  )}
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
        {dataSource.length > 15 && (
          <div style={{ textAlign: 'center', color: '#666', padding: 16, fontSize: 12 }}>
            僅顯示前 15 筆，共 {dataSource.length} 位公關
          </div>
        )}
      </div>
    </div>
  );
}
