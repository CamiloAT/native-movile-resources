/* ═══════════════════════════════════════════════════════════
   NATIVE BROWSER APIs EXPLORER – Main Application
   ═══════════════════════════════════════════════════════════ */

// ──────────── Particles Background ────────────
(function initParticles() {
  const canvas = document.getElementById('particles-canvas');
  const ctx = canvas.getContext('2d');
  let particles = [];
  const COLORS = ['#6C63FF', '#00C9A7', '#FF6B6B', '#FFC75F', '#845EC2'];

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  class Particle {
    constructor() {
      this.reset();
    }
    reset() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.r = Math.random() * 2 + 0.5;
      this.dx = (Math.random() - 0.5) * 0.4;
      this.dy = (Math.random() - 0.5) * 0.4;
      this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
      this.alpha = Math.random() * 0.5 + 0.15;
    }
    update() {
      this.x += this.dx;
      this.y += this.dy;
      if (this.x < 0 || this.x > canvas.width) this.dx *= -1;
      if (this.y < 0 || this.y > canvas.height) this.dy *= -1;
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.globalAlpha = this.alpha;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  for (let i = 0; i < 80; i++) particles.push(new Particle());

  function drawLines() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 140) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = particles[i].color;
          ctx.globalAlpha = 0.06 * (1 - dist / 140);
          ctx.lineWidth = 0.5;
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      }
    }
  }

  (function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => { p.update(); p.draw(); });
    drawLines();
    requestAnimationFrame(animate);
  })();
})();

// ──────────── Navigation ────────────
const appView = document.getElementById('app');

function showDemo(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const target = document.getElementById(`view-${name}`);
  if (target) {
    target.classList.add('active');
    target.style.animation = 'none';
    target.offsetHeight;  // reflow
    target.style.animation = '';
  }
}

function showMenu() {
  // stop any running demos
  stopFaceDetection();
  stopBarcodeDetection();
  stopScreenCapture();
  stopAudioRecording();
  stopOrientation();
  stopMotion();
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  appView.classList.add('active');
  appView.style.animation = 'none';
  appView.offsetHeight;
  appView.style.animation = '';
}

// card clicks
document.querySelectorAll('.card[data-demo]').forEach(card => {
  card.addEventListener('click', () => showDemo(card.dataset.demo));
});

// back buttons
document.querySelectorAll('[data-back]').forEach(btn => {
  btn.addEventListener('click', showMenu);
});

// ──────────── Helpers ────────────
function setStatus(id, text, isError = false) {
  const el = document.getElementById(id);
  el.classList.remove('hidden', 'error');
  if (isError) el.classList.add('error');
  el.querySelector('.material-icons-round').textContent = isError ? 'error' : 'check_circle';
  el.querySelector('.status-text').textContent = text;
}

function hideStatus(id) {
  document.getElementById(id).classList.add('hidden');
}

function checkSupport(elementId, apiName, isSupported) {
  const el = document.getElementById(elementId);
  if (isSupported) {
    el.className = 'api-support supported';
    el.innerHTML = `<span class="material-icons-round">check_circle</span> ${apiName} es compatible con tu navegador.`;
  } else {
    el.className = 'api-support unsupported';
    el.innerHTML = `<span class="material-icons-round">cancel</span> ${apiName} NO es compatible con tu navegador.`;
  }
}


/* ═══════════════════════════════════════════════════════════
   1. FILE SYSTEM ACCESS API
   ═══════════════════════════════════════════════════════════ */

const fsSupported = 'showOpenFilePicker' in window;
checkSupport('fs-support', 'File System Access API', fsSupported);

let currentFileHandle = null;

