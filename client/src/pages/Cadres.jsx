import { useState, useEffect } from 'react';
import { Table, Button, Input, Modal, Form, Select, Tag, Space, message, Popconfirm, Card } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import api from '../utils/api';

const cardStyle = {
  background: 'rgba(26, 26, 46, 0.8)',
  border: '1px solid #333',
  borderRadius: 12,
};

export default function Cadres() {
  const [dataSource, setDataSource] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();
  const isMobile = typeof window !== 'undefined' ? window.innerWidth <= 768 : false;

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/cadres');
      setDataSource(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      message.error('取得幹部資料失敗');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async (values) => {
    try {
      if (editing) {
        await api.put(`/cadres/${editing['幹部編號']}`, values);
        message.success('更新成功');
      } else {
        await api.post('/cadres', values);
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
      await api.delete(`/cadres/${id}`);
      message.success('刪除成功');
      fetchData();
    } catch (err) {
      message.error('刪除失敗');
    }
  };

  const columns = [
    { title: '編號', dataIndex: '幹部編號', key: 'id', width: 70 },
    { title: '姓名', dataIndex: '姓名', key: 'name', render: (v) => <span style={{ color: '#3498db', fontWeight: 500 }}>{v}</span> },
    { title: '暱稱', dataIndex: '暱稱', key: 'nickname', width: 100 },
    { title: '等級', dataIndex: '等級', key: 'level', width: 80 },
    { title: '聯絡方式', dataIndex: '聯絡方式', key: 'contact', width: 130 },
    { title: '操作', key: 'actions', width: 120, render: (_, record) => (
      <Space>
        <Button type="link" icon={<EditOutlined />} onClick={() => { setEditing(record); form.setFieldsValue(record); setModalVisible(true); }} />
        <Popconfirm title="確定刪除？" onConfirm={() => handleDelete(record['幹部編號'])}>
          <Button type="link" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      </Space>
    )},
  ];

  const filteredData = searchText
    ? dataSource.filter(c => (c.姓名 || '').toLowerCase().includes(searchText.toLowerCase()) || (c.暱稱 || '').toLowerCase().includes(searchText.toLowerCase()))
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
            <h2 style={{ color: '#3498db', margin: 0, fontSize: isMobile ? 18 : undefined }} className="page-title">👔 幹部管理</h2>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
              ...(isMobile ? { width: '100%' } : {}),
            }}>
              <Input.Search
                placeholder="搜尋幹部..."
                allowClear
                style={{ width: isMobile ? '100%' : 250 }}
                prefix={<SearchOutlined style={{ color: '#3498db' }} />}
                onChange={(e) => setSearchText(e.target.value)}
              />
              <Button
                type="primary"
                icon={<PlusOutlined />}
                style={{
                  ...(isMobile ? { width: '100%' } : {}),
                  background: '#3498db',
                  border: 'none',
                }}
                onClick={() => { setEditing(null); form.resetFields(); setModalVisible(true); }}
              >
                {isMobile ? '+ 新增' : '新增幹部'}
              </Button>
            </div>
          </div>
          <div className="table-responsive">
            <Table
              dataSource={filteredData}
              columns={columns}
              rowKey="幹部編號"
              loading={loading}
              pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `共 ${t} 筆` }}
              scroll={{ x: isMobile ? 600 : undefined }}
              size={isMobile ? 'small' : 'middle'}
            />
          </div>
        </div>
      </Card>
      <Modal
        title={editing ? '編輯幹部' : '新增幹部'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={isMobile ? '100%' : 500}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          {editing && (<Form.Item label="幹部編號"><Input value={editing['幹部編號']} readOnly style={{ background: '#1a1a2e', color: '#3498db', border: '1px solid #333' }} /></Form.Item>)}
          <Form.Item name="姓名" label="姓名" rules={[{ required: true, message: '請輸入姓名' }]}>
            <Input placeholder="請輸入姓名" />
          </Form.Item>
          <Form.Item name="暱稱" label="暱稱"><Input placeholder="請輸入暱稱" /></Form.Item>
          <Form.Item name="等級" label="等級" initialValue="一般">
            <Select options={[{value:'一線',label:'一線'},{value:'常董',label:'常董'},{value:'一般',label:'一般'}]} />
          </Form.Item>
          <Form.Item name="聯絡方式" label="聯絡方式"><Input placeholder="請輸入聯絡方式" /></Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" style={{ background: '#3498db', border: 'none' }}>{editing ? '更新' : '新增'}</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
