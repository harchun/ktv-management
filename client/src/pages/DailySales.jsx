import { useState, useEffect, useRef, useMemo } from 'react';
import { Table, Button, Input, Modal, Form, DatePicker, Select, InputNumber, Tag, Space, message, Popconfirm, Card, Row, Col } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../utils/api';
import { formatDate } from '../utils/formatDate';

const cardStyle = {
  background: 'rgba(26, 26, 46, 0.8)',
  border: '1px solid #333',
  borderRadius: 12,
};

export default function DailySales() {
  const [dataSource, setDataSource] = useState([]);
  const [cadres, setCadres] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [dateRange, setDateRange] = useState([
    dayjs().startOf('month'),
    dayjs().endOf('month'),
  ]);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [quickSubmitting, setQuickSubmitting] = useState(false);
  const [form] = Form.useForm();
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth <= 768 : false);
  const [submitting, setSubmitting] = useState(false);
  const submitLock = useRef(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const dateRangeRef = useRef(dateRange);
  dateRangeRef.current = dateRange;

  const fetchData = async () => {
    setLoading(true);
    try {
      const [start, end] = dateRangeRef.current || [null, null];
      const params = {};
      if (start) params.start = start.format('YYYY-MM-DD');
      if (end) params.end = end.format('YYYY-MM-DD');
      const res = await api.get('/daily-sales', { params });
      setDataSource(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      message.error('取得營業資料失敗');
    } finally {
      setLoading(false);
    }
  };

  const fetchOptions = async () => {
    try {
      const [cadRes, custRes] = await Promise.all([api.get('/cadres'), api.get('/customers')]);
      setCadres(cadRes.data || []);
      setCustomers(custRes.data || []);
    } catch (e) { /* ignore */ }
  };

  useEffect(() => { fetchData(); fetchOptions(); }, []);

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const handleSave = async (values) => {
    // Prevent concurrent submissions
    if (submitLock.current) return;
    submitLock.current = true;
    setSubmitting(true);
    try {
      const payload = {
        ...values,
        日期: values.日期 ? values.日期.format('YYYY-MM-DD') : null,
        公司吸收額: Number(values.公司吸收額) || 0,
        幹部吸收額: Number(values.幹部吸收額) || 0,
        餐酒: Number(values.餐酒) || 0,
        包廂費: Number(values.包廂費) || 0,
        坐檯費: Number(values.坐檯費) || 0,
        公關費用: Number(values.公關費用) || 0,
        進出全: Number(values.進出全) || 0,
        小潔: Number(values.小潔) || 0,
        服務費: Number(values.服務費) || 0,
        稅額: Number(values.稅額) || 0,
        業績: Number(values.業績) || 0,
        現金: Number(values.現金) || 0,
        信用: Number(values.信用) || 0,
        簽帳: Number(values.簽帳) || 0,
        其它: Number(values.其它) || 0,
      };
      
      if (editing) {
        await api.put(`/daily-sales/${editing['營業編號']}`, payload);
        message.success('更新成功');
      } else {
        await api.post('/daily-sales', payload);
        message.success('新增成功');
      }
      setModalVisible(false);
      form.resetFields();
      fetchData();
    } catch (err) {
      message.error(err.response?.data?.error || '操作失敗');
    } finally {
      submitLock.current = false;
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/daily-sales/${id}`);
      message.success('刪除成功');
      fetchData();
    } catch (err) {
      message.error('刪除失敗');
    }
  };

  const [customerQuickVisible, setCustomerQuickVisible] = useState(false);
  const [quickForm] = Form.useForm();
  const cadreLevelOrder = { '一線': 1, '常董': 2, '公關': 3, '管理層': 4, '行政': 5, '場部': 6, '一般': 7 };
  const cadreOptions = [...cadres]
    .sort((a, b) => (cadreLevelOrder[a.等級] || 9) - (cadreLevelOrder[b.等級] || 9))
    .map(c => ({ value: c['幹部編號'], label: `${c.姓名}${c.暱稱 ? ` (${c.暱稱})` : ''}` }));
  const customerOptions = customers.map(c => ({ value: c['客戶編號'], label: `${c.客戶姓名}${c.暱稱 ? ` (${c.暱稱})` : ''}` }));

  const columns = [
    { title: '編號', dataIndex: '營業編號', key: 'id', width: 60 },
    { title: '日期', dataIndex: '日期', key: 'date', width: 100, render: formatDate },
    { title: '幹部', dataIndex: '幹部姓名', key: 'cadre', width: 80 },
    { title: '房號', dataIndex: '房號', key: 'room', width: 70 },
    { title: '客戶名', dataIndex: '客戶姓名', key: 'customer', width: 100 },
    { title: '人數', dataIndex: '人數', width: 50 },
    { title: '業績', dataIndex: '業績', width: 100, render: (v) => `NT$ ${Number(v || 0).toLocaleString()}` },
    { title: '現金', dataIndex: '現金', width: 80, render: (v) => Number(v || 0).toLocaleString() },
    { title: '信用', dataIndex: '信用', width: 80, render: (v) => Number(v || 0).toLocaleString() },
    { title: '簽帳', dataIndex: '簽帳', width: 80, render: (v) => Number(v || 0).toLocaleString() },
    { title: '操作', key: 'actions', width: 120, render: (_, record) => (
      <Space>
        <Button type="link" icon={<EditOutlined />} onClick={() => {
          setEditing(record);
          form.setFieldsValue({
            ...record,
            日期: record.日期 ? dayjs(record.日期) : null,
          });
          setModalVisible(true);
        }} />
        <Popconfirm title="確定刪除？" onConfirm={() => handleDelete(record['營業編號'])}>
          <Button type="link" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      </Space>
    )},
  ];

  // Memoized filtered data to prevent re-compute on every render
  const filteredData = useMemo(() => {
    return searchText
      ? dataSource.filter(r =>
          (r.客戶姓名 || '').toLowerCase().includes(searchText.toLowerCase()) ||
          (r.幹部姓名 || '').toLowerCase().includes(searchText.toLowerCase()) ||
          (r.房號 || '').includes(searchText)
        )
      : dataSource;
  }, [dataSource, searchText]);

  // Memoized totals to prevent re-calculation on every render
  const totals = useMemo(() => {
    const r = filteredData.reduce((acc, row) => {
      acc.現金 += Number(row.現金) || 0;
      acc.信用 += Number(row.信用) || 0;
      acc.簽帳 += Number(row.簽帳) || 0;
      acc.其它 += Number(row.其它) || 0;
      acc.業績 += Number(row.業績) || 0;
      acc.人數 += Number(row.人數) || 0;
      acc.包廂費 += Number(row.包廂費) || 0;
      acc.公關費用 += Number(row.公關費用) || 0;
      acc.小潔 += Number(row.小潔) || 0;
      return acc;
    }, { 現金: 0, 信用: 0, 簽帳: 0, 其它: 0, 業績: 0, 人數: 0, 包廂費: 0, 公關費用: 0, 小潔: 0 });
    return { ...r, 總營業額: r.現金 + r.信用 + r.簽帳 + r.其它 };
  }, [filteredData]);

  return (
    <div>
      <Card style={cardStyle} bodyStyle={{ padding: 0 }} className="page-content">
        <div style={{ padding: isMobile ? 12 : 20 }}>
          {/* Control bar */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? 12 : 0,
          }}>
            <h2 style={{ color: '#2ecc71', margin: 0, fontSize: isMobile ? 18 : undefined }} className="page-title">📊 每月營業總表</h2>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
              ...(isMobile ? { width: '100%' } : {}),
            }}>
              <DatePicker.RangePicker
                onChange={(dates) => {
                  setDateRange(dates);
                  if (dates && dates[0] && dates[1]) {
                    fetchData();
                  }
                }}
                allowClear={false}
                style={{ ...(isMobile ? { width: '100%' } : { width: 220 }) }}
              />
              <Button size="small" onClick={() => { setDateRange([dayjs().startOf('month'), dayjs().endOf('month')]); fetchData(); }} style={isMobile ? { width: '100%', marginBottom: 4 } : {}}>本月</Button>
              <Button size="small" onClick={() => { setDateRange([dayjs().subtract(1, 'month').startOf('month'), dayjs().subtract(1, 'month').endOf('month')]); fetchData(); }} style={isMobile ? { width: '100%', marginBottom: 4 } : {}}>上月</Button>
              <Button size="small" onClick={() => { setDateRange([dayjs().startOf('year'), dayjs().endOf('year')]); fetchData(); }} style={isMobile ? { width: '100%', marginBottom: 4 } : {}}>今年</Button>
              <Button size="small" onClick={() => { setDateRange([null, null]); fetchData(); }} style={isMobile ? { width: '100%' } : {}}>全部</Button>
              <Input.Search
                placeholder="搜尋客戶/幹部/房號..."
                allowClear
                style={{ width: isMobile ? '100%' : 300 }}
                prefix={<SearchOutlined style={{ color: '#2ecc71' }} />}
                onChange={(e) => setSearchText(e.target.value)}
              />
              <Button
                type="primary"
                icon={<PlusOutlined />}
                style={{
                  ...(isMobile ? { width: '100%' } : {}),
                  background: '#2ecc71',
                  border: 'none',
                }}
                onClick={() => { setEditing(null); form.resetFields(); setModalVisible(true); }}
              >
                {isMobile ? '+ 新增' : '新增營業紀錄'}
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]} className="stat-cards-mobile">
            {[
              { label: '總營業額', value: totals.總營業額, color: '#2ecc71', border: '#2ecc71' },
              { label: '總業績', value: totals.業績, color: '#3498db', border: '#3498db' },
              { label: '來客數', value: totals.人數, color: '#9b59b6', border: '#9b59b6' },
              { label: '底單額', value: totals.小潔 + totals.公關費用 + totals.包廂費, color: '#e74c3c', border: '#e74c3c' },
            ].map((s, i) => (
              <Col span={isMobile ? 12 : 6} key={i}>
                <Card size="small" style={{ background: '#1a1a2e', borderColor: s.border, borderRadius: 8 }}>
                  <div style={{ color: '#999', fontSize: isMobile ? 11 : 12 }}>{s.label}</div>
                  <div style={{ color: s.color, fontSize: isMobile ? 16 : 18, fontWeight: 500 }}>
                    {typeof s.value === 'number' && s.value > 10000 ? `NT$ ${s.value.toLocaleString()}` : s.value.toLocaleString()}
                  </div>
                </Card>
              </Col>
            ))}
          </Row>

          <div className="table-responsive">
            <Table
              dataSource={filteredData}
              columns={columns}
              rowKey="營業編號"
              loading={loading}
              pagination={{
                pageSize,
                showSizeChanger: true,
                showTotal: (t) => `共 ${t} 筆`,
                onChange: (page) => setCurrentPage(page),
                onShowSizeChange: (_, size) => setPageSize(size),
                pageSizeOptions: [10, 20, 50, 100],
              }}
              scroll={{ x: isMobile ? 800 : undefined, y: 500 }}
              size={isMobile ? 'small' : 'middle'}
            />
          </div>
        </div>
      </Card>

      <Modal
        title={editing ? '編輯營業紀錄' : '新增營業紀錄'}
        open={modalVisible && !submitting}
        onCancel={() => { setModalVisible(false); setSubmitting(false); }}
        footer={null}
        width={isMobile ? '100%' : 900}
        style={{ top: isMobile ? 0 : 20 }}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Row gutter={16}>
            <Col span={isMobile ? 24 : 8}>
              <Form.Item name="日期" label="日期" rules={[{ required: true, message: '請選擇日期' }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={isMobile ? 24 : 8}>
              <Form.Item name="幹部編號" label="幹部">
                <Select options={cadreOptions} showSearch optionFilterProp="label" onChange={(v) => {
                  const selected = cadres.find(c => c['幹部編號'] === v);
                  form.setFieldValue('幹部', selected?.姓名 || '');
                }} />
              </Form.Item>
            </Col>
            <Col span={isMobile ? 24 : 8}>
              <Form.Item name="幹部" label="幹部姓名" hidden>
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={isMobile ? 24 : 8}>
              <Form.Item name="房號" label="房號"><Input placeholder="房號" /></Form.Item>
            </Col>
            <Col span={isMobile ? 24 : 8}>
              <Form.Item name="客戶編號" label="客戶" style={{ marginBottom: 4 }}>
                <Select options={customerOptions} showSearch optionFilterProp="label" onChange={(v) => {
                  const selected = customers.find(c => c['客戶編號'] === v);
                  form.setFieldValue('客戶名', selected?.客戶姓名 || '');
                }} />
              </Form.Item>
              <Button size="small" type="dashed" onClick={() => { quickForm.resetFields(); setCustomerQuickVisible(true); }}>+ 快速新增</Button>
            </Col>
            <Col span={isMobile ? 24 : 8}>
              <Form.Item name="客戶名" label="客戶名" hidden><Input /></Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={isMobile ? 24 : 8}>
              <Form.Item name="備註" label="備註"><Input placeholder="備註" /></Form.Item>
            </Col>
            <Col span={isMobile ? 24 : 8}>
              <Form.Item name="人數" label="人數"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
            </Col>
            <Col span={isMobile ? 24 : 8}></Col>
          </Row>

          <div style={{ borderTop: '1px solid #333', paddingTop: 12, marginTop: 12, marginBottom: 12 }}>
            <h4 style={{ color: '#f39c12', margin: '0 0 8px 0' }}>💰 金額明細</h4>
          </div>

          <Row gutter={16}>
            <Col span={isMobile ? 24 : 6}><Form.Item name="公司吸收額" label="公司吸收額"><InputNumber style={{ width: '100%' }} prefix="NT$" /></Form.Item></Col>
            <Col span={isMobile ? 24 : 6}><Form.Item name="幹部吸收額" label="幹部吸收額"><InputNumber style={{ width: '100%' }} prefix="NT$" /></Form.Item></Col>
            <Col span={isMobile ? 24 : 6}><Form.Item name="餐酒" label="餐酒"><InputNumber style={{ width: '100%' }} prefix="NT$" /></Form.Item></Col>
            <Col span={isMobile ? 24 : 6}><Form.Item name="包廂費" label="包廂費"><InputNumber style={{ width: '100%' }} prefix="NT$" /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={isMobile ? 24 : 6}><Form.Item name="坐檯費" label="坐檯費"><InputNumber style={{ width: '100%' }} prefix="NT$" /></Form.Item></Col>
            <Col span={isMobile ? 24 : 6}><Form.Item name="公關費用" label="公關費用"><InputNumber style={{ width: '100%' }} prefix="NT$" /></Form.Item></Col>
            <Col span={isMobile ? 24 : 6}><Form.Item name="進出全" label="進出全"><InputNumber style={{ width: '100%' }} prefix="NT$" /></Form.Item></Col>
            <Col span={isMobile ? 24 : 6}><Form.Item name="小潔" label="小潔"><InputNumber style={{ width: '100%' }} prefix="NT$" /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={isMobile ? 24 : 8}><Form.Item name="服務費" label="服務費"><InputNumber style={{ width: '100%' }} prefix="NT$" /></Form.Item></Col>
            <Col span={isMobile ? 24 : 8}><Form.Item name="稅額" label="稅額"><InputNumber style={{ width: '100%' }} prefix="NT$" /></Form.Item></Col>
            <Col span={isMobile ? 24 : 8}><Form.Item name="業績" label="業績"><InputNumber style={{ width: '100%' }} prefix="NT$" /></Form.Item></Col>
          </Row>

          <div style={{ borderTop: '1px solid #333', paddingTop: 12, marginTop: 12, marginBottom: 12 }}>
            <h4 style={{ color: '#f39c12', margin: '0 0 8px 0' }}>💳 付款方式</h4>
          </div>
          
          <Row gutter={16}>
            <Col span={isMobile ? 24 : 6}><Form.Item name="現金" label="現金"><InputNumber style={{ width: '100%' }} prefix="NT$" /></Form.Item></Col>
            <Col span={isMobile ? 24 : 6}><Form.Item name="信用" label="信用"><InputNumber style={{ width: '100%' }} prefix="NT$" /></Form.Item></Col>
            <Col span={isMobile ? 24 : 6}><Form.Item name="簽帳" label="簽帳"><InputNumber style={{ width: '100%' }} prefix="NT$" /></Form.Item></Col>
            <Col span={isMobile ? 24 : 6}><Form.Item name="其它" label="其它"><InputNumber style={{ width: '100%' }} prefix="NT$" /></Form.Item></Col>
          </Row>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right', marginTop: 16 }}>
            <Button style={{ marginRight: 8 }} onClick={() => setModalVisible(false)}>取消</Button>
            <Button type="primary" htmlType="submit" style={{ background: '#2ecc71', border: 'none' }} disabled={submitting}>{editing ? '更新' : '新增'}{submitting ? '著...' : ''}</Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Quick Add Customer Modal */}
      <Modal
        title="快速新增客戶"
        open={customerQuickVisible}
        onCancel={() => setCustomerQuickVisible(false)}
        footer={null}
        width={isMobile ? '100%' : 450}
      >
        <Form form={quickForm} layout="vertical" onFinish={async (values) => {
          if (quickSubmitting) return;
          setQuickSubmitting(true);
          try {
            const payload = {
              客戶姓名: values.姓名,
              暱稱: values.暱稱 || null,
              類別: '一般',
              電話: values.電話 || null,
              行動電話: values.手機 || null,
              LINE_ID: values.LINE || null,
              首次消費日期: null,
              總消費金額: 0,
            };
            const res = await api.post('/customers', payload);
            const newCustomer = res.data;
            setCustomers(prev => [...prev, newCustomer]);
            setCustomerQuickVisible(false);
            form.setFieldValue('客戶編號', newCustomer['客戶編號']);
            form.setFieldValue('客戶名', newCustomer.客戶姓名);
            message.success('已新增並填入');
          } catch (err) {
            message.error(err.response?.data?.error || '新增失敗');
          } finally {
            setQuickSubmitting(false);
          }
        }}>
          <Form.Item name="姓名" label="客戶姓名" rules={[{ required: true, message: '請輸入姓名' }]}>
            <Input placeholder="請輸入客戶姓名" />
          </Form.Item>
          <Form.Item name="暱稱" label="暱稱"><Input placeholder="暱稱" /></Form.Item>
          <Form.Item name="電話" label="電話"><Input placeholder="電話" /></Form.Item>
          <Form.Item name="手機" label="手機"><Input placeholder="手機" /></Form.Item>
          <Form.Item name="LINE" label="LINE ID"><Input placeholder="LINE ID" /></Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" style={{ background: '#2ecc71', border: 'none' }} loading={quickSubmitting}>新增並填入</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
