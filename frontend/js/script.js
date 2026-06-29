const BASE_URL = 'http://localhost:3000'; 

// Dropdown & Navigasi
async function switchTab(tabId) {
    document.querySelectorAll('.section-panel').forEach(panel => panel.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    event.target.classList.add('active');
    
    await fetchDropdownData();

    if(tabId === 'users') loadUsers();
    if(tabId === 'accounts') loadAccounts();
    if(tabId === 'services') loadServices();
    if(tabId === 'orders') loadOrders();
    if(tabId === 'payments') loadPayments();
}

async function fetchDropdownData() {
    try {
        const [usersRes, accountsRes, servicesRes, ordersRes] = await Promise.all([
            fetch(`${BASE_URL}/users`),
            fetch(`${BASE_URL}/game_accounts`),
            fetch(`${BASE_URL}/services`),
            fetch(`${BASE_URL}/orders`)
        ]);

        const users = await usersRes.json();
        const accounts = await accountsRes.json();
        const services = await servicesRes.json();
        const orders = await ordersRes.json();

        let htmlCustomer = '<option value="">-- Pilih Customer --</option>';
        let htmlWorker = '<option value="">-- Pilih Worker --</option>';
        users.forEach(u => {
            if(u.role === 'customer') htmlCustomer += `<option value="${u._id}">${u.nama_lengkap} (@${u.username})</option>`;
            if(u.role === 'worker' || u.role === 'admin') htmlWorker += `<option value="${u._id}">${u.nama_lengkap} (@${u.username})</option>`;
        });
        
        const accCustDropdown = document.getElementById('acc_customer_id');
        const ordCustDropdown = document.getElementById('ord_customer_id');
        const ordWorkerDropdown = document.getElementById('ord_worker_id');
        if(accCustDropdown) accCustDropdown.innerHTML = htmlCustomer;
        if(ordCustDropdown) ordCustDropdown.innerHTML = htmlCustomer;
        if(ordWorkerDropdown) ordWorkerDropdown.innerHTML = htmlWorker;

        let htmlAccount = '<option value="">-- Pilih Akun --</option>';
        accounts.forEach(acc => {
            const ownerName = acc.customer_id ? acc.customer_id.nama_lengkap : 'Tanpa Pemilik';
            htmlAccount += `<option value="${acc._id}">UID: ${acc.uid_hsr} (${acc.server}) - Milik: ${ownerName}</option>`;
        });
        const ordAccDropdown = document.getElementById('ord_account_id');
        if(ordAccDropdown) ordAccDropdown.innerHTML = htmlAccount;

        let htmlService = '';
        services.forEach(svc => {
            htmlService += `<option value="${svc._id}">${svc.nama_layanan} - Rp${svc.harga}</option>`;
        });
        const ordSvcDropdown = document.getElementById('ord_layanan_dipesan');
        if(ordSvcDropdown) ordSvcDropdown.innerHTML = htmlService;

        let htmlOrder = '<option value="">-- Pilih Invoice --</option>';
        orders.forEach(ord => {
            const ownerName = ord.customer_id ? ord.customer_id.nama_lengkap : 'Tanpa Pemilik';
            htmlOrder += `<option value="${ord._id}">${ord.nomor_invoice} (Rp${ord.total_harga}) - Milik: ${ownerName}</option>`;
        });
        const payOrdDropdown = document.getElementById('pay_order_id');
        if(payOrdDropdown) payOrdDropdown.innerHTML = htmlOrder;

        const payCustDropdown = document.getElementById('pay_customer_id');
        if(payCustDropdown) payCustDropdown.innerHTML = htmlCustomer;

    } catch (err) {
        console.error("Gagal menarik data relasi", err);
    }
}

// CRUD Users
let editUserId = null;
async function loadUsers() {
    const res = await fetch(`${BASE_URL}/users`);
    const data = await res.json();
    const list = document.getElementById('userList');
    list.innerHTML = '';
    data.reverse().forEach(item => {
        list.innerHTML += `
            <li class="data-item">
                <div class="data-info">
                    <h4>${item.nama_lengkap} (@${item.username})</h4>
                    <p>${item.email} | WA: ${item.no_wa || '-'} | Role: ${item.role}</p>
                </div>
                <div class="action-btns">
                    <button class="btn-edit" onclick='editUser(${JSON.stringify(item)})'>Edit</button>
                    <button class="btn-delete" onclick='deleteUser("${item._id}")'>Hapus</button>
                </div>
            </li>`;
    });
}
document.getElementById('userForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = { 
        nama_lengkap: document.getElementById('nama_lengkap').value, 
        username: document.getElementById('username').value, 
        email: document.getElementById('email').value, 
        password: document.getElementById('password').value, 
        role: document.getElementById('role').value,
        no_wa: document.getElementById('no_wa') ? document.getElementById('no_wa').value : ''
    };
    const method = editUserId ? 'PUT' : 'POST';
    const url = editUserId ? `${BASE_URL}/users/${editUserId}` : `${BASE_URL}/users`;
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    editUserId = null; document.getElementById('userForm').reset(); loadUsers();
});
function editUser(item) {
    document.getElementById('nama_lengkap').value = item.nama_lengkap; 
    document.getElementById('username').value = item.username; 
    document.getElementById('email').value = item.email; 
    if(document.getElementById('password')) document.getElementById('password').value = item.password || ''; 
    document.getElementById('role').value = item.role;
    if(document.getElementById('no_wa')) document.getElementById('no_wa').value = item.no_wa || '';
    editUserId = item._id; 
}
async function deleteUser(id) { 
    if(id && confirm('Hapus user ini?')) { await fetch(`${BASE_URL}/users/${id}`, { method: 'DELETE' }); loadUsers(); } 
}

