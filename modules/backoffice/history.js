// history.js — ประวัติบิล (จัดกลุ่มตามวัน เปิด/ปิดได้)
import { state } from '../../state.js';

export function initHistory() {
    document.getElementById('historyContainer').addEventListener('click', onHistoryClick);
    renderHistory();
}

function onHistoryClick(e) {
    const dayHeader = e.target.closest('.history-day-header');
    if (dayHeader) { dayHeader.parentElement.classList.toggle('open'); return; }

    const billSummary = e.target.closest('.history-bill-summary');
    if (billSummary) { billSummary.parentElement.classList.toggle('open'); }
}

function renderHistory() {
    const container = document.getElementById('historyContainer');

    if (state.historyBills.length === 0) {
        container.innerHTML = `<div class="history-empty">ยังไม่มีประวัติการชำระเงิน</div>`;
        return;
    }

    const groups = {};
    state.historyBills.forEach(b => {
        if (!groups[b.date]) groups[b.date] = [];
        groups[b.date].push(b);
    });

    let html = '';
    for (const date in groups) {
        const bills = groups[date];
        const totalRev = bills.reduce((sum, b) => sum + b.total, 0);

        html += `
            <div class="history-day-group open">
                <div class="history-day-header">
                    <div class="history-day-title"><span class="history-day-chevron">▶</span> 📅 วันที่ ${date}</div>
                    <div class="history-day-meta"><span>จำนวน ${bills.length} บิล</span><span>รวม ${totalRev} ฿</span></div>
                </div>
                <div class="history-day-body">
                    ${bills.map(b => renderBillRow(b)).join('')}
                </div>
            </div>
        `;
    }

    container.innerHTML = html;
}

function renderBillRow(b) {
    const methodBadge = b.method === 'cash'
        ? '<span class="badge-method badge-cash">เงินสด</span>'
        : '<span class="badge-method badge-qr">QR</span>';

    const itemsDetailHtml = b.items.map(i => `
        <div class="history-item-line">
            <span>${i.name} ${i.option && i.option !== 'ปกติ' ? `(${i.option})` : ''} x${i.qty}</span>
            <span>${i.price * i.qty} ฿</span>
        </div>
    `).join('');

    return `
        <div class="history-bill-row">
            <div class="history-bill-summary">
                <span class="bs-billno">${b.billNo}</span>
                <span class="bs-name"><b>${b.tableName}</b> ${methodBadge}</span>
                <span class="bs-time">${b.time}</span>
                <span class="bs-total">${b.total} ฿</span>
                <span class="bill-expand-icon">▼</span>
            </div>
            <div class="history-bill-detail">
                <div class="history-detail-meta">ยอดรวมสินค้า: ${b.subtotal} ฿ | ส่วนลด: ${b.discount} ฿</div>
                ${itemsDetailHtml}
            </div>
        </div>
    `;
}
