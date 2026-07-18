import { useState, useEffect } from 'react';
import { Table, Button, Input, Modal, Form, Space, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../utils/api';

export default function Recycling() {
  const [dataSource, setDataSource] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/recycling');
      setDataSource(Array.isArray(res.data) ? res.data : []);
    } catch (err) { message.error('取得分類資料失敗'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async (values) => {
    try {
      if (editing) { await api.put(`/recycling/${editing.回收編號}`, values); message.success('更新成功'); }
      else { await api.post('/recycling', values); message.success('新增成功'); }
      setModalVisible(false); form.resetFields(); fetchData();
    } catch (err) { message.error(err.response?.data?.error || '操作失敗'); }
  };

  const handleDelete = async (id) => {
    try { await api.delete(`/recycling/${id}`); message.success('刪除成功'); fetchData(); }
    catch { message.error('刪除失敗'); }
  };

  const columns = [
    { title: '編號', dataIndex: '回收編號', key: '回收編號', width: 70 },
    { title: '粗分類', dataIndex: '粗分類', key: '粗分類', width: 120 },
    { title: '分類方式', dataIndex: '分類方式', key: '分類方式', width: 120 },
    { title: '細分類', dataIndex: '細分類', key: '細分類', width: 120 },
    { title: '處理原則', dataIndex: '原則處理', key: '原則處理', ellipsis: true },
    { title: '操作', key: 'actions', width: 100, render: (_, r) => (
      <Space>
        <Button size="small" icon={<EditOutlined />} onClick={() => { setEditing(r); form.setFieldsValue(r); setModalVisible(true); }} />
        <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(r.回收編號)} />
      </Space>
    )},
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>分類回收</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); form.resetFields(); setModalVisible(true); }}>新增分類</Button>
      </div>
      <div className="table-responsive"><Table dataSource={dataSource} columns={columns} rowKey="回收編號" loading={loading} size="small" pagination={{ pageSize: 20 }} /></div>
      <Modal title={editing ? '編輯分類' : '新增分類'} open={modalVisible} onCancel={() => setModalVisible(false)} footer={null} width={600}>
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item name="粗分類" label="粗分類" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="分類方式" label="分類方式"><Input /></Form.Item>
          <Form.Item name="細分類" label="細分類"><Input /></Form.Item>
          <Form.Item name="原則處理" label="處理原則"><Input.TextArea rows={3} /></Form.Item>
          <Form.Item><Space><Button type="primary" htmlType="submit">{editing ? '更新' : '新增'}</Button><Button onClick={() => setModalVisible(false)}>取消</Button></Space></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
