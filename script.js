// --- 1. INITIAL STATE ---
let logs = JSON.parse(localStorage.getItem('logs')) || [];
let riwayatFisik = JSON.parse(localStorage.getItem('riwayatFisik')) || [];
let profile = JSON.parse(localStorage.getItem('profile')) || { name: '', age: 0, weight: 0, height: 0, bmr: 0, tdee: 0 };
let currentPage = 1;
const rowsPerPage = 10;

// Fungsi Tanggal Lokal (WIB) untuk Nama File & Filter Dashboard
const getTodayKey = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

updateUI();

// --- 2. NAVIGATION ---
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
}

// --- 3. INPUT LOGIC ---
function tambahItem() {
    const inputDate = document.getElementById('inputDate').value;
    const nama = document.getElementById('foodName').value;
    const tipe = document.getElementById('type').value;
    const kalori = parseInt(document.getElementById('calories').value);
    
    let tglData = inputDate ? inputDate : getTodayKey();

    if (!nama || isNaN(kalori)) return alert("Harap isi nama dan jumlah kalori!");

    logs.push({ 
        tanggal: tglData, 
        nama, 
        tipe, 
        kalori, 
        timestamp: new Date().getTime() 
    });

    saveData();
    currentPage = 1;
    updateUI();
    
    document.getElementById('foodName').value = '';
    document.getElementById('calories').value = '';
}

// --- 4. CORE UI UPDATE ---
function updateUI() {
    const tglHariIni = getTodayKey();

    // A. DASHBOARD (Filter Hari Ini)
    const tbodyLog = document.getElementById('tableBody');
    let totalIn = 0, totalOut = 0;
    
    if (tbodyLog) {
        tbodyLog.innerHTML = '';
        logs.forEach((item) => {
            if (item.tanggal === tglHariIni) {
                if (item.tipe === 'in') totalIn += item.kalori; else totalOut += item.kalori;
                
                tbodyLog.innerHTML += `<tr>
                    <td>${item.nama}</td>
                    <td>${item.tipe === 'in' ? 'Masuk' : 'Keluar'}</td>
                    <td style="color:${item.tipe === 'in' ? '#d9534f':'#5cb85c'}; font-weight:bold;">
                        ${item.tipe === 'in' ? '+':'-'}${item.kalori}
                    </td>
                </tr>`;
            }
        });

        if (tbodyLog.innerHTML === '') {
            tbodyLog.innerHTML = '<tr><td colspan="3" style="text-align:center; color:#999; padding:20px;">Belum ada aktivitas hari ini.</td></tr>';
        }

        const net = totalIn - totalOut;
        let colorNet = net < 0 ? '#5cb85c' : net > 0 ? '#d9534f' : '#007bff';
        let ketNet = net < 0 ? '(Defisit)' : net > 0 ? '(Surplus)' : '(Seimbang)';
        
        document.getElementById('dashIn').innerText = totalIn;
        document.getElementById('dashOut').innerText = totalOut;
        document.getElementById('dashNet').innerHTML = `${net} kcal <span style="color:${colorNet}">${ketNet}</span>`;
    }

    // B. ARSIP HISTORY (Pagination & Sorting Terbaru)
    const archiveBody = document.getElementById('archiveTableBody');
    const paginCtrl = document.getElementById('paginationCtrl');
    if (archiveBody) {
        archiveBody.innerHTML = '';
        let sortedLogs = logs.map((item, index) => ({...item, originalIndex: index}))
                             .sort((a, b) => b.tanggal.localeCompare(a.tanggal) || b.timestamp - a.timestamp);
        
        const start = (currentPage - 1) * rowsPerPage;
        const paginatedItems = sortedLogs.slice(start, start + rowsPerPage);

        paginatedItems.forEach(item => {
            const tglDisp = new Date(item.tanggal).toLocaleDateString('id-ID');
            archiveBody.innerHTML += `<tr>
                <td><small>${tglDisp}</small></td>
                <td>${item.nama}</td>
                <td>${item.tipe==='in'?'In':'Out'}</td>
                <td>${item.kalori}</td>
                <td><button class="btn-hapus" onclick="hapusLog(${item.originalIndex})">x</button></td>
            </tr>`;
        });

        const totalPages = Math.ceil(sortedLogs.length / rowsPerPage);
        paginCtrl.innerHTML = '';
        if (totalPages > 1) {
            for (let i = 1; i <= totalPages; i++) {
                paginCtrl.innerHTML += `<button class="${i === currentPage ? 'active-page' : ''}" onclick="changePage(${i})">${i}</button>`;
            }
        }
    }

    renderRekapAndProfile();
}

