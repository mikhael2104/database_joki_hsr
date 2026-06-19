const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  order_id: {type: mongoose.Schema.Types.ObjectId, ref: 'orders'},
  customer_id: {type: mongoose.Schema.Types.ObjectId, ref: 'users'},
  nomor_invoice: String,
  metode_pembayaran: String,
  jumlah_dibayar: Number,
  status_pembayaran: String,
  bukti_transfer: String,
  tanggal_pembayaran: Date
});

module.exports = mongoose.model('payments', PaymentSchema);