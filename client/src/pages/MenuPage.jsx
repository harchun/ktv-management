import { useState, useEffect } from 'react';
import { Table, Button, Input, Modal, Form, Select, Space, message, InputNumber, Switch } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../utils/api';

export default function MenuPage() {
  const [dataSource, setDataSource] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filterCategory, setFilterCategory] = useState(null);
  const [categories, setCategories] = useState([]);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterCategory) params.分類 = filterCategory;
      const res = await api.get('/menu', { params });
      const data = Array.isArray(res.data) ? res.data : [];
      setDataSource(data);
      // Extract unique categories
      const cats = [...new Set(data.map(d => d.分類).filter(Boolean))];
      setCategories(cats);
    } catch (err) { message.error('取得菜單資料失敗'); setDataSource([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async (values) => {
    try {
      const payload = { ...values, 單價: Number(values.單價) || 0, 是否供應: values.是否供應 !== undefined ? values.是否供應 : 1 };
      if (editing) {
        await api.put(`/menu/${editing.編號}`, payload);
        message.success('更新成功');
      } else {
        await api.post('/menu', payload);
        message.success('新增成功');
      }
      setModalVisible(false); form.resetFields(); fetchData();
    } catch (err) { message.error(err.response?.data?.error || '操作失敗'); }
  };

  const handleDelete = async (id) => {
    try { await api.delete(`/menu/${id}`); message.success('刪除成功'); fetchData(); }
    catch { message.error('刪除失敗'); }
  };

  const columns = [
    { title: '編號', dataIndex: '編號', key: '編號', width: 60 },
    { title: '菜品名稱', dataIndex: '菜品名稱', key: '菜品名稱', width: 200 },
    { title: '分類', dataIndex: '分類', key: '分類', width: 100 },
    { title: '單價', dataIndex: '單價', key: '單價', width: 100, render: (v) => `NT$ ${Number(v).toLocaleString()}` },
    { title: '供應', dataIndex: '是否供應', key: '是否供應', width: 80, render: (v) => v ? '✅ 供應中' : '❌ 暫停' },
    { title: '備註', dataIndex: '備註', key: '備註', ellipsis: true },
    { title: '操作', key: 'actions', width: 80, render: (_, r) => (
      <Space>
        <Button size="small" icon={<EditOutlined />} onClick={() => { setEditing(r); form.setFieldsValue({ ...r, 是否供應: r.是否供應 !== 0 }); setModalVisible(true); }} />
        <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(r.編號)} />
      </Space>
    )},
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>菜單</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); form.resetFields(); setModalVisible(true); }}>新增菜品</Button>
      </div>
      <div style={{ marginBottom: 12 }}>
        <Select placeholder="篩選分類" style={{ width: 200 }} allowClear value={filterCategory} onChange={setFilterCategory} options={categories.map(c => ({ value: c, label: c }))} />
      </div>
      <div className="table-responsive"><Table dataSource={dataSource} columns={columns} rowKey="編號" loading={loading} size="small" scroll={{ x: 800 }} pagination={{ pageSize: 20 }} /></div>
      <Modal title={editing ? '編輯菜品' : '新增菜品'} open={modalVisible} onCancel={() => setModalVisible(false)} footer={null} width={600}>
        <Form form={form} layout="vertical" onFinish={handleSave} initialValues={{ 是否供應: true }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Form.Item name="菜品名稱" label="菜品名稱" rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item name="分類" label="分類"><Select options={['酒水', '餐點', '小吃', '甜品', '飲料'].map(c => ({ value: c, label: c }))} /></Form.Item>
            <Form.Item name="單價" label="單價" rules={[{ required: true, message: '請輸入單價' }]}><InputNumber style={{ width: '100%' }} min={0} addonAfter="NT$" /></Form.Item>
            <Form.Item name="是否供應" label="供應中" valuePropName="checked"><Switch checkedChildren="是" unCheckedChildren="否" /></Form.Item>
            <Form.Item name="備註" label="備註" style={{ gridColumn: '1 / -1' }}><Input /></Form.Item>
          </div>
          <Form.Item><Space><Button type="primary" htmlType="submit">{editing ? '更新' : '新增'}</Button><Button onClick={() => setModalVisible(false)}>取消</Button></Space></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
