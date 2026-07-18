import { useState, useEffect } from 'react';
import { Table, Button, Input, Modal, Form, Select, Space, message, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../utils/api';
import { formatDate } from '../utils/formatDate';

const statusColors = { '待審核': 'orange', '核准': 'green', '駁回': 'red' };

export default function Resignation() {
  const [dataSource, setDataSource] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filterStatus, setFilterStatus] = useState(null);
  const [hostOptions, setHostOptions] = useState([]);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = filterStatus ? { status: filterStatus } : {};
      const res = await api.get('/resignation', { params });
      setDataSource(Array.isArray(res.data) ? res.data : []);
    } catch (err) { message.error('取得離職資料失敗'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    api.get('/hosts').then(r => setHostOptions(Array.isArray(r.data) ? r.data : [])).catch(() => {});
  }, []);

  const handleSave = async (values) => {
    try {
      if (editing) { await api.put(`/resignation/${editing.離職編號}`, values); message.success('更新成功'); }
      else { await api.post('/resignation', values); message.success('新增成功'); }
      setModalVisible(false); form.resetFields(); fetchData();
    } catch (err) { message.error(err.response?.data?.error || '操作失敗'); }
  };

  const handleDelete = async (id) => {
    try { await api.delete(`/resignation/${id}`); message.success('刪除成功'); fetchData(); }
    catch { message.error('刪除失敗'); }
  };

  const columns = [
    { title: '編號', dataIndex: '離職編號', key: '離職編號', width: 70 },
    { title: '公關編號', dataIndex: '公關編號', key: '公關編號', width: 80 },
    { title: '公關姓名', dataIndex: '公關姓名', key: '公關姓名', width: 100 },
    { title: '申請日', dataIndex: '申請日期', key: '申請日期', width: 100, render: formatDate },
    { title: '預計離職日', dataIndex: '預計離職日', key: '預計離職日', width: 100, render: formatDate },
    { title: '物品歸還', dataIndex: '物品歸還', key: '物品歸還', width: 80, render: (v) => v ? '是' : '否' },
    { title: '核決結果', dataIndex: '核決結果', key: '核決結果', width: 90, render: (v) => <Tag color={statusColors[v]}>{v}</Tag> },
    { title: '離職原因', dataIndex: '離職原因', key: '離職原因', ellipsis: true },
    { title: '操作', key: 'actions', width: 100, render: (_, r) => (
      <Space>
        <Button size="small" icon={<EditOutlined />} onClick={() => { setEditing(r); form.setFieldsValue(r); setModalVisible(true); }} />
        <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(r.離職編號)} />
      </Space>
    )},
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>離職申請</h2>
        <Space>
          <Select placeholder="篩選狀態" allowClear style={{ width: 120 }} onChange={setFilterStatus} options={[{ value: '待審核', label: '待審核' }, { value: '核准', label: '核准' }, { value: '駁回', label: '駁回' }]} />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); form.resetFields(); setModalVisible(true); }}>新增申請</Button>
        </Space>
      </div>
      <div className="table-responsive"><Table dataSource={dataSource} columns={columns} rowKey="離職編號" loading={loading} size="small" pagination={{ pageSize: 20 }} /></div>
      <Modal title={editing ? '編輯離職申請' : '新增離職申請'} open={modalVisible} onCancel={() => setModalVisible(false)} footer={null} width={700}>
        <Form form={form} layout="vertical" onFinish={handleSave} initialValues={{ 物品歸還: 0, 核決結果: '待審核' }}>
          <Form.Item name="公關編號" label="公關編號" rules={[{ required: true }]}><Select options={hostOptions.map(h => ({ value: h.公關編號, label: h.姓名 }))} /></Form.Item>
          <Form.Item name="申請日期" label="申請日期" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="預計離職日" label="預計離職日"><Input /></Form.Item>
          <Form.Item name="離職原因" label="離職原因"><Input.TextArea rows={2} /></Form.Item>
          <Form.Item name="交接事項" label="交接事項"><Input.TextArea rows={2} /></Form.Item>
          <Form.Item name="物品歸還" label="物品歸還"><Select options={[{ value: 0, label: '未歸還' }, { value: 1, label: '已歸還' }]} /></Form.Item>
          <Form.Item name="核決結果" label="核決結果"><Select options={[{ value: '待審核', label: '待審核' }, { value: '核准', label: '核准' }, { value: '駁回', label: '駁回' }]} /></Form.Item>
          <Form.Item name="核決人" label="核決人"><Input /></Form.Item>
          <Form.Item name="核決日期" label="核決日期"><Input /></Form.Item>
          <Form.Item name="備註" label="備註"><Input.TextArea rows={2} /></Form.Item>
          <Form.Item><Space><Button type="primary" htmlType="submit">{editing ? '更新' : '新增'}</Button><Button onClick={() => setModalVisible(false)}>取消</Button></Space></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
