# M-Pesa Integration Guide

## Status: ✅ CONFIGURED

Date: 2024-02-24

## Overview
M-Pesa STK Push integration is now configured in the Cloudflare backend with credentials from the Android app.

## Credentials Configured

### Production Credentials
```
MPESA_CONSUMER_KEY: FUkERaDvg1tJtT6k2ngpyapbkPwJHKea
MPESA_CONSUMER_SECRET: QNWTc8eUtn5kTjbD
MPESA_SHORTCODE: 755106
MPESA_PASSKEY: f94ecc4674aa8e226cacd184c48295f2dd648437220fed565af93680bef7fb2f
```

### Callback URL
```
https://dereva-smart-backend.pngobiro.workers.dev/api/payments/callback
```

## API Endpoints

### Initiate Payment
**Endpoint:** `POST /api/payments/initiate`

**Request:**
```json
{
  "phone": "254712345678",
  "amount": 500,
  "user_id": "user-uuid",
  "type": "subscription"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment initiated. Please check your phone for M-Pesa prompt.",
  "checkout_request_id": "CHK_1234567890_abc123",
  "payment_id": "payment-uuid"
}
```

### Payment Callback
**Endpoint:** `POST /api/payments/callback`

This endpoint receives callbacks from Safaricom M-Pesa after payment completion.

**Callback Format:**
```json
{
  "Body": {
    "stkCallback": {
      "MerchantRequestID": "29115-34620561-1",
      "CheckoutRequestID": "ws_CO_191220191020363925",
      "ResultCode": 0,
      "ResultDesc": "The service request is processed successfully.",
      "CallbackMetadata": {
        "Item": [
          {
            "Name": "Amount",
            "Value": 500
          },
          {
            "Name": "MpesaReceiptNumber",
            "Value": "NLJ7RT61SV"
          },
          {
            "Name": "TransactionDate",
            "Value": 20191219102115
          },
          {
            "Name": "PhoneNumber",
            "Value": 254712345678
          }
        ]
      }
    }
  }
}
```

### Get Payment History
**Endpoint:** `GET /api/payments/:userId`

**Response:**
```json
[
  {
    "id": "payment-uuid",
    "user_id": "user-uuid",
    "amount": 500,
    "phone_number": "254712345678",
    "payment_type": "subscription",
    "status": "completed",
    "mpesa_receipt": "NLJ7RT61SV",
    "created_at": 1708790400000,
    "updated_at": 1708790460000
  }
]
```

### Check Payment Status
**Endpoint:** `GET /api/payments/status/:paymentId`

**Response:**
```json
{
  "id": "payment-uuid",
  "status": "completed",
  "amount": 500,
  "mpesa_receipt": "NLJ7RT61SV"
}
```

## Implementation Status

### Backend (Cloudflare) ✅
- [x] Credentials configured in wrangler.toml
- [x] Payment initiation endpoint
- [x] Callback handler endpoint
- [x] Payment history endpoint
- [x] Status check endpoint
- [ ] M-Pesa API integration (STK Push)
- [ ] Callback processing logic
- [ ] Subscription activation on payment

### Android App ✅
- [x] M-Pesa credentials in manifest
- [x] Callback URL updated to Dereva backend
- [x] Payment API endpoints defined
- [x] PaymentRepository implementation
- [ ] Test payment flow
- [ ] Handle payment responses
- [ ] Update subscription status

## M-Pesa STK Push Flow

```
1. User initiates payment in app
   ↓
2. App calls /api/payments/initiate
   ↓
3. Backend calls M-Pesa STK Push API
   ↓
4. M-Pesa sends push to user's phone
   ↓
5. User enters PIN and confirms
   ↓
6. M-Pesa processes payment
   ↓
7. M-Pesa calls /api/payments/callback
   ↓
8. Backend updates payment status
   ↓
9. Backend activates subscription
   ↓
10. App polls /api/payments/status/:id
   ↓
11. App shows success message
```

## Next Steps

### 1. Implement M-Pesa STK Push API Call
Create `src/utils/mpesa.ts`:

```typescript
export async function initiateSTKPush(
  phone: string,
  amount: number,
  accountReference: string,
  env: Env
): Promise<any> {
  // Get OAuth token
  const auth = btoa(`${env.MPESA_CONSUMER_KEY}:${env.MPESA_CONSUMER_SECRET}`);
  
  const tokenResponse = await fetch(
    'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
    {
      headers: {
        'Authorization': `Basic ${auth}`
      }
    }
  );
  
  const { access_token } = await tokenResponse.json();
  
  // Generate timestamp
  const timestamp = new Date().toISOString()
    .replace(/[^0-9]/g, '')
    .slice(0, 14);
  
  // Generate password
  const password = btoa(
    `${env.MPESA_SHORTCODE}${env.MPESA_PASSKEY}${timestamp}`
  );
  
  // STK Push request
  const stkResponse = await fetch(
    'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        BusinessShortCode: env.MPESA_SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: amount,
        PartyA: phone,
        PartyB: env.MPESA_SHORTCODE,
        PhoneNumber: phone,
        CallBackURL: 'https://dereva-smart-backend.pngobiro.workers.dev/api/payments/callback',
        AccountReference: accountReference,
        TransactionDesc: 'Dereva Smart Subscription'
      })
    }
  );
  
  return await stkResponse.json();
}
```