document.getElementById('fs-open-file').addEventListener('click', async () => {
  if (!fsSupported) {
    setStatus('fs-status', 'Tu navegador no soporta esta API.', true);
    return;
  }
  try {
    const [handle] = await window.showOpenFilePicker();
    currentFileHandle = handle;
    const file = await handle.getFile();
    document.getElementById('fs-filename').textContent = file.name;

    if (file.type.startsWith('image/')) {
      // show image
      const url = URL.createObjectURL(file);
      const img = document.getElementById('fs-image');
      img.src = url;
      document.getElementById('fs-image-preview').classList.remove('hidden');
      document.getElementById('fs-editor-wrap').classList.add('hidden');
      document.getElementById('fs-dir-tree').classList.add('hidden');
      document.getElementById('fs-save-file').disabled = true;
      setStatus('fs-status', `Imagen "${file.name}" abierta correctamente.`);
    } else {
      // show text
      const text = await file.text();
      document.getElementById('fs-editor').value = text;
      document.getElementById('fs-editor-wrap').classList.remove('hidden');
      document.getElementById('fs-image-preview').classList.add('hidden');
      document.getElementById('fs-dir-tree').classList.add('hidden');
      document.getElementById('fs-save-file').disabled = false;
      setStatus('fs-status', `Archivo "${file.name}" abierto para edición.`);
    }
  } catch (e) {
    if (e.name !== 'AbortError') setStatus('fs-status', `Error: ${e.message}`, true);
  }
});

document.getElementById('fs-save-file').addEventListener('click', async () => {
  if (!currentFileHandle) return;
  try {
    const writable = await currentFileHandle.createWritable();
    await writable.write(document.getElementById('fs-editor').value);
    await writable.close();
    setStatus('fs-status', 'Archivo guardado exitosamente.');
  } catch (e) {
    setStatus('fs-status', `Error al guardar: ${e.message}`, true);
  }
});

document.getElementById('fs-open-dir').addEventListener('click', async () => {
  if (!('showDirectoryPicker' in window)) {
    setStatus('fs-status', 'showDirectoryPicker no es compatible.', true);
    return;
  }
  try {
    const dirHandle = await window.showDirectoryPicker();
    const list = document.getElementById('fs-tree-list');
    list.innerHTML = '';

    for await (const [name, handle] of dirHandle) {
      const li = document.createElement('li');
      const icon = handle.kind === 'directory' ? 'folder' : 'description';
      li.innerHTML = `<span class="material-icons-round">${icon}</span> ${name}`;
      list.appendChild(li);
    }

    document.getElementById('fs-dir-tree').classList.remove('hidden');
    document.getElementById('fs-editor-wrap').classList.add('hidden');
    document.getElementById('fs-image-preview').classList.add('hidden');
    setStatus('fs-status', `Directorio "${dirHandle.name}" abierto.`);
  } catch (e) {
    if (e.name !== 'AbortError') setStatus('fs-status', `Error: ${e.message}`, true);
  }
});


/* ═══════════════════════════════════════════════════════════
   2. WEB AUTHENTICATION API
   ═══════════════════════════════════════════════════════════ */

const authSupported = !!window.PublicKeyCredential;
checkSupport('auth-support', 'Web Authentication API', authSupported);

let storedCredentialId = null;

// Helper – random buffer
function randomBuffer(length) {
  const buf = new Uint8Array(length);
  crypto.getRandomValues(buf);
  return buf;
}

function bufferToBase64(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

document.getElementById('auth-register').addEventListener('click', async () => {
  const username = document.getElementById('auth-username').value.trim();
  if (!username) {
    setStatus('auth-status', 'Ingresa un nombre de usuario.', true);
    return;
  }
  if (!authSupported) {
    setStatus('auth-status', 'Tu navegador no soporta WebAuthn.', true);
    return;
  }

  try {
    const publicKey = {
      challenge: randomBuffer(32),
      rp: { name: 'Native APIs Explorer', id: location.hostname },
      user: {
        id: randomBuffer(16),
        name: username,
        displayName: username,
      },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 },    // ES256
        { type: 'public-key', alg: -257 },  // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'preferred',
      },
      timeout: 60000,
      attestation: 'none',
    };

    const credential = await navigator.credentials.create({ publicKey });
    storedCredentialId = credential.rawId;

    document.getElementById('auth-login').disabled = false;
    setStatus('auth-status', `Credencial registrada para "${username}".`);

    const infoEl = document.getElementById('auth-credential-info');
    infoEl.textContent = JSON.stringify({
      id: credential.id,
      type: credential.type,
      rawId: bufferToBase64(credential.rawId),
    }, null, 2);
    document.getElementById('auth-result').classList.remove('hidden');
  } catch (e) {
    setStatus('auth-status', `Error: ${e.message}`, true);
  }
});

