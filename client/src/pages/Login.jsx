import { useState } from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

export default function Login({ onLogin }) {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', values);
      const data = res.data;
      if (data.token) {
        onLogin(data.token);
        message.success('登入成功');
        navigate('/');
      } else {
        message.error(data.error || '登入失敗');
      }
    } catch (e) {
      message.error('連線失敗，請檢查網路');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0c0c1d 0%, #1a1a2e 50%, #16213e 100%)',
      padding: 16,
    }}>
      <Card
        style={{
          width: '100%',
          maxWidth: 400,
          background: 'rgba(26, 26, 46, 0.9)',
          border: '1px solid #333',
          borderRadius: 16,
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h1 style={{
            fontSize: 28,
            background: 'linear-gradient(90deg, #f39c12, #e74c3c, #9b59b6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: 4,
          }}>
            日月星辰
          </h1>
          <p style={{ color: '#888', fontSize: 13 }}>KTV 管理系統</p>
        </div>
        
        <Form form={form} onFinish={handleSubmit} size="large">
          <Form.Item name="username" rules={[{ required: true, message: '請輸入帳號' }]}>
            <Input
              prefix={<UserOutlined style={{ color: '#f39c12' }} />}
              placeholder="帳號"
              style={{ background: '#0c0c1d', border: '1px solid #333', color: '#fff' }}
            />
          </Form.Item>
          
          <Form.Item name="password" rules={[{ required: true, message: '請輸入密碼' }]}>
            <Input.Password
              prefix={<LockOutlined style={{ color: '#f39c12' }} />}
              placeholder="密碼"
              style={{ background: '#0c0c1d', border: '1px solid #333', color: '#fff' }}
            />
          </Form.Item>
          
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              style={{
                width: '100%',
                height: 44,
                background: 'linear-gradient(135deg, #f39c12, #e74c3c)',
                border: 'none',
                borderRadius: 8,
                fontSize: 15,
              }}
            >
              登入
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
