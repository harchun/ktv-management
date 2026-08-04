import { useState, useEffect } from 'react';
import { Card, Typography, Space } from 'antd';
import { UserOutlined, PhoneOutlined, EnvironmentOutlined } from '@ant-design/icons';
import api from '../utils/api';

const { Title, Text } = Typography;

const cardStyle = {
  background: 'rgba(26, 26, 46, 0.8)',
  border: '1px solid #333',
  borderRadius: 12,
  marginBottom: 12,
};

const levelColors = {
  '一線': 'gold',
  '常董': 'blue',
  '管理層': 'purple',
  '行政': 'green',
  '場部': 'cyan',
  '一般': 'default'
};

export default function MobileCadres() {
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
      const res = await api.get('/cadres');
      const raw = Array.isArray(res.data) ? res.data : [];
      const levelOrder = { '一線': 1, '常董': 2, '管理層': 3, '行政': 4, '場部': 5, '一般': 6 };
      const sorted = raw.sort((a, b) => (levelOrder[a.等級] || 9) - (levelOrder[b.等級] || 9));
      setDataSource(sorted);
      setFilteredData(sorted);
    } catch (err) {
      console.error('取得幹部資料失敗', err);
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
      (item.姓名 || '').toLowerCase().includes(value.toLowerCase()) ||
      (item.暱稱 || '').toLowerCase().includes(value.toLowerCase()) ||
      (item.等級 || '').toLowerCase().includes(value.toLowerCase())
    );
    setFilteredData(filtered);
  };

  const stats = {
    總數: dataSource.length,
    一線: dataSource.filter(d => d.等級 === '一線').length,
    常董: dataSource.filter(d => d.等級 === '常董').length,
    管理層: dataSource.filter(d => d.等級 === '管理層').length,
  };

  return (
    <div style={{ padding: 16, background: '#0a0a1a', minHeight: '100vh' }}>
      <Title level={3} style={{ color: '#9b59b6', textAlign: 'center', marginBottom: 20 }}>
        🏆 幹部一覽
      </Title>

      {/* 統計 */}
      <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ textAlign: 'center', background: 'rgba(26,26,46,0.8)', padding: '8px 16px', borderRadius: 8 }}>
          <div style={{ color: '#9b59b6', fontSize: 12 }}>總數</div>
          <div style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>{stats.總數}</div>
        </div>
        <div style={{ textAlign: 'center', background: 'rgba(26,26,46,0.8)', padding: '8px 16px', borderRadius: 8 }}>
          <div style={{ color: '#ffd700', fontSize: 12 }}>一線</div>
          <div style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>{stats.一線}</div>
        </div>
        <div style={{ textAlign: 'center', background: 'rgba(26,26,46,0.8)', padding: '8px 16px', borderRadius: 8 }}>
          <div style={{ color: '#4a90e2', fontSize: 12 }}>常董</div>
          <div style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>{stats.常董}</div>
        </div>
      </div>

      {/* 搜尋 */}
      <input
        type="text"
        placeholder="搜尋姓名/暱稱/等級..."
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

      {/* 列表 */}
      <div style={{ marginBottom: 16 }}>
        {filteredData.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#666', padding: 40 }}>
            暫無幹部資料
          </div>
        ) : (
          filteredData.map((item, idx) => (
            <Card key={idx} style={cardStyle} size="small" styles={{ body: { padding: '12px' } }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>
                  {item.姓名}
                </Text>
                <span style={{
                  background: levelColors[item.等級] || '#666',
                  color: levelColors[item.等級] === 'gold' ? '#000' : '#fff',
                  padding: '2px 8px',
                  borderRadius: 4,
                  fontSize: 12
                }}>
                  {item.等級}
                </span>
              </div>
              {item.暱稱 && (
                <div style={{ marginBottom: 4 }}>
                  <Text style={{ color: '#9b59b6' }}>暱稱: {item.暱稱}</Text>
                </div>
              )}
              {item.聯絡方式 && (
                <div style={{ marginBottom: 4 }}>
                  <Text style={{ color: '#ccc', fontSize: 13 }}>
                    <PhoneOutlined style={{ color: '#9b59b6', marginRight: 4 }} />
                    {item.聯絡方式}
                  </Text>
                </div>
              )}
              {item.電子信箱 && (
                <div style={{ marginBottom: 4 }}>
                  <Text style={{ color: '#ccc', fontSize: 13 }}>
                    {item.電子信箱}
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
