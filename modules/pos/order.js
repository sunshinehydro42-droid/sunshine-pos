// order.js — จัดการออเดอร์ และออเดอร์ที่พักไว้ (โต๊ะ)
// หมายเหตุ: เดิมมี switchTab('tables', ...) เพื่อสลับไปหน้าโต๊ะแยก แต่นาวใหม่ไม่มีแท็บนั้นแล้ว
// จึงทำเป็น modal "ออเดอร์ที่พักไว้" อยู่ในหน้า pos นี้เลย แทนการสลับหน้าเต็ม
import { state, saveState } from '../../state.js';
import { openModal, closeModal } from '../../ui.js';
import { getCartTotals, renderCart, clearCart } from './cart.js';
import { openPaymentModal } from './payment.js';

export function initOrder() {
    document.getElementById('checkoutBtn').addEventListener('click', openOrderActionModal);
    document.getElementById('saveTableBtn').addEventListener('click', saveOrderToTable);
    document.getElementById('proceedPaymentBtn').addEventListener('click', proceedToPayment);
    document.getElementById('cancelOrderActionBtn').addEventListener('click', () => closeModal('orderActionModal'));

    document.getElementById('closeSavedTablesBtn').addEventListener('click', () => closeModal('savedTablesModal'));
    document.getElementById('savedTablesContainer').addEventListener('click', onSavedTablesClick);

    updateSavedTablesBadge();
}

function openOrderActionModal() {
    if (state.cart.length === 0) return;
    const { total } = getCartTotals();

    document.getElementById('actionModalItemList').innerHTML = state.cart.map(item => `
        <div class="order-summary-item">
            <span>${item.name} ${item.option && item.option !== 'ปกติ' ? `(${item.option})` : ''} x${item.qty}</span>
            <span>${item.price * item.qty} ฿</span>
        </div>
    `).join('');

    document.getElementById('actionModalTotal').innerText = total;
    document.getElementById('tableNameInput').value = '';
    openModal('orderActionModal');
}

function saveOrderToTable() {
    const tableNameInput = document.getElementById('tableNameInput');
    const tableName = (tableNameInput && tableNameInput.value.trim())
        ? tableNameInput.value.trim()
        : `ออเดอร์ #${state.savedTables.length + 1}`;

    const { subtotal, discount, total } = getCartTotals();

    if (state.activeEditingTableId) {
        // แก้ไขโต๊ะเดิมที่ดึงมา
        const t = state.savedTables.find(item => item.id === state.activeEditingTableId);
        if (t) {
            t.tableName = tableName;
            t.items = [...state.cart];
            t.subtotal = subtotal;
            t.discount = discount;
            t.total = total;
        }
        state.activeEditingTableId = null;
    } else {
        // สร้างออเดอร์พักบิลใหม่
        state.savedTables.push({
            id: Date.now(),
            tableName,
            items: [...state.cart],
            subtotal, discount, total,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
    }

    saveState('pos_tables', state.savedTables);
    closeModal('orderActionModal');
    clearCart();
    updateSavedTablesBadge();
    alert(`บันทึกออเดอร์ "${tableName}" เรียบร้อยแล้ว`);
}

function proceedToPayment() {
    const tableNameInput = document.getElementById('tableNameInput');
    const tableName = tableNameInput ? tableNameInput.value.trim() : '';
    closeModal('orderActionModal');
    openPaymentModal(tableName);
}

// ---------- ออเดอร์ที่พักไว้ (โต๊ะ) ----------
// เรียกจาก main.js (ปุ่มลัดที่ sidebar) เพื่อเปิด modal นี้จากหน้าไหนก็ได้
export function openSavedTablesModal() {
    renderSavedTables();
    openModal('savedTablesModal');
}

function renderSavedTables() {
    const container = document.getElementById('savedTablesContainer');

    if (state.savedTables.length === 0) {
        container.innerHTML = `<div style="text-align:center; color:var(--text-muted); padding:30px 0;">ไม่มีออเดอร์พักบิลในขณะนี้</div>`;
        return;
    }

    container.innerHTML = state.savedTables.map(t => {
        const summaryStr = t.items.map(i => `${i.name} x${i.qty}`).join(', ');
        return `
            <div class="table-card" data-id="${t.id}">
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <div class="table-name">🪑 ${t.tableName}</div>
                    <button class="category-del-btn" data-action="delete" title="ยกเลิกออเดอร์นี้">×</button>
                </div>
                <div class="table-details">
                    เวลา ${t.time} • รวม <b style="color:#28a745;">${t.total} ฿</b><br>
                    <small style="color:var(--text-muted);">${summaryStr}</small>
                </div>
                <div style="display:flex; gap:8px;">
                    <button class="table-btn" style="background:var(--accent);" data-action="resume">แก้ไข/ดึงบิล</button>
                    <button class="table-btn" data-action="pay">ชำระเงิน</button>
                </div>
            </div>
        `;
    }).join('');
}

function onSavedTablesClick(e) {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const card = btn.closest('.table-card');
    const id = Number(card.dataset.id);

    if (btn.dataset.action === 'delete') deleteTable(id);
    if (btn.dataset.action === 'resume') resumeTable(id);
    if (btn.dataset.action === 'pay') payTable(id);
}

function resumeTable(id) {
    const t = state.savedTables.find(item => item.id === id);
    if (!t) return;

    state.cart = [...t.items];
    const discountInput = document.getElementById('discountInput');
    if (discountInput) discountInput.value = t.discount;
    state.activeEditingTableId = t.id;

    state.savedTables = state.savedTables.filter(item => item.id !== id);
    saveState('pos_tables', state.savedTables);

    renderCart();
    updateSavedTablesBadge();
    closeModal('savedTablesModal');
}

function payTable(id) {
    const t = state.savedTables.find(item => item.id === id);
    if (!t) return;

    state.cart = [...t.items];
    const discountInput = document.getElementById('discountInput');
    if (discountInput) discountInput.value = t.discount;

    state.savedTables = state.savedTables.filter(item => item.id !== id);
    saveState('pos_tables', state.savedTables);

    renderCart();
    updateSavedTablesBadge();
    closeModal('savedTablesModal');
    openPaymentModal(t.tableName);
}

function deleteTable(id) {
    if (!confirm('ต้องการยกเลิกออเดอร์นี้ใช่หรือไม่?')) return;
    state.savedTables = state.savedTables.filter(item => item.id !== id);
    saveState('pos_tables', state.savedTables);
    renderSavedTables();
    updateSavedTablesBadge();
}

// export ไว้เพื่อให้ main.js เรียกอัปเดต badge ได้ตั้งแต่ตอนเปิดแอป (ก่อนหน้าร้านจะถูกโหลดด้วยซ้ำ)
export function updateSavedTablesBadge() {
    const badge = document.getElementById('sidebarSavedTablesBadge');
    if (badge) badge.innerText = state.savedTables.length;
}
