import { useState, useEffect } from 'react';
import { Table, Button, Input, Modal, Form, Select, message, Card, Row, Col, Tag, Space } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import api from '../utils/api';
import { formatDate } from '../utils/formatDate';

const cardStyle = {
  background: 'rgba(26, 26, 46, 0.8)',
  border: '1px solid #333',
  borderRadius: 12,
};

export default function GossipManagement() {
  const [dataSource, setDataSource] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [submitting, setSubmitting] = useState(false);
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
      const [gossipRes, custRes] = await Promise.all([
        api.get('/gossip-orders'),
        api.get('/customers')
      ]);
      setDataSource(Array.isArray(gossipRes.data) ? gossipRes.data : []);
      setCustomers(custRes.data || []);
    } catch (err) {
      message.error('取得公關訂桌資料失敗');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const customerOptions = customers.map(c => ({
    value: c['客戶編號'],
    label: `${c.客戶姓名}${c.暱稱 ? ` (${c.暱稱})` : ''}`
  }));

  const handleSave = async (values) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const payload = {
        ...values,
        訂桌日期: values.訂桌日期 ? values.訂桌日期.format('YYYY-MM-DD') : null,
        公關人數: Number(values.公關人數) || 0,
        消費金額: Number(values.消費金額) || 0,
      };

      if (editing) {
        await api.put(`/gossip-orders/${editing['訂桌編號']}`, payload);
        message.success('更新成功');
      } else {
        await api.post('/gossip-orders', payload);
        message.success('新增成功');
      }
      setModalVisible(false);
      form.resetFields();
      fetchData();
    } catch (err) {
      message.error(err.response?.data?.error || '操作失敗');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/gossip-orders/${id}`);
      message.success('刪除成功');
      fetchData();
    } catch (err) {
      message.error('刪除失敗');
    }
  };

  const columns = [
    { title: '編號', dataIndex: '訂桌編號', key: 'id', width: 100 },
    { title: '訂桌日期', dataIndex: '訂桌日期', key: 'date', width: 100, render: formatDate },
    { title: '客戶名', dataIndex: '客戶姓名', key: 'customer', width: 100 },
    { title: '公關', dataIndex: '公關姓名', key: 'gossip', width: 80 },
    { title: '公關人數', dataIndex: '公關人數', key: 'gossip_count', width: 80, align: 'center' },
    { title: '消費金額', dataIndex: '消費金額', key: 'amount', width: 100, render: (v) => `NT$ ${Number(v || 0).toLocaleString()}` },
    { title: '備註', dataIndex: '備註', key: 'notes', width: 150 },
    { title: '操作', key: 'actions', width: 120, render: (_, record) => (
      <Space>
        <Button type="link" icon={<EditOutlined />} onClick={() => {
          setEditing(record);
          form.setFieldsValue({
            ...record,
            訂桌日期: record.訂桌日期 ? record.訂桌日期 : null,
          });
          setModalVisible(true);
        }} />
        <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record['訂桌編號'])} />
      </Space>
    )},
  ];

  const filteredData = searchText
    ? dataSource.filter(r =>
        (r.客戶姓名 || '').toLowerCase().includes(searchText.toLowerCase()) ||
        (r.公關姓名 || '').toLowerCase().includes(searchText.toLowerCase()) ||
        (r.備註 || '').toLowerCase().includes(searchText.toLowerCase())
      )
    : dataSource;

  const totalAmount = filteredData.reduce((sum, r) => sum + Number(r.消費金額 || 0), 0);

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
            <h2 style={{ color: '#9b59b6', margin: 0, fontSize: isMobile ? 18 : undefined }} className="page-title">👠 公關管理</h2>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
              ...(isMobile ? { width: '100%' } : {}),
            }}>
              <Input.Search
                placeholder="搜尋客戶/公關/備註..."
                allowClear
                style={{ width: isMobile ? '100%' : 300 }}
                prefix={<SearchOutlined style={{ color: '#9b59b6' }} />}
                onChange={(e) => setSearchText(e.target.value)}
              />
              <Button
                type="primary"
                icon={<PlusOutlined />}
                style={{
                  ...(isMobile ? { width: '100%' } : {}),
                  background: '#9b59b6',
                  border: 'none',
                }}
                onClick={() => { setEditing(null); form.resetFields(); setModalVisible(true); }}
              >
                {isMobile ? '+ 新增' : '新增公關訂桌'}
              </Button>
            </div>
          </div>

          {/* Summary */}
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={isMobile ? 24 : 8}>
              <Card size="small" style={{ background: '#1a1a2e', borderColor: '#9b59b6', borderRadius: 8 }}>
                <div style={{ color: '#999', fontSize: 12 }}>總訂桌數</div>
                <div style={{ color: '#9b59b6', fontSize: 18, fontWeight: 500 }}>{filteredData.length} 筆</div>
              </Card>
            </Col>
            <Col span={isMobile ? 24 : 8}>
              <Card size="small" style={{ background: '#1a1a2e', borderColor: '#e74c3c', borderRadius: 8 }}>
                <div style={{ color: '#999', fontSize: 12 }}>總消費金額</div>
                <div style={{ color: '#e74c3c', fontSize: 18, fontWeight: 500 }}>NT$ {totalAmount.toLocaleString()}</div>
              </Card>
            </Col>
          </Row>

          <div className="table-responsive">
            <Table
              dataSource={filteredData}
              columns={columns}
              rowKey="訂桌編號"
              loading={loading}
              pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `共 ${t} 筆` }}
              scroll={{ x: isMobile ? 900 : undefined, y: 500 }}
              size={isMobile ? 'small' : 'middle'}
            />
          </div>
        </div>
      </Card>

      <Modal
        title={editing ? '編輯公關訂桌' : '新增公關訂桌'}
        open={modalVisible && !submitting}
        onCancel={() => { setModalVisible(false); setSubmitting(false); }}
        footer={null}
        width={isMobile ? '100%' : 600}
        style={{ top: isMobile ? 0 : 20 }}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Row gutter={16}>
            <Col span={isMobile ? 24 : 12}>
              <Form.Item name="訂桌日期" label="訂桌日期" rules={[{ required: true, message: '請選擇日期' }]}>
                <Input type="date" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={isMobile ? 24 : 12}>
              <Form.Item name="公關人數" label="公關人數">
                <Select options={[
                  { value: 1, label: '1 人' },
                  { value: 2, label: '2 人' },
                  { value: 3, label: '3 人' },
                  { value: 4, label: '4 人' },
                  { value: 5, label: '5 人' },
                ]} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={isMobile ? 24 : 12}>
              <Form.Item name="客戶編號" label="客戶">
                <Select options={customerOptions} showSearch optionFilterProp="label" onChange={(v) => {
                  const selected = customers.find(c => c['客戶編號'] === v);
                  form.setFieldValue('客戶姓名', selected?.客戶姓名 || '');
                }} />
              </Form.Item>
            </Col>
            <Col span={isMobile ? 24 : 12}>
              <Form.Item name="公關" label="公關">
                <Input placeholder="請輸入公關姓名" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="公關姓名" label="公關姓名" hidden>
            <Input />
          </Form.Item>
          <Form.Item name="客戶姓名" label="客戶姓名" hidden>
            <Input />
          </Form.Item>
          <Row gutter={16}>
            <Col span={isMobile ? 24 : 12}>
              <Form.Item name="消費金額" label="消費金額">
                <InputNumber min={0} style={{ width: '100%' }} prefix="NT$" />
              </Form.Item>
            </Col>
            <Col span={isMobile ? 24 : 12}>
              <Form.Item name="房號" label="房號">
                <Input placeholder="房號" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="備註" label="備註">
            <Input.TextArea rows={3} placeholder="備註" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right', marginTop: 16 }}>
            <Button style={{ marginRight: 8 }} onClick={() => setModalVisible(false)}>取消</Button>
            <Button type="primary" htmlType="submit" style={{ background: '#9b59b6', border: 'none' }} disabled={submitting}>
              {editing ? '更新' : '新增'}{submitting ? '著...' : ''}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
