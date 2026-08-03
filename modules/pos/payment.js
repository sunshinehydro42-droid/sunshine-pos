// ส่งรายการขายในบิลนี้ไป Google Sheet (รวมไอเทมซ้ำในวันเดียวกัน อัตโนมัติ)
async function syncBillToSheet(bill) {
    const url = localStorage.getItem('webAppUrl') || localStorage.getItem('pos_script_url') || state.webAppUrl;
    if (!url) return;

    // แปลงสินค้าในบิลให้เป็นรูปแบบ rows ที่ Apps Script ต้องการ
    const rows = bill.items.map(item => ({
        date: bill.date,
        category: item.category || '',
        itemName: item.name,
        option: item.option || '',
        qty: Number(item.qty || 1),
        lineTotal: Number(item.price || 0) * Number(item.qty || 1)
    }));

    // ยิง Action 'addSale' พร้อมกับ 'rows'
    const result = await callSheetWebApp(url, 'addSale', { rows });

    if (!result.ok) {
        console.warn('ส่งข้อมูลบิล ' + bill.billNo + ' ไป Google Sheet ไม่สำเร็จ:', result.message);
    } else {
        console.log('บันทึกลง Sales Database เรียบร้อยสำหรับบิล:', bill.billNo);
    }
}