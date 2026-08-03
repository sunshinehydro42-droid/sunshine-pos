// ui.js — ฟังก์ชัน UI กลางที่ใช้ร่วมกันได้ทุกหน้า (เปิด/ปิด modal, สลับธีม)
import { state, saveState } from './state.js';

export function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'flex';
}

export function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'none';
}

export function toggleTheme() {
    state.isDarkMode = !state.isDarkMode;
    document.body.classList.toggle('dark-mode', state.isDarkMode);

    const btn = document.getElementById('themeToggleBtn');
    if (btn) btn.classList.toggle('active', state.isDarkMode);

    saveState('pos_dark', state.isDarkMode);
}

// เรียกครั้งเดียวตอนแอปเริ่มทำงาน (ใน main.js) เพื่อให้ธีมที่เคยเลือกไว้ยังติดอยู่หลังรีเฟรชหน้า
export function initTheme() {
    if (state.isDarkMode) document.body.classList.add('dark-mode');

    const btn = document.getElementById('themeToggleBtn');
    if (btn) btn.classList.toggle('active', state.isDarkMode);
}
