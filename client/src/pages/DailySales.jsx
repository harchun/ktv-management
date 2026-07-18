import { useState, useEffect } from 'react';
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
  const [dateRange, setDateRange] = useState([null, null]);
  const [form] = Form.useForm();
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth <= 768 : false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [start, end] = dateRange || [null, null];
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

  const handleSave = async (values) => {
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

  const cadreOptions = cadres.map(c => ({ value: c['幹部編號'], label: `${c.姓名}${c.暱稱 ? ` (${c.暱稱})` : ''}` }));
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

  const filteredData = searchText
    ? dataSource.filter(r =>
        (r.客戶姓名 || '').toLowerCase().includes(searchText.toLowerCase()) ||
        (r.幹部姓名 || '').toLowerCase().includes(searchText.toLowerCase()) ||
        (r.房號 || '').includes(searchText)
      )
    : dataSource;

  // Summary totals
  const totals = filteredData.reduce((acc, r) => {
    acc.業績 += Number(r.業績) || 0;
    acc.現金 += Number(r.現金) || 0;
    acc.信用 += Number(r.信用) || 0;
    acc.簽帳 += Number(r.簽帳) || 0;
    acc.餐酒 += Number(r.餐酒) || 0;
    acc.包廂費 += Number(r.包廂費) || 0;
    return acc;
  }, { 業績: 0, 現金: 0, 信用: 0, 簽帳: 0, 餐酒: 0, 包廂費: 0 });

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
            <h2 style={{ color: '#2ecc71', margin: 0, fontSize: isMobile ? 18 : undefined }} className="page-title">📊 每日營業表</h2>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
              ...(isMobile ? { width: '100%' } : {}),
            }}>
              <DatePicker.RangePicker
                onChange={(dates) => setDateRange(dates)}
                style={{ ...(isMobile ? { width: '100%' } : {}) }}
              />
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
              { label: '總業績', value: totals.業績, color: '#2ecc71', border: '#2ecc71' },
              { label: '現金', value: totals.現金, color: '#3498db', border: '#3498db' },
              { label: '信用', value: totals.信用, color: '#9b59b6', border: '#9b59b6' },
              { label: '簽帳', value: totals.簽帳, color: '#e67e22', border: '#e67e22' },
              { label: '餐酒', value: totals.餐酒, color: '#e74c3c', border: '#e74c3c' },
              { label: '包廂費', value: totals.包廂費, color: '#f1c40f', border: '#f1c40f' },
            ].map((s, i) => (
              <Col span={4} key={i}>
                <Card size="small" style={{ background: '#1a1a2e', borderColor: s.border, borderRadius: 8 }}>
                  <div style={{ color: '#999', fontSize: isMobile ? 11 : 12 }}>{s.label}</div>
                  <div style={{ color: s.color, fontSize: isMobile ? 16 : 18, fontWeight: 500 }}>NT$ {s.value.toLocaleString()}</div>
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
              pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `共 ${t} 筆` }}
              scroll={{ x: isMobile ? 800 : undefined, y: 500 }}
              size={isMobile ? 'small' : 'middle'}
            />
          </div>
        </div>
      </Card>

      <Modal
        title={editing ? '編輯營業紀錄' : '新增營業紀錄'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
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
              <Form.Item name="客戶編號" label="客戶">
                <Select options={customerOptions} showSearch optionFilterProp="label" />
              </Form.Item>
            </Col>
            <Col span={isMobile ? 24 : 8}>
              <Form.Item name="客戶名" label="客戶名" hidden><Input /></Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={isMobile ? 24 : 8}>
              <Form.Item name="人數" label="人數"><InputNumber min={1} style={{ width: '100%' }} /></Form.Item>
            </Col>
          </Row>

          <div style={{ borderTop: '1px solid #333', paddingTop: 12, marginTop: 12, marginBottom: 12 }}>
            <h4 style={{ color: '#f39c12', margin: '0 0 8px 0' }}>💰 金額明細</h4>
          </div>
          
          <Row gutter={[16, 12]}>
            <Col span={isMobile ? 24 : 6}><Form.Item name="公司吸收額" label="公司吸收額"><InputNumber style={{ width: '100%' }} prefix="NT$" /></Form.Item></Col>
            <Col span={isMobile ? 24 : 6}><Form.Item name="幹部吸收額" label="幹部吸收額"><InputNumber style={{ width: '100%' }} prefix="NT$" /></Form.Item></Col>
            <Col span={isMobile ? 24 : 6}><Form.Item name="餐酒" label="餐酒"><InputNumber style={{ width: '100%' }} prefix="NT$" /></Form.Item></Col>
            <Col span={isMobile ? 24 : 6}><Form.Item name="包廂費" label="包廂費"><InputNumber style={{ width: '100%' }} prefix="NT$" /></Form.Item></Col>
          </Row>
          <Row gutter={[16, 12]}>
            <Col span={isMobile ? 24 : 6}><Form.Item name="坐檯費" label="坐檯費"><InputNumber style={{ width: '100%' }} prefix="NT$" /></Form.Item></Col>
            <Col span={isMobile ? 24 : 6}><Form.Item name="公關費用" label="公關費用"><InputNumber style={{ width: '100%' }} prefix="NT$" /></Form.Item></Col>
            <Col span={isMobile ? 24 : 6}><Form.Item name="進出全" label="進出全"><InputNumber style={{ width: '100%' }} prefix="NT$" /></Form.Item></Col>
            <Col span={isMobile ? 24 : 6}><Form.Item name="小潔" label="小潔"><InputNumber style={{ width: '100%' }} prefix="NT$" /></Form.Item></Col>
          </Row>
          <Row gutter={[16, 12]}>
            <Col span={isMobile ? 24 : 6}><Form.Item name="服務費" label="服務費"><InputNumber style={{ width: '100%' }} prefix="NT$" /></Form.Item></Col>
            <Col span={isMobile ? 24 : 6}><Form.Item name="稅額" label="稅額"><InputNumber style={{ width: '100%' }} prefix="NT$" /></Form.Item></Col>
            <Col span={isMobile ? 24 : 6}><Form.Item name="業績" label="業績"><InputNumber style={{ width: '100%' }} prefix="NT$" /></Form.Item></Col>
            <Col span={isMobile ? 24 : 6}><Form.Item name="備註" label="備註"><Input /></Form.Item></Col>
          </Row>

          <div style={{ borderTop: '1px solid #333', paddingTop: 12, marginTop: 12, marginBottom: 12 }}>
            <h4 style={{ color: '#f39c12', margin: '0 0 8px 0' }}>💳 付款方式</h4>
          </div>
          
          <Row gutter={[16, 12]}>
            <Col span={isMobile ? 24 : 6}><Form.Item name="現金" label="現金"><InputNumber style={{ width: '100%' }} prefix="NT$" /></Form.Item></Col>
            <Col span={isMobile ? 24 : 6}><Form.Item name="信用" label="信用"><InputNumber style={{ width: '100%' }} prefix="NT$" /></Form.Item></Col>
            <Col span={isMobile ? 24 : 6}><Form.Item name="簽帳" label="簽帳"><InputNumber style={{ width: '100%' }} prefix="NT$" /></Form.Item></Col>
            <Col span={isMobile ? 24 : 6}><Form.Item name="其它" label="其它"><InputNumber style={{ width: '100%' }} prefix="NT$" /></Form.Item></Col>
          </Row>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right', marginTop: 16 }}>
            <Button style={{ marginRight: 8 }} onClick={() => setModalVisible(false)}>取消</Button>
            <Button type="primary" htmlType="submit" style={{ background: '#2ecc71', border: 'none' }}>{editing ? '更新' : '新增'}</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
