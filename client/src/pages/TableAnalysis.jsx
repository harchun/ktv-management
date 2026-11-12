import { useState, useEffect } from 'react';
import { Typography, Space, Button, Card, Row, Col, Statistic, Table, Tag, DatePicker, Spin, Empty } from 'antd';
import {
  WarningOutlined, FallOutlined, UserDeleteOutlined, BulbOutlined,
  PrinterOutlined, DownloadOutlined, TrophyOutlined, RiseOutlined, TeamOutlined, DollarCircleOutlined
} from '@ant-design/icons';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import * as XLSX from 'xlsx';
import dayjs from 'dayjs';
import api from '../utils/api';
import './TableAnalysis.css';

const { Title, Text } = Typography;
const fmt = (n) => Number(n || 0).toLocaleString('zh-TW');

// 依資料產出建議動作
function buildSuggestions(analysis) {
  const list = [];
  if (!analysis) return list;
  const { overview, declining_cadres, churned_customers } = analysis;

  if (overview.growth < -10) {
    list.push({ type: 'critical', text: `本期總消費 NT$${fmt(overview.curr_total)}，較前期下滑 ${Math.abs(overview.growth).toFixed(1)}%，建議立即檢討公關維護與促銷活動` });
  } else if (overview.growth > 0) {
    list.push({ type: 'positive', text: `本期總消費 NT$${fmt(overview.curr_total)}，較前期成長 ${overview.growth.toFixed(1)}%，維持現行經營策略` });
  }

  declining_cadres.forEach((c) => {
    const pct = c.prev_amount > 0 ? ((c.curr_amount - c.prev_amount) / c.prev_amount * 100) : -100;
    list.push({
      type: 'warning',
      text: `幹部 ${c.cadre}：營收 NT$${fmt(c.prev_amount)} → NT$${fmt(c.curr_amount)}（${pct.toFixed(0)}%），建議主管一對一追蹤其近期 TOP 客戶並協助留桌`
    });
  });

  churned_customers.slice(0, 10).forEach((c) => {
    const days = c.last_visit ? dayjs().diff(dayjs(c.last_visit), 'day') : 0;
    list.push({
      type: 'action',
      text: `流失客戶 ${c.客戶名}（幹部 ${c.cadre}，前期貢獻 NT$${fmt(c.prev_a)}，已 ${days} 天未訂桌），建議公關 48 小時內主動聯繫`
    });
  });

  if (declining_cadres.length === 0 && churned_customers.length === 0) {
    list.push({ type: 'positive', text: '本期無下滑幹部與流失客戶，客戶維持狀況良好' });
  }
  return list;
}

