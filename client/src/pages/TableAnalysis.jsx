import { useState, useEffect, useRef } from 'react';
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
  Checkbox,
  Modal,
  DatePicker
} from 'antd';
import {
  TrophyOutlined,
  RiseOutlined,
  FallOutlined,
  TableOutlined,
  DollarOutlined,
  PrinterOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import api from '../utils/api';
import dayjs from 'dayjs';
import './TableAnalysis.css';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

export default function TableAnalysis() {
  const [selectedMonths, setSelectedMonths] = useState([]);
  const [months, setMonths] = useState([]);
  const [allData, setAllData] = useState({});
  const [loading, setLoading] = useState(false);
  const printRef = useRef(null);

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

  // Print view
  if (typeof window !== 'undefined' && window.location.hash === '#print') {
    return <PrintView allData={allData} months={selectedMonths} />;
  }

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

      {/* Trend Chart Section */}
      <Card
        title={<Space><BarChartOutlined />月度趨勢對比</Space>}
        className="trend-card print-header-hidden"
      >
        <TrendChart allData={allData} months={selectedMonths} />
      </Card>

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

// Print View Component
function PrintView({ allData, months }) {
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

  return (
    <div className="print-report">
      <div className="print-header">
        <h1>日月星辰 KTV 訂桌分析報告</h1>
        <p>分析期間：{months[0]} ~ {months[months.length - 1]}</p>
        <p>報告日期：{dayjs().format('YYYY年MM月DD日')}</p>
      </div>

      {/* Summary Table */}
      <div className="print-section">
        <h2>一、月度統計摘要</h2>
        <table className="print-table">
          <thead>
            <tr>
              <th rowSpan="2">統計項目</th>
              {months.map(m => <th key={m}>{m}</th>)}
              <th rowSpan="2">趨勢</th>
            </tr>
            <tr>
              {months.map(m => <th key={`sub-${m}`}>消費金額</th>)}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>自訂桌統計</td>
              {months.map(m => {
                const d = getMonthTotal(m, 'custom');
                return <td key={m}>NT$ {d.custom.total.toLocaleString()}</td>;
              })}
              <td>
                {months.length >= 2 && (
                  <span className={getGrowthRate(
                    getMonthTotal(months[months.length - 1], 'custom').custom.total,
                    getMonthTotal(months[months.length - 2], 'custom').custom.total
                  ).isGrowth ? 'positive' : 'negative'}>
                    {getGrowthRate(
                      getMonthTotal(months[months.length - 1], 'custom').custom.total,
                      getMonthTotal(months[months.length - 2], 'custom').custom.total
                    ).rate > 0 ? '↑' : '↓'}
                    {Math.abs(getGrowthRate(
                      getMonthTotal(months[months.length - 1], 'custom').custom.total,
                      getMonthTotal(months[months.length - 2], 'custom').custom.total
                    ).rate).toFixed(1)}%
                  </span>
                )}
              </td>
            </tr>
            <tr>
              <td>幹桌統計</td>
              {months.map(m => {
                const d = getMonthTotal(m, 'cadre');
                return <td key={m}>NT$ {d.cadre.total.toLocaleString()}</td>;
              })}
              <td>
                {months.length >= 2 && (
                  <span className={getGrowthRate(
                    getMonthTotal(months[months.length - 1], 'cadre').cadre.total,
                    getMonthTotal(months[months.length - 2], 'cadre').cadre.total
                  ).isGrowth ? 'positive' : 'negative'}>
                    {getGrowthRate(
                      getMonthTotal(months[months.length - 1], 'cadre').cadre.total,
                      getMonthTotal(months[months.length - 2], 'cadre').cadre.total
                    ).rate > 0 ? '↑' : '↓'}
                    {Math.abs(getGrowthRate(
                      getMonthTotal(months[months.length - 1], 'cadre').cadre.total,
                      getMonthTotal(months[months.length - 2], 'cadre').cadre.total
                    ).rate).toFixed(1)}%
                  </span>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Custom Tables Detail */}
      <div className="print-section">
        <h2>二、自訂桌統計明細</h2>
        {months.map(m => {
          const data = allData[m]?.custom || [];
          if (data.length === 0) return null;
          return (
            <div key={m} className="print-month-group">
              <h3>{m}月</h3>
              <table className="print-table small">
                <thead>
                  <tr>
                    <th>排名</th>
                    <th>幹部</th>
                    <th>總消費</th>
                    <th>桌數</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, i) => (
                    <tr key={row.幹部}>
                      <td>{i + 1}</td>
                      <td>{row.幹部}</td>
                      <td>NT$ {Number(row.總消費).toLocaleString()}</td>
                      <td>{row.桌數}</td>
                    </tr>
                  ))}
                  <tr className="summary-row">
                    <td colSpan="2"><strong>合計</strong></td>
                    <td><strong>NT$ {data.reduce((s, r) => s + (Number(r.總消費) || 0), 0).toLocaleString()}</strong></td>
                    <td><strong>{data.length}桌</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>
          );
        })}
      </div>

      {/* Cadre Tables Detail */}
      <div className="print-section">
        <h2>三、幹桌統計明細</h2>
        {months.map(m => {
          const data = allData[m]?.cadre || [];
          if (data.length === 0) return null;
          return (
            <div key={m} className="print-month-group">
              <h3>{m}月</h3>
              <table className="print-table small">
                <thead>
                  <tr>
                    <th>排名</th>
                    <th>公關</th>
                    <th>總消費</th>
                    <th>紀錄數</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, i) => (
                    <tr key={row.公關}>
                      <td>{i + 1}</td>
                      <td>{row.公關}</td>
                      <td>NT$ {Number(row.總消費).toLocaleString()}</td>
                      <td>{row.紀錄數}</td>
                    </tr>
                  ))}
                  <tr className="summary-row">
                    <td colSpan="2"><strong>合計</strong></td>
                    <td><strong>NT$ {data.reduce((s, r) => s + (Number(r.總消費) || 0), 0).toLocaleString()}</strong></td>
                    <td><strong>{data.length}筆</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>
          );
        })}
      </div>

      <div className="print-footer">
        <p>報告生成時間：{dayjs().format('YYYY-MM-DD HH:mm:ss')}</p>
        <p>日月星辰 KTV 管理系統</p>
      </div>
    </div>
  );
}

