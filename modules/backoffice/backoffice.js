// backoffice.js — ตัวประสานหน้าหลังบ้าน (จัดการสินค้า / ประวัติบิล / รายงานยอดขาย)
// หมายเหตุ: แท็บ "ตั้งค่า" (Google Sheet Sync) ย้ายออกไปเป็นหน้าของตัวเองที่ sidebar แล้ว ดูที่ modules/settings/
// เหมือน pos.js คือไม่มี logic ของตัวเอง มีหน้าที่แค่สลับแท็บภายในหน้า + เรียก init ของแต่ละไฟล์ย่อย
import { initProductManage } from './product-manage.js';
import { initHistory } from './history.js';
import { initReport } from './report.js';

export function initBackoffice() {
    console.log('โหลดหน้าหลังบ้านสำเร็จ!');

    document.querySelectorAll('.backoffice-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchBackofficeTab(btn.dataset.tab));
    });

    initProductManage();
    initHistory();
    initReport();
}

function switchBackofficeTab(tabName) {
    document.querySelectorAll('.backoffice-tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    document.querySelectorAll('.backoffice-panel').forEach(panel => {
        panel.classList.toggle('active', panel.id === 'panel-' + tabName);
    });
}
