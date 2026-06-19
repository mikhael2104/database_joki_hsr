const mongoose = require('mongoose');

const ServiceSchema = new mongoose.Schema({
  kategori: String,
  nama_layanan: String,
  harga: Number,
  durasi_pengerjaan: Number,
  deskripsi_layanan: String,
  is_active: Boolean
});

module.exports = mongoose.model('services', ServiceSchema);