// payment.js — หน้าต่างชำระเงิน (เงินสด / สแกน QR) และการออกบิล
import { state, saveState } from '../../state.js';
import { openModal, closeModal } from '../../ui.js';
import { getCartTotals, clearCart } from './cart.js';
// เปลี่ยนจาก import { callSheetWebApp } from '../settings/sheet-sync.js' เป็นเรียกผ่าน window global แทน
// (sheet-sync.js ตอนนี้โหลดแบบ classic <script> ใน index.html แล้วประกาศ window.callSheetWebApp ให้ทุกไฟล์เรียกใช้ร่วมกัน)

let currentPaymentData = null;
let paymentMode = 'cash';

export function initPayment() {
    document.getElementById('btnCashMode').addEventListener('click', () => setPaymentMode('cash'));
    document.getElementById('btnQrMode').addEventListener('click', () => setPaymentMode('qr'));
    document.getElementById('cashReceived').addEventListener('input', calculateChange);
    document.getElementById('exactPayBtn')?.addEventListener('click', payExact);
    document.getElementById('cancelPaymentBtn').addEventListener('click', () => closeModal('paymentModal'));
    document.getElementById('confirmPayBtn').addEventListener('click', processPayment);
}

// เรียกจาก order.js (proceedToPayment / payTable)
export function openPaymentModal(tableName) {
    const { subtotal, discount, total } = getCartTotals();
    currentPaymentData = { tableName: tableName || 'ลูกค้าทั่วไป', subtotal, discount, total };

    document.getElementById('modalPayAmount').value = total + ' ฿';
    document.getElementById('paymentBillNo').innerText = `(${currentPaymentData.tableName})`;
    document.getElementById('cashReceived').value = '';
    document.getElementById('changeAmount').innerText = '0';

    setPaymentMode('cash');
    openModal('paymentModal');
}

function setPaymentMode(mode) {
    paymentMode = mode;
    const isCash = mode === 'cash';

    document.getElementById('btnCashMode').classList.toggle('active', isCash);
    document.getElementById('btnQrMode').classList.toggle('active', !isCash);
    document.getElementById('cashInputSection').style.display = isCash ? 'block' : 'none';
    document.getElementById('qrInputSection').style.display = isCash ? 'none' : 'block';

    document.getElementById('confirmPayBtn').disabled = isCash;
    if (isCash) document.getElementById('cashReceived').focus();
}

function calculateChange() {
    if (!currentPaymentData) return;
    const received = parseFloat(document.getElementById('cashReceived').value) || 0;
    const change = received - currentPaymentData.total;
    const confirmBtn = document.getElementById('confirmPayBtn');

    if (change >= 0) {
        document.getElementById('changeAmount').innerText = change;
        confirmBtn.disabled = false;
    } else {
        document.getElementById('changeAmount').innerText = '0';
        confirmBtn.disabled = true;
    }
}

// ปุ่ม "จ่ายพอดี" — ลูกค้าให้เงินมาพอดีเป๊ะ ไม่ต้องพิมพ์จำนวนเงิน ปิดบิลได้ในคลิกเดียว
function payExact() {
    if (!currentPaymentData) return;
    document.getElementById('cashReceived').value = currentPaymentData.total;
    document.getElementById('changeAmount').innerText = '0';
    processPayment();
}

