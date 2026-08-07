// sheet-sync.js — ยิง request จริงไปหา Google Apps Script Web App

// 1. ฟังก์ชันดึงรายการสินค้าและหมวดหมู่ (Master Data) จาก Google Sheet
async function fetchMasterData(url) {
    if (!url) return { ok: false, message: 'ยังไม่ได้ตั้งค่า Web App URL', categories: [], items: [] };

    try {
        const res = await fetch(url, { method: 'GET' });
        const data = await res.json();

        if (data.status === 'success') {
            return {
                ok: true,
                categories: data.categories || [],
                items: data.items || []
            };
        } else {
            return { ok: false, message: data.message || 'ดึงข้อมูลไม่สำเร็จ', categories: [], items: [] };
        }
    } catch (err) {
        return { 
            ok: false, 
            message: 'เชื่อมต่อดึงข้อมูลไม่สำเร็จ: ' + err.message, 
            categories: [], 
            items: [] 
        };
    }
}

// 2. ฟังก์ชันส่งข้อมูลไปยัง Google Sheet (บันทึกยอดขาย / ตัดสต็อก / ทดสอบการเชื่อมต่อ)
async function callSheetWebApp(url, action, payload = {}) {
    if (!url) return { ok: false, message: 'ยังไม่ได้ตั้งค่า Web App URL' };

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action, ...payload })
        });
        const data = await res.json();
        return { ok: data.status === 'success' || data.status === 'ok', message: data.message || '' };
    } catch (err) {
        return { ok: false, message: 'เชื่อมต่อไม่สำเร็จ (เช็ค URL หรือการตั้งค่า Deploy ของ Apps Script): ' + err.message };
    }
}

// 📌 ประกาศเป็นตัวแปร Global ให้ไฟล์อื่น (เช่น settings.js, payment.js) เรียกใช้ได้ทันที
window.fetchMasterData = fetchMasterData;
window.callSheetWebApp = callSheetWebApp;