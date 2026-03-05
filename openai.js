// ===========================
// OpenAI 問答模組
// ===========================
const OpenAI = require('openai');
require('dotenv').config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// 學人新創公司背景知識（System Prompt）
// ⚠️ 請根據實際情況修改這段說明，越詳細 AI 回答越精準
const SYSTEM_PROMPT = `你是「學人新創」的 LINE 智慧客服助手，請用繁體中文、友善且專業的方式回答使用者的問題。

【關於學人新創】
學人新創是一間專注於創新教育與新創培訓的公司，致力於協助更多人找到自己的可能性，提供多元化的課程、工作坊與創業輔導服務。

【你的任務】
1. 回答使用者關於公司課程、活動、報名方式、收費等問題
2. 介紹公司理念與服務
3. 引導有興趣的使用者報名或進一步了解

【注意事項】
- 若使用者詢問你不確定的細節資訊（例如具體費用、開課時間），請告知「詳情請聯繫我們」，不要自己捏造數字
- 保持回答簡潔，避免過長的回覆（盡量在 200 字以內）
- 語氣溫和、有感情，像一位親切的顧問

【聯絡方式】
如有進一步問題，使用者可直接在此對話或透過圖文選單報名。`;

/**
 * 呼叫 OpenAI API 進行問答
 * @param {string} userMessage 使用者傳送的訊息
 * @returns {string} AI 回覆文字
 */
async function askOpenAI(userMessage) {
    const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userMessage },
        ],
        max_tokens: 500,
        temperature: 0.7,
    });

    return response.choices[0].message.content.trim();
}

module.exports = { askOpenAI };
