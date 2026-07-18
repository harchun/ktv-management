import { useState, useEffect } from 'react';
import { Table, Button, Input, Modal, Form, Select, Space, message, Tag, InputNumber } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../utils/api';

export default function BonusList() {
  const [dataSource, setDataSource] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState(null);
  const [cadreOptions, setCadreOptions] = useState([]);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/bonus-list');
      setDataSource(Array.isArray(res.data) ? res.data : []);
    } catch (err) { message.error('取得獎金資料失敗'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    api.get('/cadres').then(r => setCadreOptions(Array.isArray(r.data) ? r.data : [])).catch(() => {});
  }, []);

  const handleSave = async (values) => {
    try {
      if (editing) { await api.put(`/bonus-list/${editing.獎金編號}`, values); message.success('更新成功'); }
      else { await api.post('/bonus-list', values); message.success('新增成功'); }
      setModalVisible(false); form.resetFields(); fetchData();
    } catch (err) { message.error(err.response?.data?.error || '操作失敗'); }
  };

  const handleDelete = async (id) => {
    try { await api.delete(`/bonus-list/${id}`); message.success('刪除成功'); fetchData(); }
    catch { message.error('刪除失敗'); }
  };

  const statusColor = { '未發放': 'orange', '已發放': 'green', '已扣繳': 'blue' };

  const columns = [
    { title: '編號', dataIndex: '獎金編號', key: '獎金編號', width: 70 },
    { title: '幹部編號', dataIndex: '幹部編號', key: '幹部編號', width: 80 },
    { title: '月份', dataIndex: '獎金月份', key: '獎金月份', width: 90 },
    { title: '訂桌次數', dataIndex: '訂桌次數', key: '訂桌次數', width: 80 },
    { title: '總業績', dataIndex: '總業績', key: '總業績', width: 120, render: (v) => v ? `NT$ ${Number(v).toLocaleString()}` : '-' },
    { title: '獎金', dataIndex: '獎金金額', key: '獎金金額', width: 120, render: (v) => v ? `NT$ ${Number(v).toLocaleString()}` : '-' },
    { title: '狀態', dataIndex: '發放狀態', key: '發放狀態', width: 90, render: (v) => <Tag color={statusColor[v]}>{v}</Tag> },
    { title: '操作', key: 'actions', width: 100, render: (_, r) => (
      <Space>
        <Button size="small" icon={<EditOutlined />} onClick={() => { setEditing(r); form.setFieldsValue(r); setModalVisible(true); }} />
        <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(r.獎金編號)} />
      </Space>
    )},
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>獎金明細</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); form.resetFields(); setModalVisible(true); }}>新增獎金</Button>
      </div>
      <div className="table-responsive"><Table dataSource={dataSource} columns={columns} rowKey="獎金編號" loading={loading} size="small" pagination={{ pageSize: 20 }} /></div>
      <Modal title={editing ? '編輯獎金' : '新增獎金'} open={modalVisible} onCancel={() => setModalVisible(false)} footer={null} width={600}>
        <Form form={form} layout="vertical" onFinish={handleSave} initialValues={{ 訂桌次數: 0, 總業績: 0, 獎金金額: 0, 發放狀態: '未發放' }}>
          <Form.Item name="幹部編號" label="幹部編號" rules={[{ required: true }]}><Select options={cadreOptions.map(c => ({ value: c.幹部編號, label: c.姓名 }))} /></Form.Item>
          <Form.Item name="獎金月份" label="獎金月份" rules={[{ required: true }]}><Input placeholder="2026-07" /></Form.Item>
          <Form.Item name="訂桌次數" label="訂桌次數"><InputNumber style={{ width: '100%' }} min={0} /></Form.Item>
          <Form.Item name="總業績" label="總業績"><InputNumber style={{ width: '100%' }} min={0} precision={2} /></Form.Item>
          <Form.Item name="獎金金額" label="獎金金額"><InputNumber style={{ width: '100%' }} min={0} precision={2} /></Form.Item>
          <Form.Item name="獎金條件" label="獎金條件"><Input.TextArea rows={2} /></Form.Item>
          <Form.Item name="發放狀態" label="狀態"><Select options={[{ value: '未發放', label: '未發放' }, { value: '已發放', label: '已發放' }, { value: '已扣繳', label: '已扣繳' }]} /></Form.Item>
          <Form.Item name="備註" label="備註"><Input.TextArea rows={2} /></Form.Item>
          <Form.Item><Space><Button type="primary" htmlType="submit">{editing ? '更新' : '新增'}</Button><Button onClick={() => setModalVisible(false)}>取消</Button></Space></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
