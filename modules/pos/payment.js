// payment.js — หน้าต่างชำระเงิน (เงินสด / สแกน QR) และการออกบิล
import { state, saveState } from '../../state.js';
import { openModal, closeModal } from '../../ui.js';
import { getCartTotals, clearCart } from './cart.js';
import { callSheetWebApp } from '../setting/sheet-sync.js';

let currentPaymentData = null;
let paymentMode = 'cash';

export function initPayment() {
    document.getElementById('btnCashMode').addEventListener('click', () => setPaymentMode('cash'));
    document.getElementById('btnQrMode').addEventListener('click', () => setPaymentMode('qr'));
    document.getElementById('cashReceived').addEventListener('input', calculateChange);
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
async function syncBillToSheet(bill) {
    const url = localStorage.getItem('pos_sheet_url');

    if (!url) {
        console.warn('⚠️ ยังไม่ได้ตั้งค่า Google Sheet URL กรุณาใส่ URL ในหน้าตั้งค่า');
        return;
    }

    // แปลงรายการสินค้าให้ตรงกับ addSaleRows() ใน Sales DB script
    const rows = bill.items.map(item => ({
        date: bill.date,
        category: item.category || '',
        itemName: item.name,
        option: item.option || '',
        qty: Number(item.qty || 1),
        lineTotal: Number(item.price || 0) * Number(item.qty || 1)
    }));

    // ใช้ callSheetWebApp() ตัวกลางร่วมกับหน้าตั้งค่า (ไม่ใช้ no-cors) จึงอ่าน
    // ผลลัพธ์จริงจาก Apps Script ได้ — รู้ทันทีว่าบันทึกสำเร็จหรือ error อะไร
    const result = await callSheetWebApp(url, 'addSale', { rows });

    if (result.ok) {
        console.log('✅ บันทึกยอดขายลง Google Sheet สำเร็จ บิลเลขที่:', bill.billNo, '-', result.message);
    } else {
        console.error('❌ บันทึกยอดขายไม่สำเร็จ บิลเลขที่:', bill.billNo, '-', result.message);
    }
}