document.getElementById('auth-login').addEventListener('click', async () => {
  if (!storedCredentialId) return;

  try {
    const publicKey = {
      challenge: randomBuffer(32),
      allowCredentials: [{
        id: storedCredentialId,
        type: 'public-key',
        transports: ['internal'],
      }],
      userVerification: 'preferred',
      timeout: 60000,
    };

    const assertion = await navigator.credentials.get({ publicKey });
    setStatus('auth-status', '✅ ¡Autenticación exitosa!');

    const infoEl = document.getElementById('auth-credential-info');
    infoEl.textContent = JSON.stringify({
      id: assertion.id,
      type: assertion.type,
      authenticatorData: bufferToBase64(assertion.response.authenticatorData),
      signature: bufferToBase64(assertion.response.signature),
    }, null, 2);
  } catch (e) {
    setStatus('auth-status', `Error de autenticación: ${e.message}`, true);
  }
});


/* ═══════════════════════════════════════════════════════════
   3. FACE DETECTION API
   ═══════════════════════════════════════════════════════════ */

const faceDetectionSupported = 'FaceDetector' in window;
checkSupport('face-support', 'Face Detection API (Shape Detection)', faceDetectionSupported);

let faceStream = null;
let faceAnimId = null;

async function startFaceDetection() {
  if (!faceDetectionSupported) {
    setStatus('face-status', 'Face Detection no está soportado en tu navegador. Habilita "Experimental Web Platform features" en Chrome.', true);
    return;
  }
  try {
    faceStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } });
    const video = document.getElementById('face-video');
    video.srcObject = faceStream;
    await video.play();

    document.getElementById('face-start').disabled = true;
    document.getElementById('face-stop').disabled = false;
    setStatus('face-status', 'Cámara activa. Buscando rostros...');

    const detector = new FaceDetector({ fastMode: true, maxDetectedFaces: 5 });
    const canvas = document.getElementById('face-canvas');
    const ctx = canvas.getContext('2d');

    async function detect() {
      if (!faceStream) return;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      try {
        const faces = await detector.detect(video);
        faces.forEach(face => {
          const { x, y, width, height } = face.boundingBox;
          ctx.strokeStyle = '#FF6B6B';
          ctx.lineWidth = 3;
          ctx.strokeRect(x, y, width, height);

          // label
          ctx.fillStyle = 'rgba(255,107,107,.8)';
          ctx.fillRect(x, y - 24, 80, 24);
          ctx.fillStyle = '#fff';
          ctx.font = '13px Inter, sans-serif';
          ctx.fillText('Rostro', x + 6, y - 7);
        });

        if (faces.length > 0) {
          setStatus('face-status', `${faces.length} rostro(s) detectado(s).`);
        } else {
          setStatus('face-status', 'Cámara activa. Buscando rostros...');
        }
      } catch (e) { /* ignore single frame errors */ }

      faceAnimId = requestAnimationFrame(detect);
    }
    detect();
  } catch (e) {
    setStatus('face-status', `Error de cámara: ${e.message}`, true);
  }
}

