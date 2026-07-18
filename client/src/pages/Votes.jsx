import { useState, useEffect } from 'react';
import { Table, Button, Input, Modal, Form, Select, Space, message, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../utils/api';

const statusColors = { '進行中': 'blue', '已截止': 'orange', '已公告結果': 'green', '已取消': 'red' };

export default function Votes() {
  const [dataSource, setDataSource] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filterStatus, setFilterStatus] = useState(null);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = filterStatus ? { status: filterStatus } : {};
      const res = await api.get('/votes', { params });
      setDataSource(Array.isArray(res.data) ? res.data : []);
    } catch (err) { message.error('取得投票資料失敗'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async (values) => {
    try {
      const payload = { ...values };
      if (payload.投票選項 && typeof payload.投票選項 === 'string') {
        try { payload.投票選項 = JSON.parse(payload.投票選項); } catch {}
      }
      if (payload.結果 && typeof payload.結果 === 'string') {
        try { payload.結果 = JSON.parse(payload.結果); } catch {}
      }
      if (editing) { await api.put(`/votes/${editing.投票編號}`, payload); message.success('更新成功'); }
      else { await api.post('/votes', payload); message.success('新增成功'); }
      setModalVisible(false); form.resetFields(); fetchData();
    } catch (err) { message.error(err.response?.data?.error || '操作失敗'); }
  };

  const handleDelete = async (id) => {
    try { await api.delete(`/votes/${id}`); message.success('刪除成功'); fetchData(); }
    catch { message.error('刪除失敗'); }
  };

  const columns = [
    { title: '編號', dataIndex: '投票編號', key: '投票編號', width: 70 },
    { title: '主題', dataIndex: '投票主題', key: '投票主題', width: 200 },
    { title: '狀態', dataIndex: '投票狀態', key: '投票狀態', width: 100, render: (v) => <Tag color={statusColors[v]}>{v}</Tag> },
    { title: '匿名', dataIndex: '是否匿名', key: '是否匿名', width: 60, render: (v) => v ? '是' : '否' },
    { title: '截止時間', dataIndex: '截止時間', key: '截止時間', width: 150 },
    { title: '發起人', dataIndex: '發起人編號', key: '發起人編號', width: 80 },
    { title: '操作', key: 'actions', width: 100, render: (_, r) => (
      <Space>
        <Button size="small" icon={<EditOutlined />} onClick={() => { setEditing(r); form.setFieldsValue(r); setModalVisible(true); }} />
        <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(r.投票編號)} />
      </Space>
    )},
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>投票記錄</h2>
        <Space>
          <Select placeholder="篩選狀態" allowClear style={{ width: 120 }} onChange={setFilterStatus} options={[{ value: '進行中', label: '進行中' }, { value: '已截止', label: '已截止' }, { value: '已公告結果', label: '已公告結果' }, { value: '已取消', label: '已取消' }]} />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); form.resetFields(); setModalVisible(true); }}>新增投票</Button>
        </Space>
      </div>
      <div className="table-responsive"><Table dataSource={dataSource} columns={columns} rowKey="投票編號" loading={loading} size="small" pagination={{ pageSize: 20 }} /></div>
      <Modal title={editing ? '編輯投票' : '新增投票'} open={modalVisible} onCancel={() => setModalVisible(false)} footer={null} width={700}>
        <Form form={form} layout="vertical" onFinish={handleSave} initialValues={{ 投票狀態: '進行中', 是否匿名: 0 }}>
          <Form.Item name="投票主題" label="投票主題" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="投票描述" label="投票描述"><Input.TextArea rows={2} /></Form.Item>
          <Form.Item name="投票選項" label="投票選項 (JSON陣列)" tooltip='例如: ["選項A", "選項B"]'>
            <Input.TextArea rows={2} placeholder='["選項A", "選項B"]' />
          </Form.Item>
          <Form.Item name="發起人編號" label="發起人編號"><Input /></Form.Item>
          <Form.Item name="投票狀態" label="狀態"><Select options={[{ value: '進行中', label: '進行中' }, { value: '已截止', label: '已截止' }, { value: '已公告結果', label: '已公告結果' }, { value: '已取消', label: '已取消' }]} /></Form.Item>
          <Form.Item name="是否匿名" label="是否匿名"><Select options={[{ value: 0, label: '否' }, { value: 1, label: '是' }]} /></Form.Item>
          <Form.Item name="結果" label="結果 (JSON)" tooltip="投票結束後填寫結果"><Input.TextArea rows={3} placeholder='{"選項A": 10, "選項B": 5}' /></Form.Item>
          <Form.Item><Space><Button type="primary" htmlType="submit">{editing ? '更新' : '新增'}</Button><Button onClick={() => setModalVisible(false)}>取消</Button></Space></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
