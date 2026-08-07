// settings.js — หน้าตั้งค่าระบบ (เดิมคือแท็บ "ตั้งค่า" ในหลังบ้าน แยกออกมาเป็นหน้าของตัวเองใน sidebar)
// เชื่อมต่อ Google Sheet 2 ตัวแยกกัน:
//   - Master Database: ให้หน้าขายดึงหมวดหมู่/สินค้า/ตัวเลือกมาสร้างปุ่ม (fetchMasterData)
//   - Sales Database: ให้ payment.js บันทึกยอดขายหลังชำระเงินสำเร็จ (callSheetWebApp action:'addSale')
// ก่อนหน้านี้มีช่องกรอกเดียว (pos_script_url) ทำให้ URL ของสองฐานข้อมูลทับกันเอง
// จึงแยกเป็นคนละ key: pos_master_url และ pos_sales_url
//
// ระบบตอนนี้เป็นแบบ offline-first: หน้าขายจะไม่ยิงไป Master DB อัตโนมัติอีกแล้ว
// ต้องกดปุ่ม "Sync" ด้านล่างเพื่อดึงข้อมูลล่าสุดมาเก็บไว้ในแคช (localStorage) เอง
import { callSheetWebApp } from './sheet-sync.js';
import { syncMasterData } from '../Pos/product.js';

const CONFIGS = [
    {
        storageKey: 'pos_master_url',
        // ค่าเก่าก่อนแยก 2 URL เคยถูกเก็บไว้ที่ pos_script_url — ใช้เป็นค่าเริ่มต้น
        // ให้ช่อง Master ถ้ายังไม่เคยตั้ง pos_master_url มาก่อน (กันต้องกรอกใหม่ทุกคน)
        legacyKey: 'pos_script_url',
        inputId: 'masterScriptUrlInput',
        testBtnId: 'testMasterBtn',
        saveBtnId: 'saveMasterBtn'
    },
    {
        storageKey: 'pos_sales_url',
        legacyKey: null,
        inputId: 'salesScriptUrlInput',
        testBtnId: 'testSalesBtn',
        saveBtnId: 'saveSalesBtn'
    }
];

export function initSettings() {
    CONFIGS.forEach(cfg => {
        const input = document.getElementById(cfg.inputId);
        if (!input) return;

        input.value = localStorage.getItem(cfg.storageKey)
            || (cfg.legacyKey ? (localStorage.getItem(cfg.legacyKey) || '') : '');

        document.getElementById(cfg.saveBtnId)?.addEventListener('click', () => saveUrl(cfg));
        document.getElementById(cfg.testBtnId)?.addEventListener('click', () => testConnection(cfg));
    });

    document.getElementById('syncMasterBtn')?.addEventListener('click', runMasterSync);
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

function saveUrl(cfg) {
    const input = document.getElementById(cfg.inputId);
    const url = input.value.trim();
    localStorage.setItem(cfg.storageKey, url);
    alert('บันทึก URL สำเร็จ!');
}

async function testConnection(cfg) {
    const input = document.getElementById(cfg.inputId);
    const url = input.value.trim();
    if (!url) { alert('กรุณากรอก Web App URL ก่อนทดสอบ'); return; }

    const btn = document.getElementById(cfg.testBtnId);
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
