let logs = JSON.parse(localStorage.getItem('logs')) || [];
let riwayatFisik = JSON.parse(localStorage.getItem('riwayatFisik')) || [];
let profile = JSON.parse(localStorage.getItem('profile')) || { name: '', tdee: 0, height: 0 };
let currentPage = 1;
const rowsPerPage = 10;

const getTodayKey = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

updateUI();

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
}

function tambahItem() {
    const inputDate = document.getElementById('inputDate').value;
    const nama = document.getElementById('foodName').value;
    const tipe = document.getElementById('type').value;
    const kalori = parseInt(document.getElementById('calories').value);
    let tglData = inputDate ? inputDate : getTodayKey();

    if (!nama || isNaN(kalori)) return alert("Isi data dengan benar!");

    logs.push({ tanggal: tglData, nama, tipe, kalori, timestamp: new Date().getTime() });
    saveData(); currentPage = 1; updateUI();
    document.getElementById('foodName').value = ''; document.getElementById('calories').value = '';
}

function updateUI() {
    const tglHariIni = getTodayKey();

    // 1. DASHBOARD
    const tbodyLog = document.getElementById('tableBody');
    let totalIn = 0, totalOut = 0;
    if (tbodyLog) {
        tbodyLog.innerHTML = '';
        logs.forEach(item => {
            if (item.tanggal === tglHariIni) {
                if (item.tipe === 'in') totalIn += item.kalori; else totalOut += item.kalori;
                tbodyLog.innerHTML += `<tr><td class="wrap-text">${item.nama}</td><td>${item.tipe==='in'?'In':'Out'}</td>
                    <td style="color:${item.tipe==='in'?'#d9534f':'#28a745'}; font-weight:bold;">${item.tipe==='in'?'+':'-'}${item.kalori}</td></tr>`;
            }
        });
        const net = totalIn - totalOut;
        document.getElementById('dashIn').innerText = totalIn;
        document.getElementById('dashOut').innerText = totalOut;
        document.getElementById('dashNet').innerHTML = `${net} kcal <span style="color:${net < 0 ? '#28a745' : '#d9534f'}">${net < 0 ? '(Defisit)' : '(Surplus)'}</span>`;
    }

    // 2. ARSIP + PAGINATION
    const archiveBody = document.getElementById('archiveTableBody');
    if (archiveBody) {
        archiveBody.innerHTML = '';
        let sortedLogs = logs.map((item, index) => ({...item, originalIndex: index}))
                             .sort((a, b) => b.tanggal.localeCompare(a.tanggal) || b.timestamp - a.timestamp);
        
        const start = (currentPage - 1) * rowsPerPage;
        const paginatedItems = sortedLogs.slice(start, start + rowsPerPage);

        paginatedItems.forEach(item => {
            const tglObj = new Date(item.tanggal);
            const tglDisp = isNaN(tglObj) ? item.tanggal : tglObj.toLocaleDateString('id-ID');
            archiveBody.innerHTML += `<tr>
                <td><small>${tglDisp}</small></td>
                <td class="wrap-text">${item.nama}</td>
                <td>${item.tipe==='in'?'In':'Out'}</td>
                <td>${item.kalori}</td>
                <td>
                    <button class="btn-edit" onclick="bukaEdit(${item.originalIndex})">✎</button>
                    <button class="btn-hapus" onclick="hapusLog(${item.originalIndex})">x</button>
                </td>
            </tr>`;
        });
        renderPagination(sortedLogs.length);
    }
    renderRekapAndProfile();
}

