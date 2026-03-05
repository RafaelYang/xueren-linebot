// ===========================
// 學人新創 LINE Bot - 雙 Tab 圖文選單建立腳本
// 使用 Rich Menu Alias 實現 Tab 切換
// 執行一次：node richMenu.js
// ===========================
const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;

const jsonHeaders = {
    Authorization: `Bearer ${ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
};

const YOUTUBE_URL = 'https://youtube.com/@meiyalin88?si=7B9ibR0N0IvhklZp';
const GOOGLE_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSfxQ5QImmhn1imvGka6s5jNdSgC-a2l3EJpv5QR_yBsbRpbbw/viewform';

// ===========================
// 選單 1：精選活動（無人機體驗課程）
// 圖片：2500 x 843
//   - 上方 Tab 列高度：約 80px
//     - 左：精選活動 Tab（切換 alias-1，即自己）
//     - 右：跟著大師 Tab（切換 alias-2）
//   - 下方主體：843 - 80 = 763px
//     - 「立即報名」紅色按鈕：右下角
//       大約 x=640~900, y=640~843（相對整圖）
// ===========================
const richMenu1 = {
    size: { width: 2500, height: 843 },
    selected: true,
    name: '精選活動',
    chatBarText: '點我開啟選單',
    areas: [
        // 上方 Tab - 左半「精選活動」（切換到自己，alias-1）
        {
            bounds: { x: 0, y: 0, width: 1250, height: 80 },
            action: {
                type: 'richmenuswitch',
                richMenuAliasId: 'alias-xueren-1',
                data: 'switch=tab1',
                clipboardText: '精選活動',
            },
        },
        // 上方 Tab - 右半「跟著大師學領導力」（切換到 Tab2，alias-2）
        {
            bounds: { x: 1250, y: 0, width: 1250, height: 80 },
            action: {
                type: 'richmenuswitch',
                richMenuAliasId: 'alias-xueren-2',
                data: 'switch=tab2',
                clipboardText: '跟著大師學領導力',
            },
        },
        // 下方「立即報名」按鈕（紅色圓形，右下角）
        {
            bounds: { x: 1620, y: 630, width: 300, height: 213 },
            action: {
                type: 'uri',
                uri: GOOGLE_FORM_URL,
            },
        },
    ],
};

// ===========================
// 選單 2：跟著大師學領導力（三季影片）
// 圖片：2500 x 843
//   - 上方 Tab 列：約 80px
//     - 左：精選活動 Tab（切換 alias-1）
//     - 右：跟著大師 Tab（切換 alias-2，即自己）
//   - 下方三欄影片：第一季、第二季、第三季
//     每欄 x 約 140/880/1600，寬約 640，高 763px
// ===========================
const richMenu2 = {
    size: { width: 2500, height: 843 },
    selected: false,
    name: '跟著大師學領導力',
    chatBarText: '點我開啟選單',
    areas: [
        // 上方 Tab - 左半「精選活動」（切換 alias-1）
        {
            bounds: { x: 0, y: 0, width: 1250, height: 80 },
            action: {
                type: 'richmenuswitch',
                richMenuAliasId: 'alias-xueren-1',
                data: 'switch=tab1',
                clipboardText: '精選活動',
            },
        },
        // 上方 Tab - 右半「跟著大師學領導力」（切換到自己）
        {
            bounds: { x: 1250, y: 0, width: 1250, height: 80 },
            action: {
                type: 'richmenuswitch',
                richMenuAliasId: 'alias-xueren-2',
                data: 'switch=tab2',
                clipboardText: '跟著大師學領導力',
            },
        },
        // 第一季播放按鈕（左欄）
        {
            bounds: { x: 60, y: 90, width: 700, height: 753 },
            action: {
                type: 'uri',
                uri: YOUTUBE_URL,
            },
        },
        // 第二季播放按鈕（中欄）
        {
            bounds: { x: 860, y: 90, width: 700, height: 753 },
            action: {
                type: 'uri',
                uri: YOUTUBE_URL,
            },
        },
        // 第三季播放按鈕（右欄，不含最右邊小 logo）
        {
            bounds: { x: 1650, y: 90, width: 700, height: 753 },
            action: {
                type: 'uri',
                uri: YOUTUBE_URL,
            },
        },
    ],
};

// ===========================
// 上傳圖片
// ===========================
async function uploadImage(richMenuId, imagePath, contentType) {
    const imageBuffer = fs.readFileSync(imagePath);
    await axios.post(
        `https://api-data.line.me/v2/bot/richmenu/${richMenuId}/content`,
        imageBuffer,
        {
            headers: {
                Authorization: `Bearer ${ACCESS_TOKEN}`,
                'Content-Type': contentType,
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
        }
    );
}