function stopFaceDetection() {
  if (faceStream) {
    faceStream.getTracks().forEach(t => t.stop());
    faceStream = null;
  }
  if (faceAnimId) {
    cancelAnimationFrame(faceAnimId);
    faceAnimId = null;
  }
  const video = document.getElementById('face-video');
  if (video) video.srcObject = null;
  const canvas = document.getElementById('face-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  const startBtn = document.getElementById('face-start');
  const stopBtn = document.getElementById('face-stop');
  if (startBtn) startBtn.disabled = false;
  if (stopBtn) stopBtn.disabled = true;
}

document.getElementById('face-start').addEventListener('click', startFaceDetection);
document.getElementById('face-stop').addEventListener('click', () => {
  stopFaceDetection();
  setStatus('face-status', 'Detección detenida.');
});


/* ═══════════════════════════════════════════════════════════
   4. BARCODE DETECTION API
   ═══════════════════════════════════════════════════════════ */

const barcodeSupported = 'BarcodeDetector' in window;
checkSupport('barcode-support', 'Barcode Detection API', barcodeSupported);

let barcodeStream = null;
let barcodeAnimId = null;

async function startBarcodeDetection() {
  if (!barcodeSupported) {
    setStatus('barcode-status', 'Barcode Detection no está soportado. Prueba en Chrome/Edge con flags experimentales.', true);
    return;
  }
  try {
    barcodeStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: 640, height: 480 } });
    const video = document.getElementById('barcode-video');
    video.srcObject = barcodeStream;
    await video.play();

    document.getElementById('barcode-start').disabled = true;
    document.getElementById('barcode-stop').disabled = false;
    setStatus('barcode-status', 'Cámara activa. Apunta a un código...');

    const detector = new BarcodeDetector();
    const canvas = document.getElementById('barcode-canvas');
    const ctx = canvas.getContext('2d');

    async function detect() {
      if (!barcodeStream) return;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      try {
        const codes = await detector.detect(video);
        codes.forEach(code => {
          // draw bounding box
          const pts = code.cornerPoints;
          ctx.beginPath();
          ctx.moveTo(pts[0].x, pts[0].y);
          for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
          ctx.closePath();
          ctx.strokeStyle = '#FFC75F';
          ctx.lineWidth = 3;
          ctx.stroke();

          // show result
          document.getElementById('barcode-value').textContent = code.rawValue;
          document.getElementById('barcode-format').textContent = `Formato: ${code.format}`;
          document.getElementById('barcode-result').classList.remove('hidden');

          setStatus('barcode-status', '¡Código detectado!');

          // if URL detected
          try {
            new URL(code.rawValue);
            if (confirm(`Se detectó una URL:\n${code.rawValue}\n\n¿Deseas abrir el enlace?`)) {
              window.open(code.rawValue, '_blank');
            }
          } catch (_) { /* not a URL */ }
        });
      } catch (e) { /* ignore */ }

      barcodeAnimId = requestAnimationFrame(detect);
    }
    detect();
  } catch (e) {
    setStatus('barcode-status', `Error de cámara: ${e.message}`, true);
  }
}

function stopBarcodeDetection() {
  if (barcodeStream) {
    barcodeStream.getTracks().forEach(t => t.stop());
    barcodeStream = null;
  }
  if (barcodeAnimId) {
    cancelAnimationFrame(barcodeAnimId);
    barcodeAnimId = null;
  }
  const video = document.getElementById('barcode-video');
  if (video) video.srcObject = null;
  const canvas = document.getElementById('barcode-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  const startBtn = document.getElementById('barcode-start');
  const stopBtn = document.getElementById('barcode-stop');
  if (startBtn) startBtn.disabled = false;
  if (stopBtn) stopBtn.disabled = true;
}

document.getElementById('barcode-start').addEventListener('click', startBarcodeDetection);
document.getElementById('barcode-stop').addEventListener('click', () => {
  stopBarcodeDetection();
  setStatus('barcode-status', 'Escaneo detenido.');
});


/* ═══════════════════════════════════════════════════════════
   5. SCREEN CAPTURE API
   ═══════════════════════════════════════════════════════════ */

const captureSupported = !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia);
checkSupport('capture-support', 'Screen Capture API', captureSupported);

let captureStreamRef = null;

async function startScreenCapture() {
  if (!captureSupported) {
    setStatus('capture-status', 'Screen Capture no está soportado en tu navegador.', true);
    return;
  }
  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
    captureStreamRef = stream;
    const video = document.getElementById('capture-video');
    video.srcObject = stream;

    document.getElementById('capture-start').disabled = true;
    document.getElementById('capture-stop').disabled = false;
    document.getElementById('capture-screenshot').disabled = false;
    setStatus('capture-status', 'Pantalla compartida activa.');

    // handle user stopping from browser UI
    stream.getVideoTracks()[0].addEventListener('ended', () => {
      stopScreenCapture();
      setStatus('capture-status', 'Captura finalizada por el usuario.');
    });
  } catch (e) {
    if (e.name !== 'AbortError') {
      const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
      if (isMobile && (e.name === 'NotSupportedError' || e.message.toLowerCase().includes('not supported'))) {
        setStatus('capture-status', 'Por seguridad, Android/iOS no permiten grabar la pantalla desde el navegador. Pruébalo en un PC.', true);
      } else {
        setStatus('capture-status', `Error: ${e.message}`, true);
      }
    }
  }
}