// CRUD Game Accounts
let editUid = null;
async function loadAccounts() {
    const res = await fetch(`${BASE_URL}/game_accounts`);
    const data = await res.json();
    const list = document.getElementById('accountList');
    list.innerHTML = '';
    data.reverse().forEach(item => {
        const customerName = item.customer_id ? item.customer_id.nama_lengkap : '-';
        list.innerHTML += `
            <li class="data-item">
                <div class="data-info">
                    <h4>UID: ${item.uid_hsr} (${item.server})</h4>
                    <p>Pemilik: ${customerName} | Lvl: ${item.level} | ${item.email_akun}</p>
                </div>
                <div class="action-btns">
                    <button class="btn-edit" onclick='editAccount(${JSON.stringify(item)})'>Edit</button>
                    <button class="btn-delete" onclick='deleteAccount("${item.uid_hsr}")'>Hapus</button>
                </div>
            </li>`;
    });
}
document.getElementById('accountForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = { 
        customer_id: document.getElementById('acc_customer_id').value, 
        uid_hsr: document.getElementById('uid_hsr').value, 
        server: document.getElementById('server').value, 
        level: document.getElementById('level').value, 
        login_via: document.getElementById('login_via').value, 
        email_akun: document.getElementById('email_akun') ? document.getElementById('email_akun').value : '',
        password: document.getElementById('acc_password') ? document.getElementById('acc_password').value : '' 
    };
    const method = editUid ? 'PUT' : 'POST';
    const url = editUid ? `${BASE_URL}/game_accounts/${editUid}` : `${BASE_URL}/game_accounts`;
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    editUid = null; document.getElementById('accountForm').reset(); loadAccounts();
});
function editAccount(item) {
    if(item.customer_id) document.getElementById('acc_customer_id').value = item.customer_id._id || item.customer_id;
    document.getElementById('uid_hsr').value = item.uid_hsr; 
    document.getElementById('server').value = item.server; 
    document.getElementById('level').value = item.level; 
    document.getElementById('login_via').value = item.login_via; 
    if(document.getElementById('email_akun')) document.getElementById('email_akun').value = item.email_akun || '';
    if(document.getElementById('acc_password')) document.getElementById('acc_password').value = item.password || '';
    editUid = item.uid_hsr; 
}
async function deleteAccount(uid) { 
    if(uid && confirm('Hapus akun ini?')) { await fetch(`${BASE_URL}/game_accounts/${uid}`, { method: 'DELETE' }); loadAccounts(); } 
}

// CRUD Services
let editServiceId = null; // PERUBAHAN 1: Gunakan ID sebagai acuan

async function loadServices() {
    const res = await fetch(`${BASE_URL}/services`);
    const data = await res.json();
    const list = document.getElementById('serviceList');
    list.innerHTML = '';
    data.reverse().forEach(item => {
        list.innerHTML += `
            <li class="data-item">
                <div class="data-info">
                    <h4>${item.nama_layanan}</h4>
                    <p>${item.kategori} | Rp${item.harga} | ${item.durasi_pengerjaan} Hari</p>
                </div>
                <div class="action-btns">
                    <button class="btn-edit" onclick='editService(${JSON.stringify(item)})'>Edit</button>
                    <button class="btn-delete" onclick='deleteService("${item._id}")'>Hapus</button>
                </div>
            </li>`;
    });
}

