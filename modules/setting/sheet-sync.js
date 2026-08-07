

<div class="settings-page">
    <div class="page-title">⚙️ ตั้งค่า</div>

    <div class="settings-section-title">🔗 เชื่อมต่อ Google Sheet — Master Database</div>
    <p class="settings-hint">ใช้ดึงหมวดหมู่ / สินค้า / ตัวเลือก มาสร้างปุ่มในหน้าขาย — หน้าขายจะอ่านจากแคชในเครื่องเสมอ ต้องกด "ซิงค์ข้อมูลล่าสุด" เพื่ออัปเดตแคชเมื่อมีอินเทอร์เน็ต</p>
    <div class="settings-section-title">🔗 เชื่อมต่อ Google Sheet</div>
    <p class="settings-hint">ไฟล์เดียว รวมแท็บ Categories / Products / ยอดขาย — หน้าขายอ่านจากแคชในเครื่องเสมอ ต้องกด "ซิงค์ข้อมูลล่าสุด" เพื่ออัปเดตแคชเมื่อมีอินเทอร์เน็ต</p>
    <div class="modal-field">
        <label for="masterScriptUrlInput">Master DB Web App URL</label>
        <input type="text" id="masterScriptUrlInput" placeholder="https://script.google.com/macros/s/xxxx/exec">
        <label for="scriptUrlInput">Google Apps Script Web App URL</label>
        <input type="text" id="scriptUrlInput" placeholder="https://script.google.com/macros/s/xxxx/exec">
    </div>
    <div class="modal-actions">
        <button class="modal-btn btn-save" id="testMasterBtn">🔌 ทดสอบการเชื่อมต่อ</button>
        <button class="modal-btn btn-confirm" id="saveMasterBtn">💾 บันทึก</button>
        <button class="modal-btn btn-save" id="testSheetBtn">🔌 ทดสอบการเชื่อมต่อ</button>
        <button class="modal-btn btn-confirm" id="saveSheetBtn">💾 บันทึก</button>
    </div>
    <div class="modal-actions">
        <button class="modal-btn btn-confirm" id="syncMasterBtn">🔄 ซิงค์ข้อมูลล่าสุด (สินค้า/หมวดหมู่)</button>
    </div>

    <div class="settings-section-title">🔗 เชื่อมต่อ Google Sheet — Sales Database</div>
    <p class="settings-hint">ใช้บันทึกยอดขายหลังชำระเงินสำเร็จ</p>
    <div class="modal-field">
        <label for="salesScriptUrlInput">Sales DB Web App URL</label>
        <input type="text" id="salesScriptUrlInput" placeholder="https://script.google.com/macros/s/xxxx/exec">
    </div>
    <div class="modal-actions">
        <button class="modal-btn btn-save" id="testSalesBtn">🔌 ทดสอบการเชื่อมต่อ</button>
        <button class="modal-btn btn-confirm" id="saveSalesBtn">💾 บันทึก</button>
    </div>
</div>