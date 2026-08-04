import { useState, useEffect } from 'react';
import { Card, Typography, Row, Col, Statistic } from 'antd';
import { UserOutlined, PhoneOutlined, IdcardOutlined } from '@ant-design/icons';
import api from '../utils/api';
import { formatDate } from '../utils/formatDate';

const { Title, Text } = Typography;

const cardStyle = {
  background: 'rgba(26, 26, 46, 0.8)',
  border: '1px solid #333',
  borderRadius: 12,
  marginBottom: 12,
};

export default function MobileCustomers() {
  const [dataSource, setDataSource] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ total: 0, totalSpent: 0 });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/customers');
      const data = Array.isArray(res.data) ? res.data : [];
      setDataSource(data);
      setStats({
        total: data.length,
        totalSpent: data.reduce((sum, c) => sum + (Number(c.總消費金額) || 0), 0),
      });
    } catch (err) {
      console.error('取得客戶資料失敗', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 16, background: '#0a0a1a', minHeight: '100vh' }}>
      <Title level={3} style={{ color: '#9b59b6', textAlign: 'center', marginBottom: 20 }}>
        👥 客戶一覽
      </Title>

      {/* 統計 */}
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col span={12}>
          <Card style={{ ...cardStyle, textAlign: 'center' }}>
            <Statistic 
              title={<Text style={{ color: '#888', fontSize: 11 }}>客戶總數</Text>} 
              value={stats.total}
              valueStyle={{ color: '#fff', fontSize: 20 }}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card style={{ ...cardStyle, textAlign: 'center' }}>
            <Statistic 
              title={<Text style={{ color: '#888', fontSize: 11 }}>總消費</Text>} 
              value={stats.totalSpent.toLocaleString()}
              prefix={<Text style={{ color: '#ffd700', fontSize: 12 }}>¥</Text>}
              valueStyle={{ color: '#ffd700', fontSize: 16 }}
            />
          </Card>
        </Col>
      </Row>

      {/* 列表 */}
      <div style={{ marginBottom: 16 }}>
        {dataSource.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#666', padding: 40 }}>
            暫無客戶資料
          </div>
        ) : (
          dataSource.slice(0, 20).map((item, idx) => (
            <Card key={idx} style={cardStyle} size="small" styles={{ body: { padding: '10px 12px' } }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>
                  {item.客戶姓名}
                </Text>
                <Text style={{ color: '#ffd700', fontSize: 13, fontWeight: 'bold' }}>
                  {Number(item.總消費金額 || 0).toLocaleString()}
                </Text>
              </div>
              {item.暱稱 && (
                <div style={{ marginTop: 4, fontSize: 12, color: '#888' }}>
                  暱稱: {item.暱稱}
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 11, color: '#666' }}>
                {item.行動電話 && (
                  <span><PhoneOutlined style={{ color: '#9b59b6', marginRight: 4 }} />{item.行動電話}</span>
                )}
                {item.生日 && (
                  <span><IdcardOutlined style={{ color: '#9b59b6', marginRight: 4 }} />{formatDate(item.生日)}</span>
                )}
              </div>
            </Card>
          ))
        )}
        {dataSource.length > 20 && (
          <div style={{ textAlign: 'center', color: '#666', padding: 16, fontSize: 12 }}>
            僅顯示前 20 筆，共 {dataSource.length} 位客戶
          </div>
        )}
      </div>
    </div>
  );
}
