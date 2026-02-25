const crypto = require('crypto');

async function simulate() {
    const shortcode = "755106";
    const passkey = "f94ecc4674aa8e226cacd184c48295f2dd648437220fed565af93680bef7fb2f";
    const consumerKey = "FUkERaDvg1tJtT6k2ngpyapbkPwJHKea";
    const consumerSecret = "QNWTc8eUtn5kTjbD";
    const phone = "254718952129";
    const amount = 1;

    console.log("1. Cloudflare /initiate...");
    const paymentId = crypto.randomUUID();
    const initRes = await fetch("https://dereva-smart-backend.pngobiro.workers.dev/api/payments/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            id: paymentId,
            phone: phone,
            amount: amount,
            user_id: "23891828-c463-4b21-9ec4-4a32cbd477fa",
            type: "subscription"
        })
    });
    console.log(await initRes.text());

    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
    console.log("\nGetting Safaricom token...");
    const tokenRes = await fetch("https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials", {
        headers: { "Authorization": `Basic ${auth}` }
    });
    const token = (await tokenRes.json()).access_token;

    console.log("\n2. Safaricom STK Push...");
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');
    const pushRes = await fetch("https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            BusinessShortCode: shortcode,
            Password: password,
            Timestamp: timestamp,
            TransactionType: "CustomerPayBillOnline",
            Amount: amount,
            PartyA: phone,
            PartyB: shortcode,
            PhoneNumber: phone,
            CallBackURL: "https://dereva-smart-backend.pngobiro.workers.dev/api/payments/callback",
            AccountReference: "Dereva Smart",
            TransactionDesc: "Test Payment"
        })
    });
    const pushData = await pushRes.json();
    console.log(pushData);

    const checkoutRequestId = pushData.CheckoutRequestID;

    console.log("\n3. Cloudflare /link-checkout...");
    const linkRes = await fetch("https://dereva-smart-backend.pngobiro.workers.dev/api/payments/link-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            id: paymentId,
            checkout_request_id: checkoutRequestId
        })
    });
    console.log(await linkRes.text());

    console.log("\nDone! Payment ID:", paymentId);
    console.log("Check your phone. When paid, I will query DB for checkout ID:", checkoutRequestId);
}

simulate().catch(console.error);
