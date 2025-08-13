const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');

// --- Helper Functions to Generate HTML Tables ---

function generateCpHtml(data) {
    let tableRows = '';
    data.dataCp.forEach(item => {
        tableRows += `
            <tr>
                <td>${item.elemen}</td>
                <td>${item.capaian}</td>
            </tr>
        `;
    });

    return `
        <div class="page">
            <h1>Capaian Pembelajaran (CP)</h1>
            ${generateHeaderInfo(data.infoUmum)}
            <table class="styled-table">
                <thead>
                    <tr>
                        <th>Elemen</th>
                        <th>Capaian Pembelajaran</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>
        </div>
    `;
}

function generateTpHtml(data) {
    // Implementasi untuk membuat tabel TP
    // (Bisa ditambahkan jika diperlukan)
    return '';
}

function generateAtpHtml(data) {
    // Implementasi untuk membuat tabel ATP
    // (Bisa ditambahkan jika diperlukan)
    return '';
}

function generateProsemHtml(data) {
    let tableRows = '';
    let rowCounter = 0;
    data.dataTp.forEach(tp => {
        const validAtpList = tp.atpList ? tp.atpList.filter(item => item.alur && item.alur.trim() !== '') : [];
        if (validAtpList.length > 0) {
            validAtpList.forEach(atpItem => {
                rowCounter++;
                let weekCells = '';
                atpItem.prosemWeeks.forEach(isChecked => {
                    weekCells += `<td>${isChecked ? '✔' : ''}</td>`;
                });
                tableRows += `
                    <tr>
                        <td>${rowCounter}</td>
                        <td class="text-left">${atpItem.alur}</td>
                        <td>${atpItem.alokasiProsem}</td>
                        ${weekCells}
                    </tr>
                `;
            });
        }
    });

    return `
        <div class="page">
            <h1>Program Semester (PROSEM)</h1>
            ${generateHeaderInfo(data.infoUmum)}
            <table class="styled-table prosem-table">
                <thead>
                    <tr>
                        <th rowspan="2">No</th>
                        <th rowspan="2">Alur Tujuan Pembelajaran</th>
                        <th rowspan="2">Alokasi Waktu</th>
                        <th colspan="5">Juli</th>
                        <th colspan="5">Agustus</th>
                        <th colspan="5">September</th>
                        <th colspan="5">Oktober</th>
                        <th colspan="5">November</th>
                        <th colspan="5">Desember</th>
                    </tr>
                    <tr>
                        ${Array.from({ length: 6 }, () => '<th>1</th><th>2</th><th>3</th><th>4</th><th>5</th>').join('')}
                    </tr>
                </thead>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>
             <div class="signatures">
                <div>
                    <p>Mengetahui,</p>
                    <p class="name">${data.infoUmum.kepalaMadrasah.name}</p>
                    <p>${data.infoUmum.kepalaMadrasah.title}</p>
                </div>
                <div>
                    <p>Guru Mata Pelajaran</p>
                    <p class="name">${data.infoUmum.namaPenyusun}</p>
                    <p>Guru Mapel ${data.infoUmum.mataPelajaran}</p>
                </div>
            </div>
        </div>
    `;
}


function generateHeaderInfo(info) {
    return `
        <table class="info-table">
            <tr>
                <td>Mata Pelajaran</td>
                <td>: ${info.mataPelajaran}</td>
                <td>Nama Madrasah</td>
                <td>: ${info.namaMadrasah}</td>
            </tr>
            <tr>
                <td>Kelas / Semester</td>
                <td>: ${info.kelasSemester}</td>
                <td>Tahun Pelajaran</td>
                <td>: ${info.tahunPelajaran}</td>
            </tr>
        </table>
    `;
}


module.exports = async (req, res) => {
    // Memberikan izin akses (CORS Headers)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    let browser = null;

    try {
        const data = req.body;
        let finalHtml = `
            <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; font-size: 10px; }
                        .page { page-break-after: always; }
                        .page:last-child { page-break-after: avoid; }
                        h1 { text-align: center; }
                        .info-table { width: 100%; margin-bottom: 20px; border: none; }
                        .info-table td { border: none; padding: 2px; }
                        .styled-table { border-collapse: collapse; width: 100%; font-size: 9px; }
                        .styled-table th, .styled-table td { border: 1px solid black; padding: 4px; text-align: center; }
                        .styled-table th { background-color: #f2f2f2; }
                        .text-left { text-align: left; }
                        .prosem-table th:nth-child(2), .prosem-table td:nth-child(2) { width: 6cm; }
                        .signatures { margin-top: 40px; display: flex; justify-content: space-between; font-size: 10px; }
                        .signatures p { margin: 0; }
                        .signatures .name { margin-top: 60px; font-weight: bold; text-decoration: underline; }
                    </style>
                </head>
                <body>
        `;

        data.pagesToGenerate.forEach(pageId => {
            if (pageId === 'halaman-cp') finalHtml += generateCpHtml(data);
            if (pageId === 'halaman-tp') finalHtml += generateTpHtml(data);
            if (pageId === 'halaman-atp') finalHtml += generateAtpHtml(data);
            if (pageId === 'halaman-prosem') finalHtml += generateProsemHtml(data);
            // Tambahkan halaman lain di sini
        });

        finalHtml += `</body></html>`;

        browser = await puppeteer.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(),
            headless: chromium.headless,
            ignoreHTTPSErrors: true,
        });

        const page = await browser.newPage();
        await page.setContent(finalHtml, { waitUntil: 'networkidle0' });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            landscape: data.orientasi === 'landscape',
            margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' }
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.status(200).send(pdfBuffer);

    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).send(`Gagal membuat PDF di server: ${error.message}`);
    } finally {
        if (browser !== null) {
            await browser.close();
        }
    }
};
