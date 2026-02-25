import { Hono } from 'hono';
import type { Env } from '../types';

const payments = new Hono<{ Bindings: Env }>();

// GET /api/payments/config
payments.get('/config', async (c) => {
  try {
    // In the future, this could be read from a KV store or database table
    // For now, we return a fixed configuration for the single monthly plan
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

    // Format phone number
    const formattedPhone = phone.startsWith('254') ? phone : `254${phone.replace(/^0/, '')}`;

    // Create payment record. Use provided ID if available.
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
      UPDATE payments 
      SET transaction_id = ?
      WHERE id = ?
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
    if (!stkCallback) {
      return c.json({ error: 'Invalid callback data' }, 400);
    }

    // Usually Safaricom's CheckoutRequestID is tied to our system, but 
    // we need to find the payment by phone number and amount if we didn't save the checkout request id, 
    // however, the easiest way to correlate in this specific callback is by checking the most recent pending payment 
    // for that phone number. 
    // A better approach is having the Android app pass AccountReference when making the push 
    // but Safaricom STK Push callback doesn't always echo it back. 
    // We will extract phone number from callback to map it.

    const resultCode = stkCallback.ResultCode;
    const checkoutRequestId = stkCallback.CheckoutRequestID;
    const isSuccess = resultCode === 0;

    let mpesaReceiptNumber = null;
    let amount = null;
    let phoneNumber = null;

    if (isSuccess && stkCallback.CallbackMetadata && stkCallback.CallbackMetadata.Item) {
      const items = stkCallback.CallbackMetadata.Item;
      const receiptItem = items.find((item: any) => item.Name === 'MpesaReceiptNumber');
      const amountItem = items.find((item: any) => item.Name === 'Amount');
      const phoneItem = items.find((item: any) => item.Name === 'PhoneNumber');

      if (receiptItem) mpesaReceiptNumber = receiptItem.Value;
      if (amountItem) amount = amountItem.Value;
      if (phoneItem) phoneNumber = phoneItem.Value?.toString();
    }

    // Attempt to format phone number to match database (e.g., 2547XXXXXXXX)
    let formattedPhone = phoneNumber;
    if (formattedPhone && formattedPhone.startsWith('0')) {
      formattedPhone = `254${formattedPhone.substring(1)}`;
    }

    const status = isSuccess ? 'completed' : 'failed';
    const now = Date.now();

    const db = (c.env as any).DB;

    let updatedPayment: any = null;

    // Use checkout_request_id to update exactly the right transaction
    if (checkoutRequestId) {
      updatedPayment = await db.prepare(`
          UPDATE payments 
          SET status = ?, mpesa_receipt_number = ?, completed_at = ?
          WHERE transaction_id = ? AND status = 'pending'
          RETURNING id, user_id, subscription_type, subscription_months
        `).bind(status, mpesaReceiptNumber, now, checkoutRequestId).first();

      // Fallback for older transactions that didn't save transaction_id
      if (!updatedPayment && formattedPhone) {
        updatedPayment = await db.prepare(`
              UPDATE payments 
              SET status = ?, mpesa_receipt_number = ?, completed_at = ?
              WHERE phone_number = ? AND status = 'pending' AND transaction_id IS NULL
              RETURNING id, user_id, subscription_type, subscription_months
            `).bind(status, mpesaReceiptNumber, now, formattedPhone).first();
      }
    } else if (formattedPhone) {
      // Fallback
      updatedPayment = await db.prepare(`
          UPDATE payments 
          SET status = ?, mpesa_receipt_number = ?, completed_at = ?
          WHERE phone_number = ? AND status = 'pending'
          RETURNING id, user_id, subscription_type, subscription_months
        `).bind(status, mpesaReceiptNumber, now, formattedPhone).first();
    } else {
      console.error('Could not extract checkout id or phone number from Mpesa callback to update record.');
    }

    // If payment was successful and we found the record, create a subscription
    if (isSuccess && updatedPayment) {
      const subId = crypto.randomUUID();
      const startDate = now;
      const months = updatedPayment.subscription_months || 1;

      const date = new Date(startDate);
      date.setMonth(date.getMonth() + months);
      const endDate = date.getTime();

      await db.prepare(`
        INSERT INTO subscriptions (
          id, user_id, payment_id, subscription_type,
          start_date, end_date, is_active, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, 1, ?)
      `).bind(
        subId,
        updatedPayment.user_id,
        updatedPayment.id,
        updatedPayment.subscription_type || 'monthly',
        startDate,
        endDate,
        now
      ).run();

      console.log(`Created subscription ${subId} for user ${updatedPayment.user_id}`);
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

    let payment = await db.prepare(
      'SELECT * FROM payments WHERE id = ?'
    ).bind(paymentId).first();

    if (!payment) {
      // Allow fallback: check by transaction_id (CheckoutRequestID)
      payment = await db.prepare(
        'SELECT * FROM payments WHERE transaction_id = ?'
      ).bind(paymentId).first();

      if (!payment) {
        return c.json({ error: 'Payment not found', status: 'pending' }, 404);
      }
    }

    return c.json(payment);
  } catch (error) {
    console.error('Get payment status error:', error);
    return c.json({ error: 'Failed to fetch payment status', status: 'failed' }, 500);
  }
});

export default payments;
