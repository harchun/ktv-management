import { useState, useEffect } from 'react';
import { Table, Button, Input, Modal, Form, Select, Space, message, Tag, InputNumber } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../utils/api';
import { formatDate } from '../utils/formatDate';

export default function Evaluations() {
  const [dataSource, setDataSource] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState(null);
  const [hostOptions, setHostOptions] = useState([]);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/evaluations');
      setDataSource(Array.isArray(res.data) ? res.data : []);
    } catch (err) { message.error('取得評估資料失敗'); setDataSource([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    api.get('/hosts').then(r => setHostOptions(Array.isArray(r.data) ? r.data : [])).catch(() => {});
  }, []);

  const handleSave = async (values) => {
    try {
      if (editing) { await api.put(`/evaluations/${editing.評估編號}`, values); message.success('更新成功'); }
      else { await api.post('/evaluations', values); message.success('新增成功'); }
      setModalVisible(false); form.resetFields(); fetchData();
    } catch (err) { message.error(err.response?.data?.error || '操作失敗'); }
  };

  const handleDelete = async (id) => {
    try { await api.delete(`/evaluations/${id}`); message.success('刪除成功'); fetchData(); }
    catch { message.error('刪除失敗'); }
  };

  const scoreColor = (v) => {
    if (v >= 80) return 'green';
    if (v >= 60) return 'orange';
    return 'red';
  };

  const columns = [
    { title: '編號', dataIndex: '評估編號', key: '評估編號', width: 70 },
    { title: '公關編號', dataIndex: '公關編號', key: '公關編號', width: 80 },
    { title: '評估項目', dataIndex: '評估項目', key: '評估項目', width: 150 },
    { title: '分數', dataIndex: '分數', key: '分數', width: 70, render: (v) => <Tag color={scoreColor(Number(v))}>{v}</Tag> },
    { title: '評估日期', dataIndex: '評估日期', key: '評估日期', width: 100, render: formatDate },
    { title: '評語', dataIndex: '評語', key: '評語', ellipsis: true },
    { title: '操作', key: 'actions', width: 100, render: (_, r) => (
      <Space>
        <Button size="small" icon={<EditOutlined />} onClick={() => { setEditing(r); form.setFieldsValue(r); setModalVisible(true); }} />
        <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(r.評估編號)} />
      </Space>
    )},
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>績效評估</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); form.resetFields(); setModalVisible(true); }}>新增評估</Button>
      </div>
      <div className="table-responsive"><Table dataSource={dataSource} columns={columns} rowKey="評估編號" loading={loading} size="small" pagination={{ pageSize: 20 }} /></div>
      <Modal title={editing ? '編輯評估' : '新增評估'} open={modalVisible} onCancel={() => setModalVisible(false)} footer={null} width={600}>
        <Form form={form} layout="vertical" onFinish={handleSave} initialValues={{ 分數: 0 }}>
          <Form.Item name="公關編號" label="公關編號" rules={[{ required: true, message: '請選擇公關' }]}>
            <Select options={hostOptions.map(h => ({ value: h.公關編號, label: h.姓名 }))} />
          </Form.Item>
          <Form.Item name="評估項目" label="評估項目" rules={[{ required: true, message: '請輸入評估項目' }]}><Input /></Form.Item>
          <Form.Item name="分數" label="分數"><InputNumber style={{ width: '100%' }} min={0} max={100} precision={1} /></Form.Item>
          <Form.Item name="評估日期" label="評估日期" rules={[{ required: true, message: '請選擇日期' }]}><Input /></Form.Item>
          <Form.Item name="評語" label="評語"><Input.TextArea rows={3} /></Form.Item>
          <Form.Item><Space><Button type="primary" htmlType="submit">{editing ? '更新' : '新增'}</Button><Button onClick={() => setModalVisible(false)}>取消</Button></Space></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
