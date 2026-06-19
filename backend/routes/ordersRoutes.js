const express = require('express');
const router = express.Router();
const Order = require('../models/orders');

// 1. METHOD LIHAT (Ambil Semua Data Order)
router.get('/', async (req, res) => {
  try {
    const data = await Order.find()
      .populate('worker_id', 'nama_lengkap username')
      .populate('customer_id', 'nama_lengkap no_whatsapp')
      .populate('account_id', 'uid_hsr server customer_id')
      .populate('layanan_dipesan', 'nama_layanan harga'); // Mengambil detail layanan
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2. MENAMBAH DATA (POST)
router.post('/', async (req, res) => {
  try {
    const orderBaru = new Order(req.body);
    const saved = await orderBaru.save();
    res.status(201).json({ message: "Data order berhasil ditambah!", data: saved });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 3. CARI DATA (Berdasarkan Nomor Invoice)
router.get('/search', async (req, res) => {
  try {
    // Menangkap query ?invoice=
    const keyword = req.query.nomor_invoice; 
    
    const hasil = await Order.find({
      nomor_invoice: { $regex: keyword, $options: 'i' } // 'i' agar tidak case-sensitive
    });

    res.json({
      message: "Hasil Pencarian Invoice",
      data: hasil
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. CARI BERDASARKAN RANGE TERTENTU (Filter Range Total Harga)
router.get('/filter', async (req, res) => {
  try {
    const { min, max } = req.query;
    let filter = {};

    // Logika filter rentang harga pesanan
    if (min && max) {
      filter.total_harga = { $gte: Number(min), $lte: Number(max) };
    } else if (min) {
      filter.total_harga = { $gte: Number(min) };
    } else if (max) {
      filter.total_harga = { $lte: Number(max) };
    }

    const hasil = await Order.find(filter);

    res.json({
      message: `Hasil Filter Pesanan dengan Total Harga ${min || 0} hingga ${max || '~'}`,
      data: hasil
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. METHOD UPDATE (PUT)
router.put('/:_id', async (req, res) => {
  try {
    const updatedOrder = await Order.findOneAndUpdate(
      { _id: req.params._id }, // Mencari berdasarkan invoice
      { $set: req.body }, // Mengupdate field sesuai dengan body JSON
      { returnDocument: 'after' } // Mengembalikan data terbaru setelah di-update
    );

    if (!updatedOrder) return res.status(404).json({ message: "ID tidak ditemukan" });
    
    res.json({ message: "Data berhasil diupdate!", data: updatedOrder });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 6. METHOD DELETE 
router.delete('/:_id', async (req, res) => {
  try {
    const deletedOrder = await Order.findOneAndDelete({ _id: req.params._id });
    
    if (!deletedOrder) return res.status(404).json({ message: "ID tidak ditemukan" });

    res.json({ message: "Data berhasil dihapus!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. ADVANCED QUERY (Search, Filter, Sort, Pagination)
router.get('/advanced', async (req, res) => {
  try {
    // 1. Tangkap semua parameter dari URL
    const { search, min, max, status, sortBy, order, page, limit } = req.query;
    
    // Objek kosong penampung query MongoDB
    let query = {};

    // 2. SEARCH: Mencari berdasarkan nomor invoice
    if (search) {
      query.nomor_invoice = { $regex: search, $options: 'i' };
    }

    // 3. FILTER: Berdasarkan rentang harga dan status
    if (min || max) {
      query.total_harga = {};
      if (min) query.total_harga.$gte = Number(min);
      if (max) query.total_harga.$lte = Number(max);
    }
    if (status) {
      query.status_order = status; // Contoh: status=Completed
    }

    // 4. SORTING: Mengurutkan data
    let sortOption = {};
    if (sortBy) {
      // Jika parameter order adalah 'desc', maka -1. Selain itu 1 (asc).
      sortOption[sortBy] = order === 'desc' ? -1 : 1;
    } else {
      // Default sorting: dari yang terbaru
      sortOption['tanggal_order'] = -1; 
    }

    // 5. PAGINATION: Membagi halaman
    const pageNumber = parseInt(page) || 1; // Default halaman 1
    const pageSize = parseInt(limit) || 10; // Default 10 data per halaman
    const skip = (pageNumber - 1) * pageSize;

    // Eksekusi Query dengan menempelkan Sort, Skip, dan Limit
    const hasil = await Order.find(query)
                             .sort(sortOption)
                             .skip(skip)
                             .limit(pageSize);

    // Menghitung total data keseluruhan untuk info paginasi
    const totalData = await Order.countDocuments(query);
    const totalPages = Math.ceil(totalData / pageSize);

    // Format Response yang rapi
    res.json({
      message: "Data berhasil diambil",
      metadata: {
        total_data: totalData,
        halaman_saat_ini: pageNumber,
        total_halaman: totalPages,
        data_per_halaman: pageSize
      },
      data: hasil
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;