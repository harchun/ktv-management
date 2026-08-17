import { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Select,
  Typography,
  Space,
  Tag,
  Row,
  Col,
  Statistic,
  Alert,
  Button,
  Checkbox
} from 'antd';
import {
  TrophyOutlined,
  RiseOutlined,
  FallOutlined,
  TableOutlined,
  DollarOutlined,
  PrinterOutlined
} from '@ant-design/icons';
import api from '../utils/api';

const { Title, Text } = Typography;

export default function TableAnalysis() {
  const [selectedMonths, setSelectedMonths] = useState([]);
  const [months, setMonths] = useState([]);
  const [allData, setAllData] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/stats/months')
      .then(res => {
        const data = res.data;
        const sorted = [...data].sort().reverse();
        setMonths(sorted);
        // Default: last 3 months
        setSelectedMonths(sorted.slice(0, 3));
      })
      .catch(err => console.error('Failed to load months:', err));
  }, []);

  useEffect(() => {
    if (selectedMonths.length === 0) return;

    setLoading(true);
    const promises = selectedMonths.map(m =>
      Promise.all([
        api.get(`/stats/table-usage?month=${m}`),
        api.get(`/stats/cadre-table?month=${m}`)
      ])
    );

    Promise.all(promises)
      .then(results => {
        const data = {};
        selectedMonths.forEach((m, i) => {
          data[m] = {
            custom: results[i][0].data || [],
            cadre: results[i][1].data || []
          };
        });
        setAllData(data);
      })
      .catch(err => console.error('Failed to load data:', err))
      .finally(() => setLoading(false));
  }, [selectedMonths]);

  const getMonthTotal = (month, type) => {
    const data = allData[month];
    if (!data) return { custom: { total: 0, count: 0 }, cadre: { total: 0, count: 0 } };
    const customTotal = data.custom.reduce((sum, r) => sum + (Number(r.總消費) || 0), 0);
    const cadreTotal = data.cadre.reduce((sum, r) => sum + (Number(r.總消費) || 0), 0);
    return {
      custom: { total: customTotal, count: data.custom.length },
      cadre: { total: cadreTotal, count: data.cadre.length }
    };
  };

  const getGrowthRate = (current, previous) => {
    if (!previous || previous === 0) return { rate: 0, isGrowth: true };
    const rate = ((current - previous) / previous * 100).toFixed(2);
    return { rate: parseFloat(rate), isGrowth: current >= previous };
  };

  const handleMonthChange = (values) => {
    setSelectedMonths(values.sort().reverse());
  };

  const handlePrint = () => {
    window.print();
  };

  const getRankStyle = (index) => {
    if (index === 0) return { background: '#FFD700', color: '#fff' };
    if (index === 1) return { background: '#C0C0C0', color: '#fff' };
    if (index === 2) return { background: '#CD7F32', color: '#fff' };
    return {};
  };

  return (
    <div className="table-analysis-container">
      {/* Header */}
      <div className="analysis-header print-header-hidden">
        <div>
          <Title level={2}>📊 訂桌分析報表</Title>
          <Text type="secondary">多月份成長/衰退趨勢分析（適合老闆報備）</Text>
        </div>
        <Space>
          <Select
            mode="multiple"
            value={selectedMonths}
            onChange={handleMonthChange}
            style={{ width: 280 }}
            placeholder="選擇月份（建議3-6個月）"
            maxTagCount={3}
          >
            {months.map(m => (
              <Select.Option key={m} value={m}>{m}</Select.Option>
            ))}
          </Select>
          <Button type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>
            列印A4報表
          </Button>
        </Space>
      </div>

      {/* Summary Cards */}
      <Row gutter={16} className="print-summary">
        <Col span={12}>
          <Card className="summary-card custom-card">
            <div className="card-header">
              <TrophyOutlined />
              <span>自訂桌統計</span>
            </div>
            <Row gutter={8}>
              {selectedMonths.map(m => {
                const d = getMonthTotal(m, 'custom');
                const idx = selectedMonths.indexOf(m);
                const prevD = idx > 0 ? getMonthTotal(selectedMonths[idx - 1], 'custom') : null;
                const growth = prevD ? getGrowthRate(d.total, prevD.total) : null;
                return (
                  <Col key={m} span={8}>
                    <Statistic
                      title={<span className="month-label">{m}</span>}
                      value={d.total}
                      prefix={<DollarOutlined />}
                      suffix="NT$"
                      precision={0}
                      valueStyle={{ fontSize: 16 }}
                    />
                    {growth && (
                      <Text type={growth.isGrowth ? 'success' : 'danger'} className="growth-text">
                        {growth.isGrowth ? '↑' : '↓'} {Math.abs(growth.rate)}%
                      </Text>
                    )}
                  </Col>
                );
              })}
            </Row>
          </Card>
        </Col>
        <Col span={12}>
          <Card className="summary-card cadre-card">
            <div className="card-header">
              <TrophyOutlined style={{ color: '#faad14' }} />
              <span>幹桌統計</span>
            </div>
            <Row gutter={8}>
              {selectedMonths.map(m => {
                const d = getMonthTotal(m, 'cadre');
                const idx = selectedMonths.indexOf(m);
                const prevD = idx > 0 ? getMonthTotal(selectedMonths[idx - 1], 'cadre') : null;
                const growth = prevD ? getGrowthRate(d.total, prevD.total) : null;
                return (
                  <Col key={m} span={8}>
                    <Statistic
                      title={<span className="month-label">{m}</span>}
                      value={d.total}
                      prefix={<DollarOutlined />}
                      suffix="NT$"
                      precision={0}
                      valueStyle={{ fontSize: 16 }}
                    />
                    {growth && (
                      <Text type={growth.isGrowth ? 'success' : 'danger'} className="growth-text">
                        {growth.isGrowth ? '↑' : '↓'} {Math.abs(growth.rate)}%
                      </Text>
                    )}
                  </Col>
                );
              })}
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Detailed Tables */}
      <Row gutter={16}>
        <Col span={12}>
          <Card
            title={<Space><TrophyOutlined />自訂桌統計明細</Space>}
            loading={loading}
          >
            {selectedMonths.map(m => {
              const data = allData[m]?.custom || [];
              if (data.length === 0) return null;
              return (
                <div key={m} className="month-section">
                  <Text strong className="month-title">{m}</Text>
                  <Table
                    dataSource={data}
                    columns={[
                      { title: '排名', dataIndex: 'rank', width: 50, render: (_, __, index) => <span style={getRankStyle(index)}>{index + 1}</span> },
                      { title: '幹部', dataIndex: '幹部', render: n => <Text strong>{n}</Text> },
                      { title: '總消費', dataIndex: '總消費', render: v => <Text type="danger">NT$ {Number(v).toLocaleString()}</Text> },
                      { title: '桌數', dataIndex: '桌數', width: 60, render: v => <Tag color="blue">{v}</Tag> }
                    ]}
                    rowKey="幹部"
                    pagination={false}
                    size="small"
                    summary={() => (
                      <Table.Summary>
                        <Table.Summary.Row style={{ background: '#f0f0f0' }}>
                          <Table.Summary.Cell><Text strong>合計</Text></Table.Summary.Cell>
                          <Table.Summary.Cell><Text strong>{data.length}人</Text></Table.Summary.Cell>
                          <Table.Summary.Cell>
                            <Text type="danger" strong>NT$ {data.reduce((s, r) => s + (Number(r.總消費) || 0), 0).toLocaleString()}</Text>
                          </Table.Summary.Cell>
                          <Table.Summary.Cell><Tag color="blue">{data.length}桌</Tag></Table.Summary.Cell>
                        </Table.Summary.Row>
                      </Table.Summary>
                    )}
                  />
                </div>
              );
            })}
          </Card>
        </Col>
        <Col span={12}>
          <Card
            title={<Space><TrophyOutlined style={{ color: '#faad14' }} />幹桌統計明細</Space>}
            loading={loading}
          >
            {selectedMonths.map(m => {
              const data = allData[m]?.cadre || [];
              if (data.length === 0) return null;
              return (
                <div key={m} className="month-section">
                  <Text strong className="month-title">{m}</Text>
                  <Table
                    dataSource={data}
                    columns={[
                      { title: '排名', dataIndex: 'rank', width: 50, render: (_, __, index) => <span style={getRankStyle(index)}>{index + 1}</span> },
                      { title: '公關', dataIndex: '公關', render: n => <Text strong>{n}</Text> },
                      { title: '總消費', dataIndex: '總消費', render: v => <Text type="danger">NT$ {Number(v).toLocaleString()}</Text> },
                      { title: '紀錄數', dataIndex: '紀錄數', width: 60, render: v => <Tag color="green">{v}</Tag> }
                    ]}
                    rowKey="公關"
                    pagination={false}
                    size="small"
                    summary={() => (
                      <Table.Summary>
                        <Table.Summary.Row style={{ background: '#f0f0f0' }}>
                          <Table.Summary.Cell><Text strong>合計</Text></Table.Summary.Cell>
                          <Table.Summary.Cell><Text strong>{data.length}人</Text></Table.Summary.Cell>
                          <Table.Summary.Cell>
                            <Text type="danger" strong>NT$ {data.reduce((s, r) => s + (Number(r.總消費) || 0), 0).toLocaleString()}</Text>
                          </Table.Summary.Cell>
                          <Table.Summary.Cell><Tag color="green">{data.length}筆</Tag></Table.Summary.Cell>
                        </Table.Summary.Row>
                      </Table.Summary>
                    )}
                  />
                </div>
              );
            })}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
