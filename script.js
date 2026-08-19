// ---------------------------------------------------------------
// galley — render LaTeX ke PDF langsung di browser (tanpa server)
// Menggunakan SwiftLaTeX (PdfTeXEngine, WASM)
// ---------------------------------------------------------------

const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const compileBtn = document.getElementById('compileBtn');
const downloadBtn = document.getElementById('downloadBtn');
const sourceEl = document.getElementById('source');
const pdfFrame = document.getElementById('pdfFrame');
const emptyState = document.getElementById('emptyState');
const logPanel = document.getElementById('logPanel');
const logToggle = document.getElementById('logToggle');

let engine = null;
let currentPdfUrl = null;

function setStatus(kind, text) {
  statusDot.className = 'status-dot' + (kind ? ' ' + kind : '');
  statusText.textContent = text;
}

logToggle.addEventListener('click', () => {
  const visible = logPanel.style.display === 'block';
  logPanel.style.display = visible ? 'none' : 'block';
  logToggle.textContent = visible ? 'tampilkan log kompilasi' : 'sembunyikan log kompilasi';
});

async function initEngine() {
  try {
    engine = new PdfTeXEngine();
    await engine.loadEngine();
    setStatus('ok', 'mesin siap');
    compileBtn.disabled = false;
  } catch (err) {
    console.error(err);
    setStatus('err', 'gagal memuat mesin — cek folder /engine');
    logPanel.textContent = String(err);
    logPanel.style.display = 'block';
  }
}

async function compile() {
  if (!engine) return;
  compileBtn.disabled = true;
  setStatus('loading', 'mengompilasi…');

  try {
    engine.writeMemFSFile('main.tex', sourceEl.value);
    engine.setEngineMainFile('main.tex');
    const result = await engine.compileLaTeX();

    logPanel.textContent = result.log || '';

    if (result.status === 0 && result.pdf) {
      const blob = new Blob([result.pdf], { type: 'application/pdf' });
      if (currentPdfUrl) URL.revokeObjectURL(currentPdfUrl);
      currentPdfUrl = URL.createObjectURL(blob);

      pdfFrame.src = currentPdfUrl;
      pdfFrame.style.display = 'block';
      emptyState.style.display = 'none';

      downloadBtn.style.display = 'inline-flex';
      downloadBtn.onclick = () => {
        const a = document.createElement('a');
        a.href = currentPdfUrl;
        a.download = 'document.pdf';
        document.body.appendChild(a);
        a.click();
        a.remove();
      };

      setStatus('ok', 'selesai');
    } else {
      setStatus('err', 'kompilasi gagal — lihat log');
      logPanel.style.display = 'block';
      logToggle.textContent = 'sembunyikan log kompilasi';
    }
  } catch (err) {
    console.error(err);
    setStatus('err', 'terjadi kesalahan — lihat log');
    logPanel.textContent = String(err);
    logPanel.style.display = 'block';
  } finally {
    compileBtn.disabled = false;
  }
}

compileBtn.addEventListener('click', compile);

// Ctrl/Cmd + Enter untuk compile cepat dari editor
sourceEl.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    compile();
  }
});

initEngine();
