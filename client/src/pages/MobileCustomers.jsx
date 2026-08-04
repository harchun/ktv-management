import { useState, useEffect } from 'react';
import { Card, Typography } from 'antd';
import { UserOutlined, PhoneOutlined, IdcardOutlined } from '@ant-design/icons';
import api from '../utils/api';
import { formatDate } from '../utils/formatDate';

const { Text } = Typography;

const cardStyle = {
  background: 'rgba(26, 26, 46, 0.8)',
  border: '1px solid #333',
  borderRadius: 12,
  marginBottom: 12,
};

const categoryColors = {
  'VIP': '#ffd700',
  '重要': '#ff6b6b',
  '一般': '#4ecdc4',
  '潛在': '#95e1d3',
  '黑名單': '#666'
};

export default function MobileCustomers() {
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
      const res = await api.get('/customers');
      const data = Array.isArray(res.data) ? res.data : [];
      setDataSource(data);
      setFilteredData(data);
    } catch (err) {
      console.error('取得客戶資料失敗', err);
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
      (item.客戶姓名 || '').toLowerCase().includes(value.toLowerCase()) ||
      (item.暱稱 || '').toLowerCase().includes(value.toLowerCase())
    );
    setFilteredData(filtered);
  };

  const stats = {
    總數: dataSource.length,
    VIP: dataSource.filter(d => d.類別 === 'VIP').length,
    重要: dataSource.filter(d => d.類別 === '重要').length,
    一般: dataSource.filter(d => d.類別 === '一般').length,
  };

  return (
    <div style={{ padding: 16, background: '#0a0a1a', minHeight: '100vh' }}>
      <Text style={{ color: '#9b59b6', fontSize: 20, fontWeight: 'bold', textAlign: 'center', display: 'block', marginBottom: 20 }}>
        👥 客戶一覽
      </Text>

      {/* 統計 */}
      <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ textAlign: 'center', background: 'rgba(26,26,46,0.8)', padding: '8px 12px', borderRadius: 8 }}>
          <div style={{ color: '#9b59b6', fontSize: 11 }}>總數</div>
          <div style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>{stats.總數}</div>
        </div>
        <div style={{ textAlign: 'center', background: 'rgba(26,26,46,0.8)', padding: '8px 12px', borderRadius: 8 }}>
          <div style={{ color: '#ffd700', fontSize: 11 }}>VIP</div>
          <div style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>{stats.VIP}</div>
        </div>
        <div style={{ textAlign: 'center', background: 'rgba(26,26,46,0.8)', padding: '8px 12px', borderRadius: 8 }}>
          <div style={{ color: '#ff6b6b', fontSize: 11 }}>重要</div>
          <div style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>{stats.重要}</div>
        </div>
      </div>

      {/* 搜尋 */}
      <input
        type="text"
        placeholder="搜尋姓名/暱稱..."
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
            暫無客戶資料
          </div>
        ) : (
          filteredData.map((item, idx) => (
            <Card key={idx} style={cardStyle} size="small" styles={{ body: { padding: '12px' } }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>
                  {item.客戶姓名}
                </Text>
                <span style={{
                  background: categoryColors[item.類別] || '#666',
                  color: '#fff',
                  padding: '2px 8px',
                  borderRadius: 4,
                  fontSize: 11
                }}>
                  {item.類別}
                </span>
              </div>
              {item.暱稱 && (
                <div style={{ marginBottom: 4 }}>
                  <Text style={{ color: '#9b59b6', fontSize: 13 }}>暱稱: {item.暱稱}</Text>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                {item.行動電話 && (
                  <Text style={{ color: '#ccc', fontSize: 12 }}>
                    <PhoneOutlined style={{ color: '#9b59b6', marginRight: 4 }} />
                    {item.行動電話}
                  </Text>
                )}
                {item.生日 && (
                  <Text style={{ color: '#ccc', fontSize: 12 }}>
                    <IdcardOutlined style={{ color: '#9b59b6', marginRight: 4 }} />
                    {formatDate(item.生日)}
                  </Text>
                )}
              </div>
              {item.LIN_ID && (
                <div style={{ marginBottom: 4 }}>
                  <Text style={{ color: '#ccc', fontSize: 12 }}>LINE: {item.LIN_ID}</Text>
                </div>
              )}
              <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid #333' }}>
                <Text style={{ color: '#9b59b6', fontSize: 13, fontWeight: 'bold' }}>
                  {Number(item.總消費金額 || 0).toLocaleString()} 元
                </Text>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
