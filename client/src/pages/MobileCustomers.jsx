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
      // axios response: res.data is the actual API response (array or object)
      console.log('=== AXIOS RESPONSE DEBUG ===');
      console.log('res type:', typeof res);
      console.log('res keys:', Object.keys(res));
      console.log('res.data type:', typeof res.data);
      console.log('res.data isArray:', Array.isArray(res.data));
      console.log('res.status:', res.status);
      console.log('res.data value:', JSON.stringify(res.data).substring(0, 500));
      const apiData = res.data;
      window.__DEBUG_API_RESPONSE__ = apiData;
      window.__DEBUG_API_STATUS__ = res.status;
      window.__DEBUG_API_DATA_TYPE__ = typeof apiData;
      window.__DEBUG_API_DATA_IS_ARRAY__ = Array.isArray(apiData);
      console.log('=== INACTIVE CUSTOMERS DEBUG ===');
      console.log('API response type:', typeof apiData);
      console.log('API response isArray:', Array.isArray(apiData));
      console.log('API response status:', res.status);
      console.log('API response length:', Array.isArray(apiData) ? apiData.length : 'not array');
      if (apiData && Array.isArray(apiData)) {
        console.log('First cadre 幹部編號:', apiData[0]?.幹部編號);
        console.log('First cadre 幹部:', apiData[0]?.幹部);
        console.log('First cadre 客戶列表 length:', apiData[0]?.客戶列表?.length);
        console.log('First client 客戶名:', apiData[0]?.客戶列表?.[0]?.客戶名);
        console.log('First client 最後來訪:', apiData[0]?.客戶列表?.[0]?.最後來訪);
      }
      const data = Array.isArray(apiData) ? apiData : [];
      console.log('Setting state to length:', data.length);
      setInactiveCustomers(data);
      window.__DEBUG_INACTIVE_STATE__ = data;
      console.log('State set to length:', data.length);
      console.log('================================');
    } catch (err) {
      window.__DEBUG_API_ERROR__ = err.message;
      console.error('=== INACTIVE CUSTOMERS ERROR ===');
      console.error('Error loading inactive customers', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      console.error('================================');
      setInactiveCustomers([]);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    // Build content for active customers (grouped by cadre)
    const activeContent = dataSource.map((item, idx) => `
      <div class="cadre-page">
        <h1 class="page-title">日月星辰 KTV 客戶關係表</h1>
        <h2 class="cadre-title">${item.幹部}${item.幹部暱稱 ? ' (' + item.幹部暱稱 + ')' : ''}</h2>
        <p class="cadre-info">客戶數: ${item.客戶列表?.length || 0} 位 | 來訪次數: ${item.來訪次數} 次</p>
        <table class="customer-table">
          <thead>
            <tr>
              <th class="col-name">客戶名</th>
              <th class="col-date">最後來訪</th>
              <th class="col-table">公關訂桌</th>
              <th class="col-count">來訪次數</th>
            </tr>
          </thead>
          <tbody>
            ${(item.客戶列表 || []).map(client => `
              <tr>
                <td class="col-name">${client.客戶名 || '-'}</td>
                <td class="col-date">${client.最後來訪 ? formatDate(client.最後來訪) : '-'}</td>
                <td class="col-table">${client.公關訂桌 || '-'}</td>
                <td class="col-count">${client.來訪次數}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `).join('');

    // Build content for inactive customers (grouped by cadre)
    const inactiveContent = inactiveCustomers.length > 0 ? inactiveCustomers.map((item, idx) => `
      <div class="cadre-page">
        <h1 class="page-title">日月星辰 KTV 近40天無來訪客戶</h1>
        <h2 class="cadre-title">${item.幹部}${item.幹部暱稱 ? ' (' + item.幹部暱稱 + ')' : ''}</h2>
        <p class="cadre-info">客戶數: ${item.客戶列表?.length || 0} 位</p>
        <table class="customer-table">
          <thead>
            <tr>
              <th class="col-name">客戶名</th>
              <th class="col-date">最後來訪</th>
              <th class="col-table">公關訂桌</th>
              <th class="col-count">來訪次數</th>
            </tr>
          </thead>
          <tbody>
            ${(item.客戶列表 || []).map(client => `
              <tr>
                <td class="col-name">${client.客戶名 || '-'}</td>
                <td class="col-date">${client.最後來訪 ? formatDate(client.最後來訪) : '-'}</td>
                <td class="col-table">${client.公關訂桌 || '-'}</td>
                <td class="col-count">${client.來訪次數}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `).join('') : '';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>客戶關係列印</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: "Microsoft JhengHei", "PingFang TC", sans-serif;
            background: #fff;
            color: #000;
          }
          .cadre-page {
            page-break-after: always;
            page-break-inside: avoid;
            padding: 20px 30px;
            min-height: 100vh;
          }
          .cadre-page:last-child {
            page-break-after: auto;
          }
          .page-title {
            text-align: center;
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 10px;
            color: #333;
          }
          .cadre-title {
            text-align: center;
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 5px;
            color: #666;
          }
          .cadre-info {
            text-align: center;
            font-size: 12px;
            color: #888;
            margin-bottom: 15px;
          }
          .customer-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
          }
          .customer-table th,
          .customer-table td {
            border: 1px solid #000;
            padding: 6px 8px;
            text-align: left;
          }
          .customer-table th {
            background: #f5f5f5;
            font-weight: bold;
          }
          .customer-table tr:nth-child(even) {
            background: #fafafa;
          }
          .col-name { width: 35%; }
          .col-date { width: 25%; }
          .col-table { width: 20%; }
          .col-count { width: 20%; text-align: center; }
        </style>
      </head>
      <body>
        ${activeContent}
        ${inactiveContent}
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
  };

  return (
    <div style={{ padding: 16, background: '#0a0a1a', minHeight: '100vh' }}>
      <Title level={3} style={{ color: '#9b59b6', textAlign: 'center', marginBottom: 20 }}>
        👥 客戶關係
      </Title>

      {/* Stats */}
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card style={{ ...cardStyle, textAlign: 'center' }}>
            <Statistic 
              title={<Text style={{ color: '#888', fontSize: 10 }}>客戶</Text>} 
              value={stats.totalCustomers}
              valueStyle={{ color: '#fff', fontSize: 18 }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card style={{ ...cardStyle, textAlign: 'center' }}>
            <Statistic 
              title={<Text style={{ color: '#888', fontSize: 10 }}>幹部</Text>} 
              value={stats.totalCadres}
              valueStyle={{ color: '#9b59b6', fontSize: 18 }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card style={{ ...cardStyle, textAlign: 'center' }}>
            <Statistic 
              title={<Text style={{ color: '#888', fontSize: 10 }}>來訪</Text>} 
              value={stats.totalVisits}
              valueStyle={{ color: '#ffd700', fontSize: 18 }}
            />
          </Card>
        </Col>
      </Row>

      {/* Print button */}
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <Button 
          type="primary" 
          icon={<PrinterOutlined />}
          onClick={handlePrint}
          style={{ 
            background: '#9b59b6', 
            borderColor: '#9b59b6'
          }}
        >
          列印客戶關係表
        </Button>
      </div>

      {/* Active customers section */}
      <div style={{ marginBottom: 16 }}>
        {dataSource.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#666', padding: 40 }}>
            沒有近40天來訪的客戶
          </div>
        ) : (
          <Collapse
            ghost
            style={{ marginBottom: 8 }}
            activeKey={dataSource.map(item => item.幹部)}
            expandIcon={({ isActive }) => (
              <DownOutlined style={{ color: '#9b59b6', transform: isActive ? 'rotate(180deg)' : 'rotate(0deg)' }} />
            )}
          >
            {dataSource.map((item, idx) => (
              <Panel
                header={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <Text style={{ color: '#9b59b6', fontWeight: 'bold', fontSize: 14 }}>
                      <UserOutlined style={{ marginRight: 8 }} />
                      {item.幹部}
                      {item.幹部暱稱 && <Text style={{ color: '#888', fontSize: 12, marginLeft: 6, fontWeight: 'normal' }}>({item.幹部暱稱})</Text>}
                    </Text>
                    <Text style={{ color: '#ffd700', fontSize: 13 }}>
                      {item.客戶列表?.length || 0} 位客戶
                    </Text>
                  </div>
                }
                key={item.幹部}
                value={item.幹部}
              >
                <div style={{ padding: '8px 0' }}>
                  {item.客戶列表?.map((client, cIdx) => (
                    <div key={cIdx} style={{
                      background: 'rgba(26, 26, 46, 0.6)',
                      border: '1px solid #333',
                      borderRadius: 8,
                      padding: '8px 10px',
                      marginBottom: 6,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}>
                      <div>
                        <Text style={{ color: '#fff', fontSize: 13, fontWeight: 500 }}>{client.客戶名}</Text>
                        <div style={{ marginTop: 4, fontSize: 11, color: '#666', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <CalendarOutlined style={{ color: '#9b59b6' }} />
                          最後來訪: {client.最後來訪 ? formatDate(client.最後來訪) : '-'}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {client.公關訂桌 ? (
                          <Tag style={{ background: 'rgba(255, 215, 0, 0.2)', borderColor: '#ffd700', color: '#ffd700', border: 'none', padding: '2px 8px', borderRadius: 4, fontSize: 11 }}>
                            🎯 {client.公關訂桌}
                          </Tag>
                        ) : (
                          <Text style={{ color: '#666', fontSize: 12 }}>-</Text>
                        )}
                        <Text style={{ color: '#9b59b6', fontSize: 12 }}>{client.來訪次數} 來訪</Text>
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>
            ))
          </Collapse>
        )}
      </div>

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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {inactiveCustomers.map((item, idx) => {
              const cadreKey = `inactive-${item.幹部編號 || idx}`;
              console.log('Rendering inactive cadre:', cadreKey, 'idx:', idx, 'item:', item?.幹部);
              return (
              <Card
                key={cadreKey}
                style={{ ...cardStyle, background: 'rgba(255, 193, 7, 0.05)', marginBottom: 0 }}
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ color: '#ffc107', fontWeight: 'bold' }}>
                      <UserOutlined style={{ marginRight: 8 }} />
                      {String(item.幹部 || `幹部${idx + 1}`)}
                      {item.幹部暱稱 && <Text style={{ color: '#999', fontSize: 12, marginLeft: 6, fontWeight: 'normal' }}>({String(item.幹部暱稱)})</Text>}
                    </Text>
                    <Text style={{ color: '#999', fontSize: 12 }}>
                      {Array.isArray(item.客戶列表) ? item.客戶列表.length : 0} 位客戶
                    </Text>
                  </div>
                }
              >
                <div style={{ padding: '8px 0' }}>
                  {Array.isArray(item.客戶列表) ? item.客戶列表.map((client, cIdx) => (
                    <div key={`client-${idx}-${cIdx}-${client.客戶名 || cIdx}`} style={{
                      background: 'rgba(255, 193, 7, 0.1)',
                      border: '1px solid #ffc107',
                      borderRadius: 8,
                      padding: '8px 10px',
                      marginBottom: 6,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}>
                      <div>
                        <Text style={{ color: '#ffc107', fontSize: 13, fontWeight: 500 }}>{String(client.客戶名 || '-')}</Text>
                        <div style={{ marginTop: 4, fontSize: 11, color: '#666', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <CalendarOutlined style={{ color: '#ffc107' }} />
                          最後來訪: {client.最後來訪 ? formatDate(client.最後來訪) : '-'}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {client.公關訂桌 ? (
                          <Tag style={{ background: 'rgba(255, 215, 0, 0.2)', borderColor: '#ffc107', color: '#ffc107', border: 'none', padding: '2px 8px', borderRadius: 4, fontSize: 11 }}>
                            🎯 {String(client.公關訂桌)}
                          </Tag>
                        ) : (
                          <Text style={{ color: '#666', fontSize: 12 }}>-</Text>
                        )}
                        <Text style={{ color: '#ffc107', fontSize: 12 }}>{Number(client.來訪次數) || 0} 來訪</Text>
                      </div>
                    </div>
                  )) : null}
                </div>
              </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
