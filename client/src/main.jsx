import { ConfigProvider, theme } from 'antd';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#f39c12',
          colorBgContainer: '#1a1a2e',
          colorBorder: '#333',
        },
        components: {
          Layout: {
            headerBg: '#0c0c1d',
            siderBg: '#0c0c1d',
          },
          Menu: {
            itemBg: 'transparent',
            itemColor: '#aaa',
            itemSelectedColor: '#f39c12',
            itemHoverColor: '#f39c12',
          },
        },
      }}
    >
      <App />
    </ConfigProvider>
  </React.StrictMode>,
);
