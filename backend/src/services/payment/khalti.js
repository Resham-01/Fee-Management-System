/* Khalti ePayment integration.
 *
 * Flow:
 *   1. Server POSTs to the initiate endpoint -> gets { pidx, payment_url }.
 *   2. Browser opens payment_url (Khalti hosted checkout).
 *   3. Khalti redirects browser back to our return_url with `pidx` (+ order params).
 *   4. Server must NOT trust the redirect params; it verifies via the Lookup API.
 */
const khalti = {
  name: 'khalti',
  label: 'Khalti',
  available: true,

  getConfig() {
    return {
      secretKey:
        process.env.KHALTI_SECRET_KEY || 'live_secret_key_68791341fdd94846a146f0457ff7b455',
      initiateUrl:
        process.env.KHALTI_INITIATE_URL || 'https://dev.khalti.com/api/v2/epayment/initiate/',
      lookupUrl:
        process.env.KHALTI_LOOKUP_URL || 'https://dev.khalti.com/api/v2/epayment/lookup/',
    };
  },

  async post(url, body) {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Key ${this.getConfig().secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const text = await res.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch (err) {
      throw new Error(`Khalti returned an invalid response (HTTP ${res.status})`);
    }

    if (!res.ok) {
      const detail = data?.detail || data?.message || data?.error_key || '';
      const error = new Error(`Khalti: ${res.status} ${detail}`.trim());
      error.status = res.status;
      error.data = data;
      throw error;
    }

    return data;
  },

  // Shared gateway interface: returns { type:'url', paymentUrl }.
  // Amount is NPR; Khalti requires it in paisa (NPR * 100).
  async buildPaymentForm({ transactionUuid, amount, backendUrl }) {
    const backend = (backendUrl || process.env.BACKEND_URL || 'http://localhost:5000').replace(/\/$/, '');
    const websiteUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');

    const data = await this.post(`${this.getConfig().initiateUrl}`, {
      return_url: `${backend}/api/payments/callback/khalti`,
      website_url: websiteUrl,
      amount: String(Math.round(Number(amount) * 100)),
      purchase_order_id: transactionUuid,
      purchase_order_name: `Fee payment ${transactionUuid.slice(0, 8).toUpperCase()}`,
    });

    if (!data?.payment_url) {
      throw new Error('Khalti did not return a payment URL');
    }

    return {
      type: 'url',
      paymentUrl: data.payment_url,
      pidx: data.pidx,
    };
  },

  // Lookup API returns { pidx, status, total_amount, transaction_id, ... }.
  async lookupTransaction({ pidx }) {
    return this.post(`${this.getConfig().lookupUrl}`, { pidx });
  },

  // Included to match the shared gateway interface; Khalti success is verified
  // via the Lookup API instead of a signature.
  verifySignature() {
    return true;
  },
};

module.exports = khalti;