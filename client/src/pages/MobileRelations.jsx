import { useState, useEffect } from 'react';
import { Card, Typography, Collapse } from 'antd';
import { UserOutlined, TeamOutlined } from '@ant-design/icons';
import api from '../utils/api';

const { Text } = Typography;
const { Panel } = Collapse;

const cardStyle = {
  background: 'rgba(26, 26, 46, 0.8)',
  border: '1px solid #333',
  borderRadius: 12,
  marginBottom: 12,
};

export default function MobileCustomerRelations() {
  const [dataSource, setDataSource] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filteredData, setFilteredData] = useState([]);
  const [searchText, setSearchText] = useState('');
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
      setFilteredData(data);
      
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

  const handleSearch = (value) => {
    setSearchText(value);
    if (!value) {
      setFilteredData(dataSource);
      return;
    }
    const filtered = dataSource.filter(item =>
      (item.幹部 || '').toLowerCase().includes(value.toLowerCase()) ||
      (item.客戶列表 || []).some(c => (c.客戶名 || '').toLowerCase().includes(value.toLowerCase()))
    );
    setFilteredData(filtered);
  };

  return (
    <div style={{ padding: 16, background: '#0a0a1a', minHeight: '100vh' }}>
      <Text style={{ color: '#9b59b6', fontSize: 20, fontWeight: 'bold', textAlign: 'center', display: 'block', marginBottom: 20 }}>
        📊 客戶關係
      </Text>

      {/* 統計 */}
      <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ textAlign: 'center', background: 'rgba(26,26,46,0.8)', padding: '8px 12px', borderRadius: 8 }}>
          <div style={{ color: '#9b59b6', fontSize: 11 }}>客戶數</div>
          <div style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>{stats.totalCustomers}</div>
        </div>
        <div style={{ textAlign: 'center', background: 'rgba(26,26,46,0.8)', padding: '8px 12px', borderRadius: 8 }}>
          <div style={{ color: '#9b59b6', fontSize: 11 }}>幹部數</div>
          <div style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>{stats.totalCadres}</div>
        </div>
        <div style={{ textAlign: 'center', background: 'rgba(26,26,46,0.8)', padding: '8px 12px', borderRadius: 8 }}>
          <div style={{ color: '#9b59b6', fontSize: 11 }}>來訪次數</div>
          <div style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>{stats.totalVisits}</div>
        </div>
      </div>

      {/* 搜尋 */}
      <input
        type="text"
        placeholder="搜尋幹部/客戶..."
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
            暫無客戶關係資料
          </div>
        ) : (
          filteredData.map((item, idx) => (
            <Collapse key={idx} ghost style={{ marginBottom: 8 }}>
              <Panel
                header={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <Text style={{ color: '#9b59b6', fontWeight: 'bold', fontSize: 15 }}>
                      <UserOutlined style={{ marginRight: 8 }} />
                      {item.幹部}
                    </Text>
                    <span style={{ color: '#fff', fontSize: 13 }}>
                      {item.來訪次數} 次來訪
                    </span>
                  </div>
                }
                key={item.幹部}
              >
                <div style={{ padding: '8px 0' }}>
                  {item.客戶列表?.map((client, cIdx) => (
                    <div key={cIdx} style={{
                      background: 'rgba(26, 26, 46, 0.6)',
                      border: '1px solid #333',
                      borderRadius: 8,
                      padding: '10px 12px',
                      marginBottom: 8
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text style={{ color: '#fff', fontWeight: '500' }}>
                          {client.客戶名}
                        </Text>
                        <Text style={{ color: '#9b59b6', fontSize: 12 }}>
                          {client.來訪次數} 次
                        </Text>
                      </div>
                      {client.聯絡方式 && (
                        <Text style={{ color: '#888', fontSize: 12 }}>
                          {client.聯絡方式}
                        </Text>
                      )}
                    </div>
                  ))}
                </div>
              </Panel>
            </Collapse>
          ))
        )}
      </div>
    </div>
  );
}
