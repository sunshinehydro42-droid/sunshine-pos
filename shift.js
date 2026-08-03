// shift.js — ระบบกะการทำงาน (เปิดกะ / ปิดกะ / ประวัติกะ)
// ดึงตัวแปรส่วนกลางมาใช้ (path เดียวกับ pos.js เพราะอยู่ลึกเท่ากันคือ modules/shift/)
import { state, saveState } from '../../state.js';

// คีย์ที่ใช้เก็บลง localStorage
const CURRENT_SHIFT_KEY = 'pos_shift';         // ต้องตรงกับที่ state.js อ่านตอนโหลดแอป
const SHIFT_HISTORY_KEY = 'pos_shift_history';

// ฟังก์ชันนี้จะถูกเรียกจาก main.js ทุกครั้งที่เปิดหน้า "ระบบกะ"
export function initShift() {
    // โหลดประวัติกะจาก localStorage เข้าสู่ state กลาง (โหลดครั้งแรกครั้งเดียวต่อเซสชัน)
    if (!Array.isArray(state.shiftHistory)) {
        state.shiftHistory = JSON.parse(localStorage.getItem(SHIFT_HISTORY_KEY)) || [];
    }

    // ผูก event ของฟอร์ม/ปุ่มที่อยู่คงที่ใน shift.html (ไม่ถูกเรนเดอร์ซ้ำ)
    document.getElementById('cancelCloseShiftBtn').addEventListener('click', closeShiftModal);
    document.getElementById('confirmCloseShiftBtn').addEventListener('click', confirmCloseShift);
    document.getElementById('shiftSalesInput').addEventListener('input', updateClosePreview);
    document.getElementById('closeCashInput').addEventListener('input', updateClosePreview);

    renderShiftStatusCard();
    renderShiftHistory();
}

// ---------------------------------------------------------------------
// 1. การ์ดสถานะกะปัจจุบัน
// ---------------------------------------------------------------------
function renderShiftStatusCard() {
    const card = document.getElementById('shiftStatusCard');

    if (!state.currentShift) {
        // ยังไม่มีกะเปิดอยู่ -> แสดงฟอร์มเริ่มกะ
        card.innerHTML = `
            <div class="shift-status shift-status-closed">
                <div class="shift-status-icon">🌙</div>
                <div class="shift-status-title">ยังไม่ได้เปิดกะ</div>

                <div class="shift-field">
                    <label for="staffNameInput">ชื่อพนักงาน (ไม่บังคับ)</label>
                    <input type="text" id="staffNameInput" placeholder="เช่น สมชาย">
                </div>

                <div class="shift-field">
                    <label for="startCashInput">เงินสดตั้งต้นในลิ้นชัก (บาท)</label>
                    <input type="number" id="startCashInput" min="0" placeholder="0">
                </div>

                <button id="startShiftBtn" class="shift-btn shift-btn-start">▶️ เริ่มเปิดกะ</button>
            </div>
        `;
        document.getElementById('startShiftBtn').addEventListener('click', startShift);

    } else {
        // มีกะเปิดอยู่ -> แสดงข้อมูลกะปัจจุบันและปุ่มปิดกะ
        const s = state.currentShift;
        card.innerHTML = `
            <div class="shift-status shift-status-open">
                <div class="shift-status-icon">☀️</div>
                <div class="shift-status-title">กำลังเปิดกะอยู่</div>

                <div class="shift-info-grid">
                    <div class="shift-info-item">
                        <span>พนักงาน</span><b>${s.staffName || '-'}</b>
                    </div>
                    <div class="shift-info-item">
                        <span>เวลาเปิดกะ</span><b>${formatDateTime(new Date(s.startTime))}</b>
                    </div>
                    <div class="shift-info-item">
                        <span>เงินสดตั้งต้น</span><b>${formatMoney(s.startCash)} ฿</b>
                    </div>
                </div>

                <button id="openCloseShiftBtn" class="shift-btn shift-btn-close">🔒 ปิดกะ</button>
            </div>
        `;
        document.getElementById('openCloseShiftBtn').addEventListener('click', openCloseShiftModal);
    }
}

// เริ่มเปิดกะใหม่ (บันทึกเวลาเริ่มต้นและเงินสดตั้งต้น)
function startShift() {
    const staffName = document.getElementById('staffNameInput').value.trim();
    const startCash = parseFloat(document.getElementById('startCashInput').value) || 0;

    state.currentShift = {
        id: Date.now().toString(),
        staffName,
        startTime: new Date().toISOString(),
        startCash,
        endTime: null,
        endCash: null,
        salesTotal: null,
        difference: null,
        status: 'open'
    };

    saveState(CURRENT_SHIFT_KEY, state.currentShift);
    renderShiftStatusCard();

    // แจ้ง main.js ว่าเปิดกะสำเร็จแล้ว ให้ปลดล็อกเมนูอื่นๆ และพาเข้าหน้าร้าน
    window.dispatchEvent(new CustomEvent('shift:opened'));
}