// ==================== Print Report Component ====================
function PrintReport({ analysis }) {
  if (!analysis) return null;
  const { period, overview, declining_cadres, churned_customers, top_customers, monthly_trend } = analysis;
  const suggestions = buildSuggestions(analysis);
  const today = new Date().toLocaleDateString('zh-TW');

  return (
    <div className="a4-report">
      {/* Cover */}
      <div className="page cover-page">
        <div className="cover-content">
          <div className="cover-logo"><TrophyOutlined /></div>
          <h1 className="cover-title">日月星辰 KTV</h1>
          <h2 className="cover-subtitle">訂桌分析報告</h2>
          <div className="cover-divider" />
          <p className="cover-period"><span className="label">分析期間</span><span className="value">{period.start} ~ {period.end}</span></p>
          <p className="cover-period"><span className="label">對照前期</span><span className="value">{period.prevStart} ~ {period.prevEnd}</span></p>
          <p className="cover-date"><span className="label">報告日期</span><span className="value">{today}</span></p>
        </div>
      </div>

      {/* Page: 總覽 */}
      <div className="page summary-page">
        <div className="page-header">
          <span className="page-number">01</span>
          <h2 className="page-title">經營總覽</h2>
        </div>
        <div className="summary-cards">
          <div className="summary-card custom">
            <div className="card-icon"><DollarCircleOutlined /></div>
            <div className="card-info">
              <div className="card-label">本期總消費（{period.start} ~ {period.end}）</div>
              <div className="card-value">NT$ {fmt(overview.curr_total)}</div>
              <div className="card-meta">
                <span>{fmt(overview.curr_tables)} 桌 / {fmt(overview.curr_customers)} 位客戶</span>
                <span className={overview.growth >= 0 ? 'up' : 'down'}>
                  {overview.growth >= 0 ? <RiseOutlined /> : <FallOutlined />}
                  {Math.abs(overview.growth).toFixed(1)}% vs 前期
                </span>
              </div>
            </div>
          </div>
          <div className="summary-card cadre">
            <div className="card-icon"><TeamOutlined /></div>
            <div className="card-info">
              <div className="card-label">前期總消費（{period.prevStart} ~ {period.prevEnd}）</div>
              <div className="card-value">NT$ {fmt(overview.prev_total)}</div>
              <div className="card-meta"><span>{fmt(overview.prev_tables)} 桌 / {fmt(overview.prev_customers)} 位客戶</span></div>
            </div>
          </div>
        </div>
        <div className="summary-table">
          <table className="data-table">
            <thead>
              <tr><th>月份</th><th>消費金額</th><th>桌數</th></tr>
            </thead>
            <tbody>
              {monthly_trend.map((m) => (
                <tr key={m.月份} className={m.月份 === period.start.slice(0, 7) ? 'latest' : ''}>
                  <td>{m.月份}</td>
                  <td className="amount">NT$ {fmt(m.總消費)}</td>
                  <td>{fmt(m.桌數)} 桌</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Page: 警覺項目 */}
      <div className="page">
        <div className="page-header">
          <span className="page-number">02</span>
          <h2 className="page-title">警覺項目</h2>
        </div>
        <div className="alert-block">
          <h3 className="alert-title"><WarningOutlined /> 下滑幹部（較前期衰退 30% 以上，共 {declining_cadres.length} 人）</h3>
          {declining_cadres.length === 0 ? (
            <p className="muted">本期無下滑幹部</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr><th>幹部</th><th>前期金額</th><th>本期金額</th><th>變化率</th><th>桌數(前→本)</th></tr>
              </thead>
              <tbody>
                {declining_cadres.map((c) => {
                  const pct = c.prev_amount > 0 ? ((c.curr_amount - c.prev_amount) / c.prev_amount * 100) : -100;
                  return (
                    <tr key={c.cadre}>
                      <td>{c.cadre}</td>
                      <td className="amount">NT$ {fmt(c.prev_amount)}</td>
                      <td className="amount">NT$ {fmt(c.curr_amount)}</td>
                      <td className="growth down">{pct.toFixed(1)}%</td>
                      <td>{c.prev_tables} → {c.curr_tables}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        <div className="alert-block">
          <h3 className="alert-title"><UserDeleteOutlined /> 流失客戶（前期有、本期無，共 {churned_customers.length} 位）</h3>
          {churned_customers.length === 0 ? (
            <p className="muted">本期無流失客戶</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr><th>客戶</th><th>幹部</th><th>前期貢獻</th><th>最後到訪</th><th>未訪天數</th></tr>
              </thead>
              <tbody>
                {churned_customers.slice(0, 20).map((c) => {
                  const days = c.last_visit ? dayjs().diff(dayjs(c.last_visit), 'day') : 0;
                  return (
                    <tr key={`${c.cadre}-${c.客戶名}`}>
                      <td>{c.客戶名}</td>
                      <td>{c.cadre}</td>
                      <td className="amount">NT$ {fmt(c.prev_a)}</td>
                      <td>{c.last_visit || '-'}</td>
                      <td>{days} 天</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Page: TOP客戶 + 建議動作 */}
      <div className="page">
        <div className="page-header">
          <span className="page-number">03</span>
          <h2 className="page-title">TOP 客戶與建議動作</h2>
        </div>
        <table className="data-table">
          <thead>
            <tr><th>排名</th><th>客戶</th><th>幹部</th><th>訪次</th><th>本期金額</th></tr>
          </thead>
          <tbody>
            {top_customers.map((c, i) => (
              <tr key={`${c.客戶名}-${i}`}>
                <td>{i + 1}</td>
                <td>{c.客戶名}</td>
                <td>{c.cadre}</td>
                <td>{c.訪次}</td>
                <td className="amount">NT$ {fmt(c.金額)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="alert-block">
          <h3 className="alert-title"><BulbOutlined /> 建議動作（{suggestions.length} 項）</h3>
          <div className="suggestions-list">
            {suggestions.map((s, i) => (
              <div key={i} className={`suggestion-item ${s.type}`}>
                {s.type === 'positive' ? <RiseOutlined /> : s.type === 'critical' ? <FallOutlined /> : <BulbOutlined />}
                <span>{s.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="page footer-page">
        <div className="footer-content">
          <p className="footer-text">日月星辰 KTV 管理系統</p>
          <p className="footer-date">報告日期：{today}</p>
        </div>
      </div>
    </div>
  );
}

// ==================== Main Component ====================
export default function TableAnalysis() {
  const [range, setRange] = useState([dayjs(), dayjs()]);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async (r) => {
    const rg = r || range;
    if (!rg || !rg[0] || !rg[1]) return;
    setLoading(true);
    try {
      const res = await api.get('/stats/table-analysis', {
        params: { start: rg[0].format('YYYY-MM-DD'), end: rg[1].format('YYYY-MM-DD') },
      });
      setAnalysis(res.data);
    } catch (e) {
      console.error('Failed to load table analysis:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Default to the most recent month that actually has data
    api.get('/stats/months')
      .then((res) => {
        const months = res.data || [];
        if (months.length > 0) {
          const latest = months[0]; // already DESC
          const d = dayjs(`${latest}-01`);
          const r = [d.startOf('month'), d.endOf('month')];
          setRange(r);
          fetchData(r);
        }
      })
      .catch(() => fetchData())
      .finally(() => {});
  }, []);

  const suggestions = buildSuggestions(analysis);

  const handleExcelExport = () => {
    if (!analysis) return;
    const { period, overview, declining_cadres, churned_customers, top_customers, monthly_trend } = analysis;
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
      ['訂桌分析報告'],
      [`分析期間：${period.start} ~ ${period.end} | 對照前期：${period.prevStart} ~ ${period.prevEnd}`],
      [],
      ['指標', '前期', '本期', '變化'],
      ['總消費 NT$', overview.prev_total, overview.curr_total, `${overview.growth >= 0 ? '+' : ''}${overview.growth.toFixed(1)}%`],
      ['桌數', overview.prev_tables, overview.curr_tables, ''],
      ['客戶數', overview.prev_customers, overview.curr_customers, ''],
      [],
      ['月份', '總消費', '桌數'],
      ...monthly_trend.map((m) => [m.月份, m.總消費, m.桌數]),
    ]), '總覽');

    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
      ['下滑幹部（衰退 30% 以上）'],
      [],
      ['幹部', '前期金額', '本期金額', '變化率%', '桌數(前)', '桌數(本)'],
      ...declining_cadres.map((c) => {
        const pct = c.prev_amount > 0 ? (((c.curr_amount - c.prev_amount) / c.prev_amount) * 100).toFixed(1) : '-100';
        return [c.cadre, c.prev_amount, c.curr_amount, pct, c.prev_tables, c.curr_tables];
      }),
    ]), '下滑幹部');

    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
      ['流失客戶（前期有、本期無）'],
      [],
      ['客戶', '幹部', '前期貢獻', '最後到訪', '未訪天數'],
      ...churned_customers.map((c) => {
        const days = c.last_visit ? dayjs().diff(dayjs(c.last_visit), 'day') : 0;
        return [c.客戶名, c.cadre, c.prev_a, c.last_visit || '-', days];
      }),
    ]), '流失客戶');

    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
      ['本期 TOP 20 客戶'],
      [],
      ['排名', '客戶', '幹部', '訪次', '本期金額'],
      ...top_customers.map((c, i) => [i + 1, c.客戶名, c.cadre, c.訪次, c.金額]),
    ]), 'TOP客戶');

    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
      ['建議動作'],
      [],
      ['類型', '內容'],
      ...suggestions.map((s) => [s.type === 'critical' ? '危急' : s.type === 'warning' ? '注意' : s.type === 'action' ? '動作' : '良好', s.text]),
    ]), '建議動作');

    const safePeriod = `${period.start}~${period.end}`.replace(/[\\/:*?"<>|~]/g, '-');
    XLSX.writeFile(wb, `訂桌分析_${safePeriod}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const decliningCols = [
    { title: '幹部', dataIndex: 'cadre' },
    { title: '前期金額', dataIndex: 'prev_amount', align: 'right', render: (v) => `NT$ ${fmt(v)}` },
    { title: '本期金額', dataIndex: 'curr_amount', align: 'right', render: (v) => `NT$ ${fmt(v)}` },
    {
      title: '變化率',
      dataIndex: 'prev_amount',
      render: (_, r) => {
        const pct = r.prev_amount > 0 ? ((r.curr_amount - r.prev_amount) / r.prev_amount * 100) : -100;
        return <Tag color="red">{pct.toFixed(1)}%</Tag>;
      },
    },
    { title: '桌數', dataIndex: 'prev_tables', render: (_, r) => `${r.prev_tables} → ${r.curr_tables}` },
  ];

  const churnedCols = [
    { title: '客戶', dataIndex: '客戶名' },
    { title: '幹部', dataIndex: 'cadre' },
    { title: '前期貢獻', dataIndex: 'prev_a', align: 'right', render: (v) => `NT$ ${fmt(v)}` },
    { title: '最後到訪', dataIndex: 'last_visit', render: (v) => v || '-' },
    {
      title: '未訪天數',
      dataIndex: 'last_visit',
      render: (v) => {
        const days = v ? dayjs().diff(dayjs(v), 'day') : 0;
        return <span style={{ color: days > 60 ? '#ff4d4f' : '#f39c12', fontWeight: 600 }}>{days} 天</span>;
      },
    },
  ];

  const topCols = [
    { title: '排名', dataIndex: 'idx', render: (_, __, i) => i + 1, width: 60 },
    { title: '客戶', dataIndex: '客戶名' },
    { title: '幹部', dataIndex: 'cadre' },
    { title: '訪次', dataIndex: '訪次', align: 'center' },
    { title: '本期金額', dataIndex: '金額', align: 'right', render: (v) => `NT$ ${fmt(v)}` },
  ];

  return (
    <div className="ta-page">
      {/* Control Panel */}
      <div className="ta-controls no-print">
        <div className="ta-header">
          <div>
            <Title level={2} className="ta-title">📊 訂桌分析報告</Title>
            <Text style={{ color: 'rgba(255,255,255,0.75)' }}>下滑幹部・流失客戶・建議動作（自動對照等長前期）</Text>
          </div>
          <Space wrap>
            <DatePicker.RangePicker
              value={range}
              onChange={(v) => { setRange(v); if (v && v.length === 2) fetchData(v); }}
              allowClear={false}
            />
            <Button type="primary" icon={<DownloadOutlined />} onClick={handleExcelExport}>
              Excel 下載
            </Button>
            <Button
              type="primary"
              icon={<PrinterOutlined />}
              onClick={() => window.print()}
              style={{ background: '#fff', color: '#667eea', borderColor: '#fff' }}
            >
              列印報告
            </Button>
          </Space>
        </div>
      </div>

      {/* Dashboard */}
      <div className="ta-dashboard no-print">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}><Spin size="large" /></div>
        ) : !analysis ? (
          <Empty />
        ) : (
          <>
            <Row gutter={16}>
              <Col xs={12} md={6}>
                <Card className="metric-card">
                  <Statistic
                    title="本期總消費"
                    value={Number(analysis.overview.curr_total)}
                    prefix="NT$"
                    valueStyle={{ color: analysis.overview.growth >= 0 ? '#52c41a' : '#ff4d4f' }}
                  />
                  <Text type="secondary">
                    {analysis.overview.growth >= 0 ? <RiseOutlined /> : <FallOutlined />}{' '}
                    {Math.abs(analysis.overview.growth).toFixed(1)}% vs 前期
                  </Text>
                </Card>
              </Col>
              <Col xs={12} md={6}>
                <Card className="metric-card">
                  <Statistic
                    title="下滑幹部"
                    value={analysis.declining_cadres.length}
                    suffix="人"
                    prefix={<WarningOutlined />}
                    valueStyle={{ color: analysis.declining_cadres.length > 0 ? '#ff4d4f' : '#52c41a' }}
                  />
                  <Text type="secondary">較前期衰退 30% 以上</Text>
                </Card>
              </Col>
              <Col xs={12} md={6}>
                <Card className="metric-card">
                  <Statistic
                    title="流失客戶"
                    value={analysis.churned_customers.length}
                    suffix="位"
                    prefix={<UserDeleteOutlined />}
                    valueStyle={{ color: analysis.churned_customers.length > 0 ? '#f39c12' : '#52c41a' }}
                  />
                  <Text type="secondary">前期有、本期無</Text>
                </Card>
              </Col>
              <Col xs={12} md={6}>
                <Card className="metric-card">
                  <Statistic
                    title="本期 TOP 客戶"
                    value={analysis.top_customers[0]?.客戶名 || '-'}
                    valueStyle={{ fontSize: 20, color: '#f39c12' }}
                  />
                  <Text type="secondary">
                    NT$ {fmt(analysis.top_customers[0]?.金額)}
                    {analysis.top_customers[0] ? `（${analysis.top_customers[0].cadre}）` : ''}
                  </Text>
                </Card>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={24}>
                <Card title={<span><RiseOutlined /> 月度消費趨勢</span>} className="chart-card">
                  <ResponsiveContainer width="100%" height={240}>
                    <LineChart data={analysis.monthly_trend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis dataKey="月份" stroke="#888" />
                      <YAxis stroke="#888" tickFormatter={(v) => `NT$${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v) => `NT$${Number(v).toLocaleString()}`} />
                      <Legend />
                      <Line type="monotone" dataKey="總消費" name="消費金額" stroke="#f39c12" strokeWidth={2} dot={{ fill: '#f39c12' }} />
                      <Line type="monotone" dataKey="桌數" name="桌數" stroke="#4ECDC4" strokeWidth={2} dot={{ fill: '#4ECDC4' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </Card>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Card title={<span><FallOutlined /> 下滑幹部（{analysis.declining_cadres.length} 人）</span>}>
                  <Table
                    columns={decliningCols}
                    dataSource={analysis.declining_cadres}
                    rowKey="cadre"
                    pagination={false}
                    size="small"
                    locale={{ emptyText: '本期無下滑幹部' }}
                  />
                </Card>
              </Col>
              <Col xs={24} md={12}>
                <Card title={<span><UserDeleteOutlined /> 流失客戶（{analysis.churned_customers.length} 位）</span>}>
                  <Table
                    columns={churnedCols}
                    dataSource={analysis.churned_customers}
                    rowKey={(r) => `${r.cadre}-${r.客戶名}`}
                    pagination={{ pageSize: 8, size: 'small' }}
                    size="small"
                    locale={{ emptyText: '本期無流失客戶' }}
                  />
                </Card>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Card title={<span><TrophyOutlined /> 本期 TOP 20 客戶</span>}>
                  <Table
                    columns={topCols}
                    dataSource={analysis.top_customers}
                    rowKey={(r, i) => `${r.客戶名}-${i}`}
                    pagination={{ pageSize: 10, size: 'small' }}
                    size="small"
                  />
                </Card>
              </Col>
              <Col xs={24} md={12}>
                <Card title={<span><BulbOutlined /> 建議動作（{suggestions.length} 項）</span>}>
                  <div className="suggestions-list">
                    {suggestions.map((s, i) => (
                      <div key={i} className={`suggestion-item ${s.type}`}>
                        {s.type === 'positive' ? <RiseOutlined /> : s.type === 'critical' ? <FallOutlined /> : <BulbOutlined />}
                        <span>{s.text}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </Col>
            </Row>
          </>
        )}
      </div>

      {/* A4 Print Report (hidden on screen, printed via 列印報告) */}
      <PrintReport analysis={analysis} />
    </div>
  );
}
