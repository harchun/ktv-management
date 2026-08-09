import { ConfigProvider, theme } from 'antd';
import zhTW from 'antd/locale/zh_TW';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-tw';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ConfigProvider
      locale={zhTW}
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
