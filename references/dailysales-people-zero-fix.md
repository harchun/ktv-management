# DailySales 人數=0 修復

## 問題
每日營業報表新增紀錄時，人數輸入 0 會跳回 1。

## 根本原因
1. **後端**: `server.js` 中 `人數 || 1` — JavaScript 的 `0` 是 falsy，所以 `0 || 1` 會變成 `1`
2. **資料庫**: `daily_sales` 表的 `人數` 欄位預設值是 `DEFAULT '1'`

## 修復步驟

### 1. 前端 (已在上次修復)
```jsx
// client/src/pages/DailySales.jsx
<InputNumber min={0} style={{ width: '100%' }} />
```

### 2. 後端
```javascript
// 錯誤寫法 (會把 0 轉成 1)
const 人數 = data.人數 || 1;

// 正確寫法
const 人數 = data.人數 !== undefined && data.人數 !== null ? data.人數 : 1;
```

### 3. 資料庫
```sql
ALTER TABLE daily_sales MODIFY 人數 INT DEFAULT 0;
```

## 部署
```bash
# 同步後端到 Docker
docker cp /home/harchun/ktv-management/server.js ktv-backend-single:/app/src/server.js
docker restart ktv-backend-single

# 同步前端到 Docker
docker cp /home/harchun/ktv-management/client/dist/. ktv-frontend:/usr/share/nginx/html/
docker restart ktv-frontend
```

## 注意事項
- JavaScript 的 `0` 是 falsy，不能用 `||` 做預設值
- 正確用法: `value !== undefined && value !== null ? value : defaultValue`
- 或使用空值合併運算子: `value ?? defaultValue` (ES2020+)
