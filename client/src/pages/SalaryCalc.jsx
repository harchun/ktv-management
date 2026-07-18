import { useState, useEffect } from 'react';
import { Table, Button, Input, Modal, Form, Select, Space, message, InputNumber, DatePicker, Tabs } from 'antd';
import { CalculatorOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../utils/api';

export default function SalaryCalc() {
  const [dataSource, setDataSource] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hostOptions, setHostOptions] = useState([]);
  const [selectedHost, setSelectedHost] = useState(null);
  const [calcResult, setCalcResult] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();

  const fetchHosts = async () => {
    try {
      const res = await api.get('/hosts');
      setHostOptions(Array.isArray(res.data) ? res.data : []);
    } catch {}
  };

  useEffect(() => { fetchHosts(); }, []);

  const handleCalculate = async () => {
    if (!selectedHost) { message.warning('請選擇幹部'); return; }
    setLoading(true);
    try {
      const res = await api.get(`/salary-calc/${selectedHost}`);
      setCalcResult(res.data);
    } catch (err) { message.error(err.response?.data?.error || '計算失敗'); }
    finally { setLoading(false); }
  };

  const handleSave = async (values) => {
    try {
      const payload = { ...values, 日保: Number(values.日保) || 0, 節拆: Number(values.節拆) || 0, 保薪天數: Number(values.保薪天數) || 0, 節拆天數: Number(values.節拆天數) || 0 };
      if (editing) {
        await api.put(`/salary-config/${editing.薪資編號}`, payload);
        message.success('更新成功');
      } else {
        await api.post('/salary-config', payload);
        message.success('新增成功');
      }
      setModalVisible(false); form.resetFields();
    } catch (err) { message.error(err.response?.data?.error || '操作失敗'); }
  };

  const handleDelete = async (id) => {
    try { await api.delete(`/salary-config/${id}`); message.success('刪除成功'); }
    catch { message.error('刪除失敗'); }
  };

  // Salary calculation columns
  const columns = [
    { title: '名子', dataIndex: '名子', key: '名子', width: 80, fixed: 'left' },
    { title: '日保/節拆', dataIndex: '日保', key: '日保', width: 70 },
    { title: '保薪天數', dataIndex: '保薪天數', key: '保薪天數', width: 70 },
    { title: '節拆天數', dataIndex: '節拆天數', key: '節拆天數', width: 70 },
    { title: '總節數', dataIndex: '總節數', key: '總節數', width: 60 },
    { title: '經紀人', dataIndex: '經紀人', key: '經紀人', width: 70 },
    { title: '經紀費', dataIndex: '經紀費', key: '經紀費', width: 70 },
    { title: '合計', dataIndex: '合計', key: '合計', width: 70, render: (v) => <b>{v}</b> },
    { title: '保薪薪資', dataIndex: '保薪薪資', key: '保薪薪資', width: 80 },
    { title: '節拆薪資', dataIndex: '節拆薪資', key: '節拆薪資', width: 80 },
    { title: '應發薪資', dataIndex: '應發薪資', key: '應發薪資', width: 80, render: (v) => <b style={{ color: '#faad14' }}>{v}</b> },
    { title: '扣帶檯費', dataIndex: '扣帶檯費', key: '扣帶檯費', width: 80 },
    { title: '清潔費', dataIndex: '清潔費', key: '清潔費', width: 70 },
    { title: '訂桌數', dataIndex: '訂桌數', key: '訂桌數', width: 60 },
    { title: '訂桌獎金', dataIndex: '訂桌獎金', key: '訂桌獎金', width: 80 },
    { title: '備註', dataIndex: '備註', key: '備註', ellipsis: true },
    { title: '操作', key: 'actions', width: 80, render: (_, r) => (
      <Space>
        <Button size="small" icon={<EditOutlined />} onClick={() => { setEditing(r); form.setFieldsValue(r); setModalVisible(true); }} />
        <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(r.薪資編號)} />
      </Space>
    )},
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>公關薪資計算</h2>
        <Space>
          <Select placeholder="選擇幹部" style={{ width: 200 }} onChange={setSelectedHost} value={selectedHost} options={hostOptions.map(h => ({ value: h.公關編號, label: h.姓名 }))} />
          <Button type="primary" icon={<CalculatorOutlined />} loading={loading} onClick={handleCalculate}>計算薪資</Button>
          <Button type="default" icon={<EditOutlined />} onClick={() => { setEditing(null); form.resetFields(); setModalVisible(true); }}>設定薪資</Button>
        </Space>
      </div>

      {calcResult && (
        <div className="card" style={{ marginBottom: 16 }}>
          <h3>薪資明細 - {calcResult.hostName}</h3>
          <Tabs items={[
            { key: 'basic', label: '基本資訊', children: (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div><b>日保/節拆:</b> {calcResult.日保}/{calcResult.節拆}</div>
                <div><b>保薪天數:</b> {calcResult.保薪天數}</div>
                <div><b>節拆天數:</b> {calcResult.節拆天數}</div>
                <div><b>總節數:</b> {calcResult.總節數}</div>
                <div><b>經紀費:</b> NT${calcResult.經紀費}</div>
                <div><b>合計:</b> NT${calcResult.合計}</div>
              </div>
            )},
            { key: 'detail', label: '明細', children: (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div><b>保薪薪資:</b> NT${calcResult.保薪薪資}</div>
                <div><b>節拆薪資:</b> NT${calcResult.節拆薪資}</div>
                <div><b>應發薪資:</b> NT${calcResult.應發薪資}</div>
                <div><b>扣帶檯費:</b> NT${calcResult.扣帶檯費}</div>
                <div><b>清潔費:</b> NT${calcResult.清潔費}</div>
                <div><b>訂桌數:</b> {calcResult.訂桌數}</div>
                <div><b>訂桌獎金/扣款:</b> NT${calcResult.訂桌獎金}</div>
                <div><b>備註:</b> {calcResult.備註 || '-'}</div>
              </div>
            )},
          ]} />
        </div>
      )}

      <div className="table-responsive"><Table dataSource={dataSource} columns={columns} rowKey="薪資編號" loading={loading} size="small" scroll={{ x: 1400 }} pagination={{ pageSize: 20 }} /></div>

      <Modal title={editing ? '編輯薪資' : '設定薪資'} open={modalVisible} onCancel={() => setModalVisible(false)} footer={null} width={600}>
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Form.Item name="公關編號" label="公關編號" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} /></Form.Item>
            <Form.Item name="名子" label="名字"><Input /></Form.Item>
            <Form.Item name="日保" label="日保"><InputNumber style={{ width: '100%' }} min={0} /></Form.Item>
            <Form.Item name="節拆" label="節拆"><InputNumber style={{ width: '100%' }} min={0} /></Form.Item>
            <Form.Item name="保薪天數" label="保薪天數"><InputNumber style={{ width: '100%' }} min={0} /></Form.Item>
            <Form.Item name="節拆天數" label="節拆天數"><InputNumber style={{ width: '100%' }} min={0} /></Form.Item>
            <Form.Item name="總節數" label="總節數"><InputNumber style={{ width: '100%' }} min={0} /></Form.Item>
            <Form.Item name="經紀人" label="經紀人"><Input /></Form.Item>
            <Form.Item name="經紀費" label="經紀費"><InputNumber style={{ width: '100%' }} min={0} /></Form.Item>
            <Form.Item name="合計" label="合計"><InputNumber style={{ width: '100%' }} min={0} /></Form.Item>
            <Form.Item name="保薪薪資" label="保薪薪資"><InputNumber style={{ width: '100%' }} min={0} /></Form.Item>
            <Form.Item name="節拆薪資" label="節拆薪資"><InputNumber style={{ width: '100%' }} min={0} /></Form.Item>
            <Form.Item name="應發薪資" label="應發薪資"><InputNumber style={{ width: '100%' }} min={0} /></Form.Item>
            <Form.Item name="扣帶檯費" label="扣帶檯費"><InputNumber style={{ width: '100%' }} min={0} /></Form.Item>
            <Form.Item name="清潔費" label="清潔費"><InputNumber style={{ width: '100%' }} min={0} /></Form.Item>
            <Form.Item name="訂桌數" label="訂桌數"><InputNumber style={{ width: '100%' }} min={0} /></Form.Item>
            <Form.Item name="訂桌獎金" label="訂桌獎金/扣款"><InputNumber style={{ width: '100%' }} min={0} /></Form.Item>
            <Form.Item name="備註" label="備註"><Input /></Form.Item>
          </div>
          <Form.Item><Space><Button type="primary" htmlType="submit">{editing ? '更新' : '新增'}</Button><Button onClick={() => setModalVisible(false)}>取消</Button></Space></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
