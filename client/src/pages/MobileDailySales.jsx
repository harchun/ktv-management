import { useState, useEffect } from 'react';
import { Card, Typography, Row, Col, Statistic } from 'antd';
import { DollarOutlined, TeamOutlined, CalendarOutlined } from '@ant-design/icons';
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
  const [filterDate, setFilterDate] = useState(null);
  const [stats, setStats] = useState({ total: 0, people: 0, records: 0 });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/daily-sales');
      const data = Array.isArray(res.data) ? res.data : [];
      setDataSource(data);
      
      const total = data.reduce((sum, item) => sum + (Number(item.業績) || 0), 0);
      const people = data.reduce((sum, item) => sum + (Number(item.人數) || 0), 0);
      setStats({ total, people, records: data.length });
    } catch (err) {
      console.error('取得營業資料失敗', err);
    } finally {
      setLoading(false);
    }
  };

  const uniqueDates = [...new Set(dataSource.map(d => d.日期))].sort().reverse();

  const filteredData = filterDate 
    ? dataSource.filter(item => item.日期 === filterDate)
    : dataSource.slice(0, 10);

  const filteredStats = {
    total: filteredData.reduce((sum, item) => sum + (Number(item.業績) || 0), 0),
    people: filteredData.reduce((sum, item) => sum + (Number(item.人數) || 0), 0),
    records: filteredData.length,
  };

  return (
    <div style={{ padding: 16, background: '#0a0a1a', minHeight: '100vh' }}>
      <Title level={3} style={{ color: '#9b59b6', textAlign: 'center', marginBottom: 20 }}>
        📊 每日營業表
      </Title>

      {/* 統計 */}
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card style={{ ...cardStyle, textAlign: 'center' }}>
            <Statistic 
              title={<Text style={{ color: '#888', fontSize: 11 }}>總業績</Text>} 
              value={filterDate ? filteredStats.total : stats.total}
              prefix={<DollarOutlined style={{ color: '#9b59b6' }} />}
              valueStyle={{ color: '#ffd700', fontSize: 16 }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card style={{ ...cardStyle, textAlign: 'center' }}>
            <Statistic 
              title={<Text style={{ color: '#888', fontSize: 11 }}>總人數</Text>} 
              value={filterDate ? filteredStats.people : stats.people}
              prefix={<TeamOutlined style={{ color: '#9b59b6' }} />}
              valueStyle={{ color: '#fff', fontSize: 16 }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card style={{ ...cardStyle, textAlign: 'center' }}>
            <Statistic 
              title={<Text style={{ color: '#888', fontSize: 11 }}>筆數</Text>} 
              value={filterDate ? filteredStats.records : stats.records}
              prefix={<CalendarOutlined style={{ color: '#9b59b6' }} />}
              valueStyle={{ color: '#fff', fontSize: 16 }}
            />
          </Card>
        </Col>
      </Row>

      {/* 日期選擇 */}
      {uniqueDates.length > 0 && (
        <div style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <button
            onClick={() => setFilterDate(null)}
            style={{
              padding: '6px 12px',
              background: filterDate === null ? '#9b59b6' : 'rgba(26, 26, 46, 0.8)',
              border: '1px solid ' + (filterDate === null ? '#9b59b6' : '#333'),
              borderRadius: 6,
              color: '#fff',
              fontSize: 12,
            }}
          >
            全部
          </button>
          {uniqueDates.slice(0, 7).map(date => (
            <button
              key={date}
              onClick={() => setFilterDate(date)}
              style={{
                padding: '6px 12px',
                background: filterDate === date ? '#9b59b6' : 'rgba(26, 26, 46, 0.8)',
                border: '1px solid ' + (filterDate === date ? '#9b59b6' : '#333'),
                borderRadius: 6,
                color: '#fff',
                fontSize: 12,
              }}
            >
              {date}
            </button>
          ))}
        </div>
      )}

      {/* 列表 */}
      <div style={{ marginBottom: 16 }}>
        {filteredData.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#666', padding: 40 }}>
            暫無營業紀錄
          </div>
        ) : (
          filteredData.map((item, idx) => (
            <Card key={idx} style={cardStyle} size="small" styles={{ body: { padding: '10px 12px' } }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={{ color: '#9b59b6', fontSize: 13, fontWeight: 'bold' }}>
                  {formatDate(item.日期)} {item.時段 || '晚場'}
                </Text>
                <Text style={{ color: '#ffd700', fontWeight: 'bold' }}>
                  {Number(item.業績 || 0).toLocaleString()} 元
                </Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#888' }}>
                <span>👤 {item.幹部 || '-'}</span>
                <span>🏠 {item.房號 || '-'}</span>
                <span>👥 {item.人數 || 0}人</span>
              </div>
              {item.客戶名 && (
                <div style={{ marginTop: 4, fontSize: 12, color: '#666' }}>
                  客戶: {item.客戶名}
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