### 2. Update Payment Route
Modify `src/routes/payments.ts` to call M-Pesa API:

```typescript
import { initiateSTKPush } from '../utils/mpesa';

payments.post('/initiate', async (c) => {
  try {
    const body = await c.req.json();
    const { phone, amount, user_id, type } = body;
    
    // Create payment record
    const paymentId = crypto.randomUUID();
    await c.env.DB.prepare(`
      INSERT INTO payments (id, user_id, amount, phone_number, payment_type, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)
    `).bind(paymentId, user_id, amount, phone, type, Date.now(), Date.now()).run();
    
    // Call M-Pesa STK Push
    const mpesaResponse = await initiateSTKPush(
      phone,
      amount,
      paymentId,
      c.env
    );
    
    return c.json({
      success: true,
      message: 'Payment initiated',
      checkout_request_id: mpesaResponse.CheckoutRequestID,
      payment_id: paymentId
    });
  } catch (error) {
    console.error('Payment error:', error);
    return c.json({ error: 'Payment failed' }, 500);
  }
});
```

### 3. Process Callback
Update callback handler to process M-Pesa response:

```typescript
payments.post('/callback', async (c) => {
  try {
    const body = await c.req.json();
    const callback = body.Body.stkCallback;
    
    if (callback.ResultCode === 0) {
      // Payment successful
      const metadata = callback.CallbackMetadata.Item;
      const receipt = metadata.find(i => i.Name === 'MpesaReceiptNumber')?.Value;
      const amount = metadata.find(i => i.Name === 'Amount')?.Value;
      
      // Update payment status
      await c.env.DB.prepare(`
        UPDATE payments 
        SET status = 'completed', 
            mpesa_receipt = ?,
            updated_at = ?
        WHERE checkout_request_id = ?
      `).bind(receipt, Date.now(), callback.CheckoutRequestID).run();
      
      // Activate subscription
      // TODO: Update user subscription status
      
    } else {
      // Payment failed
      await c.env.DB.prepare(`
        UPDATE payments 
        SET status = 'failed',
            error_message = ?,
            updated_at = ?
        WHERE checkout_request_id = ?
      `).bind(callback.ResultDesc, Date.now(), callback.CheckoutRequestID).run();
    }
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Callback error:', error);
    return c.json({ error: 'Callback processing failed' }, 500);
  }
});
```

## Testing

### Test Credentials
For sandbox testing, use Safaricom test credentials:
- Test Phone: 254708374149
- Test Amount: Any amount between 1-70000

### Test Flow
1. Call initiate payment endpoint
2. Check phone for STK push prompt
3. Enter test PIN: 1234
4. Wait for callback
5. Check payment status

### Production Checklist
- [ ] Switch to production M-Pesa URLs
- [ ] Update credentials to production keys
- [ ] Test with real phone numbers
- [ ] Monitor callback success rate
- [ ] Set up error alerting
- [ ] Implement retry logic
- [ ] Add transaction logging

## Subscription Plans

### Pricing
- **Monthly**: KES 500
- **Quarterly**: KES 1,200 (20% discount)
- **Annual**: KES 4,000 (33% discount)

### Payment Types
```typescript
enum PaymentType {
  SUBSCRIPTION_MONTHLY = 'subscription_monthly',
  SUBSCRIPTION_QUARTERLY = 'subscription_quarterly',
  SUBSCRIPTION_ANNUAL = 'subscription_annual',
  SCHOOL_ENROLLMENT = 'school_enrollment',
  MOCK_TEST = 'mock_test'
}
```

## Security Notes

1. **Credentials**: Stored as environment variables, not in code
2. **Callback Validation**: Verify callback source IP
3. **Amount Validation**: Verify amount matches payment record
4. **Idempotency**: Handle duplicate callbacks
5. **Logging**: Log all transactions for audit

## Troubleshooting

### "Invalid Access Token"
- Check consumer key/secret are correct
- Verify OAuth endpoint is accessible
- Check token expiration

### "Invalid Shortcode"
- Verify shortcode matches credentials
- Check if shortcode is active
- Confirm paybill vs till number

### "Callback Not Received"
- Check callback URL is publicly accessible
- Verify HTTPS is enabled
- Check firewall rules
- Monitor Cloudflare logs

### "Payment Stuck in Pending"
- Implement timeout (5 minutes)
- Add manual status check
- Query M-Pesa transaction status API

## Support

### Safaricom Support
- Email: apisupport@safaricom.co.ke
- Portal: https://developer.safaricom.co.ke

### Documentation
- M-Pesa API Docs: https://developer.safaricom.co.ke/docs
- STK Push Guide: https://developer.safaricom.co.ke/APIs/MpesaExpressSimulate

## Monitoring

### Key Metrics
- Payment success rate
- Average payment time
- Callback delivery rate
- Failed payment reasons
- Revenue by payment type

### Alerts
- Failed payment rate > 10%
- Callback not received > 5 minutes
- Duplicate transactions detected
- Unusual payment amounts
