import { useState, useEffect } from 'react';
import { Table, Card, Select, Row, Col, Statistic, Spin, Space, Button, message, DatePicker } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';
import axios from 'axios';

const API = axios.create({ baseURL: '/api' });
API.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const { Option } = Select;

const LEVELS = ['全部', '一線', '常董', '公關', '管理層', '行政', '場部', '一般'];

export default function CadreTable() {
  const [data, setData] = useState([]);
  const [months, setMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('全部');
  const [loading, setLoading] = useState(false);
  const [range, setRange] = useState(null);
  const [gossipFilter, setGossipFilter] = useState([]);

  const fetchMonths = async () => {
    try {
      const res = await API.get('/stats/months');
      setMonths(res.data);
      if (res.data.length > 0 && !selectedMonth) {
        setSelectedMonth(res.data[0]);
      }
    } catch (e) { console.error('載入月份失敗', e); }
  };

  const getParams = () => {
    const p = {};
    if (range && range.length === 2 && range[0] && range[1]) {
      p.start = range[0].format('YYYY-MM-DD');
      p.end = range[1].format('YYYY-MM-DD');
    } else if (selectedMonth) {
      p.month = selectedMonth;
    }
    if (selectedLevel && selectedLevel !== '全部') p.level = selectedLevel;
    return p;
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await API.get('/stats/cadre-table', { params: getParams() });
      setData(res.data);
    } catch (e) { message.error('載入失敗'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchMonths();
  }, []);

  useEffect(() => {
    if (range || selectedMonth) fetchData();
  }, [selectedMonth, selectedLevel, range]);

  const totalConsumption = data.reduce((sum, row) => sum + (Number(row.總消費) || 0), 0);
  const totalRecords = data.reduce((sum, r) => sum + (Number(r.紀錄數) || 0), 0);

  const handleExport = async () => {
    // Filter rows to selected gossip (if any), else all
    const exportData = gossipFilter.length ? data.filter((row) => gossipFilter.includes(row.公關)) : data;

    // Fetch details for every row (parallel) so the workbook includes 明細
    const detailsMap = {};
    await Promise.all(exportData.map(async (row) => {
      try {
        const params = { gossip: row.公關, ...getParams() };
        const res = await API.get('/stats/cadre-table-details', { params });
        detailsMap[row.公關] = res.data || [];
      } catch (e2) {
        detailsMap[row.公關] = [];
      }
    }));

    const periodStr = (range && range.length === 2)
      ? `${range[0].format('YYYY/MM/DD')} ~ ${range[1].format('YYYY/MM/DD')}`
      : (selectedMonth || '全部');
    const levelStr = selectedLevel || '全部';
    const gossipStr = gossipFilter.length ? gossipFilter.join('、') : '全部';
    const wb = XLSX.utils.book_new();

    // Sheet 1: 彙總
    const summary = [
      ['幹桌統計'],
      [`時間：${periodStr} | 等級：${levelStr} | 公關：${gossipStr} | 總消費：NT$ ${totalConsumption.toLocaleString('zh-TW')} | 紀錄數：${totalRecords}`],
      [],
      ['排名', '公關', '消費金額', '紀錄數'],
      ...exportData.map((row, idx) => [idx + 1, row.公關, row.總消費 || 0, row.紀錄數 || 0]),
    ];
    const ws1 = XLSX.utils.aoa_to_sheet(summary);
    ws1['!cols'] = [{ wch: 6 }, { wch: 14 }, { wch: 14 }, { wch: 8 }];
    ws1['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }, { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } }];
    XLSX.utils.book_append_sheet(wb, ws1, '幹桌統計');

    // Sheet 2: 明細
    const detailRows = [['公關', '幹部', '日期', '客戶名', '消費金額']];
    exportData.forEach((row) => {
      (detailsMap[row.公關] || []).forEach((d) => {
        detailRows.push([row.公關, d.幹部 || '', String(d.日期 || '').slice(0, 10), d.客戶名 || '', d.總消費 || 0]);
      });
    });
    const ws2 = XLSX.utils.aoa_to_sheet(detailRows);
    ws2['!cols'] = [{ wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 16 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, ws2, '明細');

    const safePeriod = periodStr.replace(/[\\/:*?"<>|~]/g, '-');
    const safeGossip = gossipFilter.length ? gossipFilter.join('-') : '全部';
    XLSX.writeFile(wb, `幹桌統計_${safeGossip}_${safePeriod}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const columns = [
    { title: '排名', dataIndex: 'rank', key: 'rank', width: 70, render: (val) => (
      <span style={{
        fontWeight: 'bold',
        color: val <= 3 ? '#f39c12' : '#fff',
        background: val <= 3 ? 'rgba(243,156,18,0.2)' : 'transparent',
        padding: '2px 8px',
        borderRadius: 4
      }}>{val}</span>
    )},
    { title: '公關', dataIndex: '公關', key: '公關', width: 100, render: (val) => val || '-' },
    { title: '消費金額', dataIndex: '總消費', key: '總消費', width: 120, render: (val) => `NT$ ${Math.round(val || 0).toLocaleString('zh-TW')}` },
    { title: '紀錄數', dataIndex: '紀錄數', key: '紀錄數', width: 80 },
  ];

  const tableData = data.map((row, idx) => ({ ...row, rank: idx + 1 }));

  return (
    <div>
      <Card
        title="幹桌統計"
        extra={
          <Space>
            <Button icon={<DownloadOutlined />} onClick={handleExport} style={{ background: '#27ae60', borderColor: '#27ae60', color: '#fff' }}>
              Excel 下載
            </Button>
            <span style={{ color: '#aaa' }}>選擇月份:</span>
            <Select
              value={selectedMonth}
              onChange={setSelectedMonth}
              style={{ width: 140 }}
              placeholder="選擇月份"
            >
              {months.map(m => <Option key={m} value={m}>{m}</Option>)}
            </Select>
            <span style={{ color: '#aaa', marginLeft: 16 }}>等級:</span>
            <Select
              value={selectedLevel}
              onChange={setSelectedLevel}
              style={{ width: 120 }}
            >
              {LEVELS.map(l => <Option key={l} value={l}>{l}</Option>)}
            </Select>
            <span style={{ color: '#aaa', marginLeft: 16 }}>公關:</span>
            <Select
              mode="multiple"
              value={gossipFilter}
              onChange={setGossipFilter}
              allowClear
              placeholder="指定公關(可多選)"
              style={{ width: 220, maxWidth: 300 }}
              options={[...new Set(data.map((r) => r.公關).filter(Boolean))].map((g) => ({ label: g, value: g }))}
              optionFilterProp="label"
            />
            <span style={{ color: '#aaa', marginLeft: 16 }}>時間區間:</span>
            <DatePicker.RangePicker
              value={range}
              onChange={setRange}
              allowClear
              placeholder={['開始','結束']}
            />
          </Space>
        }
      >
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col span={8}>
            <Statistic 
              title="總消費金額" 
              value={totalConsumption} 
              prefix="NT$" 
              precision={0}
              valueStyle={{ color: '#f39c12' }}
            />
          </Col>
          <Col span={8}>
            <Statistic 
              title="總紀錄數" 
              value={data.reduce((sum, r) => sum + (r.紀錄數 || 0), 0)} 
              valueStyle={{ color: '#27ae60' }}
            />
          </Col>
          <Col span={8}>
            <Statistic 
              title="統計期間" 
              value={range && range.length === 2 ? `${range[0].format('MM/DD')}~${range[1].format('MM/DD')}` : (selectedMonth || '全部')} 
              valueStyle={{ color: '#fff' }}
            />
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={tableData}
          rowKey={(record) => record.公關}
          loading={loading}
          pagination={{ pageSize: 50, showSizeChanger: false }}
          scroll={{ x: 600 }}
          size="small"
          className="table-striped"
        />
      </Card>
    </div>
  );
}