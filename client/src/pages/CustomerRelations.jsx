import { useState, useEffect } from 'react';
import { Table, Input, Card, Statistic, Row, Col, Tag, Typography, Collapse } from 'antd';
import { SearchOutlined, TrophyOutlined, UserOutlined, TeamOutlined, DownOutlined } from '@ant-design/icons';
import api from '../utils/api';

const cardStyle = {
  background: 'rgba(26, 26, 46, 0.8)',
  border: '1px solid #333',
  borderRadius: 12,
};

const { Panel } = Collapse;

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

  const customerColumns = [
    {
      title: '客戶名',
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
  ];

  const renderCustomerTable = (customerList) => (
    <Table
      dataSource={customerList}
      columns={customerColumns}
      rowKey="客戶名"
      pagination={false}
      size="small"
      scroll={{ y: 300 }}
      className="customer-table"
    />
  );

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

          {/* Search */}
          <div style={{ marginBottom: 16 }}>
            <Input.Search
              placeholder="搜尋幹部名或客戶名..."
              allowClear
              style={{ width: isMobile ? '100%' : 300 }}
              prefix={<SearchOutlined style={{ color: '#e74c3c' }} />}
              onChange={(e) => handleSearch(e.target.value)}
              onSearch={handleSearch}
            />
          </div>

          {/* Customer List by Cadre */}
          <Title level={4} style={{ color: '#e74c3c', margin: '0 0 12px 0' }}>
            👥 客戶關係表（以幹部分類）
          </Title>

          <Collapse
            defaultActiveKey={[0]}
            accordion
            style={{ background: 'transparent' }}
          >
            {filteredData.map((cadre, idx) => (
              <Panel
                key={idx}
                header={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
                    <TrophyOutlined style={{ color: '#f39c12', fontSize: 18 }} />
                    <span style={{ color: '#f39c12', fontWeight: 600, fontSize: 16 }}>{cadre.幹部}</span>
                    <span style={{ color: '#3498db', fontSize: 13 }}>
                      {cadre.客戶列表.length} 位客戶 · {cadre.來訪次數} 次 · {cadre.總人數} 人
                    </span>
                  </div>
                }
                style={{ background: 'rgba(26, 26, 46, 0.6)', marginBottom: 8, borderRadius: 8 }}
              >
                {renderCustomerTable(cadre.客戶列表)}
              </Panel>
            ))}
          </Collapse>
        </div>
      </Card>
    </div>
  );
}
