import apiClient from '../api/client';
import { getErrorMessage } from '../context/ToastContext';

export const downloadReceipt = async (invoiceId) => {
  const response = await apiClient.get(`/receipts/invoice/${invoiceId}/download`, {
    responseType: 'blob',
  });

  const disposition = response.headers['content-disposition'];
  let filename = `receipt-${invoiceId}.html`;
  if (disposition) {
    const match = disposition.match(/filename="?([^"]+)"?/);
    if (match?.[1]) filename = match[1];
  }

  const blob = new Blob([response.data], { type: 'text/html;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const downloadReceiptWithToast = async (invoiceId, showToast) => {
  try {
    await downloadReceipt(invoiceId);
    showToast?.('Receipt downloaded successfully', 'success');
  } catch (err) {
    showToast?.(getErrorMessage(err, 'Failed to download receipt'), 'error');
    throw err;
  }
};