function stopScreenCapture() {
  if (captureStreamRef) {
    captureStreamRef.getTracks().forEach(t => t.stop());
    captureStreamRef = null;
  }
  const video = document.getElementById('capture-video');
  if (video) video.srcObject = null;
  const startBtn = document.getElementById('capture-start');
  const stopBtn = document.getElementById('capture-stop');
  const ssBtn = document.getElementById('capture-screenshot');
  if (startBtn) startBtn.disabled = false;
  if (stopBtn) stopBtn.disabled = true;
  if (ssBtn) ssBtn.disabled = true;
}

document.getElementById('capture-start').addEventListener('click', startScreenCapture);
document.getElementById('capture-stop').addEventListener('click', () => {
  stopScreenCapture();
  setStatus('capture-status', 'Captura detenida.');
});

document.getElementById('capture-screenshot').addEventListener('click', () => {
  const video = document.getElementById('capture-video');
  if (!video.srcObject) return;

  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0);

  const dataUrl = canvas.toDataURL('image/png');
  document.getElementById('capture-image').src = dataUrl;
  document.getElementById('capture-download').href = dataUrl;
  document.getElementById('capture-screenshot-preview').classList.remove('hidden');
  setStatus('capture-status', 'Captura de pantalla tomada.');
});


/* ═══════════════════════════════════════════════════════════
   6. AUDIO RECORDING
   ═══════════════════════════════════════════════════════════ */

const audioRecordingSupported = !!(navigator.mediaDevices && window.MediaRecorder);
checkSupport('audio-support', 'MediaRecorder + Web Audio API', audioRecordingSupported);

let audioStream = null;
let mediaRecorder = null;
let audioChunks = [];
let audioCtx = null;
let audioAnalyser = null;
let audioAnimId = null;
let audioTimerInterval = null;
let audioStartTime = 0;

function drawAudioVisualizer() {
  const canvas = document.getElementById('audio-visualizer');
  const ctx = canvas.getContext('2d');
  if (!audioAnalyser) return;

  const bufferLength = audioAnalyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  function draw() {
    if (!audioAnalyser) return;
    audioAnimId = requestAnimationFrame(draw);
    audioAnalyser.getByteTimeDomainData(dataArray);

    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.lineWidth = 2;
    ctx.strokeStyle = '#FF4081';
    ctx.beginPath();

    const sliceWidth = canvas.width / bufferLength;
    let x = 0;
    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128.0;
      const y = (v * canvas.height) / 2;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
      x += sliceWidth;
    }
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
  }
  draw();
}

function updateAudioTimer() {
  const timerEl = document.getElementById('audio-timer');
  const elapsed = Math.floor((Date.now() - audioStartTime) / 1000);
  const mins = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const secs = String(elapsed % 60).padStart(2, '0');
  timerEl.textContent = `${mins}:${secs}`;
}

