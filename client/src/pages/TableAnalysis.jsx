import { useState, useEffect } from 'react';
import {
  Card,
  Select,
  Typography,
  Space,
  Row,
  Col,
  Button
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

// ==================== Print Report Component ====================
function PrintReport({ data, months, type }) {
  // Calculate totals
  const totals = months.map(m => {
    const monthData = data[m];
    const records = type === 'custom' ? monthData?.custom || [] : monthData?.cadre || [];
    const total = records.reduce((sum, r) => sum + (Number(r.總消費) || 0), 0);
    const count = records.length;
    return { month: m, total, count };
  });

  // Calculate growth rates
  const growthRates = totals.map((t, idx) => {
    if (idx === 0) return null;
    const prev = totals[idx - 1].total;
    if (prev === 0) return { rate: 0, isGrowth: true };
    const rate = ((t.total - prev) / prev * 100).toFixed(2);
    return { rate: parseFloat(rate), isGrowth: t.total >= prev };
  });

  // Top 3 for pie chart
  const top3 = (month) => {
    const records = type === 'custom' 
      ? (data[month]?.custom || [])
      : (data[month]?.cadre || []);
    return records.slice(0, 3).map(r => ({
      name: type === 'custom' ? r.幹部 : r.公關,
      value: Number(r.總消費) || 0
    }));
  };

  const title = type === 'custom' ? '自訂桌統計分析' : '幹部訂桌統計分析';
  const icon = type === 'custom' ? <TrophyOutlined /> : <TeamOutlined />;
  const color = type === 'custom' ? '#52c41a' : '#faad14';

  return (
    <div className={`print-report ${type}-report`}>
      {/* Report Header */}
      <div className="report-header">
        <div className="report-logo">
          <div className="logo-icon">{icon}</div>
          <div>
            <div className="company-name">日月星辰 KTV</div>
            <div className="report-type">{title}</div>
          </div>
        </div>
        <div className="report-period">
          <div className="period-label">分析期間</div>
          <div className="period-value">{months[0]} ~ {months[months.length - 1]}</div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-section">
        <div className="section-title">
          <DollarCircleOutlined /> 月度消費摘要
        </div>
        <div className="summary-cards">
          {totals.map((t, idx) => (
            <div key={t.month} className="summary-card">
              <div className="card-month">{t.month.slice(5)}</div>
              <div className="card-amount">NT$ {t.total.toLocaleString()}</div>
              <div className="card-detail">{t.count} {type === 'custom' ? '桌' : '公關'}</div>
              {growthRates[idx] && (
                <div className={`card-growth ${growthRates[idx].isGrowth ? 'up' : 'down'}`}>
                  {growthRates[idx].isGrowth ? <RiseOutlined /> : <FallOutlined />}
                  {Math.abs(growthRates[idx].rate)}%
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Chart Section */}
      <div className="chart-section">
        <div className="section-title">
          <LineChartOutlined /> 消費趨勢圖
        </div>
        <div className="bar-chart-print">
          {totals.map((t, idx) => {
            const maxTotal = Math.max(...totals.map(x => x.total), 1);
            const height = Math.max((t.total / maxTotal) * 120, 4);
            return (
              <div key={t.month} className="bar-item">
                <div className="bar-value">NT${(t.total / 1000).toFixed(0)}K</div>
                <div 
                  className="bar"
                  style={{ height: `${height}px`, background: color }}
                />
                <div className="bar-month">{t.month.slice(5)}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* TOP 3 Section */}
      <div className="top3-section">
        <div className="section-title">
          <PieChartOutlined /> TOP 3 占比分析
        </div>
        <div className="top3-grid">
          {months.map(m => (
            <div key={m} className="top3-card">
              <div className="top3-title">{m} TOP 3</div>
              <div className="pie-chart-small">
                <PieChartSimple data={top3(m)} color={color} />
              </div>
              <div className="top3-total">
                總消費 NT$ {top3(m).reduce((s, d) => s + d.value, 0).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="report-footer">
        <div className="footer-left">日月星辰 KTV 管理系統</div>
        <div className="footer-right">
          列印日期：{new Date().toLocaleDateString('zh-TW')}
        </div>
      </div>
    </div>
  );
}

// Simple pie chart for print
function PieChartSimple({ data, color }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) {
    return <div className="empty-print">無數據</div>;
  }

  let cumulativePercent = 0;
  const colors = [color, '#1890ff', '#faad14'];
  
  const slices = data.map((item, idx) => {
    const percent = item.value / total;
    const startAngle = cumulativePercent * 360;
    const endAngle = (cumulativePercent + percent) * 360;
    cumulativePercent += percent;
    
    const startRad = (startAngle - 90) * Math.PI / 180;
    const endRad = (endAngle - 90) * Math.PI / 180;
    
    const x1 = 50 + 40 * Math.cos(startRad);
    const y1 = 50 + 40 * Math.sin(startRad);
    const x2 = 50 + 40 * Math.cos(endRad);
    const y2 = 50 + 40 * Math.sin(endRad);
    
    const largeArc = percent > 0.5 ? 1 : 0;
    
    return {
      path: percent >= 0.999 
        ? `M 50 50 L 50 10 A 40 40 0 1 1 49.99 10 Z`
        : `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`,
      color: colors[idx % colors.length],
      name: item.name,
      percent: (percent * 100).toFixed(1)
    };
  });

  return (
    <div className="pie-container">
      <svg viewBox="0 0 100 100" className="pie-svg-print">
        {slices.map((s, idx) => (
          <path key={idx} d={s.path} fill={s.color} stroke="white" strokeWidth="1" />
        ))}
        <circle cx="50" cy="50" r="25" fill="white" />
      </svg>
      <div className="pie-legend-print">
        {slices.map((s, idx) => (
          <div key={idx} className="legend-row-print">
            <span className="legend-dot-print" style={{ background: s.color }} />
            <span className="legend-name-print">{s.name}</span>
            <span className="legend-pct-print">{s.percent}%</span>
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
  const [showPrint, setShowPrint] = useState(false);

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
    setShowPrint(true);
    // Wait for React to re-render, then trigger print
    setTimeout(() => {
      window.print();
      // Keep print view visible - user will close print dialog themselves
    }, 100);
  };

  return (
    <div className="ta-wrapper">
      {/* Control Panel - Hidden when printing */}
      <div className="ta-control print-hide">
        <div className="ta-title">
          <Title level={3}>📊 訂桌分析報表</Title>
          <Text type="secondary">選擇月份進行多月份比較分析</Text>
        </div>
        <Space>
          <Select
            mode="multiple"
            value={selectedMonths}
            onChange={handleMonthChange}
            style={{ width: 260 }}
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
          >
            列印A4報表
          </Button>
        </Space>
      </div>

      {/* Preview Panel - Hidden when printing */}
      {!showPrint && (
        <div className="ta-preview print-hide">
          <div className="preview-info">
            <h3>報表預覽</h3>
            <p>點擊「列印A4報表」按鈕，將生成符合A4大小的專業報表</p>
          </div>
        </div>
      )}

      {/* Print Report - Only visible when printing */}
      {showPrint && (
        <div className="print-container">
          {/* Page 1: Custom Table Analysis */}
          <div className="print-page">
            <PrintReport 
              data={allData} 
              months={selectedMonths} 
              type="custom" 
            />
          </div>
          
          {/* Page 2: Cadre Table Analysis */}
          <div className="print-page">
            <PrintReport 
              data={allData} 
              months={selectedMonths} 
              type="cadre" 
            />
          </div>
        </div>
      )}
    </div>
  );
}
