import { useState, useEffect } from 'react';
import { Table, Button, Input, Modal, Form, DatePicker, message, Card, Row, Col, Tag, Space } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../utils/api';
import { formatDate } from '../utils/formatDate';

const cardStyle = {
  background: 'rgba(26, 26, 46, 0.8)',
  border: '1px solid #333',
  borderRadius: 12,
};

export default function GossipManagement() {
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
      const res = await api.get('/gossip');
      setDataSource(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      message.error('取得公關資料失敗');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async (values) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const payload = {
        ...values,
        生日: values.生日 ? values.生日.format('YYYY-MM-DD') : null,
        報到日期: values.報到日期 ? values.報到日期.format('YYYY-MM-DD') : null,
      };

      if (editing) {
        await api.put(`/gossip/${editing['公關編號']}`, payload);
        message.success('更新成功');
      } else {
        await api.post('/gossip', payload);
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
      await api.delete(`/gossip/${id}`);
      message.success('刪除成功');
      fetchData();
    } catch (err) {
      message.error('刪除失敗');
    }
  };

  const columns = [
    { title: '暱稱', dataIndex: '暱稱', key: 'nickname', width: 100 },
    { title: '姓名', dataIndex: '姓名', key: 'name', width: 100 },
    { title: '經紀人', dataIndex: '經紀人', key: 'broker', width: 100 },
    { title: '手機', dataIndex: '手機', key: 'phone', width: 120 },
    { title: 'LINE ID', dataIndex: 'LINE_ID', key: 'line', width: 120 },
    { title: '生日', dataIndex: '生日', key: 'birthday', width: 100, render: formatDate },
    { title: '報到日期', dataIndex: '報到日期', key: 'report_date', width: 100, render: formatDate },
    { title: '操作', key: 'actions', width: 120, render: (_, record) => (
      <Space>
        <Button type="link" icon={<EditOutlined />} onClick={() => {
          setEditing(record);
          form.setFieldsValue({
            ...record,
            生日: record.生日 ? dayjs(record.生日) : null,
            報到日期: record.報到日期 ? dayjs(record.報到日期) : null,
          });
          setModalVisible(true);
        }} />
        <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record['公關編號'])} />
      </Space>
    )},
  ];

  const filteredData = searchText
    ? dataSource.filter(r =>
        (r.暱稱 || '').toLowerCase().includes(searchText.toLowerCase()) ||
        (r.姓名 || '').toLowerCase().includes(searchText.toLowerCase()) ||
        (r.經紀人 || '').toLowerCase().includes(searchText.toLowerCase())
      )
    : dataSource;

  return (
    <div>
      <Card style={cardStyle} bodyStyle={{ padding: 0 }} className="page-content">
        <div style={{ padding: isMobile ? 12 : 20 }}>
          {/* Control bar */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? 12 : 0,
          }}>
            <h2 style={{ color: '#9b59b6', margin: 0, fontSize: isMobile ? 18 : undefined }} className="page-title">👠 公關管理</h2>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
              ...(isMobile ? { width: '100%' } : {}),
            }}>
              <Input.Search
                placeholder="搜尋暱稱/姓名/經紀人..."
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
                {isMobile ? '+ 新增' : '新增公關'}
              </Button>
            </div>
          </div>

          <div className="table-responsive">
            <Table
              dataSource={filteredData}
              columns={columns}
              rowKey="公關編號"
              loading={loading}
              pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `共 ${t} 位` }}
              scroll={{ x: isMobile ? 900 : undefined }}
              size={isMobile ? 'small' : 'middle'}
            />
          </div>
        </div>
      </Card>

      <Modal
        title={editing ? '編輯公關' : '新增公關'}
        open={modalVisible && !submitting}
        onCancel={() => { setModalVisible(false); setSubmitting(false); }}
        footer={null}
        width={isMobile ? '100%' : 600}
        style={{ top: isMobile ? 0 : 20 }}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Row gutter={16}>
            <Col span={isMobile ? 24 : 12}>
              <Form.Item name="暱稱" label="暱稱">
                <Input placeholder="請輸入暱稱" />
              </Form.Item>
            </Col>
            <Col span={isMobile ? 24 : 12}>
              <Form.Item name="姓名" label="姓名">
                <Input placeholder="請輸入姓名" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={isMobile ? 24 : 12}>
              <Form.Item name="經紀人" label="經紀人">
                <Input placeholder="請輸入經紀人" />
              </Form.Item>
            </Col>
            <Col span={isMobile ? 24 : 12}>
              <Form.Item name="手機" label="手機">
                <Input placeholder="請輸入手機號碼" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={isMobile ? 24 : 12}>
              <Form.Item name="LINE_ID" label="LINE ID">
                <Input placeholder="請輸入LINE ID" />
              </Form.Item>
            </Col>
            <Col span={isMobile ? 24 : 12}>
              <Form.Item name="生日" label="生日">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={isMobile ? 24 : 12}>
              <Form.Item name="報到日期" label="報到日期">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={isMobile ? 24 : 12}>
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
