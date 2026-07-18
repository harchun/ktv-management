import { useState, useEffect } from 'react';
import { Table, Card, Button, Modal, Form, Input, DatePicker, Select, message, Space } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import axios from 'axios';
import { formatDate } from '../utils/formatDate';

const API = axios.create({ baseURL: '/api' });
API.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [hosts, setHosts] = useState([]);
  const [cadres, setCadres] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bookRes, hostRes, cadreRes] = await Promise.all([
        API.get('/bookings'),
        API.get('/hosts'),
        API.get('/cadres'),
      ]);
      setBookings(bookRes.data);
      setHosts(hostRes.data);
      setCadres(cadreRes.data);
    } catch (e) {
      message.error('載入失敗');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async (values) => {
    try {
      await API.post('/bookings', { ...values, 業績: Number(values.業績) });
      message.success('新增成功');
      setModalVisible(false);
      form.resetFields();
      fetchData();
    } catch (e) {
      message.error('操作失敗');
    }
  };

  const columns = [
    { title: '日期', dataIndex: '日期', key: '日期', width: 120, render: formatDate },
    { title: '公關', dataIndex: '公關', key: '公關' },
    { title: '幹部', dataIndex: '幹部', key: '幹部' },
    { title: '客戶', dataIndex: '客戶', key: '客戶' },
    { title: '包廂', dataIndex: '包廂', key: '包廂', width: 80 },
    { title: '業績', dataIndex: '業績', key: '業績', width: 100, render: v => `NT$ ${v?.toLocaleString()}` },
    { title: '結款方式', dataIndex: '結款方式', key: '結款方式', width: 100 },
    { title: '客稱', dataIndex: '客稱', key: '客稱' },
  ];

  return (
    <div>
      <Card
        title="訂桌管理"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingBooking(null); form.resetFields(); setModalVisible(true); }}>
            新增訂桌
          </Button>
        }
      >
        <div className="table-responsive">
        <Table columns={columns} dataSource={bookings} loading={loading} rowKey="id" scroll={{ x: 1000 }} />
        </div>
      </Card>

      <Modal title={editingBooking ? '編輯訂桌' : '新增訂桌'} open={modalVisible} onCancel={() => setModalVisible(false)} footer={null}>
        <Form form={form} onFinish={handleSave} layout="vertical">
          <Form.Item name="日期" label="日期" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="公關" label="公關" rules={[{ required: true }]}>
            <Select options={hosts.map(h => ({ value: h.姓名, label: h.姓名 }))} />
          </Form.Item>
          <Form.Item name="幹部" label="幹部">
            <Select options={cadres.map(c => ({ value: c.姓名, label: c.姓名 }))} />
          </Form.Item>
          <Form.Item name="客戶" label="客戶">
            <Input />
          </Form.Item>
          <Form.Item name="包廂" label="包廂">
            <Input placeholder="如 207" />
          </Form.Item>
          <Form.Item name="業績" label="業績">
            <Input type="number" placeholder="0" />
          </Form.Item>
          <Form.Item name="結款方式" label="結款方式">
            <Select options={[{value:'現金',label:'現金'},{value:'刷卡',label:'刷卡'},{value:'轉帳',label:'轉帳'},{value:'抵用',label:'抵用'}]} />
          </Form.Item>
          <Form.Item name="客稱" label="客稱">
            <Input />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" style={{ width: '100%' }}>儲存</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
