import { useState, useEffect } from 'react';
import {
  Table, Button, Input, Modal, Form, Select, Space, message, Popconfirm, Card, Tag, InputNumber,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, PhoneOutlined } from '@ant-design/icons';
import api from '../utils/api';

const { Search } = Input;

export default function Brokers() {
  const [dataSource, setDataSource] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();

  const fetchBrokers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/brokers');
      setDataSource(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      message.error('取得經紀公司資料失敗');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrokers();
  }, []);

  const handleSave = async (values) => {
    try {
      if (editing) {
        await api.put(`/brokers/${editing['經紀公司編號']}`, values);
        message.success('更新成功');
      } else {
        await api.post('/brokers', values);
        message.success('新增成功');
      }
      setModalVisible(false);
      form.resetFields();
      fetchBrokers();
    } catch (err) {
      message.error(err.response?.data?.error || '操作失敗');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/brokers/${id}`);
      message.success('刪除成功');
      fetchBrokers();
    } catch (err) {
      message.error('刪除失敗');
    }
  };

  const filteredData = searchText
    ? dataSource.filter(
        (b) =>
          (b['公司名稱'] || '').toLowerCase().includes(searchText.toLowerCase()) ||
          (b['負責人'] || '').toLowerCase().includes(searchText.toLowerCase()) ||
          (b['聯絡方式'] || '').includes(searchText)
      )
    : dataSource;

  const columns = [
    {
      title: '編號',
      dataIndex: '經紀公司編號',
      key: '經紀公司編號',
      width: 70,
    },
    {
      title: '公司名稱',
      dataIndex: '公司名稱',
      key: '公司名稱',
      render: (v) => <span style={{ color: '#f39c12', fontWeight: 500 }}>{v}</span>,
    },
    {
      title: '聯絡人',
      dataIndex: '負責人',
      key: '負責人',
      width: 120,
    },
    {
      title: '電話',
      dataIndex: '聯絡方式',
      key: '聯絡方式',
      width: 140,
      render: (v) => <><PhoneOutlined style={{ color: '#f39c12', marginRight: 4 }} />{v}</>,
    },
    {
      title: '地址',
      dataIndex: '地址',
      key: '地址',
      ellipsis: true,
    },
    {
      title: '佣金比例',
      dataIndex: '佣金比例',
      key: '佣金比例',
      width: 100,
      render: (v) => v ? `${parseFloat(v)*100}%` : '-',
    },
    {
      title: '狀態',
      dataIndex: '狀態',
      key: '狀態',
      width: 90,
      render: (status) => {
        const map = { '合作中': ['合作中', 'green'], '暫停': ['暫停', 'orange'], '解約': ['解約', 'red'] };
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
            form.setFieldsValue({
              ...record,
              佣金比例: record['佣金比例'] ? parseFloat(record['佣金比例']) * 100 : undefined,
            });
            setModalVisible(true);
          }} />
          <Popconfirm title="確定刪除？" onConfirm={() => handleDelete(record['經紀公司編號'])}>
            <Button type="link" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card style={{ background: 'rgba(26, 26, 46, 0.8)', border: '1px solid #333', borderRadius: 12 }} bodyStyle={{ padding: 0 }}>
        <div style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <h2 style={{ color: '#f39c12', margin: 0 }}>📞 經紀公司管理</h2>
            <Space.Compact style={{ flex: 1, maxWidth: 400 }}>
              <Search
                placeholder="搜尋經紀公司..."
                allowClear
                prefix={<PhoneOutlined style={{ color: '#f39c12' }} />}
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
                新增
              </Button>
            </Space.Compact>
          </div>

          <div className="table-responsive">
          <Table
            dataSource={filteredData}
            columns={columns}
            rowKey="經紀公司編號"
            loading={loading}
            pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `共 ${t} 筆` }}
            scroll={{ y: 500 }}
          />
          </div>
        </div>
      </Card>

      <Modal
        title={editing ? '編輯經紀公司' : '新增經紀公司'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          {editing && (
            <Form.Item label="經紀公司編號">
              <Input value={editing['經紀公司編號']} readOnly style={{ background: '#1a1a2e', color: '#f39c12', border: '1px solid #333' }} />
            </Form.Item>
          )}
          <Form.Item name="公司名稱" label="公司名稱" rules={[{ required: true, message: '請輸入公司名稱' }]}>
            <Input placeholder="請輸入公司名稱" />
          </Form.Item>
          <Form.Item name="負責人" label="聯絡人">
            <Input placeholder="請輸入聯絡人" />
          </Form.Item>
          <Form.Item name="聯絡方式" label="電話">
            <Input placeholder="請輸入電話" />
          </Form.Item>
          <Form.Item name="地址" label="地址">
            <Input placeholder="請輸入地址" />
          </Form.Item>
          <Form.Item name="電子信箱" label="Email">
            <Input placeholder="請輸入Email" />
          </Form.Item>
          <Form.Item name="佣金比例" label="佣金比例(%)">
            <InputNumber min={0} max={100} style={{ width: '100%' }} placeholder="例如: 30" />
          </Form.Item>
          <Form.Item name="狀態" label="狀態" initialValue="合作中">
            <Select options={[{value:'合作中',label:'合作中'},{value:'暫停',label:'暫停'},{value:'解約',label:'解約'}]} />
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
