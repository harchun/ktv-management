# 日月星辰 KTV 管理系統

## 技術栈
- **後端**: Node.js + Express + MySQL 8.0
- **前端**: React + Vite + Ant Design (深色霓虹風格)
- **部署**: Docker Compose
- **網域**: erp.fakertw.com

## 快速開始

### 1. 本地開發
```bash
# 安裝依賴
npm run setup

# 啟動後端
npm run dev

# 啟動前端
cd client && npm run dev
```

### 2. Docker 部署
```bash
# 建立資料庫
docker-compose up -d mysql

# 等待 MySQL 初始化
sleep 10

# 啟動所有服務
docker-compose up -d

# 訪問
# 前端: http://localhost
# 後端: http://localhost:3001
```

### 3. 資料庫初始化
```sql
CREATE DATABASE IF NOT EXISTS ktv_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'appuser'@'%' IDENTIFIED BY '';
GRANT ALL PRIVILEGES ON ktv_db.* TO 'appuser'@'%';
FLUSH PRIVILEGES;
```

## 資料表結構

### 核心資料表
- `users` - 使用者帳號
- `hosts` - 公關小姐
- `cadres` - 幹部
- `bookings` - 訂桌記錄
- `daily_performance` - 每日業績
- `monthly_revenue` - 月營業額
- `broker_companies` - 經紀公司
- `eight_gathering` - 八大雲集
- `attendance` - 出勤記錄
- `evaluations` - 級別評估
- `staff_profile` - 人事資料

## 功能模組
1. **儀表板** - 統計概覽、圖表分析
2. **公關管理** - 新增/編輯/刪除、級別分類
3. **訂桌管理** - 日期篩選、業績追蹤
4. **幹部管理** - 等級分類、業績統計
5. **業績管理** - 日報/月報、匯出功能
6. **營業報表** - 圖表分析、月度比較
7. **經紀公司** - 聯絡管理、佣金設定
8. **八大雲集** - 合作店家管理
9. **人事資料** - 員工檔案、班表管理
10. **系統設定** - 使用者管理、權限設定

## 環境變數
```env
DB_HOST=127.0.0.1
DB_USER=appuser
DB_PASSWORD=
DB_NAME=ktv_db
PORT=3001
JWT_SECRET=your-secret-key
```

## 開發日誌
- 2026-07-01: 初始建立，基於歷史 Excel 資料分析
