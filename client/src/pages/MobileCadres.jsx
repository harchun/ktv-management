import { useState, useEffect } from 'react';
import { Card, Typography, Row, Col, Statistic } from 'antd';
import { TrophyOutlined, UserOutlined, PhoneOutlined } from '@ant-design/icons';
import api from '../utils/api';

const { Title, Text } = Typography;

const cardStyle = {
  background: 'rgba(26, 26, 46, 0.8)',
  border: '1px solid #333',
  borderRadius: 12,
  marginBottom: 12,
};

const levelColors = {
  '一線': '#ffd700',
  '常董': '#4a90e2',
  '管理層': '#9b59b6',
  '行政': '#2ecc71',
  '場部': '#1abc9c',
  '一般': '#95a5a6'
};

export default function MobileCadres() {
  const [dataSource, setDataSource] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ total: 0, level1: 0, level2: 0 });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/cadres');
      const raw = Array.isArray(res.data) ? res.data : [];
      setDataSource(raw);
      setStats({
        total: raw.length,
        level1: raw.filter(d => d.等級 === '一線').length,
        level2: raw.filter(d => d.等級 === '常董').length,
      });
    } catch (err) {
      console.error('取得幹部資料失敗', err);
    } finally {
      setLoading(false);
    }
  };

  const sortedData = [...dataSource].sort((a, b) => {
    const order = { '一線': 1, '常董': 2, '管理層': 3, '行政': 4, '場部': 5, '一般': 6 };
    return (order[a.等級] || 9) - (order[b.等級] || 9);
  });

  return (
    <div style={{ padding: 16, background: '#0a0a1a', minHeight: '100vh' }}>
      <Title level={3} style={{ color: '#9b59b6', textAlign: 'center', marginBottom: 20 }}>
        🏆 幹部一覽
      </Title>

      {/* 統計 */}
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card style={{ ...cardStyle, textAlign: 'center' }}>
            <Statistic 
              title={<Text style={{ color: '#888', fontSize: 11 }}>總數</Text>} 
              value={stats.total}
              valueStyle={{ color: '#fff', fontSize: 20 }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card style={{ ...cardStyle, textAlign: 'center' }}>
            <Statistic 
              title={<Text style={{ color: '#ffd700', fontSize: 11 }}>一線</Text>} 
              value={stats.level1}
              valueStyle={{ color: '#ffd700', fontSize: 20 }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card style={{ ...cardStyle, textAlign: 'center' }}>
            <Statistic 
              title={<Text style={{ color: '#4a90e2', fontSize: 11 }}>常董</Text>} 
              value={stats.level2}
              valueStyle={{ color: '#4a90e2', fontSize: 20 }}
            />
          </Card>
        </Col>
      </Row>

      {/* 列表 */}
      <div style={{ marginBottom: 16 }}>
        {sortedData.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#666', padding: 40 }}>
            暫無幹部資料
          </div>
        ) : (
          sortedData.map((item, idx) => (
            <Card key={idx} style={cardStyle} size="small" styles={{ body: { padding: '10px 12px' } }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>
                    {item.姓名}
                  </Text>
                  {item.暱稱 && (
                    <Text style={{ color: '#888', fontSize: 12, marginLeft: 8 }}>
                      {item.暱稱}
                    </Text>
                  )}
                </div>
                <span style={{
                  background: levelColors[item.等級] || '#666',
                  color: levelColors[item.等級] === 'gold' ? '#000' : '#fff',
                  padding: '2px 8px',
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 'bold'
                }}>
                  {item.等級}
                </span>
              </div>
              {item.聯絡方式 && (
                <div style={{ marginTop: 6, fontSize: 12, color: '#888' }}>
                  <PhoneOutlined style={{ color: '#9b59b6', marginRight: 4 }} />
                  {item.聯絡方式}
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