document.getElementById('audio-start').addEventListener('click', async () => {
  if (!audioRecordingSupported) {
    setStatus('audio-status', 'Tu navegador no soporta MediaRecorder.', true);
    return;
  }
  try {
    audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioCtx.createMediaStreamSource(audioStream);
    audioAnalyser = audioCtx.createAnalyser();
    audioAnalyser.fftSize = 2048;
    source.connect(audioAnalyser);

    mediaRecorder = new MediaRecorder(audioStream);
    audioChunks = [];
    mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunks.push(e.data); };
    mediaRecorder.onstop = () => {
      const blob = new Blob(audioChunks, { type: 'audio/webm' });
      const url = URL.createObjectURL(blob);
      document.getElementById('audio-player').src = url;
      document.getElementById('audio-download').href = url;
      document.getElementById('audio-playback').classList.remove('hidden');
      setStatus('audio-status', 'Grabación finalizada. Puedes reproducirla o descargarla.');
    };
    mediaRecorder.start();

    audioStartTime = Date.now();
    const timerEl = document.getElementById('audio-timer');
    timerEl.classList.remove('hidden');
    timerEl.classList.add('recording');
    timerEl.textContent = '00:00';
    audioTimerInterval = setInterval(updateAudioTimer, 1000);

    drawAudioVisualizer();

    document.getElementById('audio-start').disabled = true;
    document.getElementById('audio-stop').disabled = false;
    document.getElementById('audio-playback').classList.add('hidden');
    setStatus('audio-status', '🔴 Grabando audio...');
  } catch (e) {
    setStatus('audio-status', `Error: ${e.message}`, true);
  }
});

function stopAudioRecording() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }
  if (audioStream) {
    audioStream.getTracks().forEach(t => t.stop());
    audioStream = null;
  }
  if (audioCtx) {
    audioCtx.close().catch(() => {});
    audioCtx = null;
    audioAnalyser = null;
  }
  if (audioAnimId) {
    cancelAnimationFrame(audioAnimId);
    audioAnimId = null;
  }
  if (audioTimerInterval) {
    clearInterval(audioTimerInterval);
    audioTimerInterval = null;
  }
  const timerEl = document.getElementById('audio-timer');
  if (timerEl) timerEl.classList.remove('recording');
  const startBtn = document.getElementById('audio-start');
  const stopBtn = document.getElementById('audio-stop');
  if (startBtn) startBtn.disabled = false;
  if (stopBtn) stopBtn.disabled = true;
}

document.getElementById('audio-stop').addEventListener('click', () => {
  stopAudioRecording();
});


/* ═══════════════════════════════════════════════════════════
   7. DEVICE ORIENTATION
   ═══════════════════════════════════════════════════════════ */

const orientSupported = 'DeviceOrientationEvent' in window;
checkSupport('orient-support', 'DeviceOrientationEvent', orientSupported);

let orientHandler = null;

function handleOrientation(e) {
  const alpha = e.alpha != null ? e.alpha : 0;
  const beta = e.beta != null ? e.beta : 0;
  const gamma = e.gamma != null ? e.gamma : 0;

  document.getElementById('orient-alpha').textContent = alpha.toFixed(1) + '°';
  document.getElementById('orient-beta').textContent = beta.toFixed(1) + '°';
  document.getElementById('orient-gamma').textContent = gamma.toFixed(1) + '°';

  // bars (alpha 0-360, beta -180..180, gamma -90..90)
  document.getElementById('orient-alpha-bar').style.width = `${(alpha / 360) * 100}%`;
  document.getElementById('orient-beta-bar').style.width = `${((beta + 180) / 360) * 100}%`;
  document.getElementById('orient-gamma-bar').style.width = `${((gamma + 90) / 180) * 100}%`;

  // 3D cube
  const cube = document.getElementById('orient-cube');
  cube.style.transform = `rotateX(${beta}deg) rotateY(${gamma}deg) rotateZ(${alpha}deg)`;
}

document.getElementById('orient-start').addEventListener('click', async () => {
  if (!orientSupported) {
    setStatus('orient-status', 'DeviceOrientationEvent no está soportado.', true);
    return;
  }
  // iOS 13+ requires permission
  if (typeof DeviceOrientationEvent.requestPermission === 'function') {
    try {
      const perm = await DeviceOrientationEvent.requestPermission();
      if (perm !== 'granted') {
        setStatus('orient-status', 'Permiso denegado.', true);
        return;
      }
    } catch (err) {
      setStatus('orient-status', `Error: ${err.message}`, true);
      return;
    }
  }
  orientHandler = handleOrientation;
  window.addEventListener('deviceorientation', orientHandler);
  document.getElementById('orient-start').disabled = true;
  document.getElementById('orient-stop').disabled = false;
  setStatus('orient-status', 'Escuchando orientación del dispositivo...');
});

