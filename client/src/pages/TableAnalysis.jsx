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
  Button
} from 'antd';
import {
  TrophyOutlined,
  RiseOutlined,
  FallOutlined,
  DollarOutlined,
  PrinterOutlined,
  FileTextOutlined
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

  const getRankStyle = (index) => {
    if (index === 0) return { background: '#FFD700', color: '#fff' };
    if (index === 1) return { background: '#C0C0C0', color: '#fff' };
    if (index === 2) return { background: '#CD7F32', color: '#fff' };
    return {};
  };

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

      {/* Print Section: Summary */}
      <div className="print-section print-summary-section">
        <div className="report-title">日月星辰 KTV 訂桌分析報告</div>
        <div className="report-period">分析期間：{selectedMonths.join(' 至 ')} 月</div>
        
        <Row gutter={32} className="summary-row">
          <Col span={12}>
            <div className="summary-box custom-summary">
              <div className="summary-icon">
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
            </div>
          </Col>
          <Col span={12}>
            <div className="summary-box cadre-summary">
              <div className="summary-icon">
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
            </div>
          </Col>
        </Row>
      </div>

      {/* Print Section: Custom Table Details */}
      <div className="print-section print-page-break">
        <div className="section-header">
          <FileTextOutlined />
          <span>自訂桌統計明細</span>
        </div>
        {selectedMonths.map(m => {
          const data = allData[m]?.custom || [];
          if (data.length === 0) return null;
          return (
            <div key={m} className="month-block">
              <div className="month-header">
                <span className="month-name">{m}</span>
                <span className="month-total">
                  合計：NT$ {data.reduce((s, r) => s + (Number(r.總消費) || 0), 0).toLocaleString()} ({data.length}桌)
                </span>
              </div>
              <Table
                dataSource={data}
                columns={[
                  { title: '排名', dataIndex: 'rank', width: 50, render: (_, __, index) => <span className={`rank-badge rank-${index + 1}`}>{index + 1}</span> },
                  { title: '幹部姓名', dataIndex: '幹部', render: n => <Text strong>{n}</Text> },
                  { title: '總消費', dataIndex: '總消費', render: v => <Text className="amount">NT$ {Number(v).toLocaleString()}</Text> },
                  { title: '桌數', dataIndex: '桌數', width: 60, render: v => <Tag color="blue">{v}</Tag> }
                ]}
                rowKey="幹部"
                pagination={false}
                size="small"
                showHeader
                className="detail-table"
              />
            </div>
          );
        })}
      </div>

      {/* Print Section: Cadre Table Details */}
      <div className="print-section print-page-break print-last-page">
        <div className="section-header">
          <FileTextOutlined />
          <span>幹部訂桌統計明細</span>
        </div>
        {selectedMonths.map(m => {
          const data = allData[m]?.cadre || [];
          if (data.length === 0) return null;
          return (
            <div key={m} className="month-block">
              <div className="month-header">
                <span className="month-name">{m}</span>
                <span className="month-total">
                  合計：NT$ {data.reduce((s, r) => s + (Number(r.總消費) || 0), 0).toLocaleString()} ({data.length}筆)
                </span>
              </div>
              <Table
                dataSource={data}
                columns={[
                  { title: '排名', dataIndex: 'rank', width: 50, render: (_, __, index) => <span className={`rank-badge rank-${index + 1}`}>{index + 1}</span> },
                  { title: '公關姓名', dataIndex: '公關', render: n => <Text strong>{n}</Text> },
                  { title: '總消費', dataIndex: '總消費', render: v => <Text className="amount">NT$ {Number(v).toLocaleString()}</Text> },
                  { title: '紀錄數', dataIndex: '紀錄數', width: 60, render: v => <Tag color="green">{v}</Tag> }
                ]}
                rowKey="公關"
                pagination={false}
                size="small"
                showHeader
                className="detail-table"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