// Trend Chart Component
function TrendChart({ allData, months }) {
  const getTotals = () => {
    return months.map(m => {
      const customData = allData[m]?.custom || [];
      const cadreData = allData[m]?.cadre || [];
      const customTotal = customData.reduce((sum, r) => sum + (Number(r.總消費) || 0), 0);
      const cadreTotal = cadreData.reduce((sum, r) => sum + (Number(r.總消費) || 0), 0);
      return { month: m, custom: customTotal, cadre: cadreTotal };
    });
  };

  const data = getTotals();
  const maxVal = Math.max(...data.map(d => Math.max(d.custom, d.cadre)));

  return (
    <div className="trend-chart">
      <div className="chart-header">
        <span className="legend-item">
          <span className="legend-color custom-color"></span>
          自訂桌統計
        </span>
        <span className="legend-item">
          <span className="legend-color cadre-color"></span>
          幹桌統計
        </span>
      </div>
      <div className="chart-body">
        {data.map((d, i) => (
          <div key={d.month} className="chart-column">
            <div className="bar-group">
              <div
                className="bar custom-bar"
                style={{ height: `${(d.custom / maxVal) * 150}px` }}
                title={`自訂桌: NT$ ${d.custom.toLocaleString()}`}
              />
              <div
                className="bar cadre-bar"
                style={{ height: `${(d.cadre / maxVal) * 150}px` }}
                title={`幹桌: NT$ ${d.cadre.toLocaleString()}`}
              />
            </div>
            <div className="bar-values">
              <span className="custom-value">NT${(d.custom / 1000).toFixed(0)}k</span>
              <span className="cadre-value">NT${(d.cadre / 1000).toFixed(0)}k</span>
            </div>
            <div className="month-label">{d.month}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

const getGrowthRate = (current, previous) => {
  if (!previous || previous === 0) return { rate: 0, isGrowth: true };
  const rate = ((current - previous) / previous * 100);
  return { rate: parseFloat(rate.toFixed(2)), isGrowth: current >= previous };
};
