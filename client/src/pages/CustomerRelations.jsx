import { useState, useEffect, useRef } from 'react';
import { Table, Input, Card, Statistic, Row, Col, Tag, Typography, Collapse, Alert, Button, DatePicker } from 'antd';
import { SearchOutlined, TrophyOutlined, UserOutlined, TeamOutlined, WarningOutlined, PrinterOutlined } from '@ant-design/icons';
import api from '../utils/api';
import { formatDate } from '../utils/formatDate';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-tw';
import { zhTW } from 'antd/locale';
import './CustomerRelations.css';

const cardStyle = {
  background: 'rgba(26, 26, 46, 0.8)',
  border: '1px solid #333',
  borderRadius: 12,
};

const { Panel } = Collapse;

const MAX_ROWS_PER_PAGE = 22;

// ==================== Single Page Component ====================
function PrintPage({ cadre, isInactive = false, currentPage = 1, totalPages = 1 }) {
  const today = new Date().toLocaleDateString('zh-TW');
  const customers = cadre.客戶列表?.slice(0, MAX_ROWS_PER_PAGE) || [];
  const startIdx = (currentPage - 1) * MAX_ROWS_PER_PAGE;
  const endIdx = startIdx + customers.length;
  const actualCustomers = cadre.客戶列表?.slice(startIdx, endIdx) || [];
  const hasMore = (cadre.客戶列表?.length || 0) > endIdx;
  
  const label = isInactive ? '40天無來訪' : '主客名單';
  const totalCustomers = cadre.客戶列表?.length || 0;
  const totalVisits = cadre.來訪次數 || 0;
  
  // Get the latest visit date for inactive customers
  let lastVisitDate = null;
  if (isInactive && cadre.客戶列表?.length > 0) {
    lastVisitDate = cadre.客戶列表.reduce((latest, c) => {
      const date = c.最後來訪 || c.最后来访;
      return date && (!latest || date > latest) ? date : latest;
    }, null);
  }
  
  const tableColumns = isInactive ?
    [
      { text: '編號', width: '50mm', align: 'center' },
      { text: '客戶名', width: '50mm', align: 'left' },
      { text: '最後來訪', width: '50mm', align: 'center' },
      { text: '公關訂桌', width: '50mm', align: 'center' },
    ] :
    [
      { text: '編號', width: '50mm', align: 'center' },
      { text: '客戶名', width: '50mm', align: 'left' },
      { text: '來訪次數', width: '50mm', align: 'center' },
    ];

  return (
    <div className="cr-page">
      <div className="cr-page-header">
        <div className="cr-header-left">
          <h1 className="cr-page-title">{cadre.幹部}</h1>
          <span className="cr-page-subtitle">{cadre.幹部暱稱 || ''}</span>
        </div>
        <div className="cr-header-right">
          <span className={`cr-badge ${isInactive ? 'cr-badge-warning' : 'cr-badge-main'}`}>
            {label}
          </span>
        </div>
      </div>
      
      <div className="cr-stats-row">
        <span className="cr-stat-item">
          <strong>{totalCustomers}</strong> 位客戶
        </span>
        {!isInactive && (
          <>
            <span className="cr-stat-divider">|</span>
            <span className="cr-stat-item">
              <strong>{totalVisits}</strong> 次來訪
            </span>
          </>
        )}
        {totalPages > 1 && (
          <>
            <span className="cr-stat-divider">|</span>
            <span className="cr-stat-item">
              第 <strong>{currentPage}</strong> / {totalPages} 頁
            </span>
          </>
        )}
      </div>
      
      <div className="cr-table-wrapper">
        <table className="cr-print-table">
          <thead>
            <tr>
              {tableColumns.map((col, idx) => (
                <th key={idx} className={`cr-col-${idx + 1}`} style={{ width: col.width, textAlign: col.align }}>
                  {col.text}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {actualCustomers.map((customer, cidx) => (
              <tr key={cidx}>
                <td className="cr-col-1" style={{ textAlign: 'center', width: '50mm' }}>{startIdx + cidx + 1}</td>
                <td className="cr-col-2" style={{ width: '50mm' }}>{customer.客戶名 || customer.客户名}</td>
                {isInactive ? (
                  <>
                    <td className="cr-col-3" style={{ textAlign: 'center', width: '50mm' }}>{formatDate(customer.最后来访)}</td>
                    <td className="cr-col-4" style={{ textAlign: 'center', width: '50mm' }}>{customer.公关订桌 || customer.公關訂桌 || '-'}</td>
                  </>
                ) : (
                  <td className="cr-col-3" style={{ textAlign: 'center', width: '50mm' }}>{customer.來訪次數 || customer.来访次数} 次</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {hasMore && (
          <div className="cr-page-more">
            （共 {totalCustomers} 位客戶，見後續頁面）
          </div>
        )}
      </div>
      
      <div className="cr-page-footer">
        <span>日月星辰酒店 KTV</span>
        <span>{isInactive ? (lastVisitDate || today) : today}</span>
      </div>
    </div>
  );
}

// ==================== Print Report Component ====================
function PrintReport({ dataSource, inactiveCustomers }) {
  const renderCadrePages = (cadre, isInactive) => {
    const totalCustomers = cadre.客戶列表?.length || 0;
    const totalPages = Math.ceil(totalCustomers / MAX_ROWS_PER_PAGE);
    
    const pages = [];
    for (let i = 0; i < totalPages; i++) {
      pages.push(
        <PrintPage
          key={`${isInactive ? 'inactive' : 'active'}-${cadre.幹部}-${i}`}
          cadre={cadre}
          isInactive={isInactive}
          currentPage={i + 1}
          totalPages={totalPages}
        />
      );
    }
    return pages;
  };

  return (
    <div className="cr-a4-report">
      {dataSource.flatMap((cadre, idx) => renderCadrePages(cadre, false))}
      {inactiveCustomers.flatMap((item, idx) => renderCadrePages(item, true))}
    </div>
  );
}

// ==================== Main Component ====================
export default function CustomerRelations() {
  const [dataSource, setDataSource] = useState([]);
  const [inactiveCustomers, setInactiveCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
  const [stats, setStats] = useState({ totalCustomers: 0, totalCadres: 0, totalVisits: 0 });
  const [showPrintView, setShowPrintView] = useState(false);
  const isMobile = typeof window !== 'undefined' ? window.innerWidth <= 768 : false;
  const { Title } = Typography;

  const dateRangeRef = useRef(dateRange);
  dateRangeRef.current = dateRange;
  const fetchingRef = useRef(false);

  const fetchData = async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setLoading(true);
    try {
      const params = {};
      if (dateRangeRef.current?.[0]) params.start = dateRangeRef.current[0].format('YYYY-MM-DD');
      if (dateRangeRef.current?.[1]) params.end = dateRangeRef.current[1].format('YYYY-MM-DD');
      const res = await api.get('/customer-relations', { params });
      const data = Array.isArray(res.data) ? res.data : [];
      setDataSource(data);

      const uniqueCustomers = new Set();
      data.forEach(item => {
        item.客戶列表?.forEach(c => uniqueCustomers.add(c.客戶名));
      });
      setStats({
        totalCustomers: uniqueCustomers.size,
        totalCadres: data.length,
        totalVisits: data.reduce((sum, item) => sum + item.來訪次數, 0)
      });
    } catch (err) {
      console.error('取得客戶關係資料失敗', err);
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  };

  const fetchInactiveCustomers = async () => {
    try {
      const params = {};
      if (dateRangeRef.current?.[0]) params.start = dateRangeRef.current[0].format('YYYY-MM-DD');
      if (dateRangeRef.current?.[1]) params.end = dateRangeRef.current[1].format('YYYY-MM-DD');
      const res = await api.get('/inactive-customers', { params });
      const data = Array.isArray(res.data) ? res.data : [];
      setInactiveCustomers(data);
    } catch (err) {
      console.error('取得40天無來訪客戶失敗', err);
    }
  };

  useEffect(() => { fetchData(); fetchInactiveCustomers(); }, []);

  const handleSearch = (value) => {
    setSearchText(value);
  };

  const handleDateChange = (dates) => {
    dateRangeRef.current = dates;
    setDateRange(dates);
    if (dates && dates[0] && dates[1]) {
      fetchData();
      fetchInactiveCustomers();
    }
  };

  const handleQuickFilter = (type) => {
    let range = null;
    if (type === 'month') {
      range = [dayjs().startOf('month'), dayjs().endOf('month')];
    } else if (type === 'lastMonth') {
      range = [dayjs().subtract(1, 'month').startOf('month'), dayjs().subtract(1, 'month').endOf('month')];
    } else if (type === '3months') {
      range = [dayjs().subtract(3, 'month').startOf('month'), dayjs().endOf('month')];
    } else if (type === 'all') {
      range = null;
    }
    dateRangeRef.current = range;
    setDateRange(range);
    if (range) {
      fetchData();
      fetchInactiveCustomers();
    } else {
      fetchData();
      fetchInactiveCustomers();
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('請允許彈出視窗以列印');
      return;
    }

    // Generate HTML content
    const activeContent = dataSource.map(cadre => renderCadrePrint(cadre, false)).join('\n');
    const inactiveContent = inactiveCustomers.map(cadre => renderCadrePrint(cadre, true)).join('\n');

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>KTV 列印報表</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { size: A4; margin: 0; }
    body {
      font-family: "Microsoft JhengHei", "PingFang TC", sans-serif;
      background: white;
      color: #1a1a2e;
    }
    .cr-page {
      width: 210mm;
      height: 297mm;
      padding: 15mm;
      page-break-after: always;
      background: white;
    }
    .cr-page:last-child { page-break-after: avoid; }
    .cr-page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 15px;
      border-bottom: 2px solid #1a1a2e;
      padding-bottom: 10px;
    }
    .cr-page-title { font-size: 18px; font-weight: bold; }
    .cr-page-subtitle { font-size: 12px; color: #666; margin-top: 3px; }
    .cr-badge {
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: bold;
    }
    .cr-badge-main { background: #e74c3c; color: white; }
    .cr-badge-warning { background: #f39c12; color: white; }
    .cr-stats-row {
      margin: 10px 0;
      font-size: 12px;
    }
    .cr-stat-item strong { font-size: 14px; }
    .cr-print-table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0;
    }
    .cr-print-table th, .cr-print-table td {
      border: 1px solid #000;
      padding: 6px 8px;
      font-size: 11px;
      height: 22px;
      vertical-align: middle;
    }
    .cr-print-table th {
      background: #f5f5f5;
      font-weight: bold;
      text-align: center;
    }
    .cr-col-1 { width: 15%; text-align: center; }
    .cr-col-2 { width: 55%; text-align: left; }
    .cr-col-3 { width: 20%; text-align: center; }
    .cr-col-4 { width: 10%; text-align: center; }
    .cr-page-footer {
      margin-top: 20px;
      text-align: center;
      font-size: 10px;
      color: #999;
      border-top: 1px solid #eee;
      padding-top: 10px;
    }
    @media print {
      body { background: white; }
      .cr-page { border: none; }
    }
  </style>
</head>
<body>
  ${activeContent}
  ${inactiveContent}
</body>
</html>`;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
      printWindow.close();
    };
  };

  const renderCadrePrint = (cadre, isInactive) => {
    const label = isInactive ? '40天無來訪' : '主客名單';
    const totalCustomers = cadre.客戶列表?.length || 0;
    const totalVisits = cadre.來訪次數 || 0;

    // Get the latest visit date for inactive customers
    let lastVisitDate = null;
    if (isInactive && cadre.客戶列表?.length > 0) {
      lastVisitDate = cadre.客戶列表.reduce((latest, c) => {
        const date = c.最後來訪 || c.最后来访;
        return date && (!latest || date > latest) ? date : latest;
      }, null);
    }

    const columns = isInactive
      ? ['編號', '客戶名', '最後來訪', '公關訂桌']
      : ['編號', '客戶名', '來訪次數'];

    const rows = (cadre.客戶列表 || []).map((c, idx) =>
      `<tr>
        <td style="text-align:center">${idx + 1}</td>
        <td>${c.客戶名 || ''}</td>
        ${isInactive ? `
          <td>${c.最後來訪 ? c.最後來訪.split('T')[0] : '-'}</td>
          <td>${c.公關訂桌 || '-'}</td>
        ` : `
          <td style="text-align:center">${c.來訪次數 || 0} 次</td>
        `}
      </tr>`
    ).join('');

    return `
<div class="cr-page">
  <div class="cr-page-header">
    <div>
      <div class="cr-page-title">${cadre.幹部}</div>
      <div class="cr-page-subtitle">${cadre.幹部暱稱 || ''}</div>
    </div>
    <span class="cr-badge ${isInactive ? 'cr-badge-warning' : 'cr-badge-main'}">${label}</span>
  </div>
  <div class="cr-stats-row">
    <strong>${totalCustomers}</strong> 位客戶
    ${!isInactive ? ` | <strong>${totalVisits}</strong> 次來訪` : ''}
  </div>
  <table class="cr-print-table">
    <thead>
      <tr>${columns.map(c => `<th>${c}</th>`).join('')}</tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="cr-page-footer">
    <span>日月星辰酒店 KTV</span>
    <span>${lastVisitDate ? new Date(lastVisitDate).toLocaleDateString('zh-TW') : ''}</span>
  </div>
</div>`;
  };

  const handleBack = () => {
    setShowPrintView(false);
  };

  const filteredData = searchText
    ? dataSource.filter(item =>
        (item.幹部 || '').toLowerCase().includes(searchText.toLowerCase()) ||
        item.客戶列表?.some(c => (c.客戶名 || '').toLowerCase().includes(searchText.toLowerCase()))
      )
    : dataSource;

  const filteredInactive = searchText
    ? inactiveCustomers.filter(item =>
        (item.幹部 || '').toLowerCase().includes(searchText.toLowerCase()) ||
        item.客戶列表?.some(c => (c.客戶名 || '').toLowerCase().includes(searchText.toLowerCase()))
      )
    : inactiveCustomers;

  const customerColumns = [
    {
      title: '客戶名',
      dataIndex: '客戶名',
      key: '客戶名',
      width: 150,
      render: (name) => (
        <span style={{ color: '#e74c3c', fontWeight: 500 }}>
          {name}
        </span>
      ),
    },
    {
      title: '來訪次數',
      dataIndex: '來訪次數',
      key: '來訪次數',
      width: 100,
      align: 'center',
      render: (count) => (
        <span style={{ color: '#3498db', fontWeight: 500 }}>{count} 次</span>
      ),
    },
  ];

  const renderCustomerTable = (customerList) => (
    <Table
      dataSource={customerList}
      columns={customerColumns}
      rowKey="客戶名"
      pagination={false}
      size="small"
      scroll={{ y: 300 }}
      className="customer-table"
    />
  );

  // Print View
  if (showPrintView) {
    return (
      <div>
        <div className="no-print" style={{ padding: 16, background: '#f5f7fa', marginBottom: 0 }}>
          <Button type="primary" onClick={handleBack} style={{ background: '#666', borderColor: '#666' }}>
            ← 返回
          </Button>
        </div>
        <PrintReport dataSource={dataSource} inactiveCustomers={inactiveCustomers} />
      </div>
    );
  }

  return (
    <div>
      <Card style={cardStyle} bodyStyle={{ padding: 0 }} className="page-content">
        <div style={{ padding: isMobile ? 12 : 20 }}>
          {/* Stats */}
          <Row gutter={16} style={{ marginBottom: 20 }}>
            <Col span={isMobile ? 24 : 8}>
              <Card style={{ background: 'rgba(231, 76, 60, 0.1)', border: '1px solid #e74c3c' }}>
                <Statistic
                  title="客戶總數"
                  value={stats.totalCustomers}
                  prefix={<UserOutlined style={{ color: '#e74c3c' }} />}
                  valueStyle={{ color: '#e74c3c' }}
                />
              </Card>
            </Col>
            <Col span={isMobile ? 24 : 8}>
              <Card style={{ background: 'rgba(243, 156, 18, 0.1)', border: '1px solid #f39c12' }}>
                <Statistic
                  title="幹部總數"
                  value={stats.totalCadres}
                  prefix={<TrophyOutlined style={{ color: '#f39c12' }} />}
                  valueStyle={{ color: '#f39c12' }}
                />
              </Card>
            </Col>
            <Col span={isMobile ? 24 : 8}>
              <Card style={{ background: 'rgba(52, 152, 219, 0.1)', border: '1px solid #3498db' }}>
                <Statistic
                  title="總來訪次數"
                  value={stats.totalVisits}
                  prefix={<TeamOutlined style={{ color: '#3498db' }} />}
                  valueStyle={{ color: '#3498db' }}
                />
              </Card>
            </Col>
          </Row>

          {/* Search + Date Filter + Print */}
          <div style={{ marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <Input.Search
              placeholder="搜尋幹部名或客戶名..."
              allowClear
              style={{ flex: 1, minWidth: isMobile ? '100%' : 250 }}
              prefix={<SearchOutlined style={{ color: '#e74c3c' }} />}
              onChange={(e) => handleSearch(e.target.value)}
              onSearch={handleSearch}
            />
            <DatePicker.RangePicker
              locale={zhTW}
              onChange={handleDateChange}
              allowClear
              style={{ minWidth: isMobile ? '100%' : 200 }}
            />
            <Button onClick={() => handleQuickFilter('month')}>本月</Button>
            <Button onClick={() => handleQuickFilter('lastMonth')}>上月</Button>
            <Button onClick={() => handleQuickFilter('3months')}>近3月</Button>
            <Button onClick={() => handleQuickFilter('all')}>全部</Button>
            <Button
              type="primary"
              icon={<PrinterOutlined />}
              onClick={handlePrint}
              style={{ background: '#e74c3c', borderColor: '#e74c3c', flexShrink: 0 }}
            >
              列印
            </Button>
          </div>

          {/* Customer List by Cadre */}
          <Title level={4} style={{ color: '#e74c3c', margin: '0 0 12px 0' }}>
            👥 客戶關係表（以幹部分類）
          </Title>

          <Collapse
            defaultActiveKey={[0]}
            accordion
            style={{ background: 'transparent' }}
          >
            {filteredData.map((cadre, idx) => (
              <Panel
                key={idx}
                header={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
                    <TrophyOutlined style={{ color: '#f39c12', fontSize: 18 }} />
                    <span style={{ color: '#f39c12', fontWeight: 600, fontSize: 16 }}>{cadre.幹部}</span>
                    <span style={{ color: '#3498db', fontSize: 13 }}>
                      {cadre.客戶列表.length} 位客戶 · {cadre.來訪次數} 次
                    </span>
                  </div>
                }
                style={{ background: 'rgba(26, 26, 46, 0.6)', marginBottom: 8, borderRadius: 8 }}
              >
                {renderCustomerTable(cadre.客戶列表)}
              </Panel>
            ))}
          </Collapse>

          {/* Inactive customers section */}
          {inactiveCustomers.length > 0 && (
            <div style={{ marginTop: 32 }}>
              <Alert
                type="warning"
                icon={<WarningOutlined />}
                showIcon
                message={`近40天無來訪客戶 (${filteredInactive.length} 位幹部)`}
                style={{ background: 'rgba(255, 193, 7, 0.1)', borderColor: '#ffc107', marginBottom: 16 }}
              />
              <Title level={4} style={{ color: '#ff9800', margin: '0 0 12px 0' }}>
                ⚠️ 40天無來訪客戶
              </Title>
              <Collapse
                accordion
                style={{ background: 'transparent' }}
              >
                {filteredInactive.map((item, idx) => (
                  <Panel
                    key={`inactive-${item.幹部編號 || idx}-${idx}`}
                    header={
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <TrophyOutlined style={{ color: '#ff9800', fontSize: 18 }} />
                        <span style={{ color: '#ff9800', fontWeight: 600, fontSize: 16 }}>{item.幹部}</span>
                        <span style={{ color: '#fff', fontSize: 13 }}>
                          {item.客戶列表?.length || 0} 位客戶
                        </span>
                      </div>
                    }
                    style={{ background: 'rgba(26, 26, 46, 0.6)', marginBottom: 8, borderRadius: 8 }}
                  >
                    <Table
                      dataSource={item.客戶列表 || []}
                      columns={[
                        {
                          title: '客戶名',
                          dataIndex: '客戶名',
                          key: '客戶名',
                          render: (name) => <span style={{ color: '#e74c3c', fontWeight: 500 }}>{name}</span>
                        },
                        {
                          title: '來訪次數',
                          dataIndex: '來訪次數',
                          key: '來訪次數',
                          width: 100,
                          align: 'center',
                          render: (count) => <span style={{ color: '#3498db', fontWeight: 500 }}>{count} 次</span>
                        },
                        {
                          title: '最後來訪',
                          dataIndex: '最後來訪',
                          key: '最後來訪',
                          width: 150,
                          align: 'center',
                          render: (date) => <span style={{ color: '#fff' }}>{formatDate(date)}</span>
                        },
                        {
                          title: '公關訂桌',
                          dataIndex: '公關訂桌',
                          key: '公關訂桌',
                          width: 120,
                          align: 'center',
                          render: (name) => name ? (
                            <Tag style={{ background: 'rgba(255, 215, 0, 0.2)', borderColor: '#ffd700', color: '#ffd700', border: 'none' }}>{name}</Tag>
                          ) : <span style={{ color: '#666' }}>-</span>
                        }
                      ]}
                      rowKey="客戶名"
                      pagination={false}
                      size="small"
                      scroll={{ y: 300 }}
                    />
                  </Panel>
                ))}
              </Collapse>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
