import { useState, useEffect } from 'react';
import { Table, Input, Card, Statistic, Row, Col, Tag, Typography } from 'antd';
import { SearchOutlined, TrophyOutlined, UserOutlined, TeamOutlined } from '@ant-design/icons';
import api from '../utils/api';

const cardStyle = {
  background: 'rgba(26, 26, 46, 0.8)',
  border: '1px solid #333',
  borderRadius: 12,
};

export default function CustomerRelations() {
  const [dataSource, setDataSource] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [stats, setStats] = useState({ totalCustomers: 0, totalCadres: 0, totalVisits: 0 });
  const isMobile = typeof window !== 'undefined' ? window.innerWidth <= 768 : false;
  const { Title } = Typography;

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/customer-relations');
      const data = Array.isArray(res.data) ? res.data : [];
      setDataSource(data);
      
      // Calculate stats
      const uniqueCustomers = new Set();
      let totalVisits = 0;
      data.forEach(item => {
        item.客戶列表?.forEach(c => uniqueCustomers.add(c.客戶名));
        totalVisits += item.來訪次數;
      });
      setStats({
        totalCustomers: uniqueCustomers.size,
        totalCadres: data.length,
        totalVisits: totalVisits
      });
    } catch (err) {
      console.error('取得客戶關係資料失敗', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSearch = (value) => {
    setSearchText(value);
  };

  const filteredData = searchText
    ? dataSource.filter(item => 
        (item.幹部 || '').toLowerCase().includes(searchText.toLowerCase()) ||
        item.客戶列表?.some(c => (c.客戶名 || '').toLowerCase().includes(searchText.toLowerCase()))
      )
    : dataSource;

  const columns = [
    {
      title: '幹部名',
      dataIndex: '幹部',
      key: '幹部',
      width: 150,
      fixed: 'left',
      render: (name) => (
        <span style={{ color: '#f39c12', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
          <TrophyOutlined style={{ color: '#f39c12' }} />
          {name}
        </span>
      ),
    },
    {
      title: '主要客戶',
      dataIndex: '客戶名',
      key: '客戶名',
      width: 150,
      render: (name) => (
        <span style={{ color: '#e74c3c', fontWeight: 500 }}>
          {name}
        </span>
      ),
    },
    {
      title: '來訪次數',
      dataIndex: '來訪次數',
      key: '來訪次數',
      width: 100,
      align: 'center',
      render: (count) => (
        <span style={{ color: '#3498db', fontWeight: 500 }}>{count} 次</span>
      ),
    },
    {
      title: '總人數',
      dataIndex: '總人數',
      key: '總人數',
      width: 100,
      align: 'center',
      render: (count) => (
        <span style={{ color: '#2ecc71', fontWeight: 500 }}>{count} 人</span>
      ),
    },
    {
      title: '客戶列表',
      dataIndex: '客戶列表',
      key: '客戶列表',
      render: (list) => (
        <div style={{ maxHeight: 200, overflowY: 'auto' }}>
          {list.map((item, idx) => (
            <div key={idx} style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '4px 8px',
              background: idx % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'transparent',
              borderRadius: 4,
              fontSize: 12,
              marginBottom: 2,
            }}>
              <span style={{ color: '#fff' }}>{item.客戶名}</span>
              <span style={{ color: '#888' }}>{item.來訪次數}次 / {item.總人數}人</span>
            </div>
          ))}
        </div>
      ),
    },
  ];

  return (
    <div>
      <Card style={cardStyle} bodyStyle={{ padding: 0 }} className="page-content">
        <div style={{ padding: isMobile ? 12 : 20 }}>
          {/* Stats */}
          <Row gutter={16} style={{ marginBottom: 20 }}>
            <Col span={isMobile ? 24 : 8}>
              <Card style={{ background: 'rgba(231, 76, 60, 0.1)', border: '1px solid #e74c3c' }}>
                <Statistic
                  title="客戶總數"
                  value={stats.totalCustomers}
                  prefix={<UserOutlined style={{ color: '#e74c3c' }} />}
                  valueStyle={{ color: '#e74c3c' }}
                />
              </Card>
            </Col>
            <Col span={isMobile ? 24 : 8}>
              <Card style={{ background: 'rgba(243, 156, 18, 0.1)', border: '1px solid #f39c12' }}>
                <Statistic
                  title="幹部總數"
                  value={stats.totalCadres}
                  prefix={<TrophyOutlined style={{ color: '#f39c12' }} />}
                  valueStyle={{ color: '#f39c12' }}
                />
              </Card>
            </Col>
            <Col span={isMobile ? 24 : 8}>
              <Card style={{ background: 'rgba(52, 152, 219, 0.1)', border: '1px solid #3498db' }}>
                <Statistic
                  title="總來訪次數"
                  value={stats.totalVisits}
                  prefix={<TeamOutlined style={{ color: '#3498db' }} />}
                  valueStyle={{ color: '#3498db' }}
                />
              </Card>
            </Col>
          </Row>

          {/* Search and Actions */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? 12 : 0,
          }}>
            <Title level={4} style={{ color: '#e74c3c', margin: 0 }}>👥 客戶關係表（以幹部分類）</Title>
            <Input.Search
              placeholder="搜尋幹部名或客戶名..."
              allowClear
              style={{ width: isMobile ? '100%' : 300 }}
              prefix={<SearchOutlined style={{ color: '#e74c3c' }} />}
              onChange={(e) => handleSearch(e.target.value)}
              onSearch={handleSearch}
            />
          </div>

          {/* Table */}
          <div className="table-responsive">
            <Table
              dataSource={filteredData}
              columns={columns}
              rowKey="幹部"
              loading={loading}
              pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `共 ${t} 位幹部` }}
              scroll={{ x: isMobile ? 700 : 900 }}
              size={isMobile ? 'small' : 'middle'}
            />
          </div>
        </div>
      </Card>
    </div>
  );
}
