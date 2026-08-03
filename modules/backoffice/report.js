// report.js — รายงานยอดขาย (วันนี้ / 7 วัน / 30 วัน / กำหนดเอง)
import { state } from '../../state.js';

let currentReportPeriod = 'day';

export function initReport() {
    document.querySelectorAll('.report-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchReportPeriod(btn.dataset.period));
    });
    document.getElementById('customStartDate').addEventListener('change', renderReport);
    document.getElementById('customEndDate').addEventListener('change', renderReport);

    renderReport();
}

function switchReportPeriod(period) {
    currentReportPeriod = period;

    document.querySelectorAll('.report-tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.period === period);
    });

    document.getElementById('customRangePanel').style.display = (period === 'custom') ? 'block' : 'none';
    renderReport();
}

function renderReport() {
    const todayStr = new Date().toISOString().split('T')[0];
    let filteredBills = [];
    let periodLabel = 'ยอดขายวันนี้';

    if (currentReportPeriod === 'day') {
        periodLabel = 'ยอดขายประจำวัน (' + todayStr + ')';
        filteredBills = state.historyBills.filter(b => b.date === todayStr);

    } else if (currentReportPeriod === '7day') {
        periodLabel = 'ยอดขายย้อนหลัง 7 วัน';
        const d = new Date(); d.setDate(d.getDate() - 7);
        filteredBills = state.historyBills.filter(b => new Date(b.date) >= d);

    } else if (currentReportPeriod === '30day') {
        periodLabel = 'ยอดขายย้อนหลัง 30 วัน';
        const d = new Date(); d.setDate(d.getDate() - 30);
        filteredBills = state.historyBills.filter(b => new Date(b.date) >= d);

    } else if (currentReportPeriod === 'custom') {
        const start = document.getElementById('customStartDate').value;
        const end = document.getElementById('customEndDate').value;
        periodLabel = `ยอดขายช่วง ${start || '...'} ถึง ${end || '...'}`;
        filteredBills = state.historyBills.filter(b => {
            if (start && b.date < start) return false;
            if (end && b.date > end) return false;
            return true;
        });
    }

    document.getElementById('reportPeriodLabel').innerText = periodLabel;

    let totalRevenue = 0;
    let totalItemCount = 0;
    const itemStats = {};

    filteredBills.forEach(b => {
        totalRevenue += b.total;
        b.items.forEach(i => {
            totalItemCount += i.qty;
            const key = i.name + (i.option && i.option !== 'ปกติ' ? ` (${i.option})` : '');
            if (!itemStats[key]) itemStats[key] = { qty: 0, revenue: 0 };
            itemStats[key].qty += i.qty;
            itemStats[key].revenue += i.price * i.qty;
        });
    });

    document.getElementById('reportTotalRevenue').innerText = totalRevenue + ' ฿';
    document.getElementById('reportBillCount').innerText = filteredBills.length;
    document.getElementById('reportItemCount').innerText = totalItemCount;

    const sortedItems = Object.keys(itemStats)
        .map(k => ({ name: k, qty: itemStats[k].qty, revenue: itemStats[k].revenue }))
        .sort((a, b) => b.qty - a.qty);

    const tbody = document.getElementById('reportBestSellerBody');

    if (sortedItems.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; color:var(--text-muted); padding:20px;">ไม่มีข้อมูลการขายในช่วงเวลานี้</td></tr>`;
        return;
    }

    tbody.innerHTML = sortedItems.map((item, index) => {
        const rankClass = index === 0 ? 'top1' : index === 1 ? 'top2' : index === 2 ? 'top3' : '';
        return `
            <tr>
                <td><span class="report-rank ${rankClass}">${index + 1}</span>${item.name}</td>
                <td class="num">${item.qty}</td>
                <td class="num">${item.revenue} ฿</td>
            </tr>
        `;
    }).join('');
}
