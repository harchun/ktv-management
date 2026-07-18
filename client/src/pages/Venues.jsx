import { useState, useEffect } from 'react';
import {
  Table, Button, Input, Modal, Form, Select, Space, message, Popconfirm, Card, Tag,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, HomeOutlined } from '@ant-design/icons';
import api from '../utils/api';

const { Search } = Input;

const cardStyle = {
  background: 'rgba(26, 26, 46, 0.8)',
  border: '1px solid #333',
  borderRadius: 12,
};

export default function Venues() {
  const [dataSource, setDataSource] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();

  const fetchVenues = async () => {
    setLoading(true);
    try {
      const res = await api.get('/venues');
      setDataSource(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      message.error('取得八大雲集資料失敗');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVenues();
  }, []);

  const handleSave = async (values) => {
    try {
      if (editing) {
        await api.put(`/venues/${editing['店家編號']}`, values);
        message.success('更新成功');
      } else {
        await api.post('/venues', values);
        message.success('新增成功');
      }
      setModalVisible(false);
      form.resetFields();
      fetchVenues();
    } catch (err) {
      message.error(err.response?.data?.error || '操作失敗');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/venues/${id}`);
      message.success('刪除成功');
      fetchVenues();
    } catch (err) {
      message.error('刪除失敗');
    }
  };

  const filteredData = searchText
    ? dataSource.filter(
        (v) =>
          (v.name || '').toLowerCase().includes(searchText.toLowerCase()) ||
          (v.address || '').toLowerCase().includes(searchText.toLowerCase())
      )
    : dataSource;

  const columns = [
    {
      title: '編號',
      dataIndex: '店家編號',
      key: 'id',
      width: 70,
    },
    {
      title: '場域名稱',
      dataIndex: '店名',
      key: 'name',
      render: (v) => <span style={{ color: '#f39c12', fontWeight: 500 }}>{v}</span>,
    },
    {
      title: '地址',
      dataIndex: '地址',
      key: 'address',
      ellipsis: true,
    },
    {
      title: '電話',
      dataIndex: '電話',
      key: 'phone',
      width: 140,
    },
    {
      title: '房號數量',
      dataIndex: '房間數',
      key: 'room_count',
      width: 100,
    },
    {
      title: '等級',
      dataIndex: '類型',
      key: 'level',
      width: 100,
      render: (v) => {
        const stars = v ? '⭐'.repeat(Math.min(v, 5)) : '-';
        return <span>{stars}</span>;
      },
    },
    {
      title: '狀態',
      dataIndex: '合作狀態',
      key: 'status',
      width: 90,
      render: (status) => {
        const map = { active: ['營業中', 'green'], inactive: ['歇業', 'red'], maintenance: ['維修中', 'orange'] };
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
          <Popconfirm title="確定刪除？" onConfirm={() => handleDelete(record['店家編號'])}>
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
            <h2 style={{ color: '#f39c12', margin: 0 }}>🏢 八大雲集管理</h2>
            <Space.Compact style={{ flex: 1, maxWidth: 400 }}>
              <Search
                placeholder="搜尋場域..."
                allowClear
                prefix={<HomeOutlined style={{ color: '#f39c12' }} />}
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
                新增場域
              </Button>
            </Space.Compact>
          </div>

          <div className="table-responsive">
          <Table
            dataSource={filteredData}
            columns={columns}
            rowKey="店家編號"
            loading={loading}
            pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `共 ${t} 筆` }}
            scroll={{ y: 500 }}
          />
          </div>
        </div>
      </Card>

      <Modal
        title={editing ? '編輯場域' : '新增場域'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          {editing && (
            <Form.Item label="店家編號">
              <Input value={editing['店家編號']} readOnly style={{ background: '#1a1a2e', color: '#f39c12', border: '1px solid #333' }} />
            </Form.Item>
          )}
          <Form.Item name="name" label="場域名稱" rules={[{ required: true, message: '請輸入場域名稱' }]}>
            <Input placeholder="場域名稱" />
          </Form.Item>
          <Form.Item name="address" label="地址">
            <Input placeholder="場域地址" />
          </Form.Item>
          <Form.Item name="phone" label="電話">
            <Input placeholder="聯絡電話" />
          </Form.Item>
          <Form.Item name="manager" label="負責人">
            <Input placeholder="負責人" />
          </Form.Item>
          <Form.Item name="room_count" label="房號數量">
            <Input type="number" placeholder="房號數量" min={0} />
          </Form.Item>
          <Form.Item name="level" label="等級(1-5)">
            <Input type="number" placeholder="等級" min={1} max={5} />
          </Form.Item>
          <Form.Item name="opening_hours" label="營業時間">
            <Input placeholder="如：18:00-04:00" />
          </Form.Item>
          <Form.Item name="status" label="狀態" initialValue="active">
            <Select options={[{value:'active',label:'營業中'},{value:'inactive',label:'歇業'},{value:'maintenance',label:'維修中'}]} />
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
