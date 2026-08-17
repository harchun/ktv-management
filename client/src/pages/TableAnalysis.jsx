import { useState, useEffect } from 'react';
import {
  Card,
  Select,
  Typography,
  Space,
  Row,
  Col,
  Statistic,
  Button
} from 'antd';
import {
  TrophyOutlined,
  RiseOutlined,
  FallOutlined,
  PrinterOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import api from '../utils/api';

const { Title, Text } = Typography;

// Bar Chart Component
function BarChart({ data, title, color, height = 200 }) {
  const maxVal = Math.max(...data.map(d => d.value), 1);
  
  return (
    <div className="chart-container">
      <div className="chart-title">{title}</div>
      <div className="bar-chart">
        {data.map((item, idx) => (
          <div key={idx} className="bar-item">
            <div className="bar-wrapper">
              <div 
                className="bar"
                style={{ 
                  height: `${(item.value / maxVal) * 150}px`,
                  background: `linear-gradient(180deg, ${color} 0%, ${color}88 100%)`
                }}
              />
              <div className="bar-value">NT$ {item.value.toLocaleString()}</div>
            </div>
            <div className="bar-label">{item.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Pie Chart Component (Simple CSS-based)
function PieChart({ data, title }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  let cumulativePercent = 0;
  
  const colors = ['#1890ff', '#52c41a', '#faad14', '#ff4d4f', '#722ed1', '#13c2c2'];
  
  return (
    <div className="pie-chart-container">
      <div className="chart-title">{title}</div>
      <div className="pie-wrapper">
        <svg viewBox="0 0 100 100" className="pie-svg">
          {data.map((item, idx) => {
            const percent = total > 0 ? item.value / total : 0;
            const startAngle = cumulativePercent * 360;
            const endAngle = (cumulativePercent + percent) * 360;
            cumulativePercent += percent;
            
            const startRad = (startAngle - 90) * Math.PI / 180;
            const endRad = (endAngle - 90) * Math.PI / 180;
            
            const x1 = 50 + 45 * Math.cos(startRad);
            const y1 = 50 + 45 * Math.sin(startRad);
            const x2 = 50 + 45 * Math.cos(endRad);
            const y2 = 50 + 45 * Math.sin(endRad);
            
            const largeArc = percent > 0.5 ? 1 : 0;
            
            const pathData = percent >= 1 
              ? `M 50 50 L 50 5 A 45 45 0 1 1 49.99 5 Z`
              : `M 50 50 L ${x1} ${y1} A 45 45 0 ${largeArc} 1 ${x2} ${y2} Z`;
            
            return (
              <path
                key={idx}
                d={pathData}
                fill={colors[idx % colors.length]}
                stroke="white"
                strokeWidth="0.5"
              />
            );
          })}
          <circle cx="50" cy="50" r="25" fill="white" />
        </svg>
        <div className="pie-center">
          <div className="pie-total">NT$ {total.toLocaleString()}</div>
          <div className="pie-label">總消費</div>
        </div>
      </div>
      <div className="pie-legend">
        {data.map((item, idx) => (
          <div key={idx} className="legend-item">
            <span className="legend-color" style={{ background: colors[idx % colors.length] }}></span>
            <span className="legend-name">{item.name}</span>
            <span className="legend-value">{((item.value / total) * 100).toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Line Chart Component for trends
function LineChart({ data, title }) {
  const maxVal = Math.max(...data.map(d => d.value), 1);
  const minVal = Math.min(...data.map(d => d.value), 0);
  const range = maxVal - minVal || 1;
  
  const points = data.map((item, idx) => {
    const x = (idx / (data.length - 1 || 1)) * 300 + 25;
    const y = 150 - ((item.value - minVal) / range) * 120;
    return `${x},${y}`;
  }).join(' ');
  
  return (
    <div className="line-chart-container">
      <div className="chart-title">{title}</div>
      <svg viewBox="0 0 350 180" className="line-svg">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
          <line key={i} x1="25" y1={20 + p * 130} x2="330" y2={20 + p * 130} 
                stroke="#f0f0f0" strokeWidth="1" />
        ))}
        {/* Line */}
        <polyline points={points} fill="none" stroke="#1890ff" strokeWidth="3" />
        {/* Points */}
        {data.map((item, idx) => {
          const x = (idx / (data.length - 1 || 1)) * 300 + 25;
          const y = 150 - ((item.value - minVal) / range) * 120;
          return (
            <g key={idx}>
              <circle cx={x} cy={y} r="5" fill="#1890ff" stroke="white" strokeWidth="2" />
              <text x={x} y={y - 12} textAnchor="middle" fill="#333" fontSize="11" fontWeight="bold">
                NT$ {(item.value / 1000).toFixed(0)}K
              </text>
              <text x={x} y="170" textAnchor="middle" fill="#666" fontSize="11">{item.label}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

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

  const getMonthTotal = (month) => {
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

  // Prepare chart data
  const customBarData = selectedMonths.map(m => ({
    name: m,
    value: getMonthTotal(m).custom.total
  }));

  const cadreBarData = selectedMonths.map(m => ({
    name: m,
    value: getMonthTotal(m).cadre.total
  }));

  const customTop3 = (month) => {
    const data = allData[month]?.custom || [];
    return data.slice(0, 3).map(r => ({
      name: r.幹部,
      value: Number(r.總消費) || 0
    }));
  };

  const cadreTop3 = (month) => {
    const data = allData[month]?.cadre || [];
    return data.slice(0, 3).map(r => ({
      name: r.公關,
      value: Number(r.總消費) || 0
    }));
  };

  // Line chart data for trends
  const customTrendData = selectedMonths.map((m, idx) => ({
    label: m,
    value: getMonthTotal(m).custom.total
  }));

  const cadreTrendData = selectedMonths.map((m, idx) => ({
    label: m,
    value: getMonthTotal(m).cadre.total
  }));

  return (
    <div className="table-analysis-container">
      {/* Control Header - Hidden when printing */}
      <div className="control-header print-hidden">
        <div>
          <Title level={3}>📊 訂桌分析報表</Title>
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

      {/* Print Header */}
      <div className="print-section print-summary-section">
        <div className="report-title">日月星辰 KTV 訂桌分析報告</div>
        <div className="report-period">分析期間：{selectedMonths.join(' 至 ')} 月</div>
      </div>

      {/* Summary Cards */}
      <Row gutter={24} className="summary-row">
        <Col span={12}>
          <Card className="summary-card custom-card" loading={loading}>
            <div className="card-header">
              <TrophyOutlined />
              <span>自訂桌統計</span>
            </div>
            <Row gutter={16}>
              {selectedMonths.map((m, idx) => {
                const d = getMonthTotal(m);
                const prevD = idx > 0 ? getMonthTotal(selectedMonths[idx - 1]) : null;
                const growth = prevD ? getGrowthRate(d.custom.total, prevD.custom.total) : null;
                return (
                  <Col key={m} span={8}>
                    <div className="summary-item">
                      <div className="summary-month">{m}</div>
                      <div className="summary-amount">NT$ {d.custom.total.toLocaleString()}</div>
                      <div className="summary-detail">{d.custom.count} 桌</div>
                      {growth && (
                        <div className={`growth-badge ${growth.isGrowth ? 'growth' : 'decline'}`}>
                          {growth.isGrowth ? <RiseOutlined /> : <FallOutlined />}
                          {Math.abs(growth.rate)}%
                        </div>
                      )}
                    </div>
                  </Col>
                );
              })}
            </Row>
          </Card>
        </Col>
        <Col span={12}>
          <Card className="summary-card cadre-card" loading={loading}>
            <div className="card-header">
              <TrophyOutlined style={{ color: '#faad14' }} />
              <span>幹部訂桌統計</span>
            </div>
            <Row gutter={16}>
              {selectedMonths.map((m, idx) => {
                const d = getMonthTotal(m);
                const prevD = idx > 0 ? getMonthTotal(selectedMonths[idx - 1]) : null;
                const growth = prevD ? getGrowthRate(d.cadre.total, prevD.cadre.total) : null;
                return (
                  <Col key={m} span={8}>
                    <div className="summary-item">
                      <div className="summary-month">{m}</div>
                      <div className="summary-amount">NT$ {d.cadre.total.toLocaleString()}</div>
                      <div className="summary-detail">{d.cadre.length} 公關</div>
                      {growth && (
                        <div className={`growth-badge ${growth.isGrowth ? 'growth' : 'decline'}`}>
                          {growth.isGrowth ? <RiseOutlined /> : <FallOutlined />}
                          {Math.abs(growth.rate)}%
                        </div>
                      )}
                    </div>
                  </Col>
                );
              })}
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Charts Section */}
      <Row gutter={24}>
        {/* Custom Table Bar Chart */}
        <Col span={12}>
          <Card title={<Space><BarChartOutlined />自訂桌月度趨勢</Space>} loading={loading}>
            <BarChart data={customBarData} title="" color="#1890ff" height={200} />
          </Card>
        </Col>

        {/* Cadre Table Bar Chart */}
        <Col span={12}>
          <Card title={<Space><BarChartOutlined />幹部訂桌月度趨勢</Space>} loading={loading}>
            <BarChart data={cadreBarData} title="" color="#faad14" height={200} />
          </Card>
        </Col>
      </Row>

      {/* Line Charts for Trends */}
      <Row gutter={24}>
        <Col span={12}>
          <Card title={<Space><BarChartOutlined />自訂桌成長趨勢</Space>} loading={loading}>
            <LineChart data={customTrendData} title="" />
          </Card>
        </Col>
        <Col span={12}>
          <Card title={<Space><BarChartOutlined />幹部訂桌成長趨勢</Space>} loading={loading}>
            <LineChart data={cadreTrendData} title="" />
          </Card>
        </Col>
      </Row>

      {/* Pie Charts for Top Contributors */}
      <Row gutter={24}>
        {selectedMonths.map(m => (
          <Col span={12} key={m}>
            <Card title={<span>{m} 自訂桌 TOP 3</span>} loading={loading}>
              <PieChart data={customTop3(m)} title="" />
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={24}>
        {selectedMonths.map(m => (
          <Col span={12} key={m}>
            <Card title={<span>{m} 幹部訂桌 TOP 3</span>} loading={loading}>
              <PieChart data={cadreTop3(m)} title="" />
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
}
