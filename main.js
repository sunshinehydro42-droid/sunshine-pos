// main.js
import { initPOS } from './modules/pos/pos.js';
import { initBackoffice } from './modules/backoffice/backoffice.js';
import { initShift } from './modules/shift/shift.js';
import { initSettings } from './modules/settings/settings.js';
import { openSavedTablesModal, updateSavedTablesBadge } from './modules/pos/order.js';
import { initTheme, toggleTheme } from './ui.js';
import { state } from './state.js';

const appContent = document.getElementById('app-content');
const moduleCss = document.getElementById('module-css');
// เลือกเฉพาะปุ่มที่มี data-page (สลับหน้าเต็ม) แยกจากปุ่ม "พักออเดอร์" ที่เป็นทางลัดเปิด modal เฉยๆ
const navButtons = document.querySelectorAll('.nav-btn[data-page]');

// ฟังก์ชันโหลดหน้าจอ (Router)
async function loadPage(pageName) {
    // ยังไม่ได้เปิดกะ -> เข้า "หน้าร้าน" ไม่ได้เท่านั้น (หลังบ้าน/ตั้งค่า/ระบบกะ เข้าได้ตามปกติ)
    // กันเหนียวไว้เผื่อมีอะไรพยายามเรียกหน้าร้านตรงๆ ทั้งที่ปุ่มถูกล็อกอยู่
    if (pageName === 'pos' && !state.currentShift) {
        pageName = 'shift';
    }

    try {
        // 1. ดึงไฟล์ HTML มาแปะ
        const response = await fetch(`./modules/${pageName}/${pageName}.html`);
        appContent.innerHTML = await response.text();

        // 2. ดึงไฟล์ CSS ของหน้านั้นมาใช้
        moduleCss.href = `./modules/${pageName}/${pageName}.css`;

        // 3. อัปเดตปุ่มเมนูให้เป็นสถานะ Active
        navButtons.forEach(btn => btn.classList.remove('active'));
        document.querySelector(`.nav-btn[data-page="${pageName}"]`).classList.add('active');

        // 4. สั่งรันฟังก์ชัน JS ของหน้านั้นๆ
        if (pageName === 'pos') initPOS();
        if (pageName === 'backoffice') initBackoffice();
        if (pageName === 'shift') initShift();
        if (pageName === 'settings') initSettings();

        // 5. เช็คสถานะล็อกเมนูซ้ำทุกครั้งที่โหลดหน้า (กันเหนียวไม่ให้ค้างล็อกถ้า event พลาด)
        syncNavLockState();

    } catch (error) {
        console.error("Error loading module:", error);
        appContent.innerHTML = `<h2>ไม่พบหน้าจอ ${pageName}</h2>`;
    }
}

// ตรวจจับการกดเมนู
navButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        const page = e.currentTarget.getAttribute('data-page');
        loadPage(page);
    });
});

// ---------- ล็อกอินการเข้าถึง "หน้าร้าน" ไว้กับสถานะกะ ----------
// ก่อนเปิดกะ: ล็อกเฉพาะปุ่ม "หน้าร้าน" กับปุ่มลัด "พักออเดอร์" (เป็นส่วนหนึ่งของขั้นตอนขาย ใช้ cart/payment ร่วมกัน)
// เมนูอื่น (หลังบ้าน, ตั้งค่า) ใช้งานได้ตามปกติแม้ยังไม่เปิดกะ
function lockAppNav() {
    const posBtn = document.querySelector('.nav-btn[data-page="pos"]');
    if (posBtn) posBtn.disabled = true;

    const savedTablesBtn = document.getElementById('sidebarSavedTablesBtn');
    if (savedTablesBtn) savedTablesBtn.disabled = true;
}

function unlockAppNav() {
    const posBtn = document.querySelector('.nav-btn[data-page="pos"]');
    if (posBtn) posBtn.disabled = false;

    const savedTablesBtn = document.getElementById('sidebarSavedTablesBtn');
    if (savedTablesBtn) savedTablesBtn.disabled = false;
}

// คำนวณสถานะล็อกใหม่จาก state.currentShift จริงเสมอ (เรียกซ้ำได้ไม่มีปัญหา)
// กันไว้เผื่อ event 'shift:opened'/'shift:closed' พลาดยิงไม่ถึง จะได้ไม่ค้างล็อกถาวร
function syncNavLockState() {
    if (state.currentShift) unlockAppNav();
    else lockAppNav();
}

// shift.js จะยิง event สองตัวนี้ตอนเปิดกะสำเร็จ/ปิดกะสำเร็จ (ดูฟังก์ชัน startShift / confirmCloseShift)
// หมายเหตุ: ต่อให้ event นี้พลาดไม่ยิง loadPage() ก็จะ sync สถานะล็อกให้เองอยู่ดี (ดู syncNavLockState)
window.addEventListener('shift:opened', async () => {
    await loadPage('pos'); // เปิดกะสำเร็จ -> พาเข้าหน้าร้านทันที (loadPage จะปลดล็อกเมนูให้เองผ่าน syncNavLockState)
});

window.addEventListener('shift:closed', async () => {
    await loadPage('shift'); // ปิดกะแล้ว -> กลับมาหน้าระบบกะ (loadPage จะล็อกเมนูให้เองผ่าน syncNavLockState)
});

// ปุ่ม "ออเดอร์ที่พักไว้" ใน sidebar — ไม่ใช่การสลับหน้าแบบ nav-btn ทั่วไป
// ถ้ายังไม่ได้อยู่หน้าร้าน จะพาไปหน้าร้านก่อน แล้วค่อยเปิด modal ทันที
document.getElementById('sidebarSavedTablesBtn').addEventListener('click', async () => {
    const posBtn = document.querySelector('.nav-btn[data-page="pos"]');
    if (!posBtn.classList.contains('active')) {
        await loadPage('pos');
    }
    openSavedTablesModal();
});

// ปุ่มสลับธีมสว่าง/มืด — ไม่เกี่ยวกับการสลับหน้า ใช้ได้ทุกหน้าเพราะอยู่ใน sidebar ตลอด
document.getElementById('themeToggleBtn').addEventListener('click', toggleTheme);

// เปิดหน้าแรกเริ่มต้น
window.onload = () => {
    initTheme(); // คงธีมที่เคยเลือกไว้จากครั้งก่อน
    syncNavLockState(); // ล็อกเมนูทันทีถ้ายังไม่ได้เปิดกะ (กันปุ่มเด้งเปิดแวบเดียวระหว่างรอโหลดหน้า)
    loadPage(state.currentShift ? 'pos' : 'shift');
    updateSavedTablesBadge(); // แสดงจำนวนออเดอร์ที่พักไว้บน sidebar ตั้งแต่เปิดแอป
};