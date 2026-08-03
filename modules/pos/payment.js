// payment.js — หน้าต่างชำระเงิน (เงินสด / สแกน QR) และการออกบิล
import { state, saveState } from '../../state.js';
import { openModal, closeModal } from '../../ui.js';
import { getCartTotals, clearCart } from './cart.js';

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

// ส่งรายการขายในบิลนี้ไป Google Sheet
async function syncBillToSheet(bill) {
    // 1. ดึง URL จากทุก Key ที่เป็นไปได้ เพื่อป้องกันปัญหาดึง URL ไม่เจอ
    const url = localStorage.getItem('webAppUrl') || 
                localStorage.getItem('pos_script_url') || 
                localStorage.getItem('sheet_url') || 
                state.webAppUrl;

    if (!url) {
        console.warn('⚠️ ไม่พบ Web App URL ในระบบ กรุณาใส่ URL ในหน้าตั้งค่า');
        return;
    }

    // 2. แปลงรายการสินค้าให้ตรงกับฟังก์ชัน addSale ใน Apps Script
    const rows = bill.items.map(item => ({
        date: bill.date,
        category: item.category || '',
        itemName: item.name,
        option: item.option || '',
        qty: Number(item.qty || 1),
        lineTotal: Number(item.price || 0) * Number(item.qty || 1)
    }));

    const payload = {
        action: 'addSale',
        rows: rows
    };

    // 3. ยิงไปที่ Google Apps Script
    try {
        await fetch(url, {
            method: 'POST',
            mode: 'no-cors', // ใช้ no-cors เพื่อป้องกันปัญหา CORS บล็อกฝั่งเบราว์เซอร์
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        console.log('✅ บันทึกยอดขายลง Google Sheet เรียบร้อย บิลเลขที่:', bill.billNo);
    } catch (err) {
        console.error('❌ ส่งข้อมูลไป Google Sheet ไม่สำเร็จ:', err);
    }
}