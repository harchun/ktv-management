import { useState, useEffect } from 'react';
import { Table, Button, Input, Modal, Form, message, Card, Row, Col, Space } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import api from '../utils/api';

const cardStyle = {
  background: 'rgba(26, 26, 46, 0.8)',
  border: '1px solid #333',
  borderRadius: 12,
};

export default function BrokerManagement() {
  const [dataSource, setDataSource] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth <= 768 : false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/brokers');
      setDataSource(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      message.error('取得經紀人資料失敗');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async (values) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      if (editing) {
        await api.put(`/brokers/${editing['經紀人編號']}`, values);
        message.success('更新成功');
      } else {
        await api.post('/brokers', values);
        message.success('新增成功');
      }
      setModalVisible(false);
      form.resetFields();
      fetchData();
    } catch (err) {
      message.error(err.response?.data?.error || '操作失敗');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/brokers/${id}`);
      message.success('刪除成功');
      fetchData();
    } catch (err) {
      message.error('刪除失敗');
    }
  };

  const columns = [
    { title: '經紀人', dataIndex: '經紀人', key: 'broker', width: 200 },
    { title: '手機', dataIndex: '手機', key: 'phone', width: 150 },
    { title: '操作', key: 'actions', width: 120, render: (_, record) => (
      <Space>
        <Button type="link" icon={<EditOutlined />} onClick={() => {
          setEditing(record);
          form.setFieldsValue(record);
          setModalVisible(true);
        }} />
        <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record['經紀人編號'])} />
      </Space>
    )},
  ];

  const filteredData = searchText
    ? dataSource.filter(r =>
        (r.經紀人 || '').toLowerCase().includes(searchText.toLowerCase()) ||
        (r.手機 || '').toLowerCase().includes(searchText.toLowerCase())
      )
    : dataSource;

  return (
    <div>
      <Card style={cardStyle} bodyStyle={{ padding: 0 }} className="page-content">
        <div style={{ padding: isMobile ? 12 : 20 }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? 12 : 0,
          }}>
            <h2 style={{ color: '#9b59b6', margin: 0, fontSize: isMobile ? 18 : undefined }} className="page-title">👔 經紀人管理</h2>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
              ...(isMobile ? { width: '100%' } : {}),
            }}>
              <Input.Search
                placeholder="搜尋經紀人/手機..."
                allowClear
                style={{ width: isMobile ? '100%' : 300 }}
                prefix={<SearchOutlined style={{ color: '#9b59b6' }} />}
                onChange={(e) => setSearchText(e.target.value)}
              />
              <Button
                type="primary"
                icon={<PlusOutlined />}
                style={{
                  ...(isMobile ? { width: '100%' } : {}),
                  background: '#9b59b6',
                  border: 'none',
                }}
                onClick={() => { setEditing(null); form.resetFields(); setModalVisible(true); }}
              >
                {isMobile ? '+ 新增' : '新增經紀人'}
              </Button>
            </div>
          </div>

          <div className="table-responsive">
            <Table
              dataSource={filteredData}
              columns={columns}
              rowKey="經紀人編號"
              loading={loading}
              pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `共 ${t} 位` }}
              scroll={{ x: isMobile ? 600 : undefined }}
              size={isMobile ? 'small' : 'middle'}
            />
          </div>
        </div>
      </Card>

      <Modal
        title={editing ? '編輯經紀人' : '新增經紀人'}
        open={modalVisible && !submitting}
        onCancel={() => { setModalVisible(false); setSubmitting(false); }}
        footer={null}
        width={isMobile ? '100%' : 500}
        style={{ top: isMobile ? 0 : 20 }}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item name="經紀人" label="經紀人" rules={[{ required: true, message: '請輸入經紀人姓名' }]}>
                <Input placeholder="請輸入經紀人姓名" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item name="手機" label="手機">
                <Input placeholder="請輸入手機號碼" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item name="備註" label="備註">
                <Input.TextArea rows={2} placeholder="備註" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right', marginTop: 16 }}>
            <Button style={{ marginRight: 8 }} onClick={() => setModalVisible(false)}>取消</Button>
            <Button type="primary" htmlType="submit" style={{ background: '#9b59b6', border: 'none' }} disabled={submitting}>
              {editing ? '更新' : '新增'}{submitting ? '著...' : ''}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
