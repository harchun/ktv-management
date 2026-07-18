import { useState, useEffect } from 'react';
import { Table, Button, Input, Modal, Form, Select, Space, message, InputNumber } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../utils/api';

export default function Inventory() {
  const [dataSource, setDataSource] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/inventory');
      setDataSource(Array.isArray(res.data) ? res.data : []);
    } catch (err) { message.error('取得庫存資料失敗'); setDataSource([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async (values) => {
    try {
      const payload = { ...values, 庫存數量: Number(values.庫存數量) || 0, 最低存量: Number(values.最低存量) || 0, 單價: Number(values.單價) || 0 };
      if (editing) {
        await api.put(`/inventory/${editing.編號}`, payload);
        message.success('更新成功');
      } else {
        await api.post('/inventory', payload);
        message.success('新增成功');
      }
      setModalVisible(false); form.resetFields(); fetchData();
    } catch (err) { message.error(err.response?.data?.error || '操作失敗'); }
  };

  const handleDelete = async (id) => {
    try { await api.delete(`/inventory/${id}`); message.success('刪除成功'); fetchData(); }
    catch { message.error('刪除失敗'); }
  };

  const stockStatus = (current, min) => {
    if (current <= min) return { text: '缺貨', color: 'red' };
    if (current <= min * 1.5) return { text: '偏低', color: 'orange' };
    return { text: '充足', color: 'green' };
  };

  const columns = [
    { title: '編號', dataIndex: '編號', key: '編號', width: 60 },
    { title: '品項名稱', dataIndex: '品項名稱', key: '品項名稱', width: 150 },
    { title: '分類', dataIndex: '分類', key: '分類', width: 80 },
    { title: '單位', dataIndex: '單位', key: '單位', width: 60 },
    { title: '庫存數量', dataIndex: '庫存數量', key: '庫存數量', width: 80, render: (v) => Number(v).toFixed(2) },
    { title: '最低存量', dataIndex: '最低存量', key: '最低存量', width: 80, render: (v) => Number(v).toFixed(2) },
    { title: '單價', dataIndex: '單價', key: '單價', width: 80, render: (v) => `NT$ ${Number(v).toLocaleString()}` },
    { title: '庫存狀態', key: '庫存狀態', width: 80, render: (_, r) => {
      const s = stockStatus(Number(r.庫存數量), Number(r.最低存量));
      return <span style={{ color: s.color, fontWeight: 'bold' }}>{s.text}</span>;
    }},
    { title: '備註', dataIndex: '備註', key: '備註', ellipsis: true },
    { title: '操作', key: 'actions', width: 80, render: (_, r) => (
      <Space>
        <Button size="small" icon={<EditOutlined />} onClick={() => { setEditing(r); form.setFieldsValue(r); setModalVisible(true); }} />
        <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(r.編號)} />
      </Space>
    )},
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>酒庫庫存</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); form.resetFields(); setModalVisible(true); }}>新增品項</Button>
      </div>
      <div className="table-responsive"><Table dataSource={dataSource} columns={columns} rowKey="編號" loading={loading} size="small" scroll={{ x: 1200 }} pagination={{ pageSize: 20 }} /></div>
      <Modal title={editing ? '編輯品項' : '新增品項'} open={modalVisible} onCancel={() => setModalVisible(false)} footer={null} width={600}>
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Form.Item name="品項名稱" label="品項名稱" rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item name="分類" label="分類"><Input /></Form.Item>
            <Form.Item name="單位" label="單位"><Input placeholder="瓶/箱/盎司" /></Form.Item>
            <Form.Item name="庫存數量" label="庫存數量"><InputNumber style={{ width: '100%' }} min={0} precision={2} /></Form.Item>
            <Form.Item name="最低存量" label="最低存量"><InputNumber style={{ width: '100%' }} min={0} precision={2} /></Form.Item>
            <Form.Item name="單價" label="單價"><InputNumber style={{ width: '100%' }} min={0} /></Form.Item>
            <Form.Item name="備註" label="備註" style={{ gridColumn: '1 / -1' }}><Input /></Form.Item>
          </div>
          <Form.Item><Space><Button type="primary" htmlType="submit">{editing ? '更新' : '新增'}</Button><Button onClick={() => setModalVisible(false)}>取消</Button></Space></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
