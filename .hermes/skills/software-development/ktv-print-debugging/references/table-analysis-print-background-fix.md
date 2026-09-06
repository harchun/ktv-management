# TableAnalysis 列印背景修復 (2026-09-01)

## 問題
訂桌分析分頁列印時，封面頁有漸層背景（紫藍），頁尾有深底，表格標題列有顏色。使用者要求純白背景列印。

## 解決方法
在 `@media print` 區塊覆蓋樣式，使用 `!important` 強制白色背景：

```css
@media print {
  .cover-page,
  .footer-page {
    background: #fff !important;
    color: #000 !important;
  }

  .cover-title,
  .cover-subtitle,
  .cover-period .value,
  .cover-date .value,
  .footer-text {
    color: #000 !important;
  }

  .data-table th {
    background: #f0f0f0 !important;
  }

  .data-table tr.section-header {
    background: #fff !important;
    color: #000 !important;
    border-bottom: 2px solid #000;
  }

  .summary-card {
    background: #fff !important;
    border: 1px solid #ccc !important;
  }

  .card-icon {
    background: #f0f0f0 !important;
  }
}
```

## 原始模式問題
原樣式使用 `-webkit-print-color-adjust: exact` 強制列印所有顏色，導致封面漸層、深色頁尾都印出來。

## 部署步驟
```bash
cd /home/harchun/ktv-management/client
npm run build
docker exec ktv-frontend rm -rf /usr/share/nginx/html/dist
docker cp /home/harchun/ktv-management/client/dist/. ktv-frontend:/usr/share/nginx/html/
docker restart ktv-frontend
```

## 驗證
瀏覽器強制重新整理 (Ctrl+Shift+R)，然後列印或預覽列印，確認：
- 封面頁白底黑字
- 頁尾白底黑字
- 表格標題列白底灰框
- 卡片白底灰框
