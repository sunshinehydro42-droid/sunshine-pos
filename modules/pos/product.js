// product.js — แสดง/กรองสินค้าและหมวดหมู่ฝั่งขาย (อ่านอย่างเดียว)
import { state } from '../../state.js';
import { handleProductClick } from './cart.js';
import { fetchMasterData } from '../setting/sheet-sync.js'; // 1. นำเข้าฟังก์ชันดึงข้อมูลจาก sheet-sync

let activeCategory = 'ทั้งหมด';

export async function initProductView() {
    document.getElementById('categoryContainer').addEventListener('click', onCategoryClick);
    document.getElementById('productGrid').addEventListener('click', onProductGridClick);
    document.getElementById('searchInput').addEventListener('input', renderProducts);

    // 2. ดึง Web App URL ของ Master DB ที่ตั้งค่าไว้ในหน้าตั้งค่า (คนละ key กับ Sales DB)
    const webAppUrl = localStorage.getItem('pos_master_url');

    if (webAppUrl) {
        // โชว์ข้อความกำลังโหลดชั่วคราว
        document.getElementById('productGrid').innerHTML = `<div style="grid-column:1/-1; text-align:center; color:var(--text-muted); padding:30px 0;">กำลังโหลดสินค้าจาก Google Sheet...</div>`;

        // 3. ยิงดึงข้อมูล Master Data จาก Sheet
        const res = await fetchMasterData(webAppUrl);

        if (res.ok) {
            // อัปเดตข้อมูลลง state
            if (res.categories.length > 0) {
                state.categories = res.categories.map(c => c.name || c);
            }
            if (res.items.length > 0) {
                state.products = res.items;
            }
        } else {
            console.warn('ดึงข้อมูลจาก Sheet ไม่สำเร็จ ใช้ข้อมูลเดิมใน state:', res.message);
        }
    } else {
        console.warn('⚠️ ยังไม่ได้ตั้งค่า Master Database URL — ใช้ข้อมูลสินค้า/หมวดหมู่ที่มีอยู่ในเครื่องแทน');
    }

    // 4. Render หน้าจอปกติ
    renderCategories();
    renderProducts();
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