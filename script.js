let logs = JSON.parse(localStorage.getItem('logs')) || [];
let riwayatFisik = JSON.parse(localStorage.getItem('riwayatFisik')) || [];
let profile = JSON.parse(localStorage.getItem('profile')) || { name: '', age: 0, weight: 0, height: 0, bmr: 0, tdee: 0 };
let currentPage = 1;
const rowsPerPage = 10;

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
    let tglFinal = inputDate ? new Date(inputDate).toLocaleDateString('id-ID') : new Date().toLocaleDateString('id-ID');

    if (!nama || isNaN(kalori)) return alert("Isi data lengkap!");

    logs.push({ tanggal: tglFinal, nama, tipe, kalori, timestamp: new Date().getTime() });
    saveData();
    currentPage = 1;
    updateUI();
    document.getElementById('foodName').value = '';
    document.getElementById('calories').value = '';
}

function hitungBMR() {
    const bmrDate = document.getElementById('bmrDate').value;
    const gender = document.getElementById('gender').value;
    const age = parseInt(document.getElementById('bmr-age').value);
    const weight = parseFloat(document.getElementById('bmr-weight').value);
    const height = parseFloat(document.getElementById('bmr-height').value);
    const act = parseFloat(document.getElementById('activity').value);

    if (!weight || !height || !age) return alert("Lengkapi data fisik!");
    let tglFinal = bmrDate ? new Date(bmrDate).toLocaleDateString('id-ID') : new Date().toLocaleDateString('id-ID');
    let bmrVal = (10 * weight) + (6.25 * height) - (5 * age) + (gender === 'male' ? 5 : -161);
    const tdeeVal = Math.round(bmrVal * act);

    riwayatFisik.push({ tanggal: tglFinal, berat: weight, bmr: Math.round(bmrVal), tdee: tdeeVal });
    profile = { ...profile, age, weight, height, bmr: Math.round(bmrVal), tdee: tdeeVal };
    saveData();
    updateUI();
}

function updateUI() {
    const tglHariIni = new Date().toLocaleDateString('id-ID');

    // 1. DASHBOARD (TANPA KOLOM AKSI)
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
        const net = totalIn - totalOut;
        document.getElementById('dashIn').innerText = totalIn;
        document.getElementById('dashOut').innerText = totalOut;
        document.getElementById('dashNet').innerHTML = `${net} kcal <small style="color:${net < 0 ? '#5cb85c':'#d9534f'}">${net < 0 ? '(Defisit)':'(Surplus)'}</small>`;
    }

    // 2. ARSIP HISTORY (DENGAN AKSI HAPUS)
    const archiveBody = document.getElementById('archiveTableBody');
    const paginCtrl = document.getElementById('paginationCtrl');
    if (archiveBody) {
        archiveBody.innerHTML = '';
        let sortedLogs = logs.map((item, index) => ({...item, originalIndex: index}))
                             .sort((a, b) => b.timestamp - a.timestamp);
        const start = (currentPage - 1) * rowsPerPage;
        const paginatedItems = sortedLogs.slice(start, start + rowsPerPage);

        paginatedItems.forEach(item => {
            archiveBody.innerHTML += `<tr><td><small>${item.tanggal}</small></td><td>${item.nama}</td><td>${item.tipe==='in'?'In':'Out'}</td>
                <td>${item.kalori}</td><td><button class="btn-hapus" onclick="hapusLog(${item.originalIndex})">x</button></td></tr>`;
        });
        const totalPages = Math.ceil(sortedLogs.length / rowsPerPage);
        paginCtrl.innerHTML = '';
        for (let i = 1; i <= totalPages; i++) {
            paginCtrl.innerHTML += `<button class="${i === currentPage ? 'active-page' : ''}" onclick="changePage(${i})">${i}</button>`;
        }
    }

    renderRekapAndProfile();
}

function changePage(p) { currentPage = p; updateUI(); }

function renderRekapAndProfile() {
    const rekapBody = document.getElementById('rekapTableBody');
    if (rekapBody) {
        rekapBody.innerHTML = '';
        const rekapData = {};
        logs.forEach(item => {
            if (!rekapData[item.tanggal]) rekapData[item.tanggal] = { in: 0, out: 0 };
            if (item.tipe === 'in') rekapData[item.tanggal].in += item.kalori; else rekapData[item.tanggal].out += item.kalori;
        });
        Object.keys(rekapData).reverse().forEach(tgl => {
            const d = rekapData[tgl];
            rekapBody.innerHTML += `<tr><td><b>${tgl}</b></td><td>${d.in}</td><td>${d.out}</td><td>${d.in-d.out}</td></tr>`;
        });
    }
    const tbodyBmr = document.getElementById('bmrTableBody');
    if (tbodyBmr) {
        tbodyBmr.innerHTML = '';
        [...riwayatFisik].reverse().forEach((item, i) => {
            const origIdx = riwayatFisik.length - 1 - i;
            tbodyBmr.innerHTML += `<tr><td>${item.tanggal}</td><td>${item.berat} kg</td><td>${item.bmr}</td><td>${item.tdee}</td><td><button class="btn-hapus" onclick="hapusBMR(${origIdx})">x</button></td></tr>`;
        });
    }
    document.getElementById('profName').value = profile.name || '';
    document.getElementById('dispAge').value = profile.age ? profile.age + " Thn" : "-";
    document.getElementById('dispWeight').value = profile.weight ? profile.weight + " kg" : "-";
    document.getElementById('dispHeight').value = profile.height ? profile.height + " cm" : "-";
    document.getElementById('dispBmr').value = profile.bmr ? profile.bmr + " kcal" : "-";
    document.getElementById('dispTdee').value = profile.tdee ? profile.tdee + " kcal" : "-";
    if (profile.height > 0) document.getElementById('idealWeight').innerText = ((profile.height - 100) * 0.9).toFixed(1);
}

function saveData() {
    localStorage.setItem('logs', JSON.stringify(logs));
    localStorage.setItem('riwayatFisik', JSON.stringify(riwayatFisik));
    localStorage.setItem('profile', JSON.stringify(profile));
}
function hapusLog(i) { if(confirm("Hapus data?")) { logs.splice(i,1); saveData(); updateUI(); } }
function hapusBMR(i) { if(confirm("Hapus?")) { riwayatFisik.splice(i,1); saveData(); updateUI(); } }
function saveProfile() { profile.name = document.getElementById('profName').value; saveData(); }