function stopOrientation() {
  if (orientHandler) {
    window.removeEventListener('deviceorientation', orientHandler);
    orientHandler = null;
  }
  const startBtn = document.getElementById('orient-start');
  const stopBtn = document.getElementById('orient-stop');
  if (startBtn) startBtn.disabled = false;
  if (stopBtn) stopBtn.disabled = true;
}

document.getElementById('orient-stop').addEventListener('click', () => {
  stopOrientation();
  setStatus('orient-status', 'Lectura de orientación detenida.');
});


/* ═══════════════════════════════════════════════════════════
   8. DEVICE MOTION
   ═══════════════════════════════════════════════════════════ */

const motionSupported = 'DeviceMotionEvent' in window;
checkSupport('motion-support', 'DeviceMotionEvent', motionSupported);

let motionHandler = null;
let ballX = 0, ballY = 0;

function handleMotion(e) {
  const acc = e.accelerationIncludingGravity || {};
  const rot = e.rotationRate || {};

  const ax = acc.x != null ? acc.x : 0;
  const ay = acc.y != null ? acc.y : 0;
  const az = acc.z != null ? acc.z : 0;

  document.getElementById('motion-ax').textContent = ax.toFixed(2);
  document.getElementById('motion-ay').textContent = ay.toFixed(2);
  document.getElementById('motion-az').textContent = az.toFixed(2);

  // bars (acceleration usually -10..10 m/s²)
  document.getElementById('motion-ax-bar').style.width = `${Math.min(Math.abs(ax) * 10, 100)}%`;
  document.getElementById('motion-ay-bar').style.width = `${Math.min(Math.abs(ay) * 10, 100)}%`;
  document.getElementById('motion-az-bar').style.width = `${Math.min(Math.abs(az) * 10, 100)}%`;

  document.getElementById('motion-ra').textContent = (rot.alpha || 0).toFixed(1) + '°/s';
  document.getElementById('motion-rb').textContent = (rot.beta || 0).toFixed(1) + '°/s';
  document.getElementById('motion-rg').textContent = (rot.gamma || 0).toFixed(1) + '°/s';

  // move ball
  const wrapSize = 250;
  const ballSize = 32;
  const maxOffset = (wrapSize - ballSize) / 2;
  ballX = Math.max(-maxOffset, Math.min(maxOffset, ballX + ax * 2));
  ballY = Math.max(-maxOffset, Math.min(maxOffset, ballY - ay * 2));
  document.getElementById('motion-ball').style.transform = `translate(${ballX}px, ${ballY}px)`;
}

document.getElementById('motion-start').addEventListener('click', async () => {
  if (!motionSupported) {
    setStatus('motion-status', 'DeviceMotionEvent no está soportado.', true);
    return;
  }
  if (typeof DeviceMotionEvent.requestPermission === 'function') {
    try {
      const perm = await DeviceMotionEvent.requestPermission();
      if (perm !== 'granted') {
        setStatus('motion-status', 'Permiso denegado.', true);
        return;
      }
    } catch (err) {
      setStatus('motion-status', `Error: ${err.message}`, true);
      return;
    }
  }
  ballX = 0; ballY = 0;
  motionHandler = handleMotion;
  window.addEventListener('devicemotion', motionHandler);
  document.getElementById('motion-start').disabled = true;
  document.getElementById('motion-stop').disabled = false;
  setStatus('motion-status', 'Escuchando movimiento del dispositivo...');
});

function stopMotion() {
  if (motionHandler) {
    window.removeEventListener('devicemotion', motionHandler);
    motionHandler = null;
  }
  const startBtn = document.getElementById('motion-start');
  const stopBtn = document.getElementById('motion-stop');
  if (startBtn) startBtn.disabled = false;
  if (stopBtn) stopBtn.disabled = true;
}

document.getElementById('motion-stop').addEventListener('click', () => {
  stopMotion();
  setStatus('motion-status', 'Lectura de movimiento detenida.');
});


/* ═══════════════════════════════════════════════════════════
   9. MULTI TOUCH
   ═══════════════════════════════════════════════════════════ */

const touchSupported = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
checkSupport('touch-support', 'Touch Events', touchSupported);

