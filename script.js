let logs = JSON.parse(localStorage.getItem('logs')) || [];
let riwayatFisik = JSON.parse(localStorage.getItem('riwayatFisik')) || [];
let profile = JSON.parse(localStorage.getItem('profile')) || { name: '', age: 0, weight: 0, height: 0, bmr: 0, tdee: 0 };

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

    if (!nama || isNaN(kalori)) return alert("Isi data dengan lengkap!");

    logs.push({ tanggal: tglFinal, nama, tipe, kalori });
    saveData();
    updateUI();
    
    document.getElementById('inputDate').value = '';
    document.getElementById('foodName').value = '';
    document.getElementById('calories').value = '';
    showPage('dashboard');
}

function hitungBMR() {
    const gender = document.getElementById('gender').value;
    const age = parseInt(document.getElementById('bmr-age').value);
    const weight = parseFloat(document.getElementById('bmr-weight').value);
    const height = parseFloat(document.getElementById('bmr-height').value);
    const act = parseFloat(document.getElementById('activity').value);

    if (!weight || !height || !age) return alert("Lengkapi data fisik!");

    let bmr = (10 * weight) + (6.25 * height) - (5 * age);
    bmr = (gender === 'male') ? bmr + 5 : bmr - 161;
    const tdee = Math.round(bmr * act);

    riwayatFisik.push({ tanggal: new Date().toLocaleDateString('id-ID'), berat: weight, bmr: Math.round(bmr), tdee: tdee });
    profile = { ...profile, age, weight, height, bmr: Math.round(bmr), tdee };

    saveData();
    updateUI();
    showPage('profile');
}

function updateUI() {
    // Dashboard Log
    const tbodyLog = document.getElementById('tableBody');
    let totalIn = 0, totalOut = 0;
    if (tbodyLog) {
        tbodyLog.innerHTML = '';
        logs.forEach((item, index) => {
            if (item.tipe === 'in') totalIn += item.kalori; else totalOut += item.kalori;
            tbodyLog.innerHTML += `<tr><td><small>${item.tanggal}</small></td><td>${item.nama}</td><td>${item.tipe === 'in' ? 'Masuk' : 'Keluar'}</td>
                <td style="color:${item.tipe === 'in' ? '#d9534f':'#5cb85c'}; font-weight:bold;">${item.tipe === 'in' ? '+':'-'}${item.kalori}</td>
                <td><button class="btn-hapus" onclick="hapusLog(${index})">x</button></td></tr>`;
        });
        const net = totalIn - totalOut;
        let ket = (net < 0) ? "(Defisit)" : (net > 0) ? "(Surplus)" : "(Seimbang)";
        let color = (net < 0) ? "#5cb85c" : (net > 0) ? "#d9534f" : "#007bff";
        document.getElementById('dashIn').innerText = totalIn;
        document.getElementById('dashOut').innerText = totalOut;
        document.getElementById('dashNet').innerHTML = `${net} kcal <span style="color:${color}; font-weight:normal; font-size:0.7em; margin-left:5px;">${ket}</span>`;
    }

    // Rekapitulasi
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
            const netH = d.in - d.out;
            let st = (netH < 0) ? "Defisit" : (netH > 0) ? "Surplus" : "Seimbang";
            let cl = (netH < 0) ? "#5cb85c" : (netH > 0) ? "#d9534f" : "#007bff";
            rekapBody.innerHTML += `<tr><td><b>${tgl}</b></td><td>${d.in}</td><td>${d.out}</td><td style="color:${cl}; font-weight:bold;">${netH} <small>(${st})</small></td></tr>`;
        });
    }

    // Profil Page Update
    document.getElementById('profName').value = profile.name || '';
    document.getElementById('dispAge').value = profile.age ? profile.age + " Tahun" : "-";
    document.getElementById('dispWeight').value = profile.weight ? profile.weight + " kg" : "-";
    document.getElementById('dispHeight').value = profile.height ? profile.height + " cm" : "-";
    document.getElementById('dispBmr').value = profile.bmr ? profile.bmr + " kcal" : "-";
    document.getElementById('dispTdee').value = profile.tdee ? profile.tdee + " kcal" : "-";
    
    if (profile.height > 0) {
        const ideal = (profile.height - 100) - ((profile.height - 100) * 0.1);
        document.getElementById('idealWeight').innerText = ideal.toFixed(1);
    }
}

function saveData() {
    localStorage.setItem('logs', JSON.stringify(logs));
    localStorage.setItem('riwayatFisik', JSON.stringify(riwayatFisik));
    localStorage.setItem('profile', JSON.stringify(profile));
}

function saveProfile() { profile.name = document.getElementById('profName').value; saveData(); }
function hapusLog(i) { if(confirm("Hapus?")) { logs.splice(i,1); saveData(); updateUI(); } }