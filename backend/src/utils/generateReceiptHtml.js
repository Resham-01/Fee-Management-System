const formatDate = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleString('en-NP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatAmount = (amount, currency = 'NPR') =>
  `${currency} ${Number(amount).toLocaleString('en-NP', { minimumFractionDigits: 2 })}`;

const gatewayLabel = (gateway) => {
  const labels = { esewa: 'eSewa', khalti: 'Khalti', fonepay: 'FonePay' };
  return labels[gateway] || gateway || 'Manual / Cash';
};

const generateReceiptHtml = (receipt) => {
  const receiptNo = receipt.receiptNumber || receipt.transactionId || receipt.invoiceId;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Payment Receipt - ${receiptNo}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f3f4f6; padding: 24px; color: #111827; }
    .receipt { max-width: 720px; margin: 0 auto; background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #4f46e5, #7c3aed); color: #fff; padding: 28px 32px; }
    .header h1 { font-size: 24px; margin-bottom: 4px; }
    .header p { opacity: 0.9; font-size: 14px; }
    .badge { display: inline-block; background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 999px; font-size: 12px; margin-top: 12px; }
    .body { padding: 32px; }
    .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 28px; }
    .meta-item label { display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; margin-bottom: 4px; }
    .meta-item span { font-size: 14px; font-weight: 600; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    th, td { padding: 12px 14px; text-align: left; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
    th { background: #f9fafb; font-size: 12px; text-transform: uppercase; color: #6b7280; }
    .total-row td { font-weight: 700; font-size: 16px; border-bottom: none; }
    .amount-box { background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 16px 20px; text-align: center; margin-bottom: 24px; }
    .amount-box .label { font-size: 12px; color: #065f46; text-transform: uppercase; }
    .amount-box .value { font-size: 28px; font-weight: 700; color: #047857; margin-top: 4px; }
    .footer { padding: 20px 32px; background: #f9fafb; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; text-align: center; }
    .paid-stamp { color: #059669; font-weight: 700; font-size: 18px; text-align: right; margin-bottom: 16px; }
    @media print { body { background: #fff; padding: 0; } .receipt { border: none; box-shadow: none; } }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <h1>${receipt.schoolName}</h1>
      <p>${receipt.schoolAddress || ''}</p>
      <p>${receipt.schoolContactEmail || ''} ${receipt.schoolContactPhone ? `| ${receipt.schoolContactPhone}` : ''}</p>
      <span class="badge">Official Payment Receipt</span>
    </div>
    <div class="body">
      <div class="paid-stamp">✓ PAID</div>
      <div class="meta">
        <div class="meta-item"><label>Receipt No.</label><span>${receiptNo}</span></div>
        <div class="meta-item"><label>Payment Date</label><span>${formatDate(receipt.paidAt)}</span></div>
        <div class="meta-item"><label>Student</label><span>${receipt.studentName}</span></div>
        <div class="meta-item"><label>Student Code</label><span>${receipt.studentCode}</span></div>
        <div class="meta-item"><label>Class / Section</label><span>${receipt.className} - ${receipt.section}</span></div>
        <div class="meta-item"><label>Parent</label><span>${receipt.parentName || '—'}</span></div>
        <div class="meta-item"><label>Term</label><span>${receipt.term}</span></div>
        <div class="meta-item"><label>Payment Method</label><span>${gatewayLabel(receipt.gateway)}</span></div>
      </div>
      <div class="amount-box">
        <div class="label">Amount Paid</div>
        <div class="value">${formatAmount(receipt.amount, receipt.currency)}</div>
      </div>
      <table>
        <thead>
          <tr><th>Description</th><th>Reference</th><th>Amount</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>${receipt.description || `Fee payment — ${receipt.term}`}</td>
            <td>${receipt.gatewayRefId || '—'}</td>
            <td>${formatAmount(receipt.amount, receipt.currency)}</td>
          </tr>
          <tr class="total-row">
            <td colspan="2">Total Paid</td>
            <td>${formatAmount(receipt.amount, receipt.currency)}</td>
          </tr>
        </tbody>
      </table>
      ${receipt.walletPhone ? `<p style="font-size:13px;color:#4b5563;margin-bottom:8px;"><strong>Wallet:</strong> ${receipt.walletPhone}</p>` : ''}
      <p style="font-size:13px;color:#4b5563;">This is a computer-generated receipt from Shulkaa Suvidha Fee Management System.</p>
    </div>
    <div class="footer">
      Generated on ${formatDate(new Date())} &mdash; ${receipt.schoolName}
    </div>
  </div>
</body>
</html>`;
};

module.exports = { generateReceiptHtml, formatDate, formatAmount, gatewayLabel };