function processPayment() {
    if (!currentPaymentData) return;
    const data = currentPaymentData;
    const now = new Date();
    const billNo = 'B' + Math.floor(100000 + Math.random() * 900000);

    const newBill = {
        billNo,
        tableName: data.tableName,
        items: [...state.cart],
        subtotal: data.subtotal,
        discount: data.discount,
        total: data.total,
        method: paymentMode,
        date: now.toISOString().split('T')[0],
        time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    state.historyBills.unshift(newBill);
    saveState('pos_history', state.historyBills);

    // ส่งข้อมูลไป Google Sheet
    syncBillToSheet(newBill);

    currentPaymentData = null;
    closeModal('paymentModal');
    clearCart();
    alert(`ชำระเงินสำเร็จ! เลขบิล ${billNo}`);
}

// ส่งรายการขายในบิลนี้ไป Google Sheet (ใช้ URL เดียวกับที่หน้าตั้งค่าตั้งไว้ ตอนนี้
// Master DB กับ Sales DB รวมอยู่ในไฟล์เดียว/สคริปต์เดียวแล้ว)
// ส่งไม่สำเร็จ (ไม่มีเน็ต/ยังไม่ตั้งค่า URL/Apps Script error) — เก็บเข้าคิวรอซิงค์
// แทนที่จะปล่อยหายไปเฉยๆ เหมือนก่อนหน้านี้
async function syncBillToSheet(bill) {
    const rows = bill.items.map(item => ({
        date: bill.date,
        category: item.category || '',
        itemName: item.name,
        option: item.option || '',
        qty: Number(item.qty || 1),
        lineTotal: Number(item.price || 0) * Number(item.qty || 1)
    }));

    const url = localStorage.getItem('pos_sheet_url');
    if (!url) {
        console.warn('⚠️ ยังไม่ได้ตั้งค่า Google Sheet URL — เก็บบิลนี้ไว้รอซิงค์ทีหลัง บิลเลขที่:', bill.billNo);
        queuePendingSale(bill.billNo, rows);
        return;
    }

    // ใช้ window.callSheetWebApp() ตัวกลางร่วมกับหน้าตั้งค่า (ไม่ใช้ no-cors) จึงอ่าน
    // ผลลัพธ์จริงจาก Apps Script ได้ — รู้ทันทีว่าบันทึกสำเร็จหรือ error อะไร
    const result = await window.callSheetWebApp(url, 'addSale', { rows });

    if (result.ok) {
        console.log('✅ บันทึกยอดขายลง Google Sheet สำเร็จ บิลเลขที่:', bill.billNo, '-', result.message);
    } else {
        console.warn('⚠️ ส่งบิลไม่สำเร็จ (อาจไม่มีเน็ต) เก็บไว้รอซิงค์ทีหลัง บิลเลขที่:', bill.billNo, '-', result.message);
        queuePendingSale(bill.billNo, rows);
    }
}

function queuePendingSale(billNo, rows) {
    state.pendingSales.push({ billNo, rows });
    saveState('pos_pending_sync', state.pendingSales);
}

// เรียกจากปุ่ม "Sync" ในหน้าตั้งค่า — วนส่งบิลทุกใบที่ค้างอยู่ในคิว
// ใบไหนส่งสำเร็จเอาออกจากคิว ใบไหนยังไม่สำเร็จเก็บไว้รอรอบถัดไปต่อ
export async function flushPendingSales() {
    if (state.pendingSales.length === 0) {
        return { ok: true, message: 'ไม่มีบิลค้างซิงค์' };
    }

    const url = localStorage.getItem('pos_sheet_url');
    if (!url) {
        return { ok: false, message: `ยังไม่ได้ตั้งค่า Google Sheet URL (มีบิลค้างซิงค์ ${state.pendingSales.length} ใบ)` };
    }

    const stillPending = [];
    let successCount = 0;

    for (const item of state.pendingSales) {
        const result = await window.callSheetWebApp(url, 'addSale', { rows: item.rows });
        if (result.ok) {
            successCount++;
        } else {
            stillPending.push(item);
        }
    }

    state.pendingSales = stillPending;
    saveState('pos_pending_sync', state.pendingSales);

    if (stillPending.length === 0) {
        return { ok: true, message: `ซิงค์บิลค้างสำเร็จทั้งหมด ${successCount} ใบ` };
    }
    return { ok: false, message: `ซิงค์บิลค้างสำเร็จ ${successCount} ใบ เหลือค้างอีก ${stillPending.length} ใบ` };
}
