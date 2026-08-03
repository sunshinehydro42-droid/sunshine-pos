// state.js — ตัวแปรกลางที่ทุกโมดูล import ไปใช้ร่วมกัน
export const state = {
    cart: [],
    products: JSON.parse(localStorage.getItem('pos_products')) || [],
    categories: JSON.parse(localStorage.getItem('pos_categories')) || [],
    optionGroups: JSON.parse(localStorage.getItem('pos_option_groups')) || [],   // ชุดตัวเลือกเพิ่มเติม ผูกกับหมวดหมู่ (product-manage.js เขียน / cart.js อ่าน)
    currentShift: JSON.parse(localStorage.getItem('pos_shift')) || null,

    savedTables: JSON.parse(localStorage.getItem('pos_tables')) || [],          // ออเดอร์พักบิล (order.js)
    historyBills: JSON.parse(localStorage.getItem('pos_history')) || [],        // ประวัติบิล (payment.js เขียน / history.js, report.js อ่าน)
    shiftHistory: JSON.parse(localStorage.getItem('pos_shift_history')) || [],  // ประวัติกะ (shift.js)
    isDarkMode: localStorage.getItem('pos_dark') === 'true',                    // ธีม (ui.js)

    activeEditingTableId: null   // ใช้ร่วมกันระหว่าง cart.js กับ order.js ตอนดึงโต๊ะเก่ามาแก้
};

// ฟังก์ชันสำหรับเซฟข้อมูลลงเครื่อง
export function saveState(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}
