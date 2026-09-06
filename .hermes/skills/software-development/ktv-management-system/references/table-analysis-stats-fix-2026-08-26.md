# 訂桌分析分頁統計修復 (2026-08-26 更新)

## 問題一：前端計算錯誤（2026-08-26 修復）

`TableAnalysis.jsx` 中「桌數/公關」欄位顯示錯誤：
- 自訂桌統計顯示 32（幹部數），應顯示 308（總桌數）
- 幹部訂桌統計顯示 24（公關數），應顯示 86（總訂桌數）

### 原因

前端使用 `records.length` 計算數量，但這只回傳陣列長度（幹部/公關數量），而非實際的次數總和。

### 修復

```javascript
// 自訂桌統計
const count = records.reduce((sum, r) => sum + (Number(r.次數) || 0), 0);

// 幹部訂桌統計
const count = records.reduce((sum, r) => sum + (Number(r.紀錄數) || 0), 0);
```

---

## 問題二：同一日期同一客戶重複計算（2026-08-27 修復）

### 問題

`daily_sales` 表中，同一日期同一客戶名可能有多筆記錄（如不同房型、不同時段），SQL 的 `COUNT(營業編號)` 會將這些視為多筆，導致統計數字偏高。

**需求**：同一日期同一客戶名，只計算一筆。

### 數據驗證

2026-08 月份數據：
- 總記錄數：338 筆
- 去重後（同一日期+同一客戶）：314 筆
- 重複記錄：24 筆

範例重複記錄：
```
2026-08-03  小劉    2次
2026-08-25  阿儒    3次
2026-08-26  尼古丁  3次
```

### 修復（後端 SQL）

修改兩個 API 的 SQL，使用 `COUNT(DISTINCT CONCAT(LEFT(日期, 10), 客戶名))`：

**`/api/stats/table-usage`**（自訂桌統計）：
```sql
-- ❌ 錯誤：計算所有記錄
COUNT(ds.營業編號) as 次數

-- ✅ 正確：同一日期+客戶只算一筆
COUNT(DISTINCT CONCAT(LEFT(ds.日期, 10), ds.客戶名)) as 次數
```

**`/api/stats/cadre-table`**（幹部訂桌統計）：
```sql
-- ❌ 錯誤
COUNT(ds.營業編號) as 紀錄數

-- ✅ 正確
COUNT(DISTINCT CONCAT(LEFT(ds.日期, 10), ds.客戶名)) as 紀錄數
```

### 驗證結果（2026-08）

| API | 修復前 | 修復後 |
|-----|--------|--------|
| 自訂桌統計總桌數 | 308 | 24 |
| 幹部訂桌統計總筆數 | 86 | 86 |

註：幹部訂桌統計原本就使用不同邏輯（GROUP BY 公關姓名），數據一致。

---

## 相關檔案

- `client/src/pages/TableAnalysis.jsx` — 前端統計計算邏輯
- `src/server.js` — 後端 API `/api/stats/table-usage` 和 `/api/stats/cadre-table`
- `references/table-analysis-stats-fix-2026-08-26.md` — 前端修復記錄
