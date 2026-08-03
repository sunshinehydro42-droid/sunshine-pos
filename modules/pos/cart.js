// cart.js — ตะกร้าสินค้า: เพิ่ม/ลบ/แก้จำนวน + การเลือกตัวเลือกสินค้า
import { state } from '../../state.js';
import { openModal, closeModal } from '../../ui.js';

let selectedProductForOption = null; // ตัวแปรชั่วคราว ใช้แค่ในไฟล์นี้ระหว่างเลือกตัวเลือกสินค้า

export function initCart() {
    document.getElementById('clearCartBtn').addEventListener('click', clearCart);
    document.getElementById('cartItems').addEventListener('click', onCartItemsClick);
    document.getElementById('discountInput').addEventListener('input', renderCart);

    document.querySelector('#optionModal .option-grid').addEventListener('click', onOptionPick);
    document.getElementById('cancelOptionBtn').addEventListener('click', closeOptionModal);

    renderCart();
}

// เรียกจาก product.js ตอนคลิกสินค้าในกริด
export function handleProductClick(id) {
    const p = state.products.find(item => item.id === id);
    if (!p) return;

    // เช็คว่าหมวดหมู่ของสินค้านี้มีชุดตัวเลือกผูกอยู่ไหม (ตั้งค่าไว้ที่หลังบ้าน > จัดการสินค้า)
    const group = state.optionGroups.find(g => g.category === p.category);

    if (group) {
        selectedProductForOption = p;
        document.getElementById('optionModalTitle').innerText = p.name;
        renderOptionGrid(group);
        openModal('optionModal');
    } else {
        addToCart(p.name, p.price, 'ปกติ', 0, p.category);
    }
}

// สร้างปุ่มตัวเลือกใน modal ตามชุดตัวเลือกที่ผูกกับหมวดหมู่ของสินค้านั้นๆ (ไม่ใช้ปุ่มตายตัวแบบเดิมแล้ว)
function renderOptionGrid(group) {
    const grid = document.querySelector('#optionModal .option-grid');
    grid.innerHTML = group.choices.map(c => `
        <button class="option-btn" data-option="${c.label}" data-extra="${c.extra}">
            <span>${c.label}</span><span class="option-price-tag">+${c.extra} ฿</span>
        </button>
    `).join('');
}

function onOptionPick(e) {
    const btn = e.target.closest('.option-btn');
    if (!btn) return;
    addOptionToCart(btn.dataset.option, parseFloat(btn.dataset.extra) || 0);
}

function addOptionToCart(optionName, extraPrice) {
    if (!selectedProductForOption) return;
    const p = selectedProductForOption;
    addToCart(p.name, p.price + extraPrice, optionName, extraPrice, p.category);
    closeOptionModal();
}

function closeOptionModal() {
    closeModal('optionModal');
    selectedProductForOption = null;
}

function addToCart(name, price, option, extra, category) {
    const existing = state.cart.find(item => item.name === name && item.option === option);
    if (existing) existing.qty += 1;
    else state.cart.push({ name, price, option, qty: 1, category: category || '' });
    renderCart();
}

function onCartItemsClick(e) {
    const btn = e.target.closest('.qty-btn');
    if (!btn) return;
    updateQty(Number(btn.dataset.index), Number(btn.dataset.change));
}

function updateQty(index, change) {
    state.cart[index].qty += change;
    if (state.cart[index].qty <= 0) state.cart.splice(index, 1);
    renderCart();
}

export function clearCart() {
    state.cart = [];
    state.activeEditingTableId = null;
    const discountInput = document.getElementById('discountInput');
    if (discountInput) discountInput.value = 0;
    renderCart();
}

export function renderCart() {
    const container = document.getElementById('cartItems');
    let html = '';
    let subtotal = 0;

    state.cart.forEach((item, index) => {
        const itemTotal = item.price * item.qty;
        subtotal += itemTotal;
        html += `
            <div class="cart-item">
                <div class="item-info">
                    <div class="item-name">
                        <span>${item.name}</span>
                        ${item.option && item.option !== 'ปกติ' ? `<span class="item-option">(${item.option})</span>` : ''}
                    </div>
                    <div class="item-price">${item.price} ฿ × ${item.qty} = ${itemTotal} ฿</div>
                </div>
                <div class="qty-controls">
                    <button class="qty-btn" data-index="${index}" data-change="-1">-</button>
                    <span>${item.qty}</span>
                    <button class="qty-btn" data-index="${index}" data-change="1">+</button>
                </div>
            </div>
        `;
    });

    container.innerHTML = html || `<div style="text-align:center; color:var(--text-muted); margin-top:30px;">ยังไม่มีสินค้าในตะกร้า</div>`;

    const discountInput = document.getElementById('discountInput');
    const discount = discountInput ? (parseFloat(discountInput.value) || 0) : 0;
    const total = Math.max(0, subtotal - discount);

    document.getElementById('subtotalPrice').innerText = subtotal + ' ฿';
    document.getElementById('totalPrice').innerText = total + ' ฿';
    document.getElementById('checkoutBtn').disabled = state.cart.length === 0;
}

// จุดคำนวณยอดตะกร้าจุดเดียว — order.js และ payment.js เรียกใช้ร่วมกัน แทนที่จะคำนวณซ้ำคนละที่
export function getCartTotals() {
    const discountInput = document.getElementById('discountInput');
    const subtotal = state.cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const discount = discountInput ? (parseFloat(discountInput.value) || 0) : 0;
    const total = Math.max(0, subtotal - discount);
    return { subtotal, discount, total };
}
