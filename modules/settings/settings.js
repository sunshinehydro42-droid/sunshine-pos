// settings.js — หน้าตั้งค่าระบบ (เดิมคือแท็บ "ตั้งค่า" ในหลังบ้าน แยกออกมาเป็นหน้าของตัวเองใน sidebar)
// รวม Master DB + Sales DB เป็น Google Sheet ไฟล์เดียว + Apps Script ตัวเดียว (URL เดียว):
//   - doGet ให้หน้าขายดึงหมวดหมู่/สินค้า (fetchMasterData)
//   - doPost ให้ payment.js บันทึกยอดขาย (callSheetWebApp action:'addSale')
// เก็บ URL ไว้ที่ key เดียว: pos_sheet_url
import { callSheetWebApp } from './sheet-sync.js';
import { syncMasterData } from '../pos/product.js';

export function initSettings() {
    const input = document.getElementById('scriptUrlInput');
    input.value = localStorage.getItem('pos_sheet_url') || '';

    document.getElementById('saveSheetBtn').addEventListener('click', saveSheetUrl);
    document.getElementById('testSheetBtn').addEventListener('click', testSheetConnection);
    document.getElementById('syncMasterBtn')?.addEventListener('click', runMasterSync);
}

function saveSheetUrl() {
    const input = document.getElementById('scriptUrlInput');
    const url = input.value.trim();
    localStorage.setItem('pos_sheet_url', url);
    alert('บันทึก URL สำเร็จ!');
}

async function testSheetConnection() {
    const input = document.getElementById('scriptUrlInput');
    const url = input.value.trim();
    if (!url) { alert('กรุณากรอก Web App URL ก่อนทดสอบ'); return; }

    const btn = document.getElementById('testSheetBtn');
    const originalLabel = btn.innerText;
    btn.disabled = true;
    btn.innerText = '🔌 กำลังทดสอบ...';

    const result = await callSheetWebApp(url, 'ping');

    btn.disabled = false;
    btn.innerText = originalLabel;

    if (result.ok) {
        alert('✅ เชื่อมต่อสำเร็จ: ' + result.message);
    } else {
        alert('❌ เชื่อมต่อไม่สำเร็จ\n\n' + result.message);
    }
}

async function runMasterSync() {
    const btn = document.getElementById('syncMasterBtn');
    const originalLabel = btn.innerText;
    btn.disabled = true;
    btn.innerText = '🔄 กำลังซิงค์...';

    const result = await syncMasterData();

    btn.disabled = false;
    btn.innerText = originalLabel;

    if (result.ok) {
        alert('✅ ' + result.message);
    } else {
        alert('❌ ซิงค์ไม่สำเร็จ\n\n' + result.message);
    }
}
