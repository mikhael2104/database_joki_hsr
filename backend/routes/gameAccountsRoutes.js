const express = require('express');
const router = express.Router();
const GameAccount = require('../models/game_accounts');

// 1. METHOD LIHAT (Ambil Semua Data Akun Game)
router.get('/', async (req, res) => {
  try {
    const data = await GameAccount.find()
      .populate('customer_id', 'nama_lengkap username')
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2. MENAMBAH DATA (POST)
router.post('/', async (req, res) => {
  try {
    const akunBaru = new GameAccount(req.body);
    const saved = await akunBaru.save();
    res.status(201).json({ message: "Data akun game berhasil ditambah!", data: saved });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 3. CARI DATA (Berdasarkan Email Akun)
router.get('/search', async (req, res) => {
  try {
    // Menangkap query ?email=
    const keyword = req.query.email; 
    
    const hasil = await GameAccount.find({
      email_akun: { $regex: keyword, $options: 'i' } // 'i' agar tidak case-sensitive
    });

    res.json({
      message: "Hasil Pencarian Akun Game",
      data: hasil
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. CARI BERDASARKAN RANGE TERTENTU (Filter Range Level)
router.get('/filter', async (req, res) => {
  try {
    const { min, max } = req.query;
    let filter = {};

    // Logika filter rentang level akun
    if (min && max) {
      filter.level = { $gte: Number(min), $lte: Number(max) };
    } else if (min) {
      filter.level = { $gte: Number(min) };
    } else if (max) {
      filter.level = { $lte: Number(max) };
    }

    const hasil = await GameAccount.find(filter);

    res.json({
      message: `Hasil Filter Akun dengan Level ${min || 0} hingga ${max || 'Max'}`,
      data: hasil
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Method Update (PUT) berdasarkan uid_hsr
router.put('/:uid', async (req, res) => {
  try {
    const updatedAccount = await GameAccount.findOneAndUpdate(
      { uid_hsr: req.params.uid },
      { $set: req.body }, 
      { new: true } 
    );

    if (!updatedAccount) return res.status(404).json({ message: "Akun dengan UID tersebut tidak ditemukan" });
    
    res.json({ message: "Data akun berhasil diupdate!", data: updatedAccount });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 6. Method Delete berdasarkan uid_hsr
router.delete('/:uid', async (req, res) => {
  try {
    const deletedAccount = await GameAccount.findOneAndDelete({ uid_hsr: req.params.uid });
    
    if (!deletedAccount) return res.status(404).json({ message: "Akun dengan UID tersebut tidak ditemukan" });

    res.json({ message: "Data akun berhasil dihapus!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Advanced Query (Search, Filter, Sort, Pagination)
router.get('/advanced', async (req, res) => {
  try {
    const { search, server, minLevel, maxLevel, sortBy, order, page, limit } = req.query;
    let query = {};

    // Search berdasarkan email_akun
    if (search) {
      query.email_akun = { $regex: search, $options: 'i' };
    }

    // Filter berdasarkan Server dan Rentang Level
    if (server) {
      query.server = server;
    }
    if (minLevel || maxLevel) {
      query.level = {};
      if (minLevel) query.level.$gte = Number(minLevel);
      if (maxLevel) query.level.$lte = Number(maxLevel);
    }

    // Sorting
    let sortOption = {};
    if (sortBy) {
      sortOption[sortBy] = order === 'desc' ? -1 : 1;
    } else {
      sortOption['level'] = -1;
    }

    // Pagination
    const pageNumber = parseInt(page) || 1; 
    const pageSize = parseInt(limit) || 10; 
    const skip = (pageNumber - 1) * pageSize;

    // Eksekusi Query
    const hasil = await GameAccount.find(query)
                                   .sort(sortOption)
                                   .skip(skip)
                                   .limit(pageSize);

    const totalData = await GameAccount.countDocuments(query);
    const totalPages = Math.ceil(totalData / pageSize);

    res.json({
      message: "Data akun game berhasil diambil",
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