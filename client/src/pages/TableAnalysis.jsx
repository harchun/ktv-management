import { useState, useEffect } from 'react';
import { Table, Card, Row, Col, Statistic, Typography, Tag, Progress } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, MinusOutlined, TrendUpOutlined, TrendDownOutlined, DollarOutlined, TeamOutlined, CalendarOutlined, RiseOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title, Text, Paragraph } = Typography;

const API = axios.create({ baseURL: '/api' });
API.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default function TableAnalysis() {
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSummary();
    fetchData();
  }, []);

  const fetchSummary = async () => {
    try {
      const res = await API.get('/stats/table-analysis');
      setSummary(res.data);
    } catch (e) { console.error('載入摘要失敗', e); }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [growthRes, gossipRes, cadreRes] = await Promise.all([
        API.get('/stats/table-analysis-growth'),
        API.get('/stats/table-analysis-gossip'),
        API.get('/stats/table-analysis-cadre')
      ]);
      
      const result = growthRes.data.map((row, idx) => ({
        ...row,
        id: row.month,
        gossip_growth: idx > 0 ? calculateGrowth(gossipRes.data[idx-1]?.total, row.gossip_total) : null,
        cadre_growth: idx > 0 ? calculateGrowth(cadreRes.data[idx-1]?.total, row.cadre_total) : null,
        visits_growth: idx > 0 ? calculateGrowth(cadreRes.data[idx-1]?.visits, row.visits) : null
      }));
      
      setData(result);
    } catch (e) { console.error('載入失敗', e); }
    finally { setLoading(false); }
  };

  const calculateGrowth = (prev, current) => {
    if (!prev || !current || prev === 0) return null;
    return ((current - prev) / prev * 100).toFixed(2);
  };

  const formatMoney = (val) => {
    return `NT$ ${Math.round(Number(val) || 0).toLocaleString('zh-TW')}`;
  };

  const getGrowthBadge = (growth) => {
    if (growth === null) return <Tag icon={<MinusOutlined />} color="default">-</Tag>;
    const val = parseFloat(growth);
    if (val > 0) return <Tag icon={<ArrowUpOutlined />} color="success">+{val}%</Tag>;
    if (val < 0) return <Tag icon={<ArrowDownOutlined />} color="error">{val}%</Tag>;
    return <Tag color="warning">0%</Tag>;
  };

  const getGrowthIcon = (growth) => {
    if (growth === null) return <MinusOutlined style={{ color: '#8c8c8c' }} />;
    const val = parseFloat(growth);
    if (val > 0) return <ArrowUpOutlined style={{ color: '#52c41a' }} />;
    if (val < 0) return <ArrowDownOutlined style={{ color: '#ff4d4f' }} />;
    return <MinusOutlined style={{ color: '#faad14' }} />;
  };

  // 計算累計數據
  const totalGossipConsumption = data.reduce((sum, r) => sum + (Number(r.gossip_total) || 0), 0);
  const totalCadreConsumption = data.reduce((sum, r) => sum + (Number(r.cadre_total) || 0), 0);
  const totalVisits = data.reduce((sum, r) => sum + (Number(r.visits) || 0), 0);
  const totalRecords = data.reduce((sum, r) => sum + (Number(r.gossip_records) || 0), 0);

  // 計算整體成長率
  const overallGossipGrowth = data.length > 1 
    ? calculateGrowth(data[0]?.gossip_total, data[data.length - 1]?.gossip_total) 
    : null;
  const overallCadreGrowth = data.length > 1
    ? calculateGrowth(data[0]?.cadre_total, data[data.length - 1]?.cadre_total)
    : null;

  // 找出最佳月份
  const bestMonth = data.reduce((prev, current) => 
    (Number(current.gossip_total) > Number(prev.gossip_total) ? current : prev)
  , data[0]);
  const worstMonth = data.reduce((prev, current) =>
    (Number(current.gossip_total) < Number(prev.gossip_total) ? current : prev)
  , data[0]);

  // 數據表格
  const columns = [
    {
      title: '月份',
      dataIndex: 'month',
      key: 'month',
      width: 100,
      render: (val) => <Text strong style={{ fontSize: 14 }}>{val}</Text>
    },
    {
      title: '公關訂桌',
      children: [
        {
          title: '總消費',
          dataIndex: 'gossip_total',
          key: 'gossip_total',
          width: 130,
          render: (val) => <Text strong>{formatMoney(val)}</Text>
        },
        {
          title: '月增率',
          dataIndex: 'gossip_growth',
          key: 'gossip_growth',
          width: 90,
          render: (val) => getGrowthBadge(val)
        },
        {
          title: '紀錄數',
          dataIndex: 'gossip_records',
          key: 'gossip_records',
          width: 80
        }
      ]
    },
    {
      title: '幹部公關',
      children: [
        {
          title: '總消費',
          dataIndex: 'cadre_total',
          key: 'cadre_total',
          width: 130,
          render: (val) => <Text strong>{formatMoney(val)}</Text>
        },
        {
          title: '月增率',
          dataIndex: 'cadre_growth',
          key: 'cadre_growth',
          width: 90,
          render: (val) => getGrowthBadge(val)
        },
        {
          title: '活躍幹部',
          dataIndex: 'active_count',
          key: 'active_count',
          width: 90
        },
        {
          title: '桌數',
          dataIndex: 'visits',
          key: 'visits',
          width: 80
        }
      ]
    }
  ];

  return (
    <div style={{ padding: '0 4px' }}>
      {/* 報告標題區 */}
      <Card 
        style={{ 
          marginBottom: 16, 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: '#fff',
          borderRadius: 8
        }}
        styles={{ body: { padding: '20px 24px' } }}
      >
        <Row align="middle" gutter={[24, 16]}>
          <Col>
            <Title level={3} style={{ color: '#fff', margin: 0 }}>📊 訂桌經營分析報告</Title>
          </Col>
          <Col style={{ marginLeft: 'auto' }}>
            <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14 }}>
              {summary?.first_month || '2026-05'} ~ {summary?.current_month || '2026-07'}
            </Text>
          </Col>
        </Row>
      </Card>

      {/* 關鍵指標區 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6}>
          <Card 
            style={{ 
              borderRadius: 8, 
              border: '1px solid #e8e8e8',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}
          >
            <Statistic
              title={<Text type="secondary">公關訂桌總消費</Text>}
              value={totalGossipConsumption}
              prefix={<DollarOutlined style={{ color: '#f39c12' }} />}
              prefixStyle={{ color: '#f39c12' }}
              valueStyle={{ color: '#f39c12', fontSize: 24 }}
              precision={0}
              suffix="NT$"
            />
            <div style={{ marginTop: 8 }}>
              {overallGossipGrowth !== null && (
                <Tag 
                  color={parseFloat(overallGossipGrowth) >= 0 ? 'success' : 'error'}
                  icon={parseFloat(overallGossipGrowth) >= 0 ? <TrendUpOutlined /> : <TrendDownOutlined />}
                >
                  期內成長 {parseFloat(overallGossipGrowth) >= 0 ? '+' : ''}{overallGossipGrowth}%
                </Tag>
              )}
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card 
            style={{ 
              borderRadius: 8, 
              border: '1px solid #e8e8e8',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}
          >
            <Statistic
              title={<Text type="secondary">幹部公關總消費</Text>}
              value={totalCadreConsumption}
              prefix={<DollarOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a', fontSize: 24 }}
              precision={0}
              suffix="NT$"
            />
            <div style={{ marginTop: 8 }}>
              {overallCadreGrowth !== null && (
                <Tag 
                  color={parseFloat(overallCadreGrowth) >= 0 ? 'success' : 'error'}
                  icon={parseFloat(overallCadreGrowth) >= 0 ? <TrendUpOutlined /> : <TrendDownOutlined />}
                >
                  期內成長 {parseFloat(overallCadreGrowth) >= 0 ? '+' : ''}{overallCadreGrowth}%
                </Tag>
              )}
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card 
            style={{ 
              borderRadius: 8, 
              border: '1px solid #e8e8e8',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}
          >
            <Statistic
              title={<Text type="secondary">總來訪桌數</Text>}
              value={totalVisits}
              prefix={<CalendarOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1', fontSize: 24 }}
            />
            <div style={{ marginTop: 8 }}>
              <Tag color="processing">{data.length} 個月數據</Tag>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card 
            style={{ 
              borderRadius: 8, 
              border: '1px solid #e8e8e8',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}
          >
            <Statistic
              title={<Text type="secondary">公關訂桌紀錄</Text>}
              value={totalRecords}
              prefix={<TeamOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff', fontSize: 24 }}
            />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                平均每月 {Math.round(totalRecords / (data.length || 1))} 筆
              </Text>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 分析摘要 */}
      {bestMonth && worstMonth && bestMonth.month !== worstMonth.month && (
        <Card 
          title={<span>📈 分析摘要</span>}
          style={{ 
            marginBottom: 16, 
            borderRadius: 8,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
          }}
        >
          <Row gutter={[24, 16]}>
            <Col span={8}>
              <div style={{ padding: '12px 16px', background: '#f6ffed', borderRadius: 6, border: '1px solid #b7eb8f' }}>
                <Text type="secondary" style={{ fontSize: 12 }}>最佳月份</Text>
                <div style={{ fontSize: 20, fontWeight: 'bold', color: '#52c41a', marginTop: 4 }}>
                  {bestMonth.month}
                </div>
                <div style={{ fontSize: 14, color: '#52c41a', marginTop: 4 }}>
                  {formatMoney(bestMonth.gossip_total)}
                </div>
              </div>
            </Col>
            <Col span={8}>
              <div style={{ padding: '12px 16px', background: '#fff2f0', borderRadius: 6, border: '1px solid #ffa39e' }}>
                <Text type="secondary" style={{ fontSize: 12 }}>最低月份</Text>
                <div style={{ fontSize: 20, fontWeight: 'bold', color: '#ff4d4f', marginTop: 4 }}>
                  {worstMonth.month}
                </div>
                <div style={{ fontSize: 14, color: '#ff4d4f', marginTop: 4 }}>
                  {formatMoney(worstMonth.gossip_total)}
                </div>
              </div>
            </Col>
            <Col span={8}>
              <div style={{ padding: '12px 16px', background: '#e6f7ff', borderRadius: 6, border: '1px solid #91d5ff' }}>
                <Text type="secondary" style={{ fontSize: 12 }}>整體趨勢</Text>
                <div style={{ fontSize: 16, fontWeight: 'bold', marginTop: 4 }}>
                  {parseFloat(overallGossipGrowth || 0) >= 0 ? (
                    <span style={{ color: '#52c41a' }}>
                      <TrendUpOutlined /> 成長中 (+{overallGossipGrowth}%)
                    </span>
                  ) : (
                    <span style={{ color: '#ff4d4f' }}>
                      <TrendDownOutlined /> 衰退中 ({overallGossipGrowth}%)
                    </span>
                  )}
                </div>
                <Text type="secondary" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
                  {formatMoney(totalGossipConsumption)} / {data.length} 個月
                </Text>
              </div>
            </Col>
          </Row>
        </Card>
      )}

      {/* 詳細數據表格 */}
      <Card 
        title={<span>📋 月度數據明細</span>}
        loading={loading}
        style={{ 
          borderRadius: 8,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}
      >
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          pagination={false}
          size="middle"
          bordered
          summary={({ pageData }) => (
            <Table.Summary.Fixed>
              <Table.Summary.Row style={{ background: '#fafafa', fontWeight: 'bold' }}>
                <Table.Summary.Cell index={0}>合計</Table.Summary.Cell>
                <Table.Summary.Cell index={1}>{formatMoney(pageData.reduce((sum, r) => sum + (Number(r.gossip_total) || 0), 0))}</Table.Summary.Cell>
                <Table.Summary.Cell index={2}>-</Table.Summary.Cell>
                <Table.Summary.Cell index={3}>{pageData.reduce((sum, r) => sum + (Number(r.gossip_records) || 0), 0)}</Table.Summary.Cell>
                <Table.Summary.Cell index={4}>{formatMoney(pageData.reduce((sum, r) => sum + (Number(r.cadre_total) || 0), 0))}</Table.Summary.Cell>
                <Table.Summary.Cell index={5}>-</Table.Summary.Cell>
                <Table.Summary.Cell index={6}>{pageData.reduce((sum, r) => sum + (Number(r.active_count) || 0), 0)}</Table.Summary.Cell>
                <Table.Summary.Cell index={7}>{pageData.reduce((sum, r) => sum + (Number(r.visits) || 0), 0)}</Table.Summary.Cell>
              </Table.Summary.Row>
            </Table.Summary.Fixed>
          )}
        />
      </Card>

      {/* 備註區 */}
      <Card 
        style={{ 
          marginTop: 16, 
          borderRadius: 8,
          background: '#fafafa',
          border: '1px solid #e8e8e8'
        }}
      >
        <Title level={5} style={{ margin: '0 0 12px 0', color: '#666' }}>📝 報告說明</Title>
        <div style={{ color: '#666', lineHeight: 1.8 }}>
          <p style={{ margin: '0 0 8px 0' }}>
            <strong>公關訂桌：</strong>以營業報表中的「公關訂桌」欄位為主，統計該公關所帶來的總消費金額。
          </p>
          <p style={{ margin: '0 0 8px 0' }}>
            <strong>幹部公關：</strong>統計幹部等級為「公關」之人員的來訪紀錄與消費金額。
          </p>
          <p style={{ margin: '0' }}>
            <strong>月增率：</strong>相對於上個月的成長或衰退百分比。
          </p>
        </div>
      </Card>
    </div>
  );
}
