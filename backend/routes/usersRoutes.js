const express = require('express');
const router = express.Router();
const User = require('../models/users');

// 1. METHOD LIHAT (Ambil Semua Data)
router.get('/', async (req, res) => {
  try {
    const data = await User.find();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2. MENAMBAH DATA (POST)
router.post('/', async (req, res) => {
  try {
    const userBaru = new User(req.body);
    const saved = await userBaru.save();
    res.status(201).json({ message: "Data berhasil ditambah!", data: saved });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 3. CARI DATA (Berdasarkan Kata Kunci Nama Layanan)
router.get('/search', async (req, res) => {
  try {
    // Menangkap query ?nama=
    const keyword = req.query.username; 
    
    const hasil = await User.find({
      username: { $regex: keyword, $options: 'i' } // 'i' agar tidak case-sensitive
    });

    res.json({
      message: "Hasil Pencarian Layanan",
      data: hasil
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. METHOD UPDATE (PUT)
router.put('/:_id', async (req, res) => {
  try {
    const updatedUser = await User.findOneAndUpdate(
      { _id: req.params._id }, // Mencari berdasarkan id
      { $set: req.body }, // Mengupdate field sesuai dengan body JSON
      { new: true } // Mengembalikan data terbaru setelah di-update
    );

    if (!updatedUser) return res.status(404).json({ message: "ID tidak ditemukan" });
    
    res.json({ message: "Data berhasil diupdate!", data: updatedUser });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 6. METHOD DELETE 
router.delete('/:_id', async (req, res) => {
  try {
    const deletedUser = await User.findOneAndDelete({ _id: req.params._id });
    
    if (!deletedUser) return res.status(404).json({ message: "ID tidak ditemukan" });

    res.json({ message: "Data berhasil dihapus!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. ADVANCED QUERY (Search, Filter, Sort, Pagination)
router.get('/advanced', async (req, res) => {
  try {
    const { search, role, sortBy, order, page, limit } = req.query;
    let query = {};

    // SEARCH: Mencari berdasarkan nama_lengkap atau username
    if (search) {
      query.$or = [
        { nama_lengkap: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } }
      ];
    }

    // FILTER: Berdasarkan role (admin, worker, customer)
    if (role) {
      query.role = role;
    }

    // SORTING
    let sortOption = {};
    if (sortBy) {
      sortOption[sortBy] = order === 'desc' ? -1 : 1;
    } else {
      sortOption['tanggal_daftar'] = -1; // Default dari daftar terbaru
    }

    // PAGINATION
    const pageNumber = parseInt(page) || 1; 
    const pageSize = parseInt(limit) || 10; 
    const skip = (pageNumber - 1) * pageSize;

    // Eksekusi Query
    const hasil = await User.find(query)
                            .sort(sortOption)
                            .skip(skip)
                            .limit(pageSize);

    const totalData = await User.countDocuments(query);
    const totalPages = Math.ceil(totalData / pageSize);

    res.json({
      message: "Data user berhasil diambil",
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