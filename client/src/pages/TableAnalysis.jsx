import { useState, useEffect } from 'react';
import {
  Select,
  Typography,
  Space,
  Button,
  Card,
  Row,
  Col,
  Statistic
} from 'antd';
import {
  TrophyOutlined,
  RiseOutlined,
  FallOutlined,
  PrinterOutlined,
  TeamOutlined,
  DollarCircleOutlined,
  ThunderboltOutlined,
  StarOutlined,
  BulbOutlined
} from '@ant-design/icons';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import api from '../utils/api';
import './TableAnalysis.css';

const { Title, Text } = Typography;

// ==================== Print Report Component ====================
function PrintReport({ customSummary, cadreSummary, months, allData }) {
  const getGrowth = (current, previous) => {
    if (!previous || previous === 0) return { rate: 0, isGrowth: true };
    const rate = ((current - previous) / previous * 100);
    return { rate, isGrowth: rate >= 0 };
  };

  const sortedCustomSummary = [...customSummary].sort((a, b) => a.month.localeCompare(b.month));
  const sortedCadreSummary = [...cadreSummary].sort((a, b) => a.month.localeCompare(b.month));

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

  const customGrowth = customSummaryWithGrowth.length > 1 
    ? getGrowth(sortedCustomSummary[sortedCustomSummary.length - 1].total, sortedCustomSummary[sortedCustomSummary.length - 2].total)
    : { rate: 0, isGrowth: true };

  const cadreGrowth = cadreSummaryWithGrowth.length > 1
    ? getGrowth(sortedCadreSummary[sortedCadreSummary.length - 1].total, sortedCadreSummary[sortedCadreSummary.length - 2].total)
    : { rate: 0, isGrowth: true };

  return (
    <div className="a4-report">
      <div className="page cover-page">
        <div className="cover-content">
          <div className="cover-logo"><TrophyOutlined /></div>
          <h1 className="cover-title">日月星辰 KTV</h1>
          <h2 className="cover-subtitle">訂桌分析報告</h2>
          <div className="cover-divider" />
          <p className="cover-period"><span className="label">分析期間</span><span className="value">{months.slice().sort().reverse().join(' ~ ')}</span></p>
          <p className="cover-date"><span className="label">報告日期</span><span className="value">{new Date().toLocaleDateString('zh-TW')}</span></p>
        </div>
      </div>

      <div className="page summary-page">
        <div className="page-header">
          <span className="page-number">訂桌</span>
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
              <tr className="section-header"><td colSpan="4">自訂桌統計</td></tr>
              {customSummaryWithGrowth.map((s, i) => (
                <tr key={s.month} className={i === customSummaryWithGrowth.length - 1 ? 'latest' : ''}>
                  <td>{s.month}</td>
                  <td className="amount">NT$ {s.total.toLocaleString()}</td>
                  <td>{s.count} 桌</td>
                  <td className="growth">
                    {s.growth && s.growth.rate !== 0 && (
                      <span className={s.growth.isGrowth ? 'up' : 'down'}>
                        {s.growth.isGrowth ? <RiseOutlined /> : <FallOutlined />}
                        {s.growth.rate.toFixed(2)}%
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              <tr className="section-header"><td colSpan="4">幹部訂桌統計</td></tr>
              {cadreSummaryWithGrowth.map((s, i) => (
                <tr key={s.month} className={i === cadreSummaryWithGrowth.length - 1 ? 'latest' : ''}>
                  <td>{s.month}</td>
                  <td className="amount">NT$ {s.total.toLocaleString()}</td>
                  <td>{s.count} 桌</td>
                  <td className="growth">
                    {s.growth && s.growth.rate !== 0 && (
                      <span className={s.growth.isGrowth ? 'up' : 'down'}>
                        {s.growth.isGrowth ? <RiseOutlined /> : <FallOutlined />}
                        {s.growth.rate.toFixed(2)}%
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
            <div className="card-icon"><DollarCircleOutlined /></div>
            <div className="card-info">
              <div className="card-label">自訂桌統計</div>
              <div className="card-value">NT$ {sortedCustomSummary[sortedCustomSummary.length - 1]?.total.toLocaleString() || '0'}</div>
              <div className="card-meta">
                <span>{sortedCustomSummary[sortedCustomSummary.length - 1]?.count || 0} 桌</span>
                {customGrowth.rate !== 0 && (
                  <span className={customGrowth.isGrowth ? 'up' : 'down'}>
                    {customGrowth.isGrowth ? <RiseOutlined /> : <FallOutlined />}
                    {customGrowth.rate.toFixed(2)}%
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="summary-card cadre">
            <div className="card-icon"><TeamOutlined /></div>
            <div className="card-info">
              <div className="card-label">幹部訂桌統計</div>
              <div className="card-value">NT$ {sortedCadreSummary[sortedCadreSummary.length - 1]?.total.toLocaleString() || '0'}</div>
              <div className="card-meta">
                <span>{sortedCadreSummary[sortedCadreSummary.length - 1]?.count || 0} 桌</span>
                {cadreGrowth.rate !== 0 && (
                  <span className={cadreGrowth.isGrowth ? 'up' : 'down'}>
                    {cadreGrowth.isGrowth ? <RiseOutlined /> : <FallOutlined />}
                    {cadreGrowth.rate.toFixed(2)}%
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="page footer-page">
        <div className="footer-content">
          <p className="footer-text">日月星辰 KTV 管理系統</p>
          <p className="footer-date">報告日期：{new Date().toLocaleDateString('zh-TW')}</p>
        </div>
      </div>
    </div>
  );
}

// ==================== Operation Analysis Component ====================
function OperationAnalysis({ customData, cadreData }) {
  const calcMetrics = (data) => {
    return data.map(item => ({
      month: item.month,
      tables: item.count,
      amount: item.total,
      avgTable: item.count > 0 ? item.total / item.count : 0
    }));
  };

  const customMetrics = calcMetrics(customData);
  const cadreMetrics = calcMetrics(cadreData);

  const totalCustomAmount = customData.reduce((sum, r) => sum + r.total, 0);
  const totalCustomTables = customData.reduce((sum, r) => sum + r.count, 0);
  const totalCadreAmount = cadreData.reduce((sum, r) => sum + r.total, 0);
  const totalCadreTables = cadreData.reduce((sum, r) => sum + r.count, 0);

  const avgCustomAmount = totalCustomTables > 0 ? totalCustomAmount / totalCustomTables : 0;
  const avgCadreAmount = totalCadreTables > 0 ? totalCadreAmount / totalCadreTables : 0;

  const customGrowth = customData.length > 1 
    ? ((customData[customData.length - 1].total - customData[0].total) / customData[0].total * 100)
    : 0;
  const cadreGrowth = cadreData.length > 1 
    ? ((cadreData[cadreData.length - 1].total - cadreData[0].total) / cadreData[0].total * 100)
    : 0;

  const bestCustomMonth = customMetrics.reduce((a, b) => a.amount > b.amount ? a : b);
  const worstCustomMonth = customMetrics.reduce((a, b) => a.amount < b.amount ? a : b);
  const bestCadreMonth = cadreMetrics.reduce((a, b) => a.amount > b.amount ? a : b);
  const worstCadreMonth = cadreMetrics.reduce((a, b) => a.amount < b.amount ? a : b);

  const suggestions = [];
  
  if (customGrowth > 0) {
    suggestions.push({ type: 'positive', text: `自訂桌統計較首期成長 ${(customGrowth).toFixed(1)}%，表現良好` });
  } else if (customGrowth < 0) {
    suggestions.push({ type: 'negative', text: `自訂桌統計較首期下滑 ${(Math.abs(customGrowth)).toFixed(1)}%，建議加強公關客戶維護` });
  }

  if (cadreGrowth > 0) {
    suggestions.push({ type: 'positive', text: `幹部訂桌統計較首期成長 ${(cadreGrowth).toFixed(1)}%` });
  } else if (cadreGrowth < 0) {
    suggestions.push({ type: 'negative', text: `幹部訂桌統計較首期下滑 ${(Math.abs(cadreGrowth)).toFixed(1)}%，建議加強公關團隊激励` });
  }

  if (avgCustomAmount > 15000) {
    suggestions.push({ type: 'positive', text: `平均客單價 NT$${avgCustomAmount.toLocaleString()} 表現優異` });
  } else if (avgCustomAmount < 10000) {
    suggestions.push({ type: 'warning', text: `平均客單價僅 NT$${avgCustomAmount.toLocaleString()}，建議推動升級消費策略` });
  }

  return (
    <div className="operation-analysis">
      <Title level={3} className="section-title">
        <ThunderboltOutlined /> 營運分析報告
      </Title>

      <Row gutter={16} className="metrics-row">
        <Col span={6}>
          <Card className="metric-card">
            <Statistic 
              title="自訂桌總消費" 
              value={totalCustomAmount} 
              prefix={<DollarCircleOutlined />}
              suffix="NT$"
              precision={0}
              valueStyle={{ color: '#f39c12' }}
            />
            <Text type="secondary"> 共 {totalCustomTables} 桌</Text>
          </Card>
        </Col>
        <Col span={6}>
          <Card className="metric-card">
            <Statistic 
              title="幹部訂桌總消費" 
              value={totalCadreAmount} 
              prefix={<TeamOutlined />}
              suffix="NT$"
              precision={0}
              valueStyle={{ color: '#4ECDC4' }}
            />
            <Text type="secondary"> 共 {totalCadreTables} 筆</Text>
          </Card>
        </Col>
        <Col span={6}>
          <Card className="metric-card">
            <Statistic 
              title="平均客單價" 
              value={(totalCustomAmount + totalCadreAmount) / (totalCustomTables + totalCadreTables)} 
              prefix="NT$"
              precision={0}
              valueStyle={{ color: '#96CEB4' }}
            />
            <Text type="secondary"> 自訂桌平均 NT${avgCustomAmount.toLocaleString()}</Text>
          </Card>
        </Col>
        <Col span={6}>
          <Card className="metric-card">
            <Statistic 
              title="成長率" 
              value={customGrowth + cadreGrowth > 0 ? '+' : ''}
              suffix="%"
              precision={1}
              valueStyle={{ color: (customGrowth + cadreGrowth) >= 0 ? '#52c41a' : '#ff4d4f' }}
            />
            <Text type="secondary"> 較首期</Text>
          </Card>
        </Col>
      </Row>

      <Row gutter={16} className="charts-row">
        <Col span={12}>
          <Card title={<span><RiseOutlined /> 消費趨勢</span>} className="chart-card">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={customMetrics.map((m, i) => ({
                month: m.month,
                custom: m.amount,
                cadre: cadreMetrics[i]?.amount || 0
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="month" stroke="#888" />
                <YAxis stroke="#888" tickFormatter={(value) => `NT$${(value/1000).toFixed(0)}k`} />
                <Tooltip formatter={(value, name) => [`NT$${value.toLocaleString()}`, name === 'custom' ? '自訂桌' : '幹部訂桌']} />
                <Legend />
                <Line type="monotone" dataKey="custom" name="custom" stroke="#f39c12" strokeWidth={2} dot={{ fill: '#f39c12' }} />
                <Line type="monotone" dataKey="cadre" name="cadre" stroke="#4ECDC4" strokeWidth={2} dot={{ fill: '#4ECDC4' }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col span={12}>
          <Card title={<span><StarOutlined /> 桌數/筆數趨勢</span>} className="chart-card">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={customMetrics.map((m, i) => ({
                month: m.month,
                自訂桌: m.tables,
                幹部訂桌: cadreMetrics[i]?.tables || 0
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="month" stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip />
                <Legend />
                <Bar dataKey="自訂桌" fill="#f39c12" name="自訂桌" />
                <Bar dataKey="幹部訂桌" fill="#4ECDC4" name="幹部訂桌" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      <Card title={<span><BulbOutlined /> 營運分析</span>} className="analysis-card">
        <div className="analysis-content">
          <div className="analysis-item">
            <Text strong>最佳月份：</Text>
            <Text>自訂桌 {bestCustomMonth.month} (NT${bestCustomMonth.amount.toLocaleString()})，幹部訂桌 {bestCadreMonth.month} (NT${bestCadreMonth.amount.toLocaleString()})</Text>
          </div>
          <div className="analysis-item">
            <Text strong>需改善月份：</Text>
            <Text>自訂桌 {worstCustomMonth.month} (NT${worstCustomMonth.amount.toLocaleString()})，幹部訂桌 {worstCadreMonth.month} (NT${worstCadreMonth.amount.toLocaleString()})</Text>
          </div>
          <div className="analysis-item">
            <Text strong>平均消費分析：</Text>
            <Text>
              自訂桌平均 NT${avgCustomAmount.toLocaleString()}/桌，
              幹部訂桌平均 NT${avgCadreAmount.toLocaleString()}/筆
            </Text>
          </div>
        </div>
      </Card>

      <Card title={<span><ThunderboltOutlined /> 建議措施</span>} className="suggestions-card">
        <div className="suggestions-list">
          {suggestions.length > 0 ? suggestions.map((s, i) => (
            <div key={i} className={`suggestion-item ${s.type}`}>
              {s.type === 'positive' ? <RiseOutlined /> : s.type === 'negative' ? <FallOutlined /> : <ThunderboltOutlined />}
              <Text>{s.text}</Text>
            </div>
          )) : (
            <Text type="secondary">數據充足時將自動生成建議</Text>
          )}
          <div className="suggestion-item">
            <StarOutlined />
            <Text>建議加強公關客戶關係維護，提升來訪頻率與消費金額</Text>
          </div>
          <div className="suggestion-item">
            <StarOutlined />
            <Text>可考慮推出季節性促銷活動，刺激消費成長</Text>
          </div>
        </div>
      </Card>
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
        api.get(`/stats/table-usage?month=${m}&level=公關`),
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
    const count = records.reduce((sum, r) => sum + (Number(r.次數) || 0), 0);
    return { month: m, total, count };
  });

  const cadreSummary = selectedMonths.map(m => {
    const records = allData[m]?.cadre || [];
    const total = records.reduce((sum, r) => sum + (Number(r.總消費) || 0), 0);
    const count = records.reduce((sum, r) => sum + (Number(r.紀錄數) || 0), 0);
    return { month: m, total, count };
  });

  return (
    <div className="ta-page">
      {/* Control Panel */}
      <div className="ta-controls">
        <div className="ta-header">
          <div>
            <Title level={2} className="ta-title">{'📊'} 訂桌分析報告</Title>
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

      {/* Operation Analysis */}
      <div className="analysis-section">
        <OperationAnalysis 
          customData={customSummary} 
          cadreData={cadreSummary}
        />
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
