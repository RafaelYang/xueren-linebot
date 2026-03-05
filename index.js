// ===========================
// 學人新創 LINE Bot 主伺服器
// ===========================
const express = require('express');
const line = require('@line/bot-sdk');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const { askOpenAI } = require('./openai');

// 報名 Google 表單連結
const GOOGLE_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSfxQ5QImmhn1imvGka6s5jNdSgC-a2l3EJpv5QR_yBsbRpbbw/viewform';

// LINE SDK 設定
const lineConfig = {
  channelSecret: process.env.LINE_CHANNEL_SECRET,
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
};

const client = new line.messagingApi.MessagingApiClient({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
});

const app = express();
const PORT = process.env.PORT || 3000;

// 靜態檔案服務（public 資料夾）
app.use(express.static(path.join(__dirname, 'public')));

// ===========================
// Webhook 路由
// ===========================
app.post(
  '/webhook',
  line.middleware(lineConfig),
  async (req, res) => {
    res.status(200).send('OK');
    const events = req.body.events;
    for (const event of events) {
      await handleEvent(event);
    }
  }
);

// ===========================
// 報名資料備份 API（可選）
// ===========================
app.use(express.json());

app.post('/api/register', (req, res) => {
  const { name, email, phone, activity, note, userId } = req.body;

  // 確保 data 資料夾存在
  const dataDir = path.join(__dirname, 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
  }

  const filePath = path.join(dataDir, 'registrations.json');
  let records = [];

  if (fs.existsSync(filePath)) {
    records = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  }

  const newRecord = {
    id: Date.now(),
    name,
    email,
    phone,
    activity,
    note,
    userId,
    createdAt: new Date().toISOString(),
  };

  records.push(newRecord);
  fs.writeFileSync(filePath, JSON.stringify(records, null, 2));

  console.log('[報名成功]', newRecord);
  res.json({ success: true, message: '報名成功！' });
});

// ===========================
// 健康檢查（Render 需要）
// ===========================
app.get('/', (req, res) => {
  res.send('學人新創 LINE Bot 運作中 ✅');
});

// /ping 路由 - 給 cron-job.org 定時呼叫，防止 Render 冷啟動
app.get('/ping', (req, res) => {
  console.log(`[Ping] ${new Date().toISOString()} - 保持運作中`);
  res.json({ status: 'ok', time: new Date().toISOString() });
});


// ===========================
// 事件處理核心
// ===========================
async function handleEvent(event) {
  const replyToken = event.replyToken;

  // 處理一般訊息（文字問答 → AI 回覆 + 動態建議問題）
  if (event.type === 'message' && event.message.type === 'text') {
    const userMessage = event.message.text.trim();

    try {
      const { answer, suggestions } = await askOpenAI(userMessage);

      // 建立訊息物件
      const message = { type: 'text', text: answer };

      // 若 AI 有產生建議問題，加入 Quick Reply 按鈕
      if (suggestions.length > 0) {
        message.quickReply = {
          items: suggestions.map(q => ({
            type: 'action',
            action: {
              type: 'message',
              label: q.length > 20 ? q.slice(0, 19) + '…' : q, // LINE 限制最多 20 字
              text: q,
            },
          })),
        };
      }

      await client.replyMessage({ replyToken, messages: [message] });
    } catch (err) {
      console.error('[AI 回覆錯誤]', err.message);
      await client.replyMessage({
        replyToken,
        messages: [{ type: 'text', text: '抱歉，系統暫時無法回應，請稍後再試 🙏' }],
      });
    }
    return;
  }


  // 處理 Postback 事件（圖文選單中間／右側按鈕）
  if (event.type === 'postback') {
    const data = event.postback.data;

    if (data === 'action=ask') {
      // 引導提問
      await client.replyMessage({
        replyToken,
        messages: [
          {
            type: 'text',
            text: `💬 您好！請直接輸入您想問的問題，例如：\n\n・課程內容是什麼？\n・如何報名？\n・費用是多少？\n\n我們的 AI 客服會立即回答您 😊`,
          },
        ],
      });
    } else if (data === 'action=about') {
      // 關於我們
      await client.replyMessage({
        replyToken,
        messages: [
          {
            type: 'text',
            text: `🏢 關於學人新創\n\n學人新創致力於推動創新教育與新創培訓，\n協助更多人找到自己的可能性。\n\n📌 有任何問題歡迎直接在此輸入，AI 客服會為您解答！`,
          },
        ],
      });
    }
    return;
  }
}

// ===========================
// 啟動伺服器
// ===========================
app.listen(PORT, () => {
  console.log(`🚀 學人新創 LINE Bot 已啟動，Port: ${PORT}`);
});
