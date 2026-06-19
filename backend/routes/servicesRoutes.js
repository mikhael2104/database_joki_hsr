const express = require('express');
const router = express.Router();
const Service = require('../models/services');

// 1. METHOD LIHAT (Ambil Semua Data)
router.get('/', async (req, res) => {
  try {
    const data = await Service.find();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2. MENAMBAH DATA (POST)
router.post('/', async (req, res) => {
  try {
    const serviceBaru = new Service(req.body);
    const saved = await serviceBaru.save();
    res.status(201).json({ message: "Data berhasil ditambah!", data: saved });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 3. CARI DATA (Berdasarkan Kata Kunci Nama Layanan)
router.get('/search', async (req, res) => {
  try {
    // Menangkap query ?nama=
    const keyword = req.query.kategori; 
    
    const hasil = await Service.find({
      kategori: { $regex: keyword, $options: 'i' } // 'i' agar tidak case-sensitive
    });

    res.json({
      message: "Hasil Pencarian Kategori",
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
      filter.harga = { $gte: Number(min), $lte: Number(max) };
    } else if (min) {
      filter.harga = { $gte: Number(min) };
    } else if (max) {
      filter.harga = { $lte: Number(max) };
    }

    const hasil = await Service.find(filter);

    res.json({
      message: `Hasil Filter Harga dari ${min || 0} hingga ${max || '~'}`,
      data: hasil
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Method Put untuk melakukan update
router.put('/:_id', async (req, res) => {
  try {
    const updatedService = await Service.findOneAndUpdate(
      { _id: req.params._id },
      { $set: req.body }, 
      { returnDocument: 'after' } 
    );

    if (!updatedService) return res.status(404).json({ message: "ID tidak ditemukan" });
    
    res.json({ message: "Layanan berhasil diupdate!", data: updatedService });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 6. Method Delete berdasarkan nama_layanan
router.delete('/:_id', async (req, res) => {
  try {
    const deletedService = await Service.findOneAndDelete({ _id: req.params._id });
    
    if (!deletedService) return res.status(404).json({ message: "ID tidak ditemukan" });

    res.json({ message: "Layanan berhasil dihapus!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Advanced Query (Search, Filter, Sort, Pagination)
router.get('/advanced', async (req, res) => {
  try {
    const { search, kategori, minHarga, maxHarga, statusAktif, sortBy, order, page, limit } = req.query;
    let query = {};

    // Search berdasarkan nama_layanan
    if (search) {
      query.nama_layanan = { $regex: search, $options: 'i' };
    }

    // Filter berdasarkan Kategori, Status Aktif, dan Rentang Harga
    if (kategori) query.kategori = kategori;
    if (statusAktif !== undefined) query.is_active = statusAktif === 'true';
    
    if (minHarga || maxHarga) {
      query.harga = {};
      if (minHarga) query.harga.$gte = Number(minHarga);
      if (maxHarga) query.harga.$lte = Number(maxHarga);
    }

    // Sorting
    let sortOption = {};
    if (sortBy) {
      sortOption[sortBy] = order === 'desc' ? -1 : 1;
    } else {
      sortOption['harga'] = 1; // Default: dari harga termurah
    }

    // Pagination
    const pageNumber = parseInt(page) || 1; 
    const pageSize = parseInt(limit) || 10; 
    const skip = (pageNumber - 1) * pageSize;

    const hasil = await Service.find(query).sort(sortOption).skip(skip).limit(pageSize);
    const totalData = await Service.countDocuments(query);
    const totalPages = Math.ceil(totalData / pageSize);

    res.json({
      message: "Data layanan berhasil diambil",
      metadata: { total_data: totalData, halaman_saat_ini: pageNumber, total_halaman: totalPages, data_per_halaman: pageSize },
      data: hasil
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;