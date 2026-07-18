import { useState, useEffect } from 'react';
import { Table, Card, Button, DatePicker, Space, message } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import { formatDate } from '../utils/formatDate';

const API = axios.create({ baseURL: '/api' });
API.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const { RangePicker } = DatePicker;

export default function Performance() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      let url = '/performance/daily';
      const params = {};
      if (dateRange) {
        params.start = dateRange[0].format('YYYY-MM-DD');
        params.end = dateRange[1].format('YYYY-MM-DD');
      }
      const res = await API.get(url, { params });
      setData(res.data);
    } catch (e) { message.error('載入失敗'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const columns = [
    { title: '日期', dataIndex: '日期', key: '日期', width: 120, render: formatDate },
    { title: '公關', dataIndex: '公關編號', key: '公關' },
    { title: '檯費營收', dataIndex: '檯費營收', key: '檯費營收', width: 120, render: v => `NT$ ${v?.toLocaleString()}` },
    { title: '經紀費', dataIndex: '經紀費', key: '經紀費', width: 120, render: v => `NT$ ${v?.toLocaleString()}` },
    { title: '營利', dataIndex: '營利', key: '營利', width: 120, render: v => `NT$ ${v?.toLocaleString()}` },
    { title: '實領', dataIndex: '實領', key: '實領', width: 120, render: v => `NT$ ${v?.toLocaleString()}` },
  ];

  return (
    <div>
      <Card title="業績管理" extra={
        <Space>
          <RangePicker onChange={dates => setDateRange(dates)} />
          <Button type="primary" icon={<DownloadOutlined />} onClick={fetchData}>匯出</Button>
        </Space>
      }>
        <div className="table-responsive">
        <Table columns={columns} dataSource={data} loading={loading} rowKey="id" scroll={{ x: 1000 }} />
        </div>
      </Card>
    </div>
  );
}
