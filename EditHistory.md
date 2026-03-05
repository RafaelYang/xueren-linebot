# EditHistory.md — 學人新創 LineBot

## 2026-03-05（更新）

### 移除 LIFF，改用 Google 表單
- **`richMenu.js`** — 「立即報名」按鈕改為 `uri` 動作，直接開啟 Google 表單
- **`index.js`** — 重寫乾淨版：移除 LIFF 相關程式碼、移除 `action=register` postback、修正語法結構錯誤

---

## 2026-03-05

### 初始建置
- 建立專案目錄與完整檔案結構
- **`.env`** — 環境變數設定（LINE / OpenAI / LIFF 金鑰）
- **`.env.example`** — 版控用範本
- **`.gitignore`** — 避免 .env、node_modules 被推上 Git
- **`package.json`** — 專案設定，含 @line/bot-sdk、openai、express
- **`index.js`** — Express 主伺服器 + Webhook 處理 + AI 問答 + 報名 API
- **`openai.js`** — OpenAI gpt-4o-mini 問答模組，含學人新創客服 Prompt
- **`richMenu.js`** — 一次性圖文選單建立腳本（3 個按鈕）
- **`public/register.html`** — LIFF 報名表單頁面（深色玻璃質感設計）
