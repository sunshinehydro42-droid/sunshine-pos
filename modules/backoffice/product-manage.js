// product-manage.js — จัดการสินค้า/หมวดหมู่ (เพิ่ม/ลบ) ฝั่งหลังบ้าน
// ใช้ prompt()/confirm() ของเบราว์เซอร์เหมือนต้นฉบับ (functions.js) เพื่อความเร็ว/โค้ดน้อย
// ถ้าอยากได้เป็นฟอร์ม modal ในธีมเดียวกับที่อื่น (แบบ shift.js) บอกได้ จะอัปเกรดให้
import { state, saveState } from '../../state.js';

export function initProductManage() {
    document.getElementById('addCategoryBtn').addEventListener('click', promptAddCategory);
    document.getElementById('addProductBtn').addEventListener('click', promptAddProduct);
    document.getElementById('manageCategoryList').addEventListener('click', onCategoryListClick);
    document.getElementById('manageProductList').addEventListener('click', onProductListClick);

    document.getElementById('optionGroupList').addEventListener('click', onOptionGroupListClick);

    renderManageCategories();
    renderOptionGroups();
    renderManageProducts();
}

// ---------- หมวดหมู่ ----------
function promptAddCategory() {
    const catName = prompt('กรอกชื่อหมวดหมู่ใหม่:');
    if (!catName || catName.trim() === '') return;
    if (state.categories.includes(catName.trim())) { alert('มีหมวดหมู่นี้อยู่แล้ว'); return; }

    state.categories.push(catName.trim());
    saveState('pos_categories', state.categories);
    renderManageCategories();
}

function onCategoryListClick(e) {
    const btn = e.target.closest('button[data-del-category]');
    if (!btn) return;
    deleteCategory(btn.dataset.delCategory);
}

function deleteCategory(catName) {
    if (!confirm(`ต้องการลบหมวดหมู่ "${catName}" ใช่หรือไม่? (ชุดตัวเลือกที่ผูกกับหมวดหมู่นี้จะถูกลบไปด้วย)`)) return;

    state.categories = state.categories.filter(c => c !== catName);
    saveState('pos_categories', state.categories);

    state.optionGroups = state.optionGroups.filter(g => g.category !== catName);
    saveState('pos_option_groups', state.optionGroups);

    renderManageCategories();
    renderOptionGroups();
    renderManageProducts();
}

// ---------- ชุดตัวเลือกเพิ่มเติม (ผูกกับหมวดหมู่ ไม่ใช่ต่อสินค้า และไม่ขึ้นเป็นไอเทมในหน้าร้าน) ----------
function onOptionGroupListClick(e) {
    const delBtn = e.target.closest('button[data-del-option-group]');
    if (delBtn) { deleteOptionGroup(Number(delBtn.dataset.delOptionGroup)); return; }

    const addBtn = e.target.closest('button[data-add-option-for]');
    if (addBtn) { promptAddOptionGroupForCategory(addBtn.dataset.addOptionFor); return; }
}

// เรียกจากปุ่มในบล็อกของหมวดหมู่นั้นๆ โดยตรง (ไม่ต้องพิมพ์ชื่อหมวดหมู่เอง กันพิมพ์ผิด/หมวดหมู่ไม่ตรง)
function promptAddOptionGroupForCategory(category) {
    const existing = state.optionGroups.find(g => g.category === category);
    if (existing) {
        const replace = confirm(`หมวดหมู่ "${category}" มีชุดตัวเลือก "${existing.name}" ผูกอยู่แล้ว ต้องการแทนที่ด้วยชุดใหม่หรือไม่?`);
        if (!replace) return;
    }

    const groupName = prompt(`ชื่อชุดตัวเลือกสำหรับหมวดหมู่ "${category}" (เช่น ระดับความหวาน):`);
    if (!groupName || groupName.trim() === '') return;

    const choicesStr = prompt('รายการตัวเลือก คั่นด้วย , และใส่ราคาเพิ่มด้วย : (เช่น หวานน้อย:0, หวานปกติ:0, หวานมาก:0)');
    if (!choicesStr) return;

    const choices = choicesStr.split(',').map(part => {
        const [label, extraStr] = part.split(':');
        return { label: (label || '').trim(), extra: parseFloat(extraStr) || 0 };
    }).filter(c => c.label !== '');

    if (choices.length === 0) { alert('กรุณาใส่ตัวเลือกอย่างน้อย 1 รายการ'); return; }

    state.optionGroups = state.optionGroups.filter(g => g.category !== category);
    state.optionGroups.push({
        id: Date.now(),
        name: groupName.trim(),
        category,
        choices
    });

    saveState('pos_option_groups', state.optionGroups);
    renderOptionGroups();
    renderManageProducts(); // อัปเดตคอลัมน์ "มีตัวเลือก" ในตารางสินค้าด้วย
}