function renderRekapAndProfile() {
    const rekapBody = document.getElementById('rekapTableBody');
    if (rekapBody) {
        rekapBody.innerHTML = '';
        const rekap = {};
        logs.forEach(item => {
            if (!rekap[item.tanggal]) rekap[item.tanggal] = { in: 0, out: 0 };
            rekap[item.tanggal][item.tipe] += item.kalori;
        });
        Object.keys(rekap).sort((a, b) => b.localeCompare(a)).forEach(tgl => {
            const d = rekap[tgl]; const net = d.in - d.out;
            const color = net < 0 ? '#28a745' : net > 0 ? '#d9534f' : '#007bff';
            const tglObj = new Date(tgl);
            const tglDisp = isNaN(tglObj) ? tgl : tglObj.toLocaleDateString('id-ID');
            rekapBody.innerHTML += `<tr><td><b>${tglDisp}</b></td>
                <td>${d.in}</td><td>${d.out}</td><td style="color:${color}; font-weight:bold">${net}</td>
                <td style="color:${color}">${net < 0 ? 'Defisit' : net > 0 ? 'Surplus' : 'Seimbang'}</td></tr>`;
        });
    }

    const tbodyBmr = document.getElementById('bmrTableBody');
    if (tbodyBmr) {
        tbodyBmr.innerHTML = '';
        [...riwayatFisik].sort((a,b) => b.tanggal.localeCompare(a.tanggal)).forEach(item => {
            const idx = riwayatFisik.findIndex(x => x === item);
            tbodyBmr.innerHTML += `<tr><td>${new Date(item.tanggal).toLocaleDateString('id-ID')}</td>
                <td>${item.berat} kg</td><td>${item.tdee}</td><td><button class="btn-hapus" onclick="hapusBMR(${idx})">x</button></td></tr>`;
        });
    }
    document.getElementById('dispTdee').value = (profile.tdee || 0) + " kcal";
    if (profile.height) document.getElementById('idealWeight').innerText = ((profile.height - 100) * 0.9).toFixed(1);
}

function bukaEdit(i) {
    const item = logs[i];
    document.getElementById('editIndex').value = i;
    document.getElementById('editDate').value = item.tanggal;
    document.getElementById('editName').value = item.nama;
    document.getElementById('editType').value = item.tipe;
    document.getElementById('editCalories').value = item.kalori;
    document.getElementById('editModal').classList.add('active');
}
function tutupModal() { document.getElementById('editModal').classList.remove('active'); }
function simpanEdit() {
    const i = document.getElementById('editIndex').value;
    logs[i] = { ...logs[i], tanggal: document.getElementById('editDate').value, nama: document.getElementById('editName').value, tipe: document.getElementById('editType').value, kalori: parseInt(document.getElementById('editCalories').value) };
    saveData(); updateUI(); tutupModal();
}

function hitungBMR() {
    const w = parseFloat(document.getElementById('bmr-weight').value), h = parseFloat(document.getElementById('bmr-height').value), a = parseInt(document.getElementById('bmr-age').value);
    const g = document.getElementById('gender').value, act = parseFloat(document.getElementById('activity').value), tgl = document.getElementById('bmrDate').value || getTodayKey();
    if (!w || !h) return;
    let bmrVal = (10 * w) + (6.25 * h) - (5 * a) + (g === 'male' ? 5 : -161);
    let tdee = Math.round(bmrVal * act);
    riwayatFisik.push({ tanggal: tgl, berat: w, tdee });
    profile = { ...profile, height: h, tdee: tdee };
    saveData(); updateUI();
}

function exportData() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ logs, riwayatFisik, profile }));
    const dl = document.createElement('a'); dl.setAttribute("href", dataStr); dl.setAttribute("download", `backup_diet_${getTodayKey()}.json`); dl.click();
}
function importData(e) {
    const reader = new FileReader(); reader.onload = (ev) => {
        const data = JSON.parse(ev.target.result); logs = data.logs; riwayatFisik = data.riwayatFisik; profile = data.profile;
        saveData(); updateUI(); alert("Import Berhasil!");
    }; reader.readAsText(e.target.files[0]);
}

function renderPagination(total) {
    const ctrl = document.getElementById('paginationCtrl'); const pages = Math.ceil(total / rowsPerPage);
    ctrl.innerHTML = ''; if (pages > 1) { for (let i = 1; i <= pages; i++) ctrl.innerHTML += `<button class="${i === currentPage ? 'active-page' : ''}" onclick="changePage(${i})">${i}</button>`; }
}
function changePage(p) { currentPage = p; updateUI(); }
function saveData() { localStorage.setItem('logs', JSON.stringify(logs)); localStorage.setItem('riwayatFisik', JSON.stringify(riwayatFisik)); localStorage.setItem('profile', JSON.stringify(profile)); }
function hapusLog(i) { if(confirm("Hapus?")) { logs.splice(i,1); saveData(); updateUI(); } }
function hapusBMR(i) { if(confirm("Hapus?")) { riwayatFisik.splice(i,1); saveData(); updateUI(); } }
function saveProfile() { profile.name = document.getElementById('profName').value; saveData(); }