import { useState, useEffect } from 'react';
import { Table, Card, Select, Row, Col, Statistic, Typography, Tag, Progress } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, MinusOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title, Text } = Typography;
const { Option } = Select;

const API = axios.create({ baseURL: '/api' });
API.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default function TableAnalysis() {
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [months, setMonths] = useState([]);
  const [selectedMonths, setSelectedMonths] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMonths();
    fetchSummary();
  }, []);

  useEffect(() => {
    if (selectedMonths.length > 0) {
      fetchData(selectedMonths.join(','));
    } else {
      setData([]);
      setSummary(null);
    }
  }, [selectedMonths]);

  const fetchMonths = async () => {
    try {
      const res = await API.get('/stats/months');
      setMonths(res.data.reverse());
    } catch (e) { console.error('載入月份失敗', e); }
  };

  const fetchSummary = async () => {
    try {
      const res = await API.get('/stats/table-analysis');
      setSummary(res.data);
    } catch (e) { console.error('載入摘要失敗', e); }
  };

  const fetchData = async (monthsParam) => {
    setLoading(true);
    try {
      const [growthRes, gossipRes, cadreRes] = await Promise.all([
        API.get('/stats/table-analysis-growth', { params: { months: monthsParam } }),
        API.get('/stats/table-analysis-gossip', { params: { months: monthsParam } }),
        API.get('/stats/table-analysis-cadre', { params: { months: monthsParam } })
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

  const getGrowthIcon = (growth) => {
    if (growth === null) return <MinusOutlined />;
    if (growth > 0) return <ArrowUpOutlined style={{ color: '#52c41a' }} />;
    if (growth < 0) return <ArrowDownOutlined style={{ color: '#ff4d4f' }} />;
    return <MinusOutlined />;
  };

  const getGrowthColor = (growth) => {
    if (growth === null) return '#8c8c8c';
    if (growth > 0) return '#52c41a';
    if (growth < 0) return '#ff4d4f';
    return '#faad14';
  };

  const getGrowthTag = (growth) => {
    if (growth === null) return <Tag color="default">-</Tag>;
    const isPositive = growth > 0;
    const isNegative = growth < 0;
    if (isPositive) return <Tag color="success">+{growth}%</Tag>;
    if (isNegative) return <Tag color="error">{growth}%</Tag>;
    return <Tag color="warning">0%</Tag>;
  };

  const formatMoney = (val) => {
    return `NT$ ${Math.round(Number(val) || 0).toLocaleString('zh-TW')}`;
  };

  const columns = [
    {
      title: '月份',
      dataIndex: 'month',
      key: 'month',
      width: 100,
      fixed: 'left',
      render: (val) => <Text strong>{val}</Text>
    },
    {
      title: '公關訂桌',
      children: [
        {
          title: '總消費',
          dataIndex: 'gossip_total',
          key: 'gossip_total',
          width: 120,
          render: (val) => formatMoney(val)
        },
        {
          title: '成長率',
          dataIndex: 'gossip_growth',
          key: 'gossip_growth',
          width: 100,
          render: (val) => getGrowthTag(val),
          sorter: (a, b) => (a.gossip_growth || -999) - (b.gossip_growth || -999)
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
          width: 120,
          render: (val) => formatMoney(val)
        },
        {
          title: '成長率',
          dataIndex: 'cadre_growth',
          key: 'cadre_growth',
          width: 100,
          render: (val) => getGrowthTag(val),
          sorter: (a, b) => (a.cadre_growth || -999) - (b.cadre_growth || -999)
        }
      ]
    },
    {
      title: '來訪桌數',
      children: [
        {
          title: '桌數',
          dataIndex: 'visits',
          key: 'visits',
          width: 80,
          render: (val) => <Text strong>{val || 0}</Text>
        },
        {
          title: '成長率',
          dataIndex: 'visits_growth',
          key: 'visits_growth',
          width: 100,
          render: (val) => getGrowthTag(val),
          sorter: (a, b) => (a.visits_growth || -999) - (b.visits_growth || -999)
        }
      ]
    },
    {
      title: '統計資料',
      children: [
        {
          title: '公關紀錄',
          dataIndex: 'gossip_records',
          key: 'gossip_records',
          width: 100
        },
        {
          title: '活躍幹部',
          dataIndex: 'active_count',
          key: 'active_count',
          width: 100
        }
      ]
    }
  ];

  return (
    <div>
      <Card 
        title="訂桌分析"
        extra={
          <Select
            mode="multiple"
            value={selectedMonths}
            onChange={setSelectedMonths}
            placeholder="選擇月份進行比較"
            style={{ width: 300 }}
            options={months.map(m => ({ value: m, label: m }))}
            maxTagCount="responsive"
          />
        }
      >
        {summary && (
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col span={6}>
              <Statistic 
                title="統計月份數" 
                value={summary.month_count} 
                suffix="個月"
                valueStyle={{ color: '#1890ff' }}
              />
            </Col>
            <Col span={6}>
              <Statistic 
                title="公關訂桌總消費" 
                value={Number(summary.total_gossip_consumption) || 0}
                prefix="NT$" 
                precision={0}
                valueStyle={{ color: '#f39c12' }}
              />
            </Col>
            <Col span={6}>
              <Statistic 
                title="幹部公關總消費" 
                value={Number(summary.total_cadre_consumption) || 0}
                prefix="NT$" 
                precision={0}
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
            <Col span={6}>
              <Statistic 
                title="總來訪桌數" 
                value={Number(summary.total_cadre_visits) || 0}
                valueStyle={{ color: '#722ed1' }}
              />
            </Col>
          </Row>
        )}

        {selectedMonths.length > 0 ? (
          <Table
            columns={columns}
            dataSource={data}
            rowKey="id"
            loading={loading}
            pagination={false}
            size="small"
            scroll={{ x: 1200 }}
            className="table-striped"
            summary={({ pageData }) => (
              <Table.Summary.Fixed>
                <Table.Summary.Row style={{ background: '#fafafa', fontWeight: 'bold' }}>
                  <Table.Summary.Cell index={0}>總計</Table.Summary.Cell>
                  <Table.Summary.Cell index={1}>{formatMoney(pageData.reduce((sum, r) => sum + (Number(r.gossip_total) || 0), 0))}</Table.Summary.Cell>
                  <Table.Summary.Cell index={2}>-</Table.Summary.Cell>
                  <Table.Summary.Cell index={3}>{formatMoney(pageData.reduce((sum, r) => sum + (Number(r.cadre_total) || 0), 0))}</Table.Summary.Cell>
                  <Table.Summary.Cell index={4}>-</Table.Summary.Cell>
                  <Table.Summary.Cell index={5}>{pageData.reduce((sum, r) => sum + (Number(r.visits) || 0), 0)}</Table.Summary.Cell>
                  <Table.Summary.Cell index={6}>-</Table.Summary.Cell>
                  <Table.Summary.Cell index={7}>{pageData.reduce((sum, r) => sum + (Number(r.gossip_records) || 0), 0)}</Table.Summary.Cell>
                  <Table.Summary.Cell index={8}>{pageData.reduce((sum, r) => sum + (Number(r.active_count) || 0), 0)}</Table.Summary.Cell>
                </Table.Summary.Row>
              </Table.Summary.Fixed>
            )}
          />
        ) : (
          <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>
            請選擇月份進行成長/衰退分析
          </div>
        )}

        {!selectedMonths.length && summary && (
          <div style={{ marginTop: 24, padding: 16, background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 4 }}>
            <Title level={5} style={{ margin: '0 0 12px 0', color: '#52c41a' }}>📊 數據摘要</Title>
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <Text type="secondary">資料涵蓋期間</Text>
                <div style={{ fontSize: 16, fontWeight: 'bold' }}>
                  {summary.first_month} ~ {summary.current_month}
                </div>
              </Col>
              <Col span={8}>
                <Text type="secondary">公關訂桌總消費</Text>
                <div style={{ fontSize: 16, fontWeight: 'bold', color: '#f39c12' }}>
                  {formatMoney(summary.total_gossip_consumption)}
                </div>
              </Col>
              <Col span={8}>
                <Text type="secondary">幹部公關總消費</Text>
                <div style={{ fontSize: 16, fontWeight: 'bold', color: '#52c41a' }}>
                  {formatMoney(summary.total_cadre_consumption)}
                </div>
              </Col>
            </Row>
          </div>
        )}
      </Card>
    </div>
  );
}
