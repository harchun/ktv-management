import { useState, useEffect } from 'react';
import { Table, Button, Input, Modal, Form, Select, Space, message, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../utils/api';
import { formatDate } from '../utils/formatDate';

const posTypes = ['公關', '幹部', '店務', '其他'];
const statusMap = { '招募中': 'green', '已額滿': 'orange', '已關閉': 'red' };

export default function Recruitment() {
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
      const res = await api.get('/recruitment', { params });
      setDataSource(Array.isArray(res.data) ? res.data : []);
    } catch (err) { message.error('取得招聘資料失敗'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async (values) => {
    try {
      if (editing) { await api.put(`/recruitment/${editing.職缺編號}`, values); message.success('更新成功'); }
      else { await api.post('/recruitment', values); message.success('新增成功'); }
      setModalVisible(false); form.resetFields(); fetchData();
    } catch (err) { message.error(err.response?.data?.error || '操作失敗'); }
  };

  const handleDelete = async (id) => {
    try { await api.delete(`/recruitment/${id}`); message.success('刪除成功'); fetchData(); }
    catch { message.error('刪除失敗'); }
  };

  const columns = [
    { title: '編號', dataIndex: '職缺編號', key: '職缺編號', width: 70 },
    { title: '職缺標題', dataIndex: '職缺標題', key: '職缺標題', width: 150 },
    { title: '職位類別', dataIndex: '職位類別', key: '職位類別', width: 80, render: (v) => <Tag>{v}</Tag> },
    { title: '薪資範圍', dataIndex: '薪資範圍', key: '薪資範圍', width: 120 },
    { title: '釋出日期', dataIndex: '釋出日期', key: '釋出日期', width: 100, render: formatDate },
    { title: '截止日', dataIndex: '截止日期', key: '截止日期', width: 100, render: formatDate },
    { title: '狀態', dataIndex: '職缺狀態', key: '職缺狀態', width: 80, render: (v) => <Tag color={statusMap[v]}>{v}</Tag> },
    { title: '應徵人數', dataIndex: '應徵人數', key: '應徵人數', width: 80 },
    { title: '操作', key: 'actions', width: 100, render: (_, r) => (
      <Space>
        <Button size="small" icon={<EditOutlined />} onClick={() => { setEditing(r); form.setFieldsValue(r); setModalVisible(true); }} />
        <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(r.職缺編號)} />
      </Space>
    )},
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>招聘管理</h2>
        <Space>
          <Select placeholder="篩選狀態" allowClear style={{ width: 120 }} onChange={setFilterStatus} options={[{ value: '招募中', label: '招募中' }, { value: '已額滿', label: '已額滿' }, { value: '已關閉', label: '已關閉' }]} />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); form.resetFields(); setModalVisible(true); }}>新增職缺</Button>
        </Space>
      </div>
      <div className="table-responsive"><Table dataSource={dataSource} columns={columns} rowKey="職缺編號" loading={loading} size="small" pagination={{ pageSize: 20 }} /></div>
      <Modal title={editing ? '編輯職缺' : '新增職缺'} open={modalVisible} onCancel={() => setModalVisible(false)} footer={null} width={700}>
        <Form form={form} layout="vertical" onFinish={handleSave} initialValues={{ 職位類別: '公關', 職缺狀態: '招募中', 應徵人數: 0 }}>
          <Form.Item name="職缺標題" label="職缺標題" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="職位類別" label="職位類別"><Select options={posTypes.map(t => ({ value: t, label: t }))} /></Form.Item>
          <Form.Item name="薪資範圍" label="薪資範圍"><Input /></Form.Item>
          <Form.Item name="工作地點" label="工作地點"><Input /></Form.Item>
          <Form.Item name="工作時段" label="工作時段"><Input /></Form.Item>
          <Form.Item name="釋出日期" label="釋出日期" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="截止日期" label="截止日"><Input /></Form.Item>
          <Form.Item name="職缺狀態" label="狀態"><Select options={[{ value: '招募中', label: '招募中' }, { value: '已額滿', label: '已額滿' }, { value: '已關閉', label: '已關閉' }]} /></Form.Item>
          <Form.Item name="工作內容" label="工作內容"><Input.TextArea rows={2} /></Form.Item>
          <Form.Item name="應徵條件" label="應徵條件"><Input.TextArea rows={2} /></Form.Item>
          <Form.Item name="聯絡方式" label="聯絡方式"><Input /></Form.Item>
          <Form.Item name="備註" label="備註"><Input.TextArea rows={2} /></Form.Item>
          <Form.Item><Space><Button type="primary" htmlType="submit">{editing ? '更新' : '新增'}</Button><Button onClick={() => setModalVisible(false)}>取消</Button></Space></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