function renderRekapAndProfile() {
    // C. REKAPITULASI (Total Per Hari + Warna)
    const rekapBody = document.getElementById('rekapTableBody');
    if (rekapBody) {
        rekapBody.innerHTML = '';
        const rekapData = {};
        logs.forEach(item => {
            if (!rekapData[item.tanggal]) rekapData[item.tanggal] = { in: 0, out: 0 };
            if (item.tipe === 'in') rekapData[item.tanggal].in += item.kalori; else rekapData[item.tanggal].out += item.kalori;
        });

        Object.keys(rekapData).sort((a, b) => b.localeCompare(a)).forEach(tgl => {
            const d = rekapData[tgl];
            const netH = d.in - d.out;
            const tglDisp = new Date(tgl).toLocaleDateString('id-ID');
            let colorStatus = netH < 0 ? '#5cb85c' : netH > 0 ? '#d9534f' : '#007bff';

            rekapBody.innerHTML += `<tr>
                <td><b>${tglDisp}</b></td>
                <td>${d.in}</td>
                <td>${d.out}</td>
                <td style="color:${colorStatus}; font-weight:bold;">${netH}</td>
            </tr>`;
        });
    }

    // D. BMR & PROFILE
    const tbodyBmr = document.getElementById('bmrTableBody');
    if (tbodyBmr) {
        tbodyBmr.innerHTML = '';
        [...riwayatFisik].sort((a,b) => b.tanggal.localeCompare(a.tanggal)).forEach((item) => {
            const origIdx = riwayatFisik.findIndex(x => x === item);
            const tglDisp = new Date(item.tanggal).toLocaleDateString('id-ID');
            tbodyBmr.innerHTML += `<tr><td>${tglDisp}</td><td>${item.berat} kg</td><td>${item.tdee}</td><td><button class="btn-hapus" onclick="hapusBMR(${origIdx})">x</button></td></tr>`;
        });
    }

    document.getElementById('profName').value = profile.name || '';
    document.getElementById('dispAge').value = profile.age ? profile.age + " Thn" : "-";
    document.getElementById('dispWeight').value = profile.weight ? profile.weight + " kg" : "-";
    document.getElementById('dispHeight').value = profile.height ? profile.height + " cm" : "-";
    document.getElementById('dispBmr').value = profile.bmr ? profile.bmr + " kcal" : "-";
    document.getElementById('dispTdee').value = profile.tdee ? profile.tdee + " kcal" : "-";
    if (profile.height > 0) {
        const ideal = (profile.height - 100) * 0.9;
        document.getElementById('idealWeight').innerText = ideal.toFixed(1);
    }
}

// --- 5. EXPORT / IMPORT (NAMA FILE BERDASARKAN TANGGAL) ---
function exportData() {
    const tgl = getTodayKey(); // Ambil tanggal hari ini (YYYY-MM-DD)
    const backupData = { logs, riwayatFisik, profile };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    
    // Nama file unik: backup_diet_2026-04-05.json
    dlAnchor.setAttribute("download", `tracker_data_${tgl}.json`); 
    
    dlAnchor.click();
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const imported = JSON.parse(e.target.result);
            if (confirm("Ganti data lama dengan data dari file backup ini?")) {
                logs = imported.logs || [];
                riwayatFisik = imported.riwayatFisik || [];
                profile = imported.profile || profile;
                saveData();
                updateUI();
                alert("Data berhasil di-import!");
            }
        } catch (err) { alert("File tidak valid!"); }
    };
    reader.readAsText(file);
}

// --- 6. BASIC FUNCTIONS ---
function hitungBMR() {
    const weight = parseFloat(document.getElementById('bmr-weight').value);
    const height = parseFloat(document.getElementById('bmr-height').value);
    const age = parseInt(document.getElementById('bmr-age').value);
    const gender = document.getElementById('gender').value;
    const act = parseFloat(document.getElementById('activity').value);
    const bmrDate = document.getElementById('bmrDate').value || getTodayKey();

    if (!weight || !height || !age) return alert("Lengkapi data!");
    let bmrVal = (10 * weight) + (6.25 * height) - (5 * age) + (gender === 'male' ? 5 : -161);
    let tdee = Math.round(bmrVal * act);
    riwayatFisik.push({ tanggal: bmrDate, berat: weight, bmr: Math.round(bmrVal), tdee });
    profile = { ...profile, age, weight, height, bmr: Math.round(bmrVal), tdee };
    saveData(); updateUI();
}

function saveData() {
    localStorage.setItem('logs', JSON.stringify(logs));
    localStorage.setItem('riwayatFisik', JSON.stringify(riwayatFisik));
    localStorage.setItem('profile', JSON.stringify(profile));
}
function changePage(p) { currentPage = p; updateUI(); }
function hapusLog(i) { if(confirm("Hapus?")) { logs.splice(i,1); saveData(); updateUI(); } }
function hapusBMR(i) { if(confirm("Hapus?")) { riwayatFisik.splice(i,1); saveData(); updateUI(); } }
function saveProfile() { profile.name = document.getElementById('profName').value; saveData(); }