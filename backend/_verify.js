require('dotenv').config({ path: 'C:/USER 2/document previously/FEE MANAGEMENT SYSTEM/backend/.env' });
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { User } = require('C:/USER 2/document previously/FEE MANAGEMENT SYSTEM/backend/src/models/User');
const FeeStructure = require('C:/USER 2/document previously/FEE MANAGEMENT SYSTEM/backend/src/models/FeeStructure');
const Invoice = require('C:/USER 2/document previously/FEE MANAGEMENT SYSTEM/backend/src/models/Invoice');
require('C:/USER 2/document previously/FEE MANAGEMENT SYSTEM/backend/src/models/School');

(async () => {
  let createdFeeStruct = null;
  let createdInvoice = null;
  try {
    await mongoose.connect(process.env.MONGODB_URI, { dbName: 'fee_management' });
    const admin = await User.findOne({ email: 'schooladmin@gmail.com' }).populate('school');
    const token = jwt.sign({ id: admin._id, role: admin.role, school: admin.school._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // 1) No fee structures -> helpful message
    let res = await fetch('http://localhost:5000/api/fee-structures/generate-invoices', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ month: 2, year: 2031 }),
    });
    console.log('NO-FEE-STRUCTURES =>', res.status, await res.text());

    // 2) With fee structure -> generates
    createdFeeStruct = await FeeStructure.create({
      school: admin.school._id, student: '6a1d0e00e7cb007efea57612', monthlyFee: 100,
    });
    res = await fetch('http://localhost:5000/api/fee-structures/generate-invoices', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ month: 3, year: 2031 }),
    });
    console.log('WITH-FEE-STRUCT =>', res.status, await res.text());
    createdInvoice = await Invoice.findOne({ school: admin.school._id, student: '6a1d0e00e7cb007efea57612', term: 'March 2031' });
    console.log('VERIFY invoice:', createdInvoice ? `ok amount=${createdInvoice.amount} status=${createdInvoice.status}` : 'MISSING');
  } catch (err) {
    console.error('ERROR:', err.message);
  } finally {
    if (createdFeeStruct) await FeeStructure.deleteOne({ _id: createdFeeStruct._id }).catch(() => {});
    if (createdInvoice) await Invoice.deleteOne({ _id: createdInvoice._id }).catch(() => {});
    await mongoose.disconnect();
  }
})();