document.getElementById('serviceForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = { 
        kategori: document.getElementById('kategori').value, 
        nama_layanan: document.getElementById('nama_layanan').value, 
        // Pastikan angka dikonversi menjadi Number agar Mongoose tidak error 400
        harga: Number(document.getElementById('harga').value), 
        durasi_pengerjaan: Number(document.getElementById('durasi_pengerjaan').value), 
        deskripsi_layanan: document.getElementById('deskripsi_layanan').value, 
        is_active: true 
    };
    
    // PERUBAHAN 3: Arahkan URL ke /:_id
    const method = editServiceId ? 'PUT' : 'POST';
    const url = editServiceId ? `${BASE_URL}/services/${editServiceId}` : `${BASE_URL}/services`;
    
    try {
        const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!response.ok) {
            const errorData = await response.json();
            alert("Gagal menyimpan: " + (errorData.error || errorData.message));
            return;
        }
        editServiceId = null; 
        document.getElementById('serviceForm').reset(); 
        loadServices();
    } catch (error) {
        console.error(error);
    }
});

function editService(item) {
    document.getElementById('kategori').value = item.kategori; 
    document.getElementById('nama_layanan').value = item.nama_layanan; 
    document.getElementById('harga').value = item.harga; 
    document.getElementById('durasi_pengerjaan').value = item.durasi_pengerjaan; 
    document.getElementById('deskripsi_layanan').value = item.deskripsi_layanan; 
    
    // PERUBAHAN 4: Simpan _id
    editServiceId = item._id; 
}

// PERUBAHAN 5: Tangkap parameter id
async function deleteService(id) { 
    if(id && confirm('Hapus layanan ini?')) { 
        await fetch(`${BASE_URL}/services/${id}`, { method: 'DELETE' }); 
        loadServices(); 
    } 
}

// CRUD Orders
let editOrderId = null;
async function loadOrders() {
    const res = await fetch(`${BASE_URL}/orders`);
    const data = await res.json();
    const list = document.getElementById('orderList');
    list.innerHTML = '';
    data.reverse().forEach(item => {
        const workerName = item.worker_id ? item.worker_id.nama_lengkap : '-';
        const customerName = item.customer_id ? item.customer_id.nama_lengkap : '-';
        list.innerHTML += `
            <li class="data-item">
                <div class="data-info">
                    <h4>${item.nomor_invoice} - ${item.status_order}</h4>
                    <p>Cust: ${customerName} | Worker: ${workerName} | Rp${item.total_harga}</p>
                </div>
                <div class="action-btns">
                    <button class="btn-edit" onclick='editOrder(${JSON.stringify(item)})'>Edit</button>
                    <button class="btn-delete" onclick='deleteOrder("${item._id}")'>Hapus</button>
                </div>
            </li>`;
    });
}
document.getElementById('orderForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const selectLayanan = document.getElementById('ord_layanan_dipesan');
    const selectedLayanan = Array.from(selectLayanan.selectedOptions).map(opt => opt.value);

    // Mencegah error Cast to ObjectId di Mongoose dengan memberikan || null
    const payload = { 
        nomor_invoice: document.getElementById('nomor_invoice').value, 
        customer_id: document.getElementById('ord_customer_id').value || null,
        account_id: document.getElementById('ord_account_id').value || null,
        worker_id: document.getElementById('ord_worker_id').value || null,
        layanan_dipesan: selectedLayanan,
        total_harga: document.getElementById('total_harga').value, 
        status_order: document.getElementById('status_order').value, 
        catatan_khusus: document.getElementById('catatan_khusus').value 
    };
    
    const method = editOrderId ? 'PUT' : 'POST';
    const url = editOrderId ? `${BASE_URL}/orders/${editOrderId}` : `${BASE_URL}/orders`;
    
    try {
        const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        
        // Pengecekan agar jika gagal, tabel tidak hilang
        if (!response.ok) {
            const errorData = await response.json();
            alert("Gagal menyimpan: " + (errorData.error || errorData.message));
            return;
        }

        editOrderId = null; 
        document.getElementById('orderForm').reset(); 
        loadOrders();
    } catch (error) {
        alert("Terjadi kesalahan jaringan/server!");
    }
});
function editOrder(item) {
    document.getElementById('nomor_invoice').value = item.nomor_invoice;
    if(item.customer_id) document.getElementById('ord_customer_id').value = item.customer_id._id || item.customer_id;
    if(item.worker_id) document.getElementById('ord_worker_id').value = item.worker_id._id || item.worker_id;
    if(item.account_id) document.getElementById('ord_account_id').value = item.account_id._id || item.account_id;
    
    const selectLayanan = document.getElementById('ord_layanan_dipesan');
    if(item.layanan_dipesan) {
        const layananIds = item.layanan_dipesan.map(s => s._id || s);
        Array.from(selectLayanan.options).forEach(opt => { opt.selected = layananIds.includes(opt.value); });
    }
    document.getElementById('total_harga').value = item.total_harga; 
    document.getElementById('status_order').value = item.status_order; 
    document.getElementById('catatan_khusus').value = item.catatan_khusus;
    editOrderId = item._id; 
}
async function deleteOrder(id) { 
    if(id && confirm('Hapus pesanan ini?')) { await fetch(`${BASE_URL}/orders/${id}`, { method: 'DELETE' }); loadOrders(); } 
}

