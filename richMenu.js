// ===========================
// 學人新創 LINE Bot - 圖文選單建立腳本
// 這支腳本只需執行一次：node richMenu.js
// ===========================
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
require('dotenv').config();

const ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;

const headers = {
    Authorization: `Bearer ${ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
};

// ===========================
// 圖文選單設定（3 個按鈕）
// ===========================
const richMenuBody = {
    size: { width: 2500, height: 843 },
    selected: true,
    name: '學人新創主選單',
    chatBarText: '點我開啟選單',
    areas: [
        // 左：立即報名（直接開啟 Google 表單）
        {
            bounds: { x: 0, y: 0, width: 833, height: 843 },
            action: {
                type: 'uri',
                uri: 'https://docs.google.com/forms/d/e/1FAIpQLSfxQ5QImmhn1imvGka6s5jNdSgC-a2l3EJpv5QR_yBsbRpbbw/viewform',
            },
        },
        // 中：問問題
        {
            bounds: { x: 833, y: 0, width: 834, height: 843 },
            action: {
                type: 'postback',
                data: 'action=ask',
                displayText: '我有問題',
            },
        },
        // 右：關於我們
        {
            bounds: { x: 1667, y: 0, width: 833, height: 843 },
            action: {
                type: 'postback',
                data: 'action=about',
                displayText: '關於我們',
            },
        },
    ],
};

async function createAndSetRichMenu() {
    try {
        // 步驟 1：建立圖文選單
        console.log('📋 建立圖文選單...');
        const createRes = await axios.post(
            'https://api.line.me/v2/bot/richmenu',
            richMenuBody,
            { headers }
        );
        const richMenuId = createRes.data.richMenuId;
        console.log(`✅ 圖文選單已建立，ID: ${richMenuId}`);

        // 步驟 2：上傳圖片（若有 richMenu.png）
        const imagePath = path.join(__dirname, 'public', 'richMenu.png');
        if (fs.existsSync(imagePath)) {
            console.log('🖼️  上傳圖文選單圖片...');
            const form = new FormData();
            form.append('file', fs.createReadStream(imagePath), {
                filename: 'richMenu.png',
                contentType: 'image/png',
            });
            await axios.post(
                `https://api-data.line.me/v2/bot/richmenu/${richMenuId}/content`,
                form,
                {
                    headers: {
                        Authorization: `Bearer ${ACCESS_TOKEN}`,
                        ...form.getHeaders(),
                    },
                }
            );
            console.log('✅ 圖片上傳完成');
        } else {
            console.log('⚠️  未找到 public/richMenu.png，請手動至 LINE OA Manager 上傳圖片');
            console.log(`   圖文選單 ID：${richMenuId}`);
        }

        // 步驟 3：設為預設圖文選單
        console.log('🔧 設定為預設圖文選單...');
        await axios.post(
            `https://api.line.me/v2/bot/user/all/richmenu/${richMenuId}`,
            {},
            { headers }
        );
        console.log('✅ 已設定為所有用戶的預設圖文選單');
        console.log('\n🎉 完成！重新整理 LINE OA 即可看到選單');

    } catch (error) {
        console.error('❌ 錯誤：', error.response?.data || error.message);
    }
}

createAndSetRichMenu();
