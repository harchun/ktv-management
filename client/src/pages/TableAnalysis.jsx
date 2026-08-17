import { useState, useEffect } from 'react';
import {
  Select,
  Typography,
  Space,
  Button
} from 'antd';
import {
  TrophyOutlined,
  RiseOutlined,
  FallOutlined,
  PrinterOutlined,
  TeamOutlined,
  DollarCircleOutlined
} from '@ant-design/icons';
import api from '../utils/api';
import './TableAnalysis.css';

const { Title, Text } = Typography;

// ==================== Print Report Component ====================
function PrintReport({ customSummary, cadreSummary, months, allData }) {
  // Calculate growth rates - sort chronologically first
  const getGrowth = (current, previous) => {
    if (!previous || previous === 0) return { rate: 0, isGrowth: true };
    const rate = ((current - previous) / previous * 100);
    return { rate, isGrowth: rate >= 0 };
  };

  // Sort summaries chronologically for growth calculation
  const sortedCustomSummary = [...customSummary].sort((a, b) => a.month.localeCompare(b.month));
  const sortedCadreSummary = [...cadreSummary].sort((a, b) => a.month.localeCompare(b.month));

  // Calculate growth for each month based on chronological order
  const customSummaryWithGrowth = sortedCustomSummary.map((s, i) => {
    const prev = i > 0 ? sortedCustomSummary[i-1] : null;
    const growth = prev ? getGrowth(s.total, prev.total) : null;
    return { ...s, growth };
  });

  const cadreSummaryWithGrowth = sortedCadreSummary.map((s, i) => {
    const prev = i > 0 ? sortedCadreSummary[i-1] : null;
    const growth = prev ? getGrowth(s.total, prev.total) : null;
    return { ...s, growth };
  });

  // Calculate overall growth for cards (latest month vs previous)
  const customGrowth = customSummaryWithGrowth.length > 1 
    ? getGrowth(sortedCustomSummary[sortedCustomSummary.length - 1].total, sortedCustomSummary[sortedCustomSummary.length - 2].total)
    : { rate: 0, isGrowth: true };

  const cadreGrowth = cadreSummaryWithGrowth.length > 1
    ? getGrowth(sortedCadreSummary[sortedCadreSummary.length - 1].total, sortedCadreSummary[sortedCadreSummary.length - 2].total)
    : { rate: 0, isGrowth: true };

  return (
    <div className="a4-report">
      {/* Page 1: Cover */}
      <div className="page cover-page">
        <div className="cover-content">
          <div className="cover-logo">
            <TrophyOutlined />
          </div>
          <h1 className="cover-title">日月星辰 KTV</h1>
          <h2 className="cover-subtitle">訂桌分析報告</h2>
          <div className="cover-divider" />
          <p className="cover-period">
            <span className="label">分析期間</span>
            <span className="value">{months.slice().sort().reverse().join(' ~ ')}</span>
          </p>
          <p className="cover-date">
            <span className="label">報告日期</span>
            <span className="value">{new Date().toLocaleDateString('zh-TW')}</span>
          </p>
        </div>
      </div>

      {/* Page 2: Summary */}
      <div className="page summary-page">
        <div className="page-header">
          <span className="page-number">01</span>
          <h2 className="page-title">月度消費摘要</h2>
        </div>
        
        <div className="summary-table">
          <table className="data-table">
            <thead>
              <tr>
                <th className="col-month">月份</th>
                <th className="col-amount">消費金額</th>
                <th className="col-count">桌數/公關</th>
                <th className="col-growth">成長率</th>
              </tr>
            </thead>
            <tbody>
              <tr className="section-header">
                <td colSpan="4">自訂桌統計</td>
              </tr>
              {customSummaryWithGrowth.map((s, i) => (
                <tr key={s.month} className={i === customSummaryWithGrowth.length - 1 ? 'latest' : ''}>
                  <td>{s.month}</td>
                  <td className="amount">NT$ {s.total.toLocaleString()}</td>
                  <td>{s.count} 桌</td>
                  <td className="growth">
                    {s.growth && s.growth.rate !== 0 && (
                      <span className={s.growth.isGrowth ? 'up' : 'down'}>
                        {s.growth.isGrowth ? <RiseOutlined /> : <FallOutlined />}
                        {Math.abs(s.growth.rate).toFixed(2)}%
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              <tr className="section-header">
                <td colSpan="4">幹部訂桌統計</td>
              </tr>
              {cadreSummaryWithGrowth.map((s, i) => (
                <tr key={s.month} className={i === cadreSummaryWithGrowth.length - 1 ? 'latest' : ''}>
                  <td>{s.month}</td>
                  <td className="amount">NT$ {s.total.toLocaleString()}</td>
                  <td>{s.count} 公關</td>
                  <td className="growth">
                    {s.growth && s.growth.rate !== 0 && (
                      <span className={s.growth.isGrowth ? 'up' : 'down'}>
                        {s.growth.isGrowth ? <RiseOutlined /> : <FallOutlined />}
                        {Math.abs(s.growth.rate).toFixed(2)}%
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="summary-cards">
          <div className="summary-card custom">
            <div className="card-icon">
              <DollarCircleOutlined />
            </div>
            <div className="card-info">
              <div className="card-label">自訂桌統計</div>
              <div className="card-value">
                NT$ {sortedCustomSummary[sortedCustomSummary.length - 1]?.total.toLocaleString() || '0'}
              </div>
              <div className="card-meta">
                <span>{sortedCustomSummary[sortedCustomSummary.length - 1]?.count || 0} 桌</span>
                {customGrowth.rate !== 0 && (
                  <span className={customGrowth.isGrowth ? 'up' : 'down'}>
                    {customGrowth.isGrowth ? <RiseOutlined /> : <FallOutlined />}
                    {Math.abs(customGrowth.rate).toFixed(2)}%
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="summary-card cadre">
            <div className="card-icon">
              <TeamOutlined />
            </div>
            <div className="card-info">
              <div className="card-label">幹部訂桌統計</div>
              <div className="card-value">
                NT$ {sortedCadreSummary[sortedCadreSummary.length - 1]?.total.toLocaleString() || '0'}
              </div>
              <div className="card-meta">
                <span>{sortedCadreSummary[sortedCadreSummary.length - 1]?.count || 0} 公關</span>
                {cadreGrowth.rate !== 0 && (
                  <span className={cadreGrowth.isGrowth ? 'up' : 'down'}>
                    {cadreGrowth.isGrowth ? <RiseOutlined /> : <FallOutlined />}
                    {Math.abs(cadreGrowth.rate).toFixed(2)}%
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Page 3: Footer */}
      <div className="page footer-page">
        <div className="footer-content">
          <p className="footer-text">日月星辰 KTV 管理系統</p>
          <p className="footer-date">報告日期：{new Date().toLocaleDateString('zh-TW')}</p>
        </div>
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
            >
              列印報告
            </Button>
          </Space>
        </div>
      </div>

      {/* Print Report */}
      <PrintReport 
        customSummary={customSummary}
        cadreSummary={cadreSummary}
        months={selectedMonths}
        allData={allData}
      />
    </div>
  );
}
