import { useState, useEffect } from 'react';
import { Card, Typography, Row, Col, Statistic, Collapse, Tag, Button, Alert } from 'antd';
import { UserOutlined, CalendarOutlined, DownOutlined, PrinterOutlined, WarningOutlined } from '@ant-design/icons';
import api from '../utils/api';
import { formatDate } from '../utils/formatDate';

const { Title, Text } = Typography;
const { Panel } = Collapse;

const cardStyle = {
  background: 'rgba(26, 26, 46, 0.8)',
  border: '1px solid #333',
  borderRadius: 12,
  marginBottom: 12,
};

export default function MobileCustomers() {
  const [dataSource, setDataSource] = useState([]);
  const [inactiveCustomers, setInactiveCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ totalCustomers: 0, totalCadres: 0, totalVisits: 0 });

  useEffect(() => {
    fetchData();
    fetchInactiveCustomers();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/customer-relations');
      const data = Array.isArray(res.data) ? res.data : [];
      setDataSource(data);
      
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
      console.error('Error loading data', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchInactiveCustomers = async () => {
    try {
      const res = await api.get('/inactive-customers');
      const data = Array.isArray(res.data) ? res.data : [];
      setInactiveCustomers(data);
    } catch (err) {
      console.error('Error loading inactive customers', err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ padding: 16, background: '#0a0a1a', minHeight: '100vh' }}>
      <Title level={3} style={{ color: '#9b59b6', textAlign: 'center', marginBottom: 20 }}>
        👥 客戶關係
      </Title>

      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card style={cardStyle} style={{ textAlign: 'center' }}>
            <Statistic title="客戶" value={stats.totalCustomers} valueStyle={{ color: '#fff', fontSize: 18 }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card style={cardStyle} style={{ textAlign: 'center' }}>
            <Statistic title="幹部" value={stats.totalCadres} valueStyle={{ color: '#9b59b6', fontSize: 18 }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card style={cardStyle} style={{ textAlign: 'center' }}>
            <Statistic title="來訪" value={stats.totalVisits} valueStyle={{ color: '#52c41a', fontSize: 18 }} />
          </Card>
        </Col>
      </Row>

      <Button
        type="primary"
        icon={<PrinterOutlined />}
        onClick={handlePrint}
        style={{ width: '100%', marginBottom: 16, background: '#9b59b6', borderColor: '#9b59b6' }}
      >
        列印客戶關係表
      </Button>

      {/* Active customers section */}
      {dataSource.length > 0 ? (
        <Collapse
          ghost
          style={{ marginBottom: 8 }}
          activeKey={dataSource.map(item => item.幹部)}
          expandIcon={({ isActive }) => (
            <DownOutlined rotate={isActive ? 180 : 0} style={{ color: '#9b59b6' }} />
          )}
        >
          {dataSource.map((item, idx) => (
            <Panel header={`${item.幹部}(${item.幹部暱稱})`} key={idx}>
              <div>
                {Array.isArray(item.客戶列表) && item.客戶列表.length > 0 ? (
                  item.客戶列表.map((client, i) => (
                    <div key={i} style={{ padding: '8px 0', borderBottom: i < item.客戶列表.length - 1 ? '1px solid #333' : 'none' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ color: '#fff', fontWeight: 500 }}>{client.客戶名}</Text>
                        <Text style={{ color: '#666', fontSize: 12 }}>{client.客戶編號}</Text>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {client.公關訂桌 ? (
                          <Tag style={{ background: 'rgba(255, 215, 0, 0.2)', borderColor: '#ffd700', color: '#ffd700', border: 'none', padding: '2px 8px', borderRadius: 4, fontSize: 11 }}>
                            {client.公關訂桌}
                          </Tag>
                        ) : (
                          <Text style={{ color: '#666', fontSize: 12 }}>-</Text>
                        )}
                        <Text style={{ color: '#9b59b6', fontSize: 12 }}>{client.來訪次數} 來訪</Text>
                      </div>
                    </div>
                  ))
                ) : (
                  <Text style={{ color: '#666' }}>無客戶</Text>
                )}
              </div>
            </Panel>
          ))}
        </Collapse>
      ) : null}

      {/* Inactive customers section */}
      {inactiveCustomers.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <Alert
            type="warning"
            icon={<WarningOutlined />}
            showIcon
            message={`近40天無來訪客戶 (${inactiveCustomers.length} 位幹部)`}
            style={{ background: 'rgba(255, 193, 7, 0.1)', borderColor: '#ffc107', marginBottom: 12 }}
          />
          <Collapse
            ghost
            style={{ marginBottom: 8 }}
            activeKey={inactiveCustomers.map(item => item.幹部)}
            expandIcon={({ isActive }) => (
              <DownOutlined rotate={isActive ? 180 : 0} style={{ color: '#9b59b6' }} />
            )}
          >
            {inactiveCustomers.map((item, idx) => (
              <Panel header={`${item.幹部} (${item.幹部編號}) - ${item.客戶列表?.length || 0} 位客戶`} key={idx}>
                <div>
                  {Array.isArray(item.客戶列表) && item.客戶列表.length > 0 ? (
                    item.客戶列表.map((client, i) => (
                      <div key={idx + '-' + i} style={{ padding: '8px 0', borderBottom: i < item.客戶列表.length - 1 ? '1px solid #333' : 'none' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text style={{ color: '#fff', fontWeight: 500 }}>{client.客戶名}</Text>
                          <Text style={{ color: '#666', fontSize: 12 }}>最後來訪: {formatDate(client.最後來訪)}</Text>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                          {String(client.公關訂桌) ? (
                            <Tag style={{ background: 'rgba(255, 215, 0, 0.2)', borderColor: '#ffd700', color: '#ffd700', border: 'none', padding: '2px 8px', borderRadius: 4, fontSize: 11 }}>
                              {String(client.公關訂桌)}
                            </Tag>
                          ) : (
                            <Text style={{ color: '#666', fontSize: 12 }}>-</Text>
                          )}
                          <Text style={{ color: '#9b59b6', fontSize: 12 }}>{String(client.來訪次數)} 來訪</Text>
                        </div>
                      </div>
                    ))
                  ) : (
                    <Text style={{ color: '#666' }}>無客戶</Text>
                  )}
                </div>
              </Panel>
            ))}
          </Collapse>
        </div>
      )}
    </div>
  );
}
