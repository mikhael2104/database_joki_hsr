const express = require('express');
const router = express.Router();
const Payments = require('../models/payments');
const Order = require('../models/orders');

// 1. METHOD LIHAT (Ambil Semua Data)
router.get('/', async (req, res) => {
  try {
    const data = await Payments.find()
      .populate('order_id', 'nomor_invoice total_harga status_order')
      .populate('customer_id', 'nama_lengkap')
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2. MENAMBAH DATA (POST)
router.post('/', async (req, res) => {
  try {
    const paymentBaru = new Payments(req.body);
    const saved = await paymentBaru.save();
    res.status(201).json({ message: "Data berhasil ditambah!", data: saved });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 3. CARI DATA (Berdasarkan Kata Kunci Nama Layanan)
router.get('/search', async (req, res) => {
  try {
    // Menangkap query ?nama=
    const keyword = req.query.metode_pembayaran; 
    
    const hasil = await Payments.find({
      metode_pembayaran: { $regex: keyword, $options: 'i' } // 'i' agar tidak case-sensitive
    });

    res.json({
      message: "Hasil Pencarian Layanan",
      data: hasil
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. CARI BERDASARKAN RANGE TERTENTU (Filter Range Harga)
router.get('/filter', async (req, res) => {
  try {
    const { min, max } = req.query;
    let filter = {};

    // Logika jika ada parameter min dan/atau max
    if (min && max) {
      filter.jumlah_dibayar = { $gte: Number(min), $lte: Number(max) };
    } else if (min) {
      filter.jumlah_dibayar = { $gte: Number(min) };
    } else if (max) {
      filter.jumlah_dibayar = { $lte: Number(max) };
    }

    const hasil = await Payments.find(filter);

    res.json({
      message: `Hasil Filter jumlah bayar dari ${min || 0} hingga ${max || '~'}`,
      data: hasil
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Method Update (PUT) berdasarkan nomor_invoice
router.put('/:_id', async (req, res) => {
  try {
    const updatedPayment = await Payments.findOneAndUpdate(
      { _id: req.params._id },
      { $set: req.body }, 
      { new: true } 
    );

    if (!updatedPayment) return res.status(404).json({ message: "Invoice tidak ditemukan" });
    
    res.json({ message: "Data pembayaran berhasil diupdate!", data: updatedPayment });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 6. Method Delete berdasarkan nomor_invoice
router.delete('/:_id', async (req, res) => {
  try {
    const deletedPayment = await Payments.findOneAndDelete({ _id: req.params._id });
    
    if (!deletedPayment) return res.status(404).json({ message: "ID tidak ditemukan" });

    res.json({ message: "Data pembayaran berhasil dihapus!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Advanced Query (Search, Filter, Sort, Pagination)
router.get('/advanced', async (req, res) => {
  try {
    const { search, status, metode, sortBy, order, page, limit } = req.query;
    let query = {};

    // Search berdasarkan nomor_invoice
    if (search) {
      query.nomor_invoice = { $regex: search, $options: 'i' };
    }

    // Filter berdasarkan status dan metode pembayaran
    if (status) query.status_pembayaran = status;
    if (metode) query.metode_pembayaran = metode;

    // Sorting
    let sortOption = {};
    if (sortBy) {
      sortOption[sortBy] = order === 'desc' ? -1 : 1;
    } else {
      sortOption['tanggal_pembayaran'] = -1; // Default: transaksi terbaru
    }

    // Pagination
    const pageNumber = parseInt(page) || 1; 
    const pageSize = parseInt(limit) || 10; 
    const skip = (pageNumber - 1) * pageSize;

    const hasil = await Payments.find(query).sort(sortOption).skip(skip).limit(pageSize);
    const totalData = await Payments.countDocuments(query);
    const totalPages = Math.ceil(totalData / pageSize);

    res.json({
      message: "Data pembayaran berhasil diambil",
      metadata: { total_data: totalData, halaman_saat_ini: pageNumber, total_halaman: totalPages, data_per_halaman: pageSize },
      data: hasil
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;