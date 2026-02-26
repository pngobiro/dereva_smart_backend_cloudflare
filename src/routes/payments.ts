import { Hono } from 'hono';
import type { Env } from '../types';

const payments = new Hono<{ Bindings: Env }>();

// GET /api/payments/config
payments.get('/config', async (c) => {
  try {
    return c.json({
      success: true,
      monthlyPrice: 1.0,
      currency: "KES",
      durationDays: 30,
      features: [
        "Unlimited mock tests",
        "Full progress tracking",
        "Unlimited AI tutor",
        "Offline access",
        "Auto-renewal"
      ]
    });
  } catch (error) {
    console.error('Get payment config error:', error);
    return c.json({ error: 'Failed to fetch payment configuration' }, 500);
  }
});

// POST /api/payments/initiate
payments.post('/initiate', async (c) => {
  try {
    const body = await c.req.json();
    const { id, phone, amount, user_id, type, checkout_request_id } = body;

    if (!phone || !amount || !user_id) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    const formattedPhone = phone.startsWith('254') ? phone : `254${phone.replace(/^0/, '')}`;
    const paymentId = id || crypto.randomUUID();
    const now = Date.now();
    const db = (c.env as any).DB;

    await db.prepare(`
      INSERT INTO payments (
        id, user_id, amount, phone_number, payment_method, subscription_type,
        status, transaction_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)
    `).bind(
      paymentId, user_id, amount, formattedPhone, 'mpesa', type || 'monthly', checkout_request_id || null, now
    ).run();

    return c.json({
      success: true,
      message: 'Payment record created.',
      payment_id: paymentId
    });
  } catch (error) {
    console.error('Initiate payment error:', error);
    return c.json({ error: 'Failed to initiate payment' }, 500);
  }
});

// POST /api/payments/link-checkout
payments.post('/link-checkout', async (c) => {
  try {
    const body = await c.req.json();
    const { id, checkout_request_id } = body;

    if (!id || !checkout_request_id) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    const db = (c.env as any).DB;
    await db.prepare(`
      UPDATE payments SET transaction_id = ? WHERE id = ?
    `).bind(checkout_request_id, id).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Link checkout error:', error);
    return c.json({ error: 'Failed to link checkout ID' }, 500);
  }
});

// POST /api/payments/callback
payments.post('/callback', async (c) => {
  try {
    const body = await c.req.json();
    console.log('M-Pesa callback:', JSON.stringify(body));

    const stkCallback = body?.Body?.stkCallback;
    if (!stkCallback) return c.json({ error: 'Invalid callback data' }, 400);

    const resultCode = stkCallback.ResultCode;
    const checkoutRequestId = stkCallback.CheckoutRequestID;
    const isSuccess = resultCode === 0;

    let mpesaReceiptNumber = null;
    let phoneNumber = null;

    if (isSuccess && stkCallback.CallbackMetadata && stkCallback.CallbackMetadata.Item) {
      const items = stkCallback.CallbackMetadata.Item;
      const receiptItem = items.find((item: any) => item.Name === 'MpesaReceiptNumber');
      const phoneItem = items.find((item: any) => item.Name === 'PhoneNumber');
      if (receiptItem) mpesaReceiptNumber = receiptItem.Value;
      if (phoneItem) phoneNumber = phoneItem.Value?.toString();
    }

    let formattedPhone = phoneNumber;
    if (formattedPhone && formattedPhone.startsWith('0')) {
      formattedPhone = `254${formattedPhone.substring(1)}`;
    }

    const status = isSuccess ? 'completed' : 'failed';
    const now = Date.now();
    const db = (c.env as any).DB;

    // Step 1: Update payment status
    await db.prepare(`
        UPDATE payments 
        SET status = ?, mpesa_receipt_number = ?, completed_at = ?
        WHERE (transaction_id = ? OR id = ? OR (phone_number = ? AND transaction_id IS NULL)) 
        AND status = 'pending'
      `).bind(status, mpesaReceiptNumber, now, checkoutRequestId || '', checkoutRequestId || '', formattedPhone || '').run();

    // Step 2: Select the updated record
    const updatedPayment: any = await db.prepare(`
        SELECT id, user_id, subscription_type, subscription_months 
        FROM payments 
        WHERE (transaction_id = ? OR id = ? OR (phone_number = ? AND mpesa_receipt_number = ?))
        LIMIT 1
      `).bind(checkoutRequestId || '', checkoutRequestId || '', formattedPhone || '', mpesaReceiptNumber || '').first();

    if (isSuccess && updatedPayment) {
      const actualUserId = updatedPayment.user_id;
      const subId = crypto.randomUUID();
      const months = updatedPayment.subscription_months || 1;
      const endDate = now + (months * 30 * 24 * 60 * 60 * 1000);

      await db.prepare(`
        INSERT INTO subscriptions (
          id, user_id, payment_id, subscription_type,
          start_date, end_date, is_active, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, 1, ?)
      `).bind(subId, actualUserId, updatedPayment.id, 'monthly', now, endDate, now).run();

      // Always set to PREMIUM_MONTHLY after any payment
      const subStatus = 'PREMIUM_MONTHLY';
        
      await db.prepare(`
        UPDATE users SET subscription_status = ?, subscription_expiry_date = ? WHERE id = ?
      `).bind(subStatus, endDate, actualUserId).run();

      console.log(`Updated user ${actualUserId} to ${subStatus}`);
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('Payment callback error:', error);
    return c.json({ error: 'Failed to process callback' }, 500);
  }
});

// GET /api/payments/:userId
payments.get('/:userId', async (c) => {
  try {
    const userId = c.req.param('userId');
    const { results } = await c.env.DB.prepare(
      'SELECT * FROM payments WHERE user_id = ? ORDER BY created_at DESC'
    ).bind(userId).all();
    return c.json(results || []);
  } catch (error) {
    console.error('Get payments error:', error);
    return c.json({ error: 'Failed to fetch payments' }, 500);
  }
});

// GET /api/payments/status/:paymentId
payments.get('/status/:paymentId', async (c) => {
  try {
    const paymentId = c.req.param('paymentId');
    const db = (c.env as any).DB;

    let payment = await db.prepare('SELECT * FROM payments WHERE id = ?').bind(paymentId).first();
    if (!payment) {
      payment = await db.prepare('SELECT * FROM payments WHERE transaction_id = ?').bind(paymentId).first();
    }

    if (!payment) return c.json({ error: 'Payment not found', status: 'pending' }, 404);
    return c.json(payment);
  } catch (error) {
    console.error('Get payment status error:', error);
    return c.json({ error: 'Failed to fetch payment status', status: 'failed' }, 500);
  }
});

export default payments;
