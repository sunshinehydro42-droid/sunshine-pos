// settings.js — หน้าตั้งค่าระบบ (เดิมคือแท็บ "ตั้งค่า" ในหลังบ้าน แยกออกมาเป็นหน้าของตัวเองใน sidebar)
// รวม Master DB + Sales DB เป็น Google Sheet ไฟล์เดียว + Apps Script ตัวเดียว (URL เดียว):
//   - doGet ให้หน้าขายดึงหมวดหมู่/สินค้า (fetchMasterData)
//   - doPost ให้ payment.js บันทึกยอดขาย (callSheetWebApp action:'addSale')
// เก็บ URL ไว้ที่ key เดียว: pos_sheet_url
//
// หมายเหตุ: callSheetWebApp / fetchMasterData ตอนนี้โหลดผ่าน <script> แบบ classic ใน index.html
// แล้วประกาศเป็น window.callSheetWebApp / window.fetchMasterData ให้ทุกไฟล์เรียกใช้ร่วมกัน
// (ไม่ใช้ import จาก sheet-sync.js อีกต่อไป กันปัญหา path/case-sensitive ที่เคยพังตอน deploy)
import { syncMasterData } from '../pos/product.js';
import { flushPendingSales } from '../pos/payment.js';

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

    const result = await window.callSheetWebApp(url, 'ping');

    btn.disabled = false;
    btn.innerText = originalLabel;

    if (result.ok) {
        alert('✅ เชื่อมต่อสำเร็จ: ' + result.message);
    } else {
        alert('❌ เชื่อมต่อไม่สำเร็จ\n\n' + result.message);
    }
}

// ปุ่มนี้ตอนนี้ทำ 2 อย่างพร้อมกันในคลิกเดียว:
//   1) ขาเข้า: ดึงเมนู/หมวดหมู่/สต็อกล่าสุดจาก Google Sheet เข้ามาอัปเดตแคชในเครื่อง (syncMasterData)
//   2) ขาออก: ส่งบิลที่คิดเงินตอนไม่มีเน็ต/ส่งไม่สำเร็จ ที่ค้างอยู่ในคิว กลับไปบันทึกที่ Google Sheet (flushPendingSales)
// ก่อนหน้านี้ flushPendingSales ถูกเขียนไว้เฉยๆ ไม่มีใครเรียกใช้ บิลที่ค้างคิวเลยไม่เคยถูกส่งซ้ำเลย
async function runMasterSync() {
    const btn = document.getElementById('syncMasterBtn');
    const originalLabel = btn.innerText;
    btn.disabled = true;
    btn.innerText = '🔄 กำลังซิงค์...';

    const masterResult = await syncMasterData();
    const salesResult = await flushPendingSales();

    btn.disabled = false;
    btn.innerText = originalLabel;

    const messages = [];
    messages.push((masterResult.ok ? '✅ ' : '❌ ') + masterResult.message);
    messages.push((salesResult.ok ? '✅ ' : '⚠️ ') + salesResult.message);

    alert(messages.join('\n'));
}