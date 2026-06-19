const express = require('express');
const mongoose = require('mongoose');
const cors = require("cors");

// Import Route
const serviceRoutes = require('./routes/servicesRoutes');
const orderRoutes = require('./routes/ordersRoutes');
const gameAccountRoutes = require('./routes/gameAccountsRoutes');
const userRoutes = require('./routes/usersRoutes');
const paymentRoutes = require('./routes/paymentsRoutes');

const app = express();
const PORT = 3000;

app.use(cors())
app.use(express.json()); // Middleware agar bisa baca JSON

// Koneksi ke Database Joki HSR
mongoose.connect('mongodb://localhost:27017/joki_hsr')
  .then(() => console.log('Terhubung ke MongoDB joki_hsr!'))
  .catch(err => console.error("Gagal terkoneksi:", err));

// Route Dasar
app.get('/', (req, res) => {
  res.send('API Sistem Joki HSR Aktif!');
});

// Daftarkan Route Collection
app.use('/services', serviceRoutes);
app.use('/orders', orderRoutes);
app.use('/game_accounts', gameAccountRoutes);
app.use('/users', userRoutes);
app.use('/payments', paymentRoutes);

// Jalankan Server
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});