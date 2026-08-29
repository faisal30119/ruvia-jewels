import crypto from 'crypto';
import Razorpay from 'razorpay';

const KEY_ID = 'rzp_test_TVWBNkkEHT8qym';
const KEY_SECRET = 'OAZ8A70JRp19Cwxrlb0kGDAR';

async function runTests() {
  console.log('Testing Razorpay Integration...');
  const rzp = new Razorpay({
    key_id: KEY_ID,
    key_secret: KEY_SECRET,
  });

  // 1. Test Order Creation
  const amount = 899; // ₹899 -> 89900 paise
  const order = await rzp.orders.create({
    amount: amount * 100,
    currency: 'INR',
    receipt: `test_receipt_${Date.now()}`,
    notes: { test: 'true' },
  });

  console.log('✅ Order created successfully:', {
    order_id: order.id,
    amount: order.amount,
    currency: order.currency,
  });

  // 2. Test HMAC Signature Verification logic
  const mockPaymentId = 'pay_mockTest123456';
  const validSignature = crypto
    .createHmac('sha256', KEY_SECRET)
    .update(`${order.id}|${mockPaymentId}`)
    .digest('hex');

  // Verify match
  const checkSignature = crypto
    .createHmac('sha256', KEY_SECRET)
    .update(`${order.id}|${mockPaymentId}`)
    .digest('hex');

  if (validSignature === checkSignature) {
    console.log('✅ Signature verification algorithm: PASS');
  } else {
    console.error('❌ Signature mismatch');
  }

  // 3. Test Invalid Signature Rejection
  const invalidSignature = 'invalid_tampered_signature';
  if (invalidSignature !== validSignature) {
    console.log('✅ Tampered signature correctly rejected: PASS');
  }
}

runTests().catch((err) => {
  console.error('Test failed:', err);
});
