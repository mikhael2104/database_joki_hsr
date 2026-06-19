const mongoose = require('mongoose');

const Game_AccountSchema = new mongoose.Schema({
  customer_id: {type: mongoose.Schema.Types.ObjectId, ref: 'users'},
  uid_hsr: Number,
  server: String,
  level: Number,
  login_via: String,
  email_akun: String,
  password: String
});

module.exports = mongoose.model('game_accounts', Game_AccountSchema);