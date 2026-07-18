import { useState, useEffect } from 'react';
import { Table, Card, Button, DatePicker, Space, message, Modal, Form, Input, InputNumber, Select } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, DownloadOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import { formatDate } from '../utils/formatDate';

const API = axios.create({ baseURL: '/api' });
API.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const { RangePicker } = DatePicker;

export default function CadrePerformance() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      let url = '/cadre-performance';
      const params = {};
      if (dateRange) {
        params.start = dateRange[0].format('YYYY-MM-DD');
        params.end = dateRange[1].format('YYYY-MM-DD');
      }
      const res = await API.get(url, { params });
      setData(res.data);
    } catch (e) { message.error('載入失敗'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await API.delete(`/cadre-performance/${id}`);
      message.success('刪除成功');
      fetchData();
    } catch (e) { message.error('刪除失敗'); }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingRecord) {
        await API.put(`/cadre-performance/${editingRecord.id}`, values);
        message.success('更新成功');
      } else {
        await API.post('/cadre-performance', values);
        message.success('新增成功');
      }
      setModalVisible(false);
      fetchData();
    } catch (e) { message.error('提交失敗'); }
  };

  const handleExport = async () => {
    try {
      const params = {};
      if (dateRange) {
        params.start = dateRange[0].format('YYYY-MM-DD');
        params.end = dateRange[1].format('YYYY-MM-DD');
      }
      const res = await API.get('/reports/export/cadre', { params, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `cadre_performance_${dayjs().format('YYYYMMDD')}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) { message.error('匯出失敗'); }
  };

  const columns = [
    { title: '編號', dataIndex: 'id', key: 'id', width: 80 },
    { title: '幹部', dataIndex: 'cadre_name', key: 'cadre_name', width: 120 },
    { title: '房號', dataIndex: 'room_number', key: 'room_number', width: 80 },
    { title: '客戶名', dataIndex: 'customer_name', key: 'customer_name', width: 120 },
    { title: '人數', dataIndex: 'num_people', key: 'num_people', width: 80 },
    { title: '公司吸收額', dataIndex: 'company_amount', key: 'company_amount', width: 120, render: v => `NT$ ${v?.toLocaleString()}` },
    { title: '幹部吸收額', dataIndex: 'cadre_amount', key: 'cadre_amount', width: 120, render: v => `NT$ ${v?.toLocaleString()}` },
    { title: '餐酒', dataIndex: 'food_drink', key: 'food_drink', width: 100, render: v => `NT$ ${v?.toLocaleString()}` },
    { title: '包廂費', dataIndex: 'room_fee', key: 'room_fee', width: 100, render: v => `NT$ ${v?.toLocaleString()}` },
    { title: '坐檯費', dataIndex: 'table_fee', key: 'table_fee', width: 100, render: v => `NT$ ${v?.toLocaleString()}` },
    { title: '公關費用', dataIndex: 'host_fee', key: 'host_fee', width: 100, render: v => `NT$ ${v?.toLocaleString()}` },
    { title: '進出全', dataIndex: 'full_entry', key: 'full_entry', width: 100, render: v => `NT$ ${v?.toLocaleString()}` },
    { title: '小費', dataIndex: 'tip', key: 'tip', width: 80, render: v => `NT$ ${v?.toLocaleString()}` },
    { title: '服務費', dataIndex: 'service_fee', key: 'service_fee', width: 100, render: v => `NT$ ${v?.toLocaleString()}` },
    { title: '稅額', dataIndex: 'tax', key: 'tax', width: 80, render: v => `NT$ ${v?.toLocaleString()}` },
    { title: '業績', dataIndex: 'total_sales', key: 'total_sales', width: 120, render: v => `NT$ ${v?.toLocaleString()}` },
    { title: '現金', dataIndex: 'cash', key: 'cash', width: 100, render: v => `NT$ ${v?.toLocaleString()}` },
    { title: '信用', dataIndex: 'credit', key: 'credit', width: 100, render: v => `NT$ ${v?.toLocaleString()}` },
    { title: '簽帳', dataIndex: 'charge', key: 'charge', width: 100, render: v => `NT$ ${v?.toLocaleString()}` },
    { title: '其它', dataIndex: 'other', key: 'other', width: 100, render: v => `NT$ ${v?.toLocaleString()}` },
    { title: '日期', dataIndex: 'sale_date', key: 'sale_date', width: 120, render: formatDate },
    { title: '操作', key: 'action', width: 150, render: (_, record) => (
      <Space>
        <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>編輯</Button>
        <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)}>刪除</Button>
      </Space>
    )},
  ];

  return (
    <div>
      <Card title="幹部業績表" extra={
        <Space>
          <RangePicker onChange={dates => setDateRange(dates)} />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增</Button>
          <Button icon={<DownloadOutlined />} onClick={handleExport}>匯出CSV</Button>
        </Space>
      }>
        <div className="table-responsive">
          <Table 
            columns={columns} 
            dataSource={data} 
            loading={loading} 
            rowKey="id" 
            scroll={{ x: 2400 }} 
            pagination={{ pageSize: 20 }}
          />
        </div>
      </Card>

      <Modal
        title={editingRecord ? '編輯幹部業績' : '新增幹部業績'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
        width={800}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="cadre_name" label="幹部" rules={[{ required: true, message: '請輸入幹部名稱' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="room_number" label="房號">
            <Input />
          </Form.Item>
          <Form.Item name="customer_name" label="客戶名">
            <Input />
          </Form.Item>
          <Form.Item name="num_people" label="人數">
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="company_amount" label="公司吸收額">
            <InputNumber min={0} style={{ width: '100%' }} formatter={value => `NT$ ${value}`} parser={value => value?.replace('NT$', '')} />
          </Form.Item>
          <Form.Item name="cadre_amount" label="幹部吸收額">
            <InputNumber min={0} style={{ width: '100%' }} formatter={value => `NT$ ${value}`} parser={value => value?.replace('NT$', '')} />
          </Form.Item>
          <Form.Item name="food_drink" label="餐酒">
            <InputNumber min={0} style={{ width: '100%' }} formatter={value => `NT$ ${value}`} parser={value => value?.replace('NT$', '')} />
          </Form.Item>
          <Form.Item name="room_fee" label="包廂費">
            <InputNumber min={0} style={{ width: '100%' }} formatter={value => `NT$ ${value}`} parser={value => value?.replace('NT$', '')} />
          </Form.Item>
          <Form.Item name="table_fee" label="坐檯費">
            <InputNumber min={0} style={{ width: '100%' }} formatter={value => `NT$ ${value}`} parser={value => value?.replace('NT$', '')} />
          </Form.Item>
          <Form.Item name="host_fee" label="公關費用">
            <InputNumber min={0} style={{ width: '100%' }} formatter={value => `NT$ ${value}`} parser={value => value?.replace('NT$', '')} />
          </Form.Item>
          <Form.Item name="full_entry" label="進出全">
            <InputNumber min={0} style={{ width: '100%' }} formatter={value => `NT$ ${value}`} parser={value => value?.replace('NT$', '')} />
          </Form.Item>
          <Form.Item name="tip" label="小費">
            <InputNumber min={0} style={{ width: '100%' }} formatter={value => `NT$ ${value}`} parser={value => value?.replace('NT$', '')} />
          </Form.Item>
          <Form.Item name="service_fee" label="服務費">
            <InputNumber min={0} style={{ width: '100%' }} formatter={value => `NT$ ${value}`} parser={value => value?.replace('NT$', '')} />
          </Form.Item>
          <Form.Item name="tax" label="稅額">
            <InputNumber min={0} style={{ width: '100%' }} formatter={value => `NT$ ${value}`} parser={value => value?.replace('NT$', '')} />
          </Form.Item>
          <Form.Item name="total_sales" label="業績">
            <InputNumber min={0} style={{ width: '100%' }} formatter={value => `NT$ ${value}`} parser={value => value?.replace('NT$', '')} />
          </Form.Item>
          <Form.Item name="cash" label="現金">
            <InputNumber min={0} style={{ width: '100%' }} formatter={value => `NT$ ${value}`} parser={value => value?.replace('NT$', '')} />
          </Form.Item>
          <Form.Item name="credit" label="信用">
            <InputNumber min={0} style={{ width: '100%' }} formatter={value => `NT$ ${value}`} parser={value => value?.replace('NT$', '')} />
          </Form.Item>
          <Form.Item name="charge" label="簽帳">
            <InputNumber min={0} style={{ width: '100%' }} formatter={value => `NT$ ${value}`} parser={value => value?.replace('NT$', '')} />
          </Form.Item>
          <Form.Item name="other" label="其它">
            <InputNumber min={0} style={{ width: '100%' }} formatter={value => `NT$ ${value}`} parser={value => value?.replace('NT$', '')} />
          </Form.Item>
          <Form.Item name="sale_date" label="日期" rules={[{ required: true, message: '請選擇日期' }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
