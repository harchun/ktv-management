import { useEffect, useState } from 'react';
import {
  Card, Table, Tag, Button, Space, Typography, Modal, Alert, message, Row, Col,
} from 'antd';
import {
  CopyOutlined, ApiOutlined, SafetyCertificateOutlined, ThunderboltOutlined,
} from '@ant-design/icons';

const { Text, Paragraph } = Typography;

// Write endpoints (still require Bearer token)
const WRITE_ENDPOINTS = [
  { method: 'POST', path: '/auth/login', desc: '登入，回傳 JWT token' },
  { method: 'POST', path: '/cadres', desc: '新增幹部' },
  { method: 'PUT', path: '/cadres/:id', desc: '修改幹部' },
  { method: 'DELETE', path: '/cadres/:id', desc: '刪除幹部' },
  { method: 'POST', path: '/customers', desc: '新增客戶' },
  { method: 'PUT', path: '/customers/:id', desc: '修改客戶' },
  { method: 'DELETE', path: '/customers/:id', desc: '刪除客戶' },
  { method: 'POST', path: '/daily-sales', desc: '新增營業記錄' },
  { method: 'POST', path: '/gossip', desc: '新增公關' },
  { method: 'PUT', path: '/gossip/:id', desc: '修改公關' },
  { method: 'DELETE', path: '/gossip/:id', desc: '刪除公關' },
  { method: 'POST', path: '/brokers', desc: '新增經紀人' },
  { method: 'PUT', path: '/brokers/:id', desc: '修改經紀人' },
  { method: 'DELETE', path: '/brokers/:id', desc: '刪除經紀人' },
];

const methodColor = { GET: 'green', POST: 'orange', PUT: 'blue', DELETE: 'red' };