(function initMultitouch() {
  const canvas = document.getElementById('touch-canvas');
  const ctx = canvas.getContext('2d');
  const COLORS = ['#FF4081', '#00BCD4', '#FFC75F', '#7C4DFF', '#FF9800', '#00C9A7', '#E91E63', '#6C63FF'];
  const activeTouches = {};

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    for (const touch of e.changedTouches) {
      const rect = canvas.getBoundingClientRect();
      activeTouches[touch.identifier] = {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
        color: COLORS[touch.identifier % COLORS.length],
      };
    }
    document.getElementById('touch-count').textContent = e.touches.length;
    setStatus('touch-status', `${e.touches.length} punto(s) de contacto activo(s).`);
  }, { passive: false });

  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    for (const touch of e.changedTouches) {
      const rect = canvas.getBoundingClientRect();
      const prev = activeTouches[touch.identifier];
      if (!prev) continue;
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      ctx.beginPath();
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(x, y);
      ctx.strokeStyle = prev.color;
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.stroke();

      // draw dot
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fillStyle = prev.color;
      ctx.fill();

      prev.x = x;
      prev.y = y;
    }
  }, { passive: false });

  canvas.addEventListener('touchend', (e) => {
    for (const touch of e.changedTouches) {
      delete activeTouches[touch.identifier];
    }
    document.getElementById('touch-count').textContent = e.touches.length;
    if (e.touches.length === 0) {
      setStatus('touch-status', 'Todos los toques finalizados.');
    }
  });

  // Mouse fallback for desktop
  let mouseDown = false;
  let lastMouse = null;

  canvas.addEventListener('mousedown', (e) => {
    mouseDown = true;
    const rect = canvas.getBoundingClientRect();
    lastMouse = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    document.getElementById('touch-count').textContent = '1';
    setStatus('touch-status', 'Dibujando con ratón (simula 1 toque).');
  });

  canvas.addEventListener('mousemove', (e) => {
    if (!mouseDown || !lastMouse) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(lastMouse.x, lastMouse.y);
    ctx.lineTo(x, y);
    ctx.strokeStyle = '#E91E63';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#E91E63';
    ctx.fill();

    lastMouse = { x, y };
  });

  canvas.addEventListener('mouseup', () => {
    mouseDown = false;
    lastMouse = null;
    document.getElementById('touch-count').textContent = '0';
  });

  document.getElementById('touch-clear').addEventListener('click', () => {
    resizeCanvas();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setStatus('touch-status', 'Lienzo limpiado.');
  });
})();


/* ═══════════════════════════════════════════════════════════
   10. VIEW TRANSITIONS API
   ═══════════════════════════════════════════════════════════ */

const vtSupported = 'startViewTransition' in document;
checkSupport('vt-support', 'View Transitions API', vtSupported);

// Helper: do a view transition (or just run callback if unsupported)
function doTransition(callback) {
  if (vtSupported) {
    document.startViewTransition(callback);
    setStatus('vt-status', 'Transición ejecutada con View Transitions API.');
  } else {
    callback();
    setStatus('vt-status', 'View Transitions no soportada. Cambio aplicado sin transición.', true);
  }
}

// Theme toggle
let vtLightTheme = false;
document.getElementById('vt-toggle-theme').addEventListener('click', () => {
  doTransition(() => {
    vtLightTheme = !vtLightTheme;
    const showcase = document.getElementById('vt-showcase');
    showcase.classList.toggle('light-theme', vtLightTheme);
  });
});

// Layout toggle
let vtListLayout = false;
document.getElementById('vt-toggle-layout').addEventListener('click', () => {
  doTransition(() => {
    vtListLayout = !vtListLayout;
    const showcase = document.getElementById('vt-showcase');
    showcase.classList.toggle('list-layout', vtListLayout);
  });
});

// Shuffle
document.getElementById('vt-shuffle').addEventListener('click', () => {
  const showcase = document.getElementById('vt-showcase');
  doTransition(() => {
    const cards = Array.from(showcase.children);
    // Fisher-Yates shuffle
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      showcase.appendChild(cards[j]);
    }
  });
});