function deleteOptionGroup(id) {
    if (!confirm('ต้องการลบชุดตัวเลือกนี้ใช่หรือไม่?')) return;
    state.optionGroups = state.optionGroups.filter(g => g.id !== id);
    saveState('pos_option_groups', state.optionGroups);
    renderOptionGroups();
    renderManageProducts();
}

// ---------- สินค้า ----------
function promptAddProduct() {
    const name = prompt('ชื่อเมนูสินค้า:');
    if (!name) return;

    const priceStr = prompt('ราคาขาย (บาท):', '40');
    const price = parseFloat(priceStr) || 0;

    const catListStr = state.categories.join(', ');
    const cat = prompt(`เลือกหมวดหมู่ (${catListStr}):`, state.categories[0] || 'ทั่วไป');
    if (!cat) return;

    const newProduct = {
        id: Date.now(),
        name: name.trim(),
        price,
        category: cat.trim()
    };

    if (!state.categories.includes(cat.trim())) {
        state.categories.push(cat.trim());
        saveState('pos_categories', state.categories);
    }

    state.products.push(newProduct);
    saveState('pos_products', state.products);
    renderManageCategories();
    renderManageProducts();
}

function onProductListClick(e) {
    const btn = e.target.closest('button[data-del-product]');
    if (!btn) return;
    deleteProduct(Number(btn.dataset.delProduct));
}

function deleteProduct(id) {
    if (!confirm('ต้องการลบสินค้านี้ออกจากระบบใช่หรือไม่?')) return;
    state.products = state.products.filter(p => p.id !== id);
    saveState('pos_products', state.products);
    renderManageProducts();
}

// ---------- เรนเดอร์ ----------
function renderManageCategories() {
    const container = document.getElementById('manageCategoryList');

    if (state.categories.length === 0) {
        container.innerHTML = `<p style="color:var(--text-muted);">ยังไม่มีหมวดหมู่ — กด "+ เพิ่มหมวดหมู่" ด้านบน</p>`;
        return;
    }

    container.innerHTML = state.categories.map(cat => `
        <div class="bo-category-chip">
            <span>${cat}</span>
            <button data-del-category="${cat}" title="ลบหมวดหมู่">×</button>
        </div>
    `).join('');
}

function renderOptionGroups() {
    const container = document.getElementById('optionGroupList');

    if (state.categories.length === 0) {
        container.innerHTML = `<p style="color:var(--text-muted);">ยังไม่มีหมวดหมู่ — เพิ่มหมวดหมู่ก่อนถึงจะสร้างชุดตัวเลือกได้</p>`;
        return;
    }

    // เรียงตามลำดับหมวดหมู่จริง (ตัวเดียวกับที่ใช้แสดงทั่วระบบ) ไม่ใช่ลำดับที่สร้างชุดตัวเลือก
    // แบ่งเป็นบล็อกต่อหมวดหมู่ชัดเจน หมวดหมู่ไหนยังไม่มีชุดตัวเลือกก็ยังโชว์ให้เห็นพร้อมปุ่มเพิ่มในตัว
    container.innerHTML = state.categories.map(cat => {
        const group = state.optionGroups.find(g => g.category === cat);

        return `
            <div class="bo-option-cat-block">
                <div class="bo-option-cat-head">
                    <span class="bo-option-cat-name">${cat}</span>
                    <button class="bo-btn bo-btn-secondary bo-btn-sm" data-add-option-for="${cat}">
                        ${group ? '↻ แทนที่ชุดตัวเลือก' : '+ เพิ่มชุดตัวเลือก'}
                    </button>
                </div>

                ${group ? `
                    <div class="bo-option-group-card">
                        <div class="bo-option-group-head">
                            <b>${group.name}</b>
                            <button class="bo-del-btn" data-del-option-group="${group.id}">ลบ</button>
                        </div>
                        <div class="bo-option-group-choices">
                            ${group.choices.map(c => `<span class="bo-option-chip">${c.label} (+${c.extra} ฿)</span>`).join('')}
                        </div>
                    </div>
                ` : `
                    <div class="bo-option-empty">ยังไม่มีชุดตัวเลือกสำหรับหมวดหมู่นี้</div>
                `}
            </div>
        `;
    }).join('');
}

function renderManageProducts() {
    const tbody = document.getElementById('manageProductList');

    if (state.products.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--text-muted); padding:20px;">ยังไม่มีสินค้า — กด "+ เพิ่มสินค้า" ด้านบน</td></tr>`;
        return;
    }

    tbody.innerHTML = state.products.map(p => {
        const hasGroup = state.optionGroups.some(g => g.category === p.category);
        return `
        <tr>
            <td>${p.name}</td>
            <td>${p.category}</td>
            <td class="num">${p.price} ฿</td>
            <td style="text-align:center;">${hasGroup ? '✔' : '—'}</td>
            <td style="text-align:center;"><button class="bo-del-btn" data-del-product="${p.id}">ลบ</button></td>
        </tr>
    `;
    }).join('');
}
