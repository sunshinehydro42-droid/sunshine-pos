// payment.js — หน้าต่างชำระเงิน (เงินสด / สแกน QR) และการออกบิล
import { state, saveState } from '../../state.js';
import { openModal, closeModal } from '../../ui.js';
import { getCartTotals, clearCart } from './cart.js';
import { callSheetWebApp } from '../settings/sheet-sync.js';

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

    // เงินสด: ต้องกรอกรับเงินมาให้พอก่อนถึงจะกดยืนยันได้ / สแกน QR: ยืนยันได้ทันที
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

    syncBillToSheet(newBill); // ยิงไป Google Sheet เบื้องหลัง (ตัดสต็อก + บันทึกยอดขาย)

    currentPaymentData = null;
    closeModal('paymentModal');
    clearCart();
    alert(`ชำระเงินสำเร็จ! เลขบิล ${billNo}`);
}

// ส่งรายการขายในบิลนี้ไป Google Sheet (บันทึกลง Sales_Log + ตัดสต็อก Master Sheet)
async function syncBillToSheet(bill) {
    // 1. ดึง URL จาก localStorage ให้ตรงกับ Key ที่ใช้ร่วมกันทั้งแอพ
    const url = localStorage.getItem('webAppUrl') || localStorage.getItem('pos_script_url') || state.webAppUrl;
    if (!url) return; // ถ้ายังไม่ได้ตั้งค่า URL ให้ข้ามไป

    // 2. แปลงโครงสร้างสินค้าในตะกร้าให้อยู่ในรูปแบบที่ Apps Script ตัดสต็อกและบันทึกได้
    const cartItems = bill.items.map(item => ({
        id: item.id,
        name: item.name,
        qty: item.qty,
        price: item.price
    }));

    // 3. ยิงข้อมูลไป Google Apps Script
    const result = await callSheetWebApp(url, 'record_sale', {
        orderId: bill.billNo,
        cart: cartItems
    });

    if (!result.ok) {
        console.warn('ส่งข้อมูลบิล ' + bill.billNo + ' ไป Google Sheet ไม่สำเร็จ:', result.message);
    } else {
        console.log('บันทึกลง Sheet และตัดสต็อกสำเร็จสำหรับบิล:', bill.billNo);
    }
}