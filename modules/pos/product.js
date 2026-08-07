// product.js — แสดง/กรองสินค้าและหมวดหมู่ฝั่งขาย (อ่านอย่างเดียว)
import { state, saveState } from '../../state.js';
import { handleProductClick } from './cart.js';
import { fetchMasterData } from '../setting/sheet-sync.js';

let activeCategory = 'ทั้งหมด';

export async function initProductView() {
    document.getElementById('categoryContainer').addEventListener('click', onCategoryClick);
    document.getElementById('productGrid').addEventListener('click', onProductGridClick);
    document.getElementById('searchInput').addEventListener('input', renderProducts);

    // Render ทันทีจากแคชในเครื่อง (state.products/categories ที่โหลดจาก localStorage
    // ตอน state.js import ครั้งแรก) — ไม่รอเน็ตอีกต่อไป ทำงานได้แม้ออฟไลน์
    renderCategories();
    renderProducts();
}

// เรียกจากปุ่ม "Sync" (หน้าตั้งค่า หรือหน้าขาย) เท่านั้น — ไม่ยิงอัตโนมัติตอนเปิดหน้า
// ดึงข้อมูลล่าสุดจาก Master DB มาอัปเดต state + เซฟลง localStorage (แคช) แล้ว
// re-render หน้าจอถ้าตอนนี้อยู่หน้าขายพอดี (เช็ค DOM ก่อน เผื่อเรียกจากหน้าอื่น)
export async function syncMasterData() {
    const webAppUrl = localStorage.getItem('pos_sheet_url');
    if (!webAppUrl) {
        return { ok: false, message: 'ยังไม่ได้ตั้งค่า Google Sheet URL ในหน้าตั้งค่า' };
    }

    const res = await fetchMasterData(webAppUrl);
    if (!res.ok) {
        return { ok: false, message: res.message };
    }

    if (res.categories.length > 0) {
        state.categories = res.categories.map(c => c.name || c);
        saveState('pos_categories', state.categories);
    }
    if (res.items.length > 0) {
        state.products = res.items;
        saveState('pos_products', state.products);
    }

    if (document.getElementById('productGrid')) {
        renderCategories();
        renderProducts();
    }

    return { ok: true, message: `ซิงค์สำเร็จ: ${state.categories.length} หมวดหมู่, ${state.products.length} สินค้า` };
}

function onCategoryClick(e) {
    const btn = e.target.closest('.category-btn');
    if (!btn) return;
    activeCategory = btn.dataset.category;
    renderCategories();
    renderProducts();
}

function onProductGridClick(e) {
    const card = e.target.closest('.product-card');
    if (!card) return;
    handleProductClick(Number(card.dataset.id));
}

export function renderCategories() {
    const container = document.getElementById('categoryContainer');

    let html = `<button class="category-btn ${activeCategory === 'ทั้งหมด' ? 'active' : ''}" data-category="ทั้งหมด">ทั้งหมด</button>`;
    state.categories.forEach(cat => {
        html += `<button class="category-btn ${cat === activeCategory ? 'active' : ''}" data-category="${cat}">${cat}</button>`;
    });

    container.innerHTML = html;
}

export function renderProducts() {
    const grid = document.getElementById('productGrid');
    const searchInput = document.getElementById('searchInput');
    const keyword = searchInput ? searchInput.value.toLowerCase() : '';

    const filtered = state.products.filter(p => {
        const matchCat = activeCategory === 'ทั้งหมด' || p.category === activeCategory;
        const matchKeyword = p.name.toLowerCase().includes(keyword);
        return matchCat && matchKeyword;
    });

    if (filtered.length === 0) {
        grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; color:var(--text-muted); padding:30px 0;">ไม่พบสินค้าที่ค้นหา</div>`;
        return;
    }

    grid.innerHTML = filtered.map(p => {
        const hasGroup = state.optionGroups ? state.optionGroups.some(g => g.category === p.category) : false;
        return `
        <div class="product-card" data-id="${p.id}">
            ${hasGroup ? '<div class="has-option-badge">มีตัวเลือก</div>' : ''}
            <div class="product-title">${p.name}</div>
            <div class="product-price">${p.price} ฿</div>
        </div>
    `;
    }).join('');
}