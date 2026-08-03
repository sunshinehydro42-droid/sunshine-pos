// pos.js — ตัวประสานหน้าร้าน (ขายสินค้า)
// ตัวไฟล์นี้ไม่มี logic ของตัวเอง มีหน้าที่แค่เรียก init ของแต่ละไฟล์ย่อยตามลำดับ
import { initCart } from './cart.js';
import { initProductView } from './product.js';
import { initOrder } from './order.js';
import { initPayment } from './payment.js';

// ฟังก์ชันนี้จะถูกเรียกจาก main.js ตอนที่เปิดหน้านี้
export function initPOS() {
    console.log('โหลดหน้าร้านค้าสำเร็จ!');

    initCart();        // ต้องมาก่อน initProductView เพราะ product.js เรียก handleProductClick จากไฟล์นี้
    initProductView();
    initOrder();        // ต้องมาก่อน initPayment เพราะ order.js เรียก openPaymentModal จากไฟล์นั้น
    initPayment();
}
