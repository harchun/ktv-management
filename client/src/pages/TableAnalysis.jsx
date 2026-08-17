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
  Progress,
  Alert,
  Collapse
} from 'antd';
import {
  TrophyOutlined,
  RiseOutlined,
  FallOutlined,
  TableOutlined,
  DollarOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Panel } = Collapse;

export default function TableAnalysis() {
  const [selectedMonth, setSelectedMonth] = useState('');
  const [months, setMonths] = useState([]);
  const [customTables, setCustomTables] = useState([]);
  const [cadreTables, setCadreTables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [customGrowth, setCustomGrowth] = useState(null);
  const [cadreGrowth, setCadreGrowth] = useState(null);

  useEffect(() => {
    fetch('/api/stats/months')
      .then(r => r.json())
      .then(data => {
        const sorted = [...data].sort().reverse();
        setMonths(sorted);
        if (sorted.length > 0) setSelectedMonth(sorted[0]);
      });
  }, []);

  useEffect(() => {
    if (!selectedMonth) return;

    setLoading(true);
    Promise.all([
      fetch(`/api/stats/table-usage?month=${selectedMonth}`),
      fetch(`/api/stats/cadre-table?month=${selectedMonth}`)
    ])
      .then(([customRes, cadreRes]) =>
        Promise.all([customRes.json(), cadreRes.json()])
      )
      .then(([customData, cadreData]) => {
        setCustomTables(customData || []);
        setCadreTables(cadreData || []);
        calculateGrowth(selectedMonth, customData, cadreData);
      })
      .finally(() => setLoading(false));
  }, [selectedMonth]);

  const calculateGrowth = (currentMonth, currentCustom, currentCadre) => {
    const currentIndex = months.indexOf(currentMonth);
    if (currentIndex <= 0) return;

    const prevMonth = months[currentIndex - 1];

    // 自訂桌成長率
    if (currentCustom && months[currentIndex - 1]) {
      fetch(`/api/stats/table-usage?month=${prevMonth}`)
        .then(r => r.json())
        .then(prevData => {
          const currentTotal = currentCustom.reduce((sum, r) => sum + (Number(r.總消費) || 0), 0);
          const prevTotal = (prevData || []).reduce((sum, r) => sum + (Number(r.總消費) || 0), 0);
          const currentTables = currentCustom.length;
          const prevTables = (prevData || []).length;

          setCustomGrowth({
            consumption: prevTotal > 0 ? ((currentTotal - prevTotal) / prevTotal * 100).toFixed(2) : 0,
            tables: prevTables > 0 ? ((currentTables - prevTables) / prevTables * 100).toFixed(2) : 0,
            isGrowth: currentTotal >= prevTotal
          });
        });
    }

    // 幹桌成長率
    if (currentCadre && months[currentIndex - 1]) {
      fetch(`/api/stats/cadre-table?month=${prevMonth}`)
        .then(r => r.json())
        .then(prevData => {
          const currentTotal = currentCadre.reduce((sum, r) => sum + (Number(r.總消費) || 0), 0);
          const prevTotal = (prevData || []).reduce((sum, r) => sum + (Number(r.總消費) || 0), 0);
          const currentTables = currentCadre.length;
          const prevTables = (prevData || []).length;

          setCadreGrowth({
            consumption: prevTotal > 0 ? ((currentTotal - prevTotal) / prevTotal * 100).toFixed(2) : 0,
            tables: prevTables > 0 ? ((currentTables - prevTables) / prevTables * 100).toFixed(2) : 0,
            isGrowth: currentTotal >= prevTotal
          });
        });
    }
  };

  const getRankStyle = (index) => {
    if (index === 0) return { background: '#FFD700', color: '#fff' };
    if (index === 1) return { background: '#C0C0C0', color: '#fff' };
    if (index === 2) return { background: '#CD7F32', color: '#fff' };
    return {};
  };

  const customColumns = [
    {
      title: '排名',
      dataIndex: 'rank',
      key: 'rank',
      width: 60,
      render: (rank, _, index) => (
        <span style={getRankStyle(index)}>
          {index + 1}
        </span>
      )
    },
    {
      title: '幹部',
      dataIndex: '幹部',
      key: '幹部',
      render: (name) => <Text strong>{name}</Text>
    },
    {
      title: '總消費',
      dataIndex: '總消費',
      key: '總消費',
      render: (val) => <Text type="danger">NT$ {Number(val).toLocaleString()}</Text>
    },
    {
      title: '桌數',
      dataIndex: '桌數',
      key: '桌數',
      width: 80,
      render: (val) => <Tag color="blue">{val}</Tag>
    }
  ];

  const cadreColumns = [
    {
      title: '排名',
      dataIndex: 'rank',
      key: 'rank',
      width: 60,
      render: (rank, _, index) => (
        <span style={getRankStyle(index)}>
          {index + 1}
        </span>
      )
    },
    {
      title: '公關',
      dataIndex: '公關訂桌',
      key: '公關訂桌',
      render: (name) => <Text strong>{name}</Text>
    },
    {
      title: '總消費',
      dataIndex: '總消費',
      key: '總消費',
      render: (val) => <Text type="danger">NT$ {Number(val).toLocaleString()}</Text>
    },
    {
      title: '紀錄數',
      dataIndex: '紀錄數',
      key: '紀錄數',
      width: 80,
      render: (val) => <Tag color="green">{val}</Tag>
    }
  ];

  const growthBadge = (growth) => {
    if (!growth) return null;
    const isGrowth = parseFloat(growth.consumption) >= 0;
    return (
      <Tag color={isGrowth ? 'success' : 'error'} className="ml-2">
        {isGrowth ? <RiseOutlined /> : <FallOutlined />}
        {Math.abs(growth.consumption)}%
      </Tag>
    );
  };

  return (
    <div style={{ padding: '24px' }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={2}>📊 訂桌分析</Title>
          <Text type="secondary">分析自訂桌統計與幹桌統計的月份成長/衰退趨勢</Text>
        </Col>
        <Col>
          <Select
            value={selectedMonth}
            onChange={setSelectedMonth}
            style={{ width: 150 }}
            size="large"
          >
            {months.map(m => (
              <Select.Option key={m} value={m}>{m}</Select.Option>
            ))}
          </Select>
        </Col>
      </Row>

      {/* 自訂桌統計區段 */}
      <Card
        title={
          <Space>
            <TrophyOutlined />
            <span>自訂桌統計</span>
            {customGrowth && growthBadge(customGrowth)}
          </Space>
        }
        loading={loading}
        extra={
          customGrowth && (
            <Space direction="vertical" size={0}>
              <Text type="secondary">較上月：</Text>
              <Text type={customGrowth.isGrowth ? 'success' : 'danger'} strong>
                {customGrowth.isGrowth ? '↑' : '↓'} 消費 {Math.abs(customGrowth.consumption)}%
              </Text>
            </Space>
          )
        }
        style={{ marginBottom: 24 }}
      >
        {customTables.length > 0 ? (
          <>
            {/* 本月統計摘要 */}
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={6}>
                <Statistic
                  title="本月總消費"
                  value={customTables.reduce((sum, r) => sum + (Number(r.總消費) || 0), 0)}
                  prefix={<DollarOutlined />}
                  suffix="NT$"
                  precision={0}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="本月桌數"
                  value={customTables.length}
                  prefix={<TableOutlined />}
                />
              </Col>
              {customGrowth && (
                <>
                  <Col span={6}>
                    <Statistic
                      title="上月總消費"
                      value={customTables.reduce((sum, r) => sum + (Number(r.總消費) || 0), 0) * (1 - customGrowth.consumption / 100)}
                      prefix={<DollarOutlined />}
                      suffix="NT$"
                      precision={0}
                    />
                  </Col>
                  <Col span={6}>
                    <Statistic
                      title="上月桌數"
                      value={Math.round(customTables.length / (1 + customGrowth.tables / 100))}
                      prefix={<TableOutlined />}
                    />
                  </Col>
                </>
              )}
            </Row>

            <Table
              dataSource={customTables}
              columns={customColumns}
              rowKey="幹部"
              pagination={false}
              size="middle"
              summary={() => (
                <Table.Summary fixed>
                  <Table.Summary.Row style={{ background: '#f0f0f0' }}>
                    <Table.Summary.Cell index={0}><Text strong>合計</Text></Table.Summary.Cell>
                    <Table.Summary.Cell index={1}><Text strong>{customTables.length} 人</Text></Table.Summary.Cell>
                    <Table.Summary.Cell index={2}>
                      <Text type="danger" strong>
                        NT$ {customTables.reduce((sum, r) => sum + (Number(r.總消費) || 0), 0).toLocaleString()}
                      </Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={3}>
                      <Tag color="blue" style={{ fontWeight: 'bold' }}>{customTables.length} 桌</Tag>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                </Table.Summary>
              )}
            />
          </>
        ) : (
          <Alert
            message="本月暂无自訂桌統計數據"
            type="info"
            showIcon
          />
        )}
      </Card>

      {/* 幹桌統計區段 */}
      <Card
        title={
          <Space>
            <TrophyOutlined style={{ color: '#faad14' }} />
            <span>幹桌統計</span>
            {cadreGrowth && growthBadge(cadreGrowth)}
          </Space>
        }
        loading={loading}
        extra={
          cadreGrowth && (
            <Space direction="vertical" size={0}>
              <Text type="secondary">較上月：</Text>
              <Text type={cadreGrowth.isGrowth ? 'success' : 'error'} strong>
                {cadreGrowth.isGrowth ? '↑' : '↓'} 消費 {Math.abs(cadreGrowth.consumption)}%
              </Text>
            </Space>
          )
        }
        style={{ marginBottom: 24 }}
      >
        {cadreTables.length > 0 ? (
          <>
            {/* 本月統計摘要 */}
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={6}>
                <Statistic
                  title="本月總消費"
                  value={cadreTables.reduce((sum, r) => sum + (Number(r.總消費) || 0), 0)}
                  prefix={<DollarOutlined />}
                  suffix="NT$"
                  precision={0}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="本月紀錄數"
                  value={cadreTables.length}
                  prefix={<TableOutlined />}
                />
              </Col>
              {cadreGrowth && (
                <>
                  <Col span={6}>
                    <Statistic
                      title="上月總消費"
                      value={cadreTables.reduce((sum, r) => sum + (Number(r.總消費) || 0), 0) * (1 - cadreGrowth.consumption / 100)}
                      prefix={<DollarOutlined />}
                      suffix="NT$"
                      precision={0}
                    />
                  </Col>
                  <Col span={6}>
                    <Statistic
                      title="上月紀錄數"
                      value={Math.round(cadreTables.length / (1 + cadreGrowth.tables / 100))}
                      prefix={<TableOutlined />}
                    />
                  </Col>
                </>
              )}
            </Row>

            <Table
              dataSource={cadreTables}
              columns={cadreColumns}
              rowKey="公關訂桌"
              pagination={false}
              size="middle"
              summary={() => (
                <Table.Summary fixed>
                  <Table.Summary.Row style={{ background: '#f0f0f0' }}>
                    <Table.Summary.Cell index={0}><Text strong>合計</Text></Table.Summary.Cell>
                    <Table.Summary.Cell index={1}><Text strong>{cadreTables.length} 人</Text></Table.Summary.Cell>
                    <Table.Summary.Cell index={2}>
                      <Text type="danger" strong>
                        NT$ {cadreTables.reduce((sum, r) => sum + (Number(r.總消費) || 0), 0).toLocaleString()}
                      </Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={3}>
                      <Tag color="green" style={{ fontWeight: 'bold' }}>{cadreTables.length} 筆</Tag>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                </Table.Summary>
              )}
            />
          </>
        ) : (
          <Alert
            message="本月暂无幹桌統計數據"
            type="info"
            showIcon
          />
        )}
      </Card>
    </div>
  );
}
