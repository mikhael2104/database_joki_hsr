const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  nomor_invoice: String,
  worker_id: {type: mongoose.Schema.Types.ObjectId, ref: 'users'},
  customer_id: {type: mongoose.Schema.Types.ObjectId, ref: 'users'},
  account_id: {type: mongoose.Schema.Types.ObjectId, ref: 'game_accounts'},
  layanan_dipesan: [{type: mongoose.Schema.Types.ObjectId, ref: 'services'}],
  total_harga: Number,
  status_order: String,
  catatan_khusus: String,
  tanggal_order: Date,
  tanggal_selesai: Date
});

module.exports = mongoose.model('orders', OrderSchema);