// CRUD Payments
let editPaymentId = null; // Ubah acuan menjadi ID

async function loadPayments() {
    const res = await fetch(`${BASE_URL}/payments`);
    const data = await res.json();
    const list = document.getElementById('paymentList');
    list.innerHTML = '';
    data.reverse().forEach(item => {
        const orderRef = item.order_id ? item.order_id.nomor_invoice : '-';
        const customerName = item.customer_id ? item.customer_id.nama_lengkap : '-';
        list.innerHTML += `
            <li class="data-item">
                <div class="data-info">
                    <h4>Struk: ${item.nomor_invoice} - ${item.status_pembayaran}</h4>
                    <p>Pembayar: ${customerName} | Order INV: ${orderRef} | Metode: ${item.metode_pembayaran} | Rp${item.jumlah_dibayar}</p>
                </div>
                <div class="action-btns">
                    <button class="btn-edit" onclick='editPayment(${JSON.stringify(item)})'>Edit</button>
                    <button class="btn-delete" onclick='deletePayment("${item._id}")'>Hapus</button>
                </div>
            </li>`;
    });
}

document.getElementById('paymentForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = { 
        nomor_invoice: document.getElementById('pay_invoice').value, 
        customer_id: document.getElementById('pay_customer_id').value, 
        order_id: document.getElementById('pay_order_id').value, 
        metode_pembayaran: document.getElementById('metode_pembayaran').value, 
        jumlah_dibayar: document.getElementById('jumlah_dibayar').value, 
        status_pembayaran: document.getElementById('status_pembayaran').value,
        bukti_transfer: document.getElementById('bukti_transfer') ? document.getElementById('bukti_transfer').value : '' 
    };
    
    // PERUBAHAN: Mengecek editPaymentId dan mengarahkannya ke URL /:_id
    const method = editPaymentId ? 'PUT' : 'POST';
    const url = editPaymentId ? `${BASE_URL}/payments/${editPaymentId}` : `${BASE_URL}/payments`;
    
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    
    editPaymentId = null; 
    document.getElementById('paymentForm').reset(); 
    loadPayments();
});

function editPayment(item) {
    document.getElementById('pay_invoice').value = item.nomor_invoice; 
    if(item.customer_id) document.getElementById('pay_customer_id').value = item.customer_id._id || item.customer_id;
    if(item.order_id) document.getElementById('pay_order_id').value = item.order_id._id || item.order_id;
    document.getElementById('metode_pembayaran').value = item.metode_pembayaran; 
    document.getElementById('jumlah_dibayar').value = item.jumlah_dibayar; 
    document.getElementById('status_pembayaran').value = item.status_pembayaran;
    if(document.getElementById('bukti_transfer')) document.getElementById('bukti_transfer').value = item.bukti_transfer || '';
    
    // PERUBAHAN: Menyimpan _id ke dalam variabel
    editPaymentId = item._id; 
}

// PERUBAHAN: Menerima parameter id
async function deletePayment(id) { 
    if(id && confirm('Hapus pembayaran ini?')) { 
        await fetch(`${BASE_URL}/payments/${id}`, { method: 'DELETE' }); 
        loadPayments(); 
    } 
}

// Inisialisasi awal
fetchDropdownData().then(() => {
    loadUsers(); 
});