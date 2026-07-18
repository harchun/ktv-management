import { useState, useEffect } from 'react';
import {
  Table, Button, Input, Modal, Form, Select, Space, message, Popconfirm, Card, Tag,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UserOutlined } from '@ant-design/icons';
import api from '../utils/api';
import { formatDate } from '../utils/formatDate';

const { Search } = Input;

const cardStyle = {
  background: 'rgba(26, 26, 46, 0.8)',
  border: '1px solid #333',
  borderRadius: 12,
};

export default function Staff() {
  const [dataSource, setDataSource] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await api.get('/staff');
      setDataSource(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      message.error('取得人事資料失敗');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleSave = async (values) => {
    try {
      if (editing) {
        await api.put(`/staff/${editing['人事編號']}`, values);
        message.success('更新成功');
      } else {
        await api.post('/staff', values);
        message.success('新增成功');
      }
      setModalVisible(false);
      form.resetFields();
      fetchStaff();
    } catch (err) {
      message.error(err.response?.data?.error || '操作失敗');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/staff/${id}`);
      message.success('刪除成功');
      fetchStaff();
    } catch (err) {
      message.error('刪除失敗');
    }
  };

  const filteredData = searchText
    ? dataSource.filter(
        (s) =>
          (s.name || '').toLowerCase().includes(searchText.toLowerCase()) ||
          (s.employee_id || '').toLowerCase().includes(searchText.toLowerCase()) ||
          (s.department || '').toLowerCase().includes(searchText.toLowerCase())
      )
    : dataSource;

  const columns = [
    {
      title: '員工編號',
      dataIndex: '人事編號',
      key: 'employee_id',
      width: 120,
    },
    {
      title: '姓名',
      dataIndex: '姓名',
      key: 'name',
      render: (v) => <span style={{ color: '#f39c12', fontWeight: 500 }}>{v}</span>,
    },
    {
      title: '部門',
      dataIndex: '部門',
      key: 'department',
      width: 120,
    },
    {
      title: '職位',
      dataIndex: '職位',
      key: 'position',
      width: 120,
    },
    {
      title: '電話',
      dataIndex: '聯絡方式',
      key: 'phone',
      width: 130,
    },
    {
      title: ' Email',
      dataIndex: '電子信箱',
      key: 'email',
      ellipsis: true,
    },
    {
      title: '入職日期',
      dataIndex: '入職日期',
      key: 'hire_date',
      width: 110,
      render: formatDate,
    },
    {
      title: '薪資',
      dataIndex: '薪資',
      key: 'salary',
      width: 100,
      render: (v) => v ? `$${Number(v).toLocaleString()}` : '-',
    },
    {
      title: '狀態',
      dataIndex: '員工狀態',
      key: 'status',
      width: 90,
      render: (status) => {
        const map = { active: ['在職', 'green'], inactive: ['離職', 'red'], leave: ['休假', 'orange'] };
        const [label, color] = map[status] || ['未知', 'default'];
        return <Tag color={color}>{label}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => {
            setEditing(record);
            form.setFieldsValue(record);
            setModalVisible(true);
          }} />
          <Popconfirm title="確定刪除？" onConfirm={() => handleDelete(record['人事編號'])}>
            <Button type="link" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card style={cardStyle} bodyStyle={{ padding: 0 }}>
        <div style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <h2 style={{ color: '#f39c12', margin: 0 }}>👤 人事資料管理</h2>
            <Space.Compact style={{ flex: 1, maxWidth: 400 }}>
              <Search
                placeholder="搜尋員工..."
                allowClear
                prefix={<UserOutlined style={{ color: '#f39c12' }} />}
                onChange={(e) => setSearchText(e.target.value)}
              />
              <Button
                type="primary"
                icon={<PlusOutlined />}
                style={{ background: '#f39c12', border: 'none' }}
                onClick={() => {
                  setEditing(null);
                  form.resetFields();
                  setModalVisible(true);
                }}
              >
                新增員工
              </Button>
            </Space.Compact>
          </div>

          <div className="table-responsive">
          <Table
            dataSource={filteredData}
            columns={columns}
            rowKey="人事編號"
            loading={loading}
            pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `共 ${t} 筆` }}
            scroll={{ y: 500 }}
          />
          </div>
        </div>
      </Card>

      <Modal
        title={editing ? '編輯員工' : '新增員工'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          {editing && (
            <Form.Item label="人事編號">
              <Input value={editing['人事編號']} readOnly style={{ background: '#1a1a2e', color: '#f39c12', border: '1px solid #333' }} />
            </Form.Item>
          )}
          <Form.Item name="employee_id" label="員工編號" rules={[{ required: true, message: '請輸入員工編號' }]}>
            <Input placeholder="員工編號" />
          </Form.Item>
          <Form.Item name="name" label="姓名" rules={[{ required: true, message: '請輸入姓名' }]}>
            <Input placeholder="姓名" />
          </Form.Item>
          <Form.Item name="department" label="部門" rules={[{ required: true, message: '請選擇部門' }]}>
            <Select placeholder="選擇部門" options={[{value:'公關部',label:'公關部'},{value:'業務部',label:'業務部'},{value:'財務部',label:'財務部'},{value:'管理部',label:'管理部'},{value:'技術部',label:'技術部'}]} />
          </Form.Item>
          <Form.Item name="position" label="職位">
            <Input placeholder="職位" />
          </Form.Item>
          <Form.Item name="phone" label="電話">
            <Input placeholder="電話" />
          </Form.Item>
          <Form.Item name="email" label="Email">
            <Input type="email" placeholder="Email" />
          </Form.Item>
          <Form.Item name="hire_date" label="入職日期">
            <Input type="date" />
          </Form.Item>
          <Form.Item name="birth_date" label="生日">
            <Input type="date" />
          </Form.Item>
          <Form.Item name="salary" label="薪資">
            <Input type="number" placeholder="月薪" min={0} />
          </Form.Item>
          <Form.Item name="status" label="狀態" initialValue="active">
            <Select options={[{value:'active',label:'在職'},{value:'inactive',label:'離職'},{value:'leave',label:'休假'}]} />
          </Form.Item>
          <Form.Item name="address" label="地址">
            <Input placeholder="地址" />
          </Form.Item>
          <Form.Item name="emergency_contact" label="緊急聯絡人">
            <Input placeholder="緊急聯絡人" />
          </Form.Item>
          <Form.Item name="remark" label="備註">
            <Input.TextArea rows={2} placeholder="備註" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" style={{ background: '#f39c12', border: 'none' }}>
              {editing ? '更新' : '新增'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
