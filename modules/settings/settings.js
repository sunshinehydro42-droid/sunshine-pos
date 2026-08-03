// settings.js — หน้าตั้งค่าระบบ (เดิมคือแท็บ "ตั้งค่า" ในหลังบ้าน แยกออกมาเป็นหน้าของตัวเองใน sidebar)
// ตอนนี้มีแค่การเชื่อมต่อ Google Sheet (Google Apps Script Web App) — ยิง request จริงแล้ว ไม่ใช่จำลอง
import { callSheetWebApp } from './sheet-sync.js';

export function initSettings() {
    const urlInput = document.getElementById('scriptUrlInput');
    urlInput.value = localStorage.getItem('pos_script_url') || '';

    document.getElementById('saveSheetBtn').addEventListener('click', saveSheetUrl);
    document.getElementById('testSheetBtn').addEventListener('click', testSheetConnection);
}

function saveSheetUrl() {
    const urlInput = document.getElementById('scriptUrlInput');
    const url = urlInput.value.trim();
    localStorage.setItem('pos_script_url', url);
    alert('บันทึก URL สำเร็จ!');
}

async function testSheetConnection() {
    const urlInput = document.getElementById('scriptUrlInput');
    const url = urlInput.value.trim();
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