// ===========================
// 主流程
// ===========================
async function setup() {
    try {
        // 步驟 0：刪除舊的圖文選單與 Alias
        console.log('🗑️  清除舊圖文選單...');
        const listRes = await axios.get('https://api.line.me/v2/bot/richmenu/list', { headers: jsonHeaders });
        for (const menu of listRes.data.richmenus || []) {
            await axios.delete(`https://api.line.me/v2/bot/richmenu/${menu.richMenuId}`, { headers: jsonHeaders });
            console.log(`   已刪除 menu：${menu.richMenuId}`);
        }

        // 刪除舊 Alias（忽略 404 錯誤）
        for (const aliasId of ['alias-xueren-1', 'alias-xueren-2']) {
            try {
                await axios.delete(`https://api.line.me/v2/bot/richmenu/alias/${aliasId}`, { headers: jsonHeaders });
                console.log(`   已刪除 alias：${aliasId}`);
            } catch (_) { }
        }

        // 步驟 1：建立兩個選單 + 上傳圖片
        console.log('\n📋 建立圖文選單 1（精選活動）...');
        const res1 = await axios.post('https://api.line.me/v2/bot/richmenu', richMenu1, { headers: jsonHeaders });
        const menuId1 = res1.data.richMenuId;
        console.log(`✅ 選單 1 建立完成，ID: ${menuId1}`);

        console.log('🖼️  上傳圖片 1...');
        await uploadImage(menuId1, path.join(__dirname, 'public', 'menu1.jpg'), 'image/jpeg');
        console.log('✅ 圖片 1 上傳完成');

        console.log('\n📋 建立圖文選單 2（跟著大師）...');
        const res2 = await axios.post('https://api.line.me/v2/bot/richmenu', richMenu2, { headers: jsonHeaders });
        const menuId2 = res2.data.richMenuId;
        console.log(`✅ 選單 2 建立完成，ID: ${menuId2}`);

        console.log('🖼️  上傳圖片 2...');
        await uploadImage(menuId2, path.join(__dirname, 'public', 'menu2.jpg'), 'image/jpeg');
        console.log('✅ 圖片 2 上傳完成');

        // 步驟 2：建立 Alias（讓 richmenuswitch 能切換）
        console.log('\n🔗 建立 Rich Menu Alias...');
        await axios.post('https://api.line.me/v2/bot/richmenu/alias', {
            richMenuAliasId: 'alias-xueren-1',
            richMenuId: menuId1,
        }, { headers: jsonHeaders });
        console.log('✅ alias-xueren-1 → 選單 1');

        await axios.post('https://api.line.me/v2/bot/richmenu/alias', {
            richMenuAliasId: 'alias-xueren-2',
            richMenuId: menuId2,
        }, { headers: jsonHeaders });
        console.log('✅ alias-xueren-2 → 選單 2');

        // 步驟 3：設選單 1 為所有用戶的預設
        console.log('\n🔧 設定預設選單（選單 1）...');
        await axios.post(
            `https://api.line.me/v2/bot/user/all/richmenu/${menuId1}`,
            {},
            { headers: jsonHeaders }
        );
        console.log('✅ 已設定所有用戶預設顯示「精選活動」選單');
        console.log('\n🎉 雙 Tab 圖文選單設定完成！重新整理 LINE App 即可看到效果');

    } catch (error) {
        console.error('❌ 錯誤：', error.response?.data || error.message);
    }
}

setup();