export default function ApiPanel() {
  const [index, setIndex] = useState(null);
  const [results, setResults] = useState({});
  const [modal, setModal] = useState(null);
  const [testing, setTesting] = useState({});

  const baseUrl = index ? index.base : 'https://ktv.fakertw.com/api';

  useEffect(() => {
    fetch('/api')
      .then((r) => r.json())
      .then(setIndex)
      .catch(() => setIndex(null));
  }, []);

  const copyUrl = (url) => {
    navigator.clipboard.writeText(url).then(
      () => message.success('已複製'),
      () => message.error('複製失敗')
    );
  };

  const testEndpoint = async (path) => {
    const needsAuth = !path.startsWith('/stats') && !['/customer-relations', '/inactive-customers', '/users', '/settings', '/gossip', '/brokers', '/cadres', '/customers', '/daily-sales'].includes(path);
    const token = localStorage.getItem('token');
    const headers = {};
    if (needsAuth && token) headers.Authorization = `Bearer ${token}`;
    setTesting((t) => ({ ...t, [path]: true }));
    try {
      const t0 = Date.now();
      const res = await fetch(baseUrl + path, { headers });
      const body = await res.text();
      let parsed = body;
      try { parsed = JSON.parse(body); } catch (e) { /* keep raw */ }
      setResults((r) => ({
        ...r,
        [path]: {
          status: res.status,
          ok: res.ok,
          ms: Date.now() - t0,
          size: body.length,
          data: parsed,
        },
      }));
      if (res.status === 401) {
        message.warning(`${path} 需要 token`);
      }
    } catch (e) {
      setResults((r) => ({ ...r, [path]: { status: 'ERR', ok: false, data: String(e) } }));
    }
    setTesting((t) => ({ ...t, [path]: false }));
  };

  const publicCols = [
    {
      title: '端點',
      dataIndex: 'path',
      render: (p, r) => (
        <Space size={4} wrap>
          <Tag color={methodColor.GET}>GET</Tag>
          <Text code style={{ fontSize: 12 }}>{p}</Text>
          {r.params && <Text type="secondary" style={{ fontSize: 11 }}>{r.params}</Text>}
        </Space>
      ),
    },
    { title: '說明', dataIndex: 'desc', width: 260 },
    {
      title: '測試',
      width: 150,
      render: (_, r) => {
        const res = results[r.path];
        return (
          <Space>
            <Button
              size="small"
              icon={<ThunderboltOutlined />}
              loading={testing[r.path]}
              onClick={() => testEndpoint(r.path)}
            >
              測試
            </Button>
            {res && (
              <Button size="small" type="link" style={{ padding: 0 }} onClick={() => setModal(r)}>
                {res.ok ? <Tag color="green">{res.status}</Tag> : <Tag color="red">{res.status}</Tag>}
              </Button>
            )}
          </Space>
        );
      },
    },
  ];

  const writeCols = [
    {
      title: '端點',
      dataIndex: 'path',
      render: (p, r) => (
        <Space size={4} wrap>
          <Tag color={methodColor[r.method] || 'default'}>{r.method}</Tag>
          <Text code style={{ fontSize: 12 }}>{p}</Text>
        </Space>
      ),
    },
    { title: '說明', dataIndex: 'desc', width: 220 },
  ];

  const publicEndpoints = index ? index.endpoints : [];

  return (
    <div style={{ padding: 0 }}>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card
            title={<Space><ApiOutlined /> API 面板</Space>}
            extra={
              <Space>
                <Button icon={<CopyOutlined />} onClick={() => copyUrl(baseUrl + '/docs')}>文件</Button>
                <Button icon={<CopyOutlined />} onClick={() => copyUrl(baseUrl + '/openapi.json')}>OpenAPI 規格</Button>
                <Button icon={<CopyOutlined />} onClick={() => copyUrl(baseUrl)}>複製 Base URL</Button>
              </Space>
            }
          >
            <Alert
              type="info"
              showIcon
              icon={<SafetyCertificateOutlined />}
              style={{ marginBottom: 16 }}
              message={
                <span>
                  公開端點（GET）免登入，可直接呼叫；寫入端點（POST/PUT/DELETE）需 Bearer token。
                  n8n / 外部系統可直連 <Text code>https://ktv.fakertw.com/api/...</Text>
                </span>
              }
              description={index?.auth || undefined}
            />
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Card
                  type="inner"
                  title={<Space><Tag color="green">公開</Tag> GET 端點（免登入）</Space>}
                >
                  <Table
                    rowKey="path"
                    size="small"
                    pagination={false}
                    dataSource={publicEndpoints}
                    columns={publicCols}
                    expandable={{
                      expandedRowRender: (r) => {
                        const res = results[r.path];
                        if (!res) return <Text type="secondary">尚未測試</Text>;
                        return (
                          <Paragraph
                            style={{
                              maxHeight: 300,
                              overflow: 'auto',
                              background: '#111',
                              padding: 12,
                              borderRadius: 6,
                              fontSize: 12,
                            }}
                          >
                            <Text type="success" style={{ fontSize: 12 }}>
                              HTTP {res.status} · {res.ms}ms · {res.size} 字元
                            </Text>
                            <pre style={{ margin: '8px 0 0', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                              {JSON.stringify(res.data, null, 2).slice(0, 3000)}
                              {res.data && JSON.stringify(res.data).length > 3000 && '\n…（已截斷）'}
                            </pre>
                          </Paragraph>
                        );
                      },
                    }}
                  />
                </Card>
              </Col>
              <Col span={24}>
                <Card
                  type="inner"
                  title={<Space><Tag color="orange">需登入</Tag> 寫入端點（Bearer token）</Space>}
                >
                  <Table
                    rowKey="path"
                    size="small"
                    pagination={false}
                    dataSource={WRITE_ENDPOINTS}
                    columns={writeCols}
                  />
                </Card>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      <Modal
        open={!!modal}
        title={modal ? `回應 ${modal.path} — HTTP ${modal.status}` : ''}
        footer={
          modal && (
            <Button
              icon={<CopyOutlined />}
              onClick={() => copyUrl(JSON.stringify(modal.data, null, 2))}
            >
              複製 JSON
            </Button>
          )
        }
        onCancel={() => setModal(null)}
        width={720}
      >
        {modal && (
          <Paragraph>
            <Text type="success">HTTP {modal.status} · {modal.ms}ms · {modal.size} 字元</Text>
            <pre
              style={{
                maxHeight: 480,
                overflow: 'auto',
                background: '#0d0d18',
                padding: 12,
                borderRadius: 6,
                fontSize: 12,
                marginTop: 8,
              }}
            >
              {typeof modal.data === 'string'
                ? modal.data
                : JSON.stringify(modal.data, null, 2)}
            </pre>
          </Paragraph>
        )}
      </Modal>
    </div>
  );
}
