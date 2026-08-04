import { useState, useEffect } from 'react';
import { Table, Input, Card, Statistic, Row, Col, Tag, Space } from 'antd';
import { SearchOutlined, UserOutlined, TeamOutlined } from '@ant-design/icons';
import api from '../utils/api';
import { formatDate } from '../utils/formatDate';

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

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/customer-relations');
      const data = Array.isArray(res.data) ? res.data : [];
      setDataSource(data);
      
      // Calculate stats
      const uniqueCadres = new Set();
      let totalVisits = 0;
      data.forEach(item => {
        uniqueCadres.add(item.主要幹部);
        totalVisits += item.來訪次數;
      });
      setStats({
        totalCustomers: data.length,
        totalCadres: uniqueCadres.size,
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
        (item.客戶名 || '').toLowerCase().includes(searchText.toLowerCase()) ||
        (item.主要幹部 || '').toLowerCase().includes(searchText.toLowerCase())
      )
    : dataSource;

  const columns = [
    {
      title: '客戶名',
      dataIndex: '客戶名',
      key: '客戶名',
      width: 150,
      fixed: 'left',
      render: (name) => (
        <span style={{ color: '#e74c3c', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
          <UserOutlined style={{ color: '#f39c12' }} />
          {name}
        </span>
      ),
    },
    {
      title: '主要幹部',
      dataIndex: '主要幹部',
      key: '主要幹部',
      width: 120,
      render: (name) => (
        <Tag color="gold" style={{ fontSize: 13, padding: '2px 8px' }}>{name}</Tag>
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
      title: '幹部列表',
      dataIndex: '幹部列表',
      key: '幹部列表',
      width: 200,
      render: (list) => (
        <Space direction="vertical" size={4} style={{ width: '100%' }}>
          {list.slice(0, 3).map((item, idx) => (
            <div key={idx} style={{ fontSize: 12, color: '#888', display: 'flex', justifyContent: 'space-between' }}>
              <span>{item.幹部}</span>
              <span>{item.來訪次數}次/{item.總人數}人</span>
            </div>
          ))}
          {list.length > 3 && (
            <div style={{ fontSize: 12, color: '#666' }}>...等 {list.length} 位幹部</div>
          )}
        </Space>
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
                  prefix={<TeamOutlined style={{ color: '#f39c12' }} />}
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
            <h2 style={{ color: '#e74c3c', margin: 0, fontSize: isMobile ? 18 : undefined }} className="page-title">
              👥 客戶關係表
            </h2>
            <Input.Search
              placeholder="搜尋客戶名或幹部..."
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
              rowKey="客戶名"
              loading={loading}
              pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `共 ${t} 位客戶` }}
              scroll={{ x: isMobile ? 700 : 800 }}
              size={isMobile ? 'small' : 'middle'}
            />
          </div>
        </div>
      </Card>
    </div>
  );
}
