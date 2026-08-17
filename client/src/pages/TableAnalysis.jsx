import { useState, useEffect } from 'react';
import {
  Select,
  Typography,
  Space,
  Row,
  Col,
  Button,
  Card
} from 'antd';
import {
  TrophyOutlined,
  RiseOutlined,
  FallOutlined,
  PrinterOutlined,
  TeamOutlined,
  DollarCircleOutlined,
  LineChartOutlined,
  PieChartOutlined
} from '@ant-design/icons';
import api from '../utils/api';

const { Title, Text } = Typography;

// ==================== Custom Bar Chart ====================
function BarChart({ data, color }) {
  const maxVal = Math.max(...data.map(d => d.value));
  return (
    <div className="bar-chart">
      {data.map((d, i) => (
        <div key={i} className="bar-row">
          <span className="bar-label">{d.label}</span>
          <div className="bar-track">
            <div 
              className="bar-fill" 
              style={{ 
                width: `${(d.value / maxVal) * 100}%`,
                background: color
              }}
            />
          </div>
          <span className="bar-value">{d.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

// ==================== Donut Chart ====================
function DonutChart({ data, size = 120 }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  let cumulative = 0;
  const colors = ['#667eea', '#f093fb', '#4facfe', '#43e97b', '#fa709a'];
  
  const paths = data.map((d, i) => {
    const percent = d.value / total;
    const startAngle = cumulative * 360;
    const endAngle = (cumulative + percent) * 360;
    cumulative += percent;
    
    const startRad = (startAngle - 90) * Math.PI / 180;
    const endRad = (endAngle - 90) * Math.PI / 180;
    
    const r = size / 2;
    const cx = size / 2;
    const cy = size / 2;
    
    const x1 = cx + r * Math.cos(startRad);
    const y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad);
    const y2 = cy + r * Math.sin(endRad);
    
    const largeArc = percent > 0.5 ? 1 : 0;
    
    return {
      path: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`,
      color: colors[i % colors.length],
      name: d.name,
      percent: (percent * 100).toFixed(1)
    };
  });
  
  return (
    <div className="donut-container">
      <svg viewBox={`0 0 ${size} ${size}`} className="donut-svg">
        {paths.map((p, i) => (
          <path key={i} d={p.path} fill={p.color} />
        ))}
        <circle cx={size/2} cy={size/2} r={size/2 * 0.6} fill="white" />
      </svg>
      <div className="donut-legend">
        {paths.map((p, i) => (
          <div key={i} className="legend-item">
            <span className="legend-dot" style={{ background: p.color }} />
            <span className="legend-name">{p.name}</span>
            <span className="legend-pct">{p.percent}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==================== Trend Line Chart ====================
function TrendLine({ data, color }) {
  if (data.length < 2) return null;
  
  const maxVal = Math.max(...data.map(d => d.value));
  const minVal = Math.min(...data.map(d => d.value));
  const range = maxVal - minVal || 1;
  
  const width = 300;
  const height = 100;
  const padding = 20;
  
  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1)) * (width - padding * 2);
    const y = height - padding - ((d.value - minVal) / range) * (height - padding * 2);
    return `${x},${y}`;
  }).join(' ');
  
  return (
    <div className="trend-chart">
      <svg viewBox={`0 0 ${width} ${height}`} className="trend-svg">
        <defs>
          <linearGradient id={`grad-${color.replace('#', '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: color, stopOpacity: 0.3 }} />
            <stop offset="100%" style={{ stopColor: color, stopOpacity: 0 }} />
          </linearGradient>
        </defs>
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
        />
        {data.map((d, i) => {
          const x = padding + (i / (data.length - 1)) * (width - padding * 2);
          const y = height - padding - ((d.value - minVal) / range) * (height - padding * 2);
          return (
            <g key={i}>
              <circle cx={x} cy={y} r="3" fill={color} />
              <text x={x} y={y - 8} textAnchor="middle" fontSize="8" fill="#666">{d.label}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ==================== Main Report Component ====================
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

  const handleMonthChange = (values) => {
    setSelectedMonths(values.sort().reverse());
  };

  const handlePrint = () => {
    window.print();
  };

  // Calculate summary data
  const customSummary = selectedMonths.map(m => {
    const records = allData[m]?.custom || [];
    const total = records.reduce((sum, r) => sum + (Number(r.總消費) || 0), 0);
    const count = records.length;
    return { month: m, total, count };
  });

  const cadreSummary = selectedMonths.map(m => {
    const records = allData[m]?.cadre || [];
    const total = records.reduce((sum, r) => sum + (Number(r.總消費) || 0), 0);
    const count = records.length;
    return { month: m, total, count };
  });

  return (
    <div className="ta-page">
      {/* Control Panel */}
      <div className="ta-controls">
        <div className="ta-header">
          <div>
            <Title level={2} className="ta-title">📊 訂桌分析報告</Title>
            <Text type="secondary">多月份成長率分析報表</Text>
          </div>
          <Space>
            <Select
              mode="multiple"
              value={selectedMonths}
              onChange={handleMonthChange}
              style={{ width: 280 }}
              placeholder="選擇月份（3-6個月）"
              maxTagCount={2}
            >
              {months.map(m => (
                <Select.Option key={m} value={m}>{m}</Select.Option>
              ))}
            </Select>
            <Button 
              type="primary" 
              icon={<PrinterOutlined />} 
              onClick={handlePrint}
              size="large"
              className="ta-print-btn"
            >
              列印報告
            </Button>
          </Space>
        </div>
      </div>

      {/* Print Report */}
      <div className="print-report">
        {/* Slide 1: Cover */}
        <div className="slide cover-slide">
          <div className="cover-content">
            <div className="cover-logo">
              <TrophyOutlined className="logo-icon" />
            </div>
            <h1 className="cover-title">日月星辰 KTV</h1>
            <h2 className="cover-subtitle">訂桌分析報告</h2>
            <p className="cover-period">分析期間：{selectedMonths.join(' ~ ')}</p>
            <p className="cover-date">報告日期：{new Date().toLocaleDateString('zh-TW')}</p>
          </div>
        </div>

        {/* Slide 2: Summary */}
        <div className="slide summary-slide">
          <div className="slide-header">
            <span className="slide-number">01</span>
            <h2 className="slide-title">月度消費摘要</h2>
          </div>
          
          <div className="summary-grid">
            <div className="summary-card custom-card">
              <div className="card-icon" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                <DollarCircleOutlined />
              </div>
              <div className="card-content">
                <div className="card-label">自訂桌統計</div>
                <div className="card-total">
                  {customSummary[customSummary.length - 1]?.total.toLocaleString() || '0'}
                </div>
                <div className="card-meta">
                  <span>{customSummary[customSummary.length - 1]?.count || 0} 桌</span>
                  {customSummary.length > 1 && (
                    <span className={`growth-tag ${((customSummary[customSummary.length - 1]?.total - customSummary[customSummary.length - 2]?.total) / customSummary[customSummary.length - 2]?.total * 100) >= 0 ? 'up' : 'down'}`}>
                      {customSummary.length > 1 && (
                        <>
                          {((customSummary[customSummary.length - 1]?.total - customSummary[customSummary.length - 2]?.total) / customSummary[customSummary.length - 2]?.total * 100) >= 0 ? <RiseOutlined /> : <FallOutlined />}
                          {Math.abs(((customSummary[customSummary.length - 1]?.total - customSummary[customSummary.length - 2]?.total) / customSummary[customSummary.length - 2]?.total * 100)).toFixed(2)}%
                        </>
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="summary-card cadre-card">
              <div className="card-icon" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                <TeamOutlined />
              </div>
              <div className="card-content">
                <div className="card-label">幹部訂桌統計</div>
                <div className="card-total">
                  {cadreSummary[cadreSummary.length - 1]?.total.toLocaleString() || '0'}
                </div>
                <div className="card-meta">
                  <span>{cadreSummary[cadreSummary.length - 1]?.count || 0} 公關</span>
                  {cadreSummary.length > 1 && cadreSummary[cadreSummary.length - 1]?.total > 0 && cadreSummary[cadreSummary.length - 2]?.total > 0 && (
                    <span className={`growth-tag ${((cadreSummary[cadreSummary.length - 1]?.total - cadreSummary[cadreSummary.length - 2]?.total) / cadreSummary[cadreSummary.length - 2]?.total * 100) >= 0 ? 'up' : 'down'}`}>
                      {((cadreSummary[cadreSummary.length - 1]?.total - cadreSummary[cadreSummary.length - 2]?.total) / cadreSummary[cadreSummary.length - 2]?.total * 100) >= 0 ? <RiseOutlined /> : <FallOutlined />}
                      {Math.abs(((cadreSummary[cadreSummary.length - 1]?.total - cadreSummary[cadreSummary.length - 2]?.total) / cadreSummary[cadreSummary.length - 2]?.total * 100)).toFixed(2)}%
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Slide 3: Custom Table Trend */}
        <div className="slide chart-slide">
          <div className="slide-header">
            <span className="slide-number">02</span>
            <h2 className="slide-title">自訂桌消費趨勢</h2>
          </div>
          
          <div className="chart-container">
            <TrendLine 
              data={customSummary.map(s => ({
                label: s.month.slice(2),
                value: s.total
              }))}
              color="#667eea"
            />
          </div>
          
          <div className="bar-chart-container">
            <BarChart 
              data={customSummary.map(s => ({
                label: s.month,
                value: s.total
              }))}
              color="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
            />
          </div>
        </div>

        {/* Slide 4: Cadre Table Trend */}
        <div className="slide chart-slide">
          <div className="slide-header">
            <span className="slide-number">03</span>
            <h2 className="slide-title">幹部訂桌消費趨勢</h2>
          </div>
          
          <div className="chart-container">
            <TrendLine 
              data={cadreSummary.map(s => ({
                label: s.month.slice(2),
                value: s.total
              }))}
              color="#f093fb"
            />
          </div>
          
          <div className="bar-chart-container">
            <BarChart 
              data={cadreSummary.map(s => ({
                label: s.month,
                value: s.total
              }))}
              color="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
            />
          </div>
        </div>

        {/* Slide 5: TOP Analysis */}
        <div className="slide chart-slide">
          <div className="slide-header">
            <span className="slide-number">04</span>
            <h2 className="slide-title">TOP 3 占比分析</h2>
          </div>
          
          <div className="donut-grid">
            {selectedMonths.slice(0, 3).map(month => {
              const records = allData[month]?.custom?.slice(0, 3) || [];
              return (
                <div key={month} className="donut-item">
                  <h4 className="donut-title">{month}</h4>
                  <DonutChart 
                    data={records.map(r => ({
                      name: r.幹部,
                      value: Number(r.總消費) || 0
                    }))}
                    size={100}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Slide 6: Footer */}
        <div className="slide footer-slide">
          <div className="footer-content">
            <p className="footer-text">日月星辰 KTV 管理系統</p>
            <p className="footer-date">報告日期：{new Date().toLocaleDateString('zh-TW')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