// ---------------------------------------------------------------------
// 2. Modal ปิดกะ
// ---------------------------------------------------------------------
function openCloseShiftModal() {
    document.getElementById('shiftSalesInput').value = '';
    document.getElementById('closeCashInput').value = '';
    document.getElementById('closeShiftPreview').innerHTML = '';
    document.getElementById('closeShiftModal').classList.add('active');
}

function closeShiftModal() {
    document.getElementById('closeShiftModal').classList.remove('active');
}

// แสดงยอดคาดว่าจะมีในลิ้นชัก และผลต่างแบบเรียลไทม์ ขณะที่พิมพ์
function updateClosePreview() {
    const s = state.currentShift;
    const preview = document.getElementById('closeShiftPreview');
    if (!s) return;

    const sales = parseFloat(document.getElementById('shiftSalesInput').value) || 0;
    const closeCash = parseFloat(document.getElementById('closeCashInput').value) || 0;
    const expected = s.startCash + sales;
    const diff = closeCash - expected;

    let diffLabel = 'ตรงกัน';
    let diffClass = 'diff-zero';
    if (diff > 0) { diffLabel = `เกิน ${formatMoney(diff)} ฿`; diffClass = 'diff-over'; }
    else if (diff < 0) { diffLabel = `ขาด ${formatMoney(Math.abs(diff))} ฿`; diffClass = 'diff-under'; }

    preview.innerHTML = `
        <div class="shift-preview-row"><span>ยอดคาดว่าจะมีในลิ้นชัก</span><b>${formatMoney(expected)} ฿</b></div>
        <div class="shift-preview-row ${diffClass}"><span>ผลต่าง</span><b>${diffLabel}</b></div>
    `;
}

// ยืนยันปิดกะ: คำนวณผลต่าง บันทึกลงประวัติ แล้วล้างกะปัจจุบัน
function confirmCloseShift() {
    const s = state.currentShift;
    if (!s) return;

    const sales = parseFloat(document.getElementById('shiftSalesInput').value) || 0;
    const closeCash = parseFloat(document.getElementById('closeCashInput').value) || 0;
    const expected = s.startCash + sales;

    s.endTime = new Date().toISOString();
    s.endCash = closeCash;
    s.salesTotal = sales;
    s.difference = closeCash - expected;
    s.status = 'closed';

    // ย้ายกะนี้เข้าประวัติ (ไว้บนสุด)
    state.shiftHistory.unshift(s);
    saveState(SHIFT_HISTORY_KEY, state.shiftHistory);

    // ล้างกะปัจจุบัน
    state.currentShift = null;
    saveState(CURRENT_SHIFT_KEY, null);

    closeShiftModal();
    renderShiftStatusCard();
    renderShiftHistory();

    // แจ้ง main.js ว่าปิดกะแล้ว ให้ล็อกเมนูอื่นและพากลับมาหน้านี้ (ต้องเปิดกะใหม่ก่อนถึงจะใช้หน้าอื่นได้)
    window.dispatchEvent(new CustomEvent('shift:closed'));
}

// ---------------------------------------------------------------------
// 3. ประวัติกะ
// ---------------------------------------------------------------------
function renderShiftHistory() {
    const container = document.getElementById('shiftHistoryContainer');

    if (!state.shiftHistory || state.shiftHistory.length === 0) {
        container.innerHTML = `<p class="shift-history-empty">ยังไม่มีประวัติกะที่ปิดแล้ว</p>`;
        return;
    }

    container.innerHTML = state.shiftHistory.map(s => {
        const diffClass = s.difference > 0 ? 'diff-over' : s.difference < 0 ? 'diff-under' : 'diff-zero';
        const diffText = s.difference > 0 ? `เกิน ${formatMoney(s.difference)} ฿`
            : s.difference < 0 ? `ขาด ${formatMoney(Math.abs(s.difference))} ฿`
            : 'ตรงกัน';

        return `
            <div class="shift-history-item">
                <div class="shift-history-main">
                    <b>${s.staffName || 'ไม่ระบุชื่อ'}</b>
                    <span>${formatDateTime(new Date(s.startTime))} — ${formatDateTime(new Date(s.endTime))}</span>
                </div>
                <div class="shift-history-nums">
                    <span>เริ่มต้น ${formatMoney(s.startCash)} ฿</span>
                    <span>ปิดกะ ${formatMoney(s.endCash)} ฿</span>
                    <span class="${diffClass}">${diffText}</span>
                </div>
            </div>
        `;
    }).join('');
}

// ---------------------------------------------------------------------
// 4. Helper functions
// ---------------------------------------------------------------------
function formatMoney(n) {
    return Number(n || 0).toLocaleString('th-TH');
}

function formatDateTime(d) {
    return d.toLocaleString('th-TH', { day: 'numeric', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' });
}
