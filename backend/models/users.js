const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  nama_lengkap: String,
  username: String,
  email: String,
  no_wa: Number,
  role: String,
  tanggal_daftar: Date
});

module.exports = mongoose.model('users', UserSchema);