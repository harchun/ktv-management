import { useState, useEffect } from 'react';
import { Card, Typography } from 'antd';
import { UserOutlined, PhoneOutlined } from '@ant-design/icons';
import api from '../utils/api';

const { Text } = Typography;

const cardStyle = {
  background: 'rgba(26, 26, 46, 0.8)',
  border: '1px solid #333',
  borderRadius: 12,
  marginBottom: 12,
};

export default function MobileGossip() {
  const [dataSource, setDataSource] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filteredData, setFilteredData] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [brokers, setBrokers] = useState([]);

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
      setFilteredData(gossipData);
      setBrokers(brokerData);
    } catch (err) {
      console.error('取得公關資料失敗', err);
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
      (item.暱稱 || '').toLowerCase().includes(value.toLowerCase()) ||
      (item.姓名 || '').toLowerCase().includes(value.toLowerCase()) ||
      (item.經紀人 || '').toLowerCase().includes(value.toLowerCase())
    );
    setFilteredData(filtered);
  };

  const getBrokerCompany = (brokerName) => {
    const broker = brokers.find(b => b.經紀人 === brokerName);
    return broker?.所屬公司 || '';
  };

  const stats = {
    總數: dataSource.length,
    有經紀人: dataSource.filter(d => d.經紀人).length,
  };

  return (
    <div style={{ padding: 16, background: '#0a0a1a', minHeight: '100vh' }}>
      <Text style={{ color: '#9b59b6', fontSize: 20, fontWeight: 'bold', textAlign: 'center', display: 'block', marginBottom: 20 }}>
        👠 公關管理
      </Text>

      {/* 統計 */}
      <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ textAlign: 'center', background: 'rgba(26,26,46,0.8)', padding: '8px 12px', borderRadius: 8 }}>
          <div style={{ color: '#9b59b6', fontSize: 11 }}>總數</div>
          <div style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>{stats.總數}</div>
        </div>
        <div style={{ textAlign: 'center', background: 'rgba(26,26,46,0.8)', padding: '8px 12px', borderRadius: 8 }}>
          <div style={{ color: '#9b59b6', fontSize: 11 }}>有經紀人</div>
          <div style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>{stats.有經紀人}</div>
        </div>
      </div>

      {/* 搜尋 */}
      <input
        type="text"
        placeholder="搜尋暱稱/姓名/經紀人..."
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
            暫無公關資料
          </div>
        ) : (
          filteredData.map((item, idx) => (
            <Card key={idx} style={cardStyle} size="small" styles={{ body: { padding: '12px' } }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>
                  {item.姓名}
                </Text>
                {item.暱稱 && (
                  <span style={{
                    background: 'rgba(155, 89, 182, 0.3)',
                    color: '#9b59b6',
                    padding: '2px 8px',
                    borderRadius: 4,
                    fontSize: 12
                  }}>
                    {item.暱稱}
                  </span>
                )}
              </div>
              {item.經紀人 && (
                <div style={{ marginBottom: 4 }}>
                  <Text style={{ color: '#ccc', fontSize: 13 }}>
                    <UserOutlined style={{ color: '#9b59b6', marginRight: 4 }} />
                    {item.經紀人}
                    {getBrokerCompany(item.經紀人) && (
                      <span style={{ color: '#9b59b6', marginLeft: 4 }}>
                        [{getBrokerCompany(item.經紀人)}]
                      </span>
                    )}
                  </Text>
                </div>
              )}
              {item.手機 && (
                <div style={{ marginBottom: 4 }}>
                  <Text style={{ color: '#ccc', fontSize: 13 }}>
                    <PhoneOutlined style={{ color: '#9b59b6', marginRight: 4 }} />
                    {item.手機}
                  </Text>
                </div>
              )}
              {item.LINE_ID && (
                <div style={{ marginBottom: 4 }}>
                  <Text style={{ color: '#ccc', fontSize: 13 }}>LINE: {item.LINE_ID}</Text>
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
