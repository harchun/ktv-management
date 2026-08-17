import { useState, useEffect } from 'react';
import {
  Card,
  Select,
  Typography,
  Space,
  Row,
  Col,
  Statistic,
  Button,
  Divider
} from 'antd';
import {
  TrophyOutlined,
  RiseOutlined,
  FallOutlined,
  PrinterOutlined,
  DollarCircleOutlined,
  TeamOutlined,
  LineChartOutlined,
  PieChartOutlined
} from '@ant-design/icons';
import api from '../utils/api';

const { Title, Text, Span } = Typography;

// ==================== Bar Chart ====================
function BarChart({ data, color, height = 180 }) {
  const maxVal = Math.max(...data.map(d => d.value), 1);
  
  return (
    <div className="bar-chart-wrapper">
      <div className="bar-chart">
        {data.map((item, idx) => (
          <div key={idx} className="bar-group">
            <div className="bar-value-label">
              NT$ {(item.value / 1000).toFixed(0)}K
            </div>
            <div 
              className="bar-fill"
              style={{ 
                height: `${Math.max((item.value / maxVal) * 120, 4)}px`,
                background: `linear-gradient(180deg, ${color} 0%, ${color}CC 100%)`
              }}
            />
            <div className="bar-label">{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==================== Line Chart ====================
function LineChart({ data, color }) {
  if (data.length < 2) return null;
  
  const padding = 40;
  const width = 400;
  const height = 160;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  
  const maxVal = Math.max(...data.map(d => d.value), 1);
  const minVal = Math.min(...data.map(d => d.value), 0);
  const range = maxVal - minVal || 1;
  
  const points = data.map((item, idx) => {
    const x = padding + (idx / (data.length - 1)) * chartWidth;
    const y = padding + chartHeight - ((item.value - minVal) / range) * chartHeight;
    return { x, y, ...item };
  });
  
  const pathD = points.map((p, idx) => 
    `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
  ).join(' ');
  
  const areaD = pathD + ` L ${points[points.length-1].x} ${padding + chartHeight} L ${points[0].x} ${padding + chartHeight} Z`;
  
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="line-chart-svg">
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
        <line 
          key={i} 
          x1={padding} 
          y1={padding + p * chartHeight} 
          x2={width - padding} 
          y2={padding + p * chartHeight}
          stroke="#f0f0f0" 
          strokeWidth="1" 
        />
      ))}
      
      {/* Area fill */}
      <path d={areaD} fill={color} fillOpacity="0.1" />
      
      {/* Line */}
      <path d={pathD} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      
      {/* Points */}
      {points.map((p, idx) => (
        <g key={idx}>
          <circle cx={p.x} cy={p.y} r="6" fill="white" stroke={color} strokeWidth="3" />
          <text x={p.x} y={p.y - 14} textAnchor="middle" fill="#333" fontSize="11" fontWeight="600">
            NT$ {(p.value / 1000).toFixed(0)}K
          </text>
          <text x={p.x} y={height - 8} textAnchor="middle" fill="#999" fontSize="11">
            {p.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

// ==================== Pie Chart ====================
function PieChart({ data, size = 140 }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) {
    return (
      <div className="empty-pie">
        <PieChartOutlined style={{ fontSize: 32, color: '#d9d9d9' }} />
        <Text type="secondary">無數據</Text>
      </div>
    );
  }
  
  let cumulativePercent = 0;
  const colors = ['#52c41a', '#1890ff', '#faad14', '#ff4d4f', '#722ed1', '#13c2c2'];
  
  const slices = data.map((item, idx) => {
    const percent = item.value / total;
    const startAngle = cumulativePercent * 360;
    const endAngle = (cumulativePercent + percent) * 360;
    cumulativePercent += percent;
    
    const startRad = (startAngle - 90) * Math.PI / 180;
    const endRad = (endAngle - 90) * Math.PI / 180;
    
    const x1 = 50 + 42 * Math.cos(startRad);
    const y1 = 50 + 42 * Math.sin(startRad);
    const x2 = 50 + 42 * Math.cos(endRad);
    const y2 = 50 + 42 * Math.sin(endRad);
    
    const largeArc = percent > 0.5 ? 1 : 0;
    
    return {
      path: percent >= 0.999 
        ? `M 50 50 L 50 8 A 42 42 0 1 1 49.99 8 Z`
        : `M 50 50 L ${x1} ${y1} A 42 42 0 ${largeArc} 1 ${x2} ${y2} Z`,
      color: colors[idx % colors.length],
      name: item.name,
      percent: (percent * 100).toFixed(1)
    };
  });
  
  return (
    <div className="pie-chart-wrapper">
      <svg viewBox="0 0 100 100" className="pie-svg">
        {slices.map((s, idx) => (
          <path key={idx} d={s.path} fill={s.color} stroke="white" strokeWidth="1" />
        ))}
        <circle cx="50" cy="50" r="28" fill="white" />
      </svg>
      <div className="pie-center-info">
        <div className="pie-total">NT$ {(total / 1000).toFixed(0)}K</div>
        <div className="pie-sub">總消費</div>
      </div>
      <div className="pie-legend">
        {slices.map((s, idx) => (
          <div key={idx} className="legend-row">
            <span className="legend-dot" style={{ background: s.color }} />
            <span className="legend-name">{s.name}</span>
            <span className="legend-pct">{s.percent}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==================== Main Component ====================
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

  // Chart data preparation
  const customBarData = selectedMonths.map(m => ({
    label: m.slice(5),
    value: getMonthTotal(m).custom.total
  }));

  const cadreBarData = selectedMonths.map(m => ({
    label: m.slice(5),
    value: getMonthTotal(m).cadre.total
  }));

  const customTrendData = selectedMonths.map(m => ({
    label: m.slice(5),
    value: getMonthTotal(m).custom.total
  }));

  const cadreTrendData = selectedMonths.map(m => ({
    label: m.slice(5),
    value: getMonthTotal(m).cadre.total
  }));

  const customTop3 = (month) => 
    (allData[month]?.custom || []).slice(0, 3).map(r => ({
      name: r.幹部,
      value: Number(r.總消費) || 0
    }));

  const cadreTop3 = (month) => 
    (allData[month]?.cadre || []).slice(0, 3).map(r => ({
      name: r.公關,
      value: Number(r.總消費) || 0
    }));

  return (
    <div className="ta-container">
      {/* Header */}
      <div className="ta-header print-hide">
        <div className="ta-header-left">
          <Title level={2} className="ta-title">訂桌分析報表</Title>
          <Text className="ta-subtitle">多月份成長/衰退趨勢分析 · 適合老闆報備</Text>
        </div>
        <Space className="ta-header-right">
          <Select
            mode="multiple"
            value={selectedMonths}
            onChange={handleMonthChange}
            style={{ width: 260 }}
            placeholder="選擇月份"
            maxTagCount={2}
            className="ta-month-select"
          >
            {months.map(m => (
              <Select.Option key={m} value={m}>{m}</Select.Option>
            ))}
          </Select>
          <Button 
            type="primary" 
            icon={<PrinterOutlined />} 
            onClick={handlePrint}
            className="ta-print-btn"
          >
            列印報表
          </Button>
        </Space>
      </div>

      {/* Report Title - Print Only */}
      <div className="ta-print-title print-only">
        <h1>日月星辰 KTV 訂桌分析報告</h1>
        <p>分析期間：{selectedMonths.join(' 至 ')} 月</p>
      </div>

      {/* Summary Cards */}
      <Row gutter={[20, 20]} className="ta-summary-row">
        <Col span={12}>
          <Card className="ta-card ta-custom-card" loading={loading}>
            <div className="ta-card-header">
              <div className="ta-card-icon ta-custom-icon">
                <TrophyOutlined />
              </div>
              <div className="ta-card-info">
                <span className="ta-card-title">自訂桌統計</span>
                <span className="ta-card-desc">幹部自訂桌消費分析</span>
              </div>
            </div>
            <Row gutter={[12, 12]} className="ta-summary-items">
              {selectedMonths.map((m, idx) => {
                const d = getMonthTotal(m);
                const prevD = idx > 0 ? getMonthTotal(selectedMonths[idx - 1]) : null;
                const growth = prevD ? getGrowthRate(d.custom.total, prevD.custom.total) : null;
                return (
                  <Col key={m} span={8}>
                    <div className="ta-summary-item">
                      <div className="ta-month-tag">{m.slice(5)}</div>
                      <div className="ta-amount">NT$ {d.custom.total.toLocaleString()}</div>
                      <div className="ta-detail">{d.custom.count} 桌</div>
                      {growth && (
                        <div className={`ta-growth ${growth.isGrowth ? 'ta-growth-up' : 'ta-growth-down'}`}>
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
          <Card className="ta-card ta-cadre-card" loading={loading}>
            <div className="ta-card-header">
              <div className="ta-card-icon ta-cadre-icon">
                <TeamOutlined />
              </div>
              <div className="ta-card-info">
                <span className="ta-card-title">幹部訂桌統計</span>
                <span className="ta-card-desc">公關訂桌消費分析</span>
              </div>
            </div>
            <Row gutter={[12, 12]} className="ta-summary-items">
              {selectedMonths.map((m, idx) => {
                const d = getMonthTotal(m);
                const prevD = idx > 0 ? getMonthTotal(selectedMonths[idx - 1]) : null;
                const growth = prevD ? getGrowthRate(d.cadre.total, prevD.cadre.total) : null;
                return (
                  <Col key={m} span={8}>
                    <div className="ta-summary-item">
                      <div className="ta-month-tag">{m.slice(5)}</div>
                      <div className="ta-amount">NT$ {d.cadre.total.toLocaleString()}</div>
                      <div className="ta-detail">{d.cadre.length} 公關</div>
                      {growth && (
                        <div className={`ta-growth ${growth.isGrowth ? 'ta-growth-up' : 'ta-growth-down'}`}>
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
      <Divider className="ta-section-divider print-hide">
        <LineChartOutlined /> 趨勢分析
      </Divider>

      <Row gutter={[20, 20]} className="ta-charts-row">
        <Col span={12}>
          <Card className="ta-card" title={<span className="ta-card-label">自訂桌月度消費</span>}>
            <BarChart data={customBarData} color="#52c41a" />
          </Card>
        </Col>
        <Col span={12}>
          <Card className="ta-card" title={<span className="ta-card-label">幹部訂桌月度消費</span>}>
            <BarChart data={cadreBarData} color="#faad14" />
          </Card>
        </Col>
      </Row>

      <Row gutter={[20, 20]} className="ta-charts-row">
        <Col span={12}>
          <Card className="ta-card" title={<span className="ta-card-label">自訂桌成長趨勢</span>}>
            <LineChart data={customTrendData} color="#52c41a" />
          </Card>
        </Col>
        <Col span={12}>
          <Card className="ta-card" title={<span className="ta-card-label">幹部訂桌成長趨勢</span>}>
            <LineChart data={cadreTrendData} color="#faad14" />
          </Card>
        </Col>
      </Row>

      {/* TOP 3 Charts */}
      <Divider className="ta-section-divider print-hide">
        <PieChartOutlined /> TOP 3 占比分析
      </Divider>

      <Row gutter={[20, 20]}>
        {selectedMonths.map(m => (
          <Col span={8} key={m}>
            <Card className="ta-card ta-pie-card" title={<span className="ta-card-label">{m} 自訂桌 TOP 3</span>}>
              <PieChart data={customTop3(m)} />
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[20, 20]} className="ta-pie-row-2">
        {selectedMonths.map(m => (
          <Col span={8} key={m}>
            <Card className="ta-card ta-pie-card" title={<span className="ta-card-label">{m} 幹部訂桌 TOP 3</span>}>
              <PieChart data={cadreTop3(m)} />
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
}
