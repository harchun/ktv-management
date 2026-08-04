import { useState, useEffect } from 'react';
import { Card, Typography, Row, Col, Statistic, Collapse } from 'antd';
import { UserOutlined, TeamOutlined, DownOutlined } from '@ant-design/icons';
import api from '../utils/api';

const { Title, Text } = Typography;
const { Panel } = Collapse;

const cardStyle = {
  background: 'rgba(26, 26, 46, 0.8)',
  border: '1px solid #333',
  borderRadius: 12,
  marginBottom: 12,
};

export default function MobileRelations() {
  const [dataSource, setDataSource] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ totalCustomers: 0, totalCadres: 0, totalVisits: 0 });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/customer-relations');
      const data = Array.isArray(res.data) ? res.data : [];
      setDataSource(data);
      
      const uniqueCustomers = new Set();
      data.forEach(item => {
        item.客戶列表?.forEach(c => uniqueCustomers.add(c.客戶名));
      });
      setStats({
        totalCustomers: uniqueCustomers.size,
        totalCadres: data.length,
        totalVisits: data.reduce((sum, item) => sum + item.來訪次數, 0)
      });
    } catch (err) {
      console.error('取得客戶關係資料失敗', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 16, background: '#0a0a1a', minHeight: '100vh' }}>
      <Title level={3} style={{ color: '#9b59b6', textAlign: 'center', marginBottom: 20 }}>
        📈 客戶關係
      </Title>

      {/* 統計 */}
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card style={{ ...cardStyle, textAlign: 'center' }}>
            <Statistic 
              title={<Text style={{ color: '#888', fontSize: 10 }}>客戶</Text>} 
              value={stats.totalCustomers}
              valueStyle={{ color: '#fff', fontSize: 18 }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card style={{ ...cardStyle, textAlign: 'center' }}>
            <Statistic 
              title={<Text style={{ color: '#888', fontSize: 10 }}>幹部</Text>} 
              value={stats.totalCadres}
              valueStyle={{ color: '#9b59b6', fontSize: 18 }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card style={{ ...cardStyle, textAlign: 'center' }}>
            <Statistic 
              title={<Text style={{ color: '#888', fontSize: 10 }}>來訪</Text>} 
              value={stats.totalVisits}
              valueStyle={{ color: '#ffd700', fontSize: 18 }}
            />
          </Card>
        </Col>
      </Row>

      {/* 列表 */}
      <div style={{ marginBottom: 16 }}>
        {dataSource.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#666', padding: 40 }}>
            暫無客戶關係資料
          </div>
        ) : (
          dataSource.map((item, idx) => (
            <Collapse 
              key={idx} 
              ghost 
              style={{ marginBottom: 8 }}
              expandIcon={({ isActive }) => (
                <DownOutlined style={{ color: '#9b59b6', transform: isActive ? 'rotate(180deg)' : 'rotate(0deg)' }} />
              )}
            >
              <Panel
                header={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <Text style={{ color: '#9b59b6', fontWeight: 'bold', fontSize: 14 }}>
                      <UserOutlined style={{ marginRight: 8 }} />
                      {item.幹部}
                    </Text>
                    <Text style={{ color: '#ffd700', fontSize: 13 }}>
                      {item.來訪次數} 次
                    </Text>
                  </div>
                }
                key={item.幹部}
              >
                <div style={{ padding: '8px 0' }}>
                  {item.客戶列表?.slice(0, 5).map((client, cIdx) => (
                    <div key={cIdx} style={{
                      background: 'rgba(26, 26, 46, 0.6)',
                      border: '1px solid #333',
                      borderRadius: 8,
                      padding: '8px 10px',
                      marginBottom: 6,
                      display: 'flex',
                      justifyContent: 'space-between',
                    }}>
                      <Text style={{ color: '#ccc', fontSize: 13 }}>{client.客戶名}</Text>
                      <Text style={{ color: '#9b59b6', fontSize: 12 }}>{client.來訪次數}次</Text>
                    </div>
                  ))}
                  {item.客戶列表?.length > 5 && (
                    <Text style={{ color: '#666', fontSize: 11, display: 'block', textAlign: 'center' }}>
                      還有 {item.客戶列表.length - 5} 位客戶...
                    </Text>
                  )}
                </div>
              </Panel>
            </Collapse>
          ))
        )}
      </div>
    </div>
  );
}
