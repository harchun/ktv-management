import { useState, useEffect } from 'react';
import { Table, Button, Input, Modal, Form, Select, Space, message, Popconfirm, Card } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, KeyOutlined } from '@ant-design/icons';
import api from '../utils/api';

const cardStyle = {
  background: 'rgba(26, 26, 46, 0.8)',
  border: '1px solid #333',
  borderRadius: 12,
};

export default function Settings() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [passwordModal, setPasswordModal] = useState(false);
  const [changingPassword, setChangingPassword] = useState(null);
  const [form] = Form.useForm();
  const [passForm] = Form.useForm();
  const isMobile = typeof window !== 'undefined' ? window.innerWidth <= 768 : false;

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users');
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      message.info('使用者管理 API 不可用');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async (values) => {
    try {
      if (editing) {
        await api.put(`/users/${editing.用戶編號}`, values);
        message.success('更新成功');
      } else {
        await api.post('/users', values);
        message.success('新增成功');
      }
      setModalVisible(false);
      form.resetFields();
      fetchData();
    } catch (err) {
      message.error(err.response?.data?.error || '操作失敗');
    }
  };

  const handleChangePassword = async (values) => {
    try {
      await api.put(`/users/${changingPassword.用戶編號}`, { 密碼: values.new_password });
      message.success('密碼修改成功');
      setPasswordModal(false);
      passForm.resetFields();
      setChangingPassword(null);
    } catch (err) {
      message.error('密碼修改失敗');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/users/${id}`);
      message.success('刪除成功');
      fetchData();
    } catch (err) {
      message.error(err.response?.data?.error || '刪除失敗');
    }
  };

  const roleColors = { 管理員: 'red', 幹部: 'blue', 公關: 'green', 經紀人: 'purple' };

  const columns = [
    { title: 'ID', dataIndex: '用戶編號', key: 'id', width: 60 },
    { title: '帳號', dataIndex: '帳號', key: 'account', render: (v) => <span style={{ color: '#3498db', fontWeight: 500 }}>{v}</span> },
    { title: '角色', dataIndex: '角色', key: 'role', width: 100, render: (r) => <span style={{ color: roleColors[r] || '#aaa' }}>{r}</span> },
    { title: '顯示名稱', dataIndex: '顯示名稱', key: 'displayName', width: 120 },
    { title: '狀態', dataIndex: '是否啟用', key: 'enabled', width: 80, render: (v) => v ? <span style={{ color: '#2ecc71' }}>啟用</span> : <span style={{ color: '#e74c3c' }}>停用</span> },
    { title: '操作', key: 'actions', width: 180, render: (_, record) => (
      <Space>
        <Button type="link" icon={<EditOutlined />} onClick={() => { setEditing(record); form.setFieldsValue({ username: record.帳號, role: record.角色, displayName: record.顯示名稱, enabled: record.是否啟用 }); setModalVisible(true); }} />
        <Button type="link" icon={<KeyOutlined />} onClick={() => { setChangingPassword(record); passForm.resetFields(); setPasswordModal(true); }}>改密</Button>
        <Popconfirm title="確定刪除？" onConfirm={() => handleDelete(record.用戶編號)}>
          <Button type="link" danger icon={<DeleteOutlined />} disabled={record.帳號 === 'admin'} />
        </Popconfirm>
      </Space>
    )},
  ];

  const filteredData = searchText
    ? users.filter(u => (u.帳號 || '').toLowerCase().includes(searchText.toLowerCase()) || (u.角色 || '').toLowerCase().includes(searchText.toLowerCase()))
    : users;

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
            <h2 style={{ color: '#f39c12', margin: 0, fontSize: isMobile ? 18 : undefined }} className="page-title">⚙️ 系統設定</h2>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
              ...(isMobile ? { width: '100%' } : {}),
            }}>
              <Input.Search
                placeholder="搜尋帳號..."
                allowClear
                style={{ width: isMobile ? '100%' : 200 }}
                prefix={<SearchOutlined style={{ color: '#f39c12' }} />}
                onChange={(e) => setSearchText(e.target.value)}
              />
              <Button
                type="primary"
                icon={<PlusOutlined />}
                style={{
                  ...(isMobile ? { width: '100%' } : {}),
                  background: '#f39c12',
                  border: 'none',
                }}
                onClick={() => { setEditing(null); form.resetFields(); setModalVisible(true); }}
              >
                {isMobile ? '+ 新增' : '新增使用者'}
              </Button>
            </div>
          </div>
          <div className="table-responsive">
            <Table
              dataSource={filteredData}
              columns={columns}
              rowKey="用戶編號"
              loading={loading}
              pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 筆` }}
              scroll={{ x: isMobile ? 600 : undefined }}
              size={isMobile ? 'small' : 'middle'}
            />
          </div>
        </div>
      </Card>

      {/* Add/Edit User Modal */}
      <Modal
        title={editing ? '編輯使用者' : '新增使用者'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={isMobile ? '100%' : 500}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          {editing && (<Form.Item label="用戶編號"><Input value={editing.用戶編號} readOnly style={{ background: '#1a1a2e', color: '#f39c12', border: '1px solid #333' }} /></Form.Item>)}
          <Form.Item name="username" label="帳號" rules={[{ required: true, message: '請輸入帳號' }]}>
            <Input placeholder="請輸入帳號" />
          </Form.Item>
          {!editing && (<Form.Item name="password" label="密碼" rules={[{ required: true, message: '請輸入密碼' }]}>
            <Input.Password placeholder="請輸入密碼" />
          </Form.Item>)}
          <Form.Item name="role" label="角色" initialValue="管理員">
            <Select options={[{value:'管理員',label:'管理員'},{value:'幹部',label:'幹部'},{value:'公關',label:'公關'},{value:'經紀人',label:'經紀人'}]} />
          </Form.Item>
          <Form.Item name="displayName" label="顯示名稱"><Input placeholder="請輸入顯示名稱" /></Form.Item>
          <Form.Item name="enabled" label="是否啟用" initialValue={1}>
            <Select options={[{value:1,label:'啟用'},{value:0,label:'停用'}]} />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" style={{ background: '#f39c12', border: 'none' }}>{editing ? '更新' : '新增'}</Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        title={`修改密碼 - ${changingPassword?.帳號 || ''}`}
        open={passwordModal}
        onCancel={() => { setPasswordModal(false); setChangingPassword(null); }}
        footer={null}
        width={isMobile ? '100%' : 400}
      >
        <Form form={passForm} layout="vertical" onFinish={handleChangePassword}>
          <Form.Item name="new_password" label="新密碼" rules={[{ required: true, message: '請輸入新密碼' }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" style={{ background: '#f39c12', border: 'none' }}>確認修改</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
