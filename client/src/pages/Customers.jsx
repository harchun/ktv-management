import { useState, useEffect } from 'react';
import { Table, Button, Input, Modal, Form, Select, Tag, Space, message, Popconfirm, Card } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, ClockCircleOutlined } from '@ant-design/icons';
import api from '../utils/api';
import { formatDate } from '../utils/formatDate';

const cardStyle = {
  background: 'rgba(26, 26, 46, 0.8)',
  border: '1px solid #333',
  borderRadius: 12,
};

export default function Customers() {
  const [dataSource, setDataSource] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [visitHistory, setVisitHistory] = useState(null);
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [form] = Form.useForm();
  const isMobile = typeof window !== 'undefined' ? window.innerWidth <= 768 : false;

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/customers');
      setDataSource(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      message.error('取得客戶資料失敗');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async (values) => {
    try {
      if (editing) {
        await api.put(`/customers/${editing['客戶編號']}`, values);
        message.success('更新成功');
      } else {
        await api.post('/customers', values);
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
      await api.delete(`/customers/${id}`);
      message.success('刪除成功');
      fetchData();
    } catch (err) {
      message.error('刪除失敗');
    }
  };

  const handleViewVisits = async (record) => {
    try {
      const res = await api.get(`/customers/${record['客戶編號']}/visits`);
      setVisitHistory(res.data);
      setShowVisitModal(true);
    } catch (err) {
      message.error('取得來訪紀錄失敗');
    }
  };

  const getCategoryColor = (cat) => {
    const colors = { VIP: 'gold', '重要': 'red', '一般': 'blue', '潛在': 'cyan', '黑名單': 'volcano' };
    return colors[cat] || 'default';
  };

  const columns = [
    { title: '編號', dataIndex: '客戶編號', key: 'id', width: 70 },
    { title: '客戶名', dataIndex: '客戶姓名', key: 'name', render: (v) => <span style={{ color: '#e74c3c', fontWeight: 500 }}>{v}</span> },
    { title: '暱稱', dataIndex: '暱稱', key: 'nickname', width: 100 },
    { title: '電話', dataIndex: '電話', key: 'phone', width: 130 },
    { title: '類別', dataIndex: '類別', key: 'category', width: 80, render: (cat) => <Tag color={getCategoryColor(cat)}>{cat}</Tag> },
    { title: '操作', key: 'actions', width: 200, render: (_, record) => (
      <Space>
        <Button type="link" icon={<EditOutlined />} onClick={() => { setEditing(record); form.setFieldsValue(record); setModalVisible(true); }} />
        <Button type="link" icon={<ClockCircleOutlined />} onClick={() => handleViewVisits(record)}>來訪</Button>
        <Popconfirm title="確定刪除？" onConfirm={() => handleDelete(record['客戶編號'])}>
          <Button type="link" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      </Space>
    )},
  ];

  const filteredData = searchText
    ? dataSource.filter(c => (c.客戶姓名 || '').toLowerCase().includes(searchText.toLowerCase()) || (c.暱稱 || '').toLowerCase().includes(searchText.toLowerCase()) || (c.電話 || '').includes(searchText))
    : dataSource;

  return (
    <div>
      <Card style={cardStyle} bodyStyle={{ padding: 0 }} className="page-content">
        <div style={{ padding: isMobile ? 12 : 20 }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? 12 : 0,
          }}>
            <h2 style={{ color: '#e74c3c', margin: 0, fontSize: isMobile ? 18 : undefined }} className="page-title">👥 客戶管理</h2>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
              ...(isMobile ? { width: '100%' } : {}),
            }}>
              <Input.Search
                placeholder="搜尋客戶..."
                allowClear
                style={{ width: isMobile ? '100%' : 250 }}
                prefix={<SearchOutlined style={{ color: '#e74c3c' }} />}
                onChange={(e) => setSearchText(e.target.value)}
              />
              <Button
                type="primary"
                icon={<PlusOutlined />}
                style={{
                  ...(isMobile ? { width: '100%' } : {}),
                  background: '#e74c3c',
                  border: 'none',
                }}
                onClick={() => { setEditing(null); form.resetFields(); setModalVisible(true); }}
              >
                {isMobile ? '+ 新增' : '新增客戶'}
              </Button>
            </div>
          </div>
          <div className="table-responsive">
            <Table
              dataSource={filteredData}
              columns={columns}
              rowKey="客戶編號"
              loading={loading}
              pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `共 ${t} 筆` }}
              scroll={{ x: isMobile ? 700 : undefined }}
              size={isMobile ? 'small' : 'middle'}
            />
          </div>
        </div>
      </Card>

      {/* Visit History Modal */}
      <Modal
        title="來訪紀錄"
        open={showVisitModal}
        onCancel={() => setShowVisitModal(false)}
        footer={null}
        width={isMobile ? '100%' : 900}
      >
        {visitHistory && (
          <>
            <div style={{ marginBottom: 16, padding: 12, background: '#1a1a2e', borderRadius: 8 }}>
              <span style={{ color: '#f39c12' }}>多久沒來：</span>
              <span style={{ color: visitHistory.daysSinceLastVisit > 30 ? '#e74c3c' : '#2ecc71', fontWeight: 500, fontSize: 18 }}>
                {visitHistory.daysSinceLastVisit === null ? '從未來訪' : `${visitHistory.daysSinceLastVisit} 天前`}
              </span>
            </div>
            <Table
              dataSource={visitHistory.visits}
              pagination={{ pageSize: 10 }}
              size="small"
              rowKey="營業編號"
              scroll={{ x: isMobile ? 600 : undefined, y: 400 }}
            >
              <Table.Column title="幹部" dataIndex="幹部姓名" width={80} />
              <Table.Column title="日期" dataIndex="日期" width={100} render={formatDate} />
              <Table.Column title="房號" dataIndex="房號" width={80} />
              <Table.Column title="人數" dataIndex="人數" width={60} />
              <Table.Column title="業績" dataIndex="業績" width={100} render={(v) => `NT$ ${Number(v).toLocaleString()}`} />
              <Table.Column title="現金" dataIndex="現金" width={80} />
              <Table.Column title="信用" dataIndex="信用" width={80} />
              <Table.Column title="簽帳" dataIndex="簽帳" width={80} />
            </Table>
          </>
        )}
      </Modal>

      <Modal
        title={editing ? '編輯客戶' : '新增客戶'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={isMobile ? '100%' : 600}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          {editing && (<Form.Item label="客戶編號"><Input value={editing['客戶編號']} readOnly style={{ background: '#1a1a2e', color: '#e74c3c', border: '1px solid #333' }} /></Form.Item>)}
          <Form.Item name="客戶姓名" label="客戶姓名" rules={[{ required: true, message: '請輸入客戶姓名' }]}>
            <Input placeholder="請輸入客戶姓名" />
          </Form.Item>
          <Form.Item name="暱稱" label="暱稱"><Input placeholder="請輸入暱稱" /></Form.Item>
          <Form.Item name="電話" label="電話"><Input placeholder="請輸入電話" /></Form.Item>
          <Form.Item name="行動電話" label="手機"><Input placeholder="請輸入手機" /></Form.Item>
          <Form.Item name="LINE_ID" label="LINE ID"><Input placeholder="請輸入LINE ID" /></Form.Item>
          <Form.Item name="生日" label="生日"><Input type="date" /></Form.Item>
          <Form.Item name="類別" label="類別" initialValue="一般">
            <Select options={[{value:'VIP',label:'VIP'},{value:'重要',label:'重要'},{value:'一般',label:'一般'},{value:'潛在',label:'潛在'},{value:'黑名單',label:'黑名單'}]} />
          </Form.Item>
          <Form.Item name="特徵" label="特徵"><Input.TextArea rows={2} placeholder="客戶特徵" /></Form.Item>
          <Form.Item name="備註" label="備註"><Input.TextArea rows={2} placeholder="備註" /></Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" style={{ background: '#e74c3c', border: 'none' }}>{editing ? '更新' : '新增'}</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
