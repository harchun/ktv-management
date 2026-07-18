import { useState, useEffect } from 'react';
import {
  Table, Button, Input, Modal, Form, Select, Tag, Space, message, Popconfirm, Card,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import api from '../utils/api';
import { formatDate } from '../utils/formatDate';

const { Search } = Input;

const cardStyle = {
  background: 'rgba(26, 26, 46, 0.8)',
  border: '1px solid #333',
  borderRadius: 12,
};

export default function Hosts() {
  const [dataSource, setDataSource] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();

  const fetchHosts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/hosts');
      setDataSource(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      message.error('取得公關資料失敗');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHosts();
  }, []);

  const handleSave = async (values) => {
    try {
      if (editing) {
        await api.put(`/hosts/${editing["公關編號"]}`, values);
        message.success('更新成功');
      } else {
        await api.post('/hosts', values);
        message.success('新增成功');
      }
      setModalVisible(false);
      form.resetFields();
      fetchHosts();
    } catch (err) {
      message.error(err.response?.data?.error || '操作失敗');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/hosts/${id}`);
      message.success('刪除成功');
      fetchHosts();
    } catch (err) {
      message.error('刪除失敗');
    }
  };

  const columns = [
    {
      title: '編號',
      dataIndex: '公關編號',
      key: 'id',
      width: 70,
    },
    {
      title: '姓名',
      dataIndex: '姓名',
      key: 'name',
      render: (v) => <span style={{ color: '#f39c12', fontWeight: 500 }}>{v}</span>,
    },
    {
      title: '暱稱',
      dataIndex: '暱稱',
      key: 'nickname',
      width: 100,
    },
    {
      title: '電話',
      dataIndex: '聯絡方式',
      key: 'phone',
      width: 130,
    },
    {
      title: '身高',
      dataIndex: '身高',
      key: 'height',
      width: 80,
      render: (v) => v ? `${v}cm` : '-',
    },
    {
      title: '血型',
      dataIndex: '三圍',
      key: 'blood_type',
      width: 70,
    },
    {
      title: '生日',
      dataIndex: '生日',
      key: 'birthday',
      width: 110,
      render: formatDate,
    },
    {
      title: '狀態',
      dataIndex: '狀態',
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
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => {
              setEditing(record);
              form.setFieldsValue(record);
              setModalVisible(true);
            }}
          />
          <Popconfirm title="確定刪除？" onConfirm={() => handleDelete(record['公關編號'])}>
            <Button type="link" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const filteredData = searchText
    ? dataSource.filter(
        (h) =>
          (h.name || '').toLowerCase().includes(searchText.toLowerCase()) ||
          (h.nickname || '').toLowerCase().includes(searchText.toLowerCase()) ||
          (h.phone || '').includes(searchText)
      )
    : dataSource;

  return (
    <div>
      <Card style={cardStyle} bodyStyle={{ padding: 0 }}>
        <div style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ color: '#f39c12', margin: 0 }}>👩 公關管理</h2>
            <Space>
              <Search
                placeholder="搜尋公關..."
                allowClear
                style={{ width: 250 }}
                prefix={<SearchOutlined style={{ color: '#f39c12' }} />}
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
                新增公關
              </Button>
            </Space>
          </div>

          <div className="table-responsive">
          <Table
            dataSource={filteredData}
            columns={columns}
            rowKey="公關編號"
            loading={loading}
            pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `共 ${t} 筆` }}
            scroll={{ y: 500 }}
          />
          </div>
        </div>
      </Card>

      <Modal
        title={editing ? '編輯公關' : '新增公關'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          {editing && (
            <Form.Item label="公關編號">
              <Input value={editing["公關編號"]} readOnly style={{ background: '#1a1a2e', color: '#f39c12', border: '1px solid #333' }} />
            </Form.Item>
          )}
          <Form.Item name="姓名" label="姓名" rules={[{ required: true, message: '請輸入姓名' }]}>
            <Input placeholder="請輸入姓名" />
          </Form.Item>
          <Form.Item name="暱稱" label="暱稱">
            <Input placeholder="請輸入暱稱" />
          </Form.Item>
          <Form.Item name="聯絡方式" label="電話">
            <Input placeholder="請輸入電話" />
          </Form.Item>
          <Form.Item name="電子信箱" label="Email">
            <Input placeholder="請輸入Email" type="email" />
          </Form.Item>
          <Form.Item name="身高" label="身高(cm)">
            <Input type="number" placeholder="身高" />
          </Form.Item>
          <Form.Item name="體重" label="體重(kg)">
            <Input type="number" placeholder="體重" />
          </Form.Item>
          <Form.Item name="三圍" label="血型">
            <Select placeholder="選擇血型" options={[{value:'A',label:'A型'},{value:'B',label:'B型'},{value:'AB',label:'AB型'},{value:'O',label:'O型'}]} />
          </Form.Item>
          <Form.Item name="生日" label="生日">
            <Input type="date" />
          </Form.Item>
          <Form.Item name="照片" label="照片網址">
            <Input placeholder="照片URL" />
          </Form.Item>
          <Form.Item name="狀態" label="狀態" initialValue="active">
            <Select options={[{value:'active',label:'在職'},{value:'inactive',label:'離職'},{value:'leave',label:'休假'}]} />
          </Form.Item>
          <Form.Item name="備註" label="備註">
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
