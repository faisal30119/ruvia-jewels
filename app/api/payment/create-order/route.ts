import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { requireAuth } from '@/lib/auth-helper';

export async function POST(request: Request) {
  const { user, error: authError } = await requireAuth(request);
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { amount, email, name } = body;

  const numAmount = Number(amount);
  if (isNaN(numAmount) || numAmount < 1) {
    return NextResponse.json(
      { error: 'Minimum order amount must be at least ₹1 (100 paise)' },
      { status: 400 }
    );
  }

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return NextResponse.json(
      { error: 'Razorpay API credentials are not configured on the server' },
      { status: 500 }
    );
  }

  const razorpay = new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });

  try {
    const amountInPaise = Math.round(numAmount * 100);
    const order = await razorpay.orders.create({
      amount: amountInPaise, // in paise (min 100 paise)
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      notes: {
        email: email ?? '',
        name: name ?? '',
        user_id: user.id,
      },
    });

    return NextResponse.json({
      id: order.id,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key: keyId,
    });
  } catch (err: unknown) {
    console.error('Razorpay order creation error:', err);
    const message = err instanceof Error ? err.message : 'Failed to create Razorpay order';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
