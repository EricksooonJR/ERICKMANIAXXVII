// Botones de imprimir / PNG
const poster = document.getElementById('poster');
const btnPrint = document.getElementById('btnPrint');
const btnPNG = document.getElementById('btnPNG');

if (btnPrint) btnPrint.addEventListener('click', () => window.print());

if (btnPNG) btnPNG.addEventListener('click', async () => {
  if (typeof html2canvas === "undefined") {
    alert("html2canvas no cargó. Revisa que el script CDN esté antes de app.js.");
    return;
  }
  if (!poster) {
    alert("No encontré el elemento #poster en el HTML.");
    return;
  }

  try {
    btnPNG.disabled = true;
    btnPNG.textContent = "⏳ Generando PNG...";

    const scale = Math.min(3, window.devicePixelRatio || 2);

    const canvas = await html2canvas(poster, {
      backgroundColor: null,
      scale,
      useCORS: true
    });

    const a = document.createElement('a');
    a.download = 'Cartel_LuchaLibre_Erick27.png';
    a.href = canvas.toDataURL('image/png');
    a.click();
  } catch (e) {
    alert("No se pudo generar el PNG. Intenta imprimir a PDF o recarga la página.");
    console.error(e);
  } finally {
    btnPNG.disabled = false;
    btnPNG.innerHTML = "🖼️ Descargar <small>(PNG)</small>";
  }
});

// Definición de luchas (para llenar slots automáticamente)
const matches = {
  estelar: {
    left: ["Galvánico", "Black Míster"],
    right:["Caudillo", "Black Killer"]
  },
  semifinal: {
    left: ["Red Man", "Radar"],
    right:["Blue Kiss", "Neón JR"]
  },
  segunda: {
    left: ["Tritón TK"],
    right:["Driver"]
  },
  primera: {
    left: ["Tiburón JR"],
    right:["Valak"]
  }
};

// ===== AQUÍ defines qué imagen usa cada luchador (edita las rutas a tus archivos en /img) =====
const fighterImages = {
  "Galvánico": "./img/galvanico.png",
  "Black Míster": "./img/mister.png",
  "Caudillo": "./img/caudillo.png",
  "Black Killer": "./img/killer.png",

  "Red Man": "./img/red.png",
  "Radar": "./img/radar.png",
  "Blue Kiss": "./img/blue.png",
  "Neón JR": "./img/neon.png",

  "Tritón TK": "./img/triton.png",
  "Driver": "./img/driver.png",

  "Tiburón JR": "./img/tiburon.png",
  "Valak": "./img/valak.png",
};

const fallbackImg =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
    <rect width="512" height="512" fill="#111"/>
    <text x="50%" y="50%" fill="#f4c84a" font-size="30"
      font-family="Impact, Arial Black, sans-serif"
      text-anchor="middle" dominant-baseline="middle">
      RUTA MAL / SIN FOTO
    </text>
  </svg>`);

function buildFighterCard({ name, side }){
  const wrapper = document.createElement("div");
  wrapper.className = `fighter ${side}`;
  wrapper.setAttribute("data-fighter", name);

  const img = document.createElement("img");
  img.alt = name;
  img.loading = "lazy";

  // Usa SOLO la imagen definida en fighterImages
  img.src = fighterImages[name] || "";

  // Si no encuentra la ruta / no carga, usa fallback visible
  img.onerror = () => { img.src = fallbackImg; };

  const label = document.createElement("div");
  label.className = "name";
  label.textContent = name;

  wrapper.append(img, label);
  return wrapper;
}

function hydrateFighters(){
  document.querySelectorAll(".versus.fighters").forEach(versus => {
    const matchId = versus.getAttribute("data-match");
    const cfg = matches[matchId];
    if(!cfg) return;

    const leftGrid = versus.querySelector('.fighterGrid[data-side="left"]');
    const rightGrid = versus.querySelector('.fighterGrid[data-side="right"]');

    if (!leftGrid || !rightGrid) return;

    // Normaliza el layout: centra cuando es 1v1
    leftGrid.style.gridTemplateColumns = "1fr";
    rightGrid.style.gridTemplateColumns = "1fr";

    leftGrid.style.justifyItems = (cfg.left.length === 1) ? "center" : "stretch";
    rightGrid.style.justifyItems = (cfg.right.length === 1) ? "center" : "stretch";

    leftGrid.innerHTML = "";
    rightGrid.innerHTML = "";

    // Debug: avisa si falta alguna ruta en fighterImages
    [...cfg.left, ...cfg.right].forEach(n => {
      if (!fighterImages[n]) console.warn("Falta ruta en fighterImages para:", n);
    });

    cfg.left.forEach(name => leftGrid.appendChild(buildFighterCard({ name, side: "left" })));
    cfg.right.forEach(name => rightGrid.appendChild(buildFighterCard({ name, side: "right" })));
  });
}

// Ejecuta al cargar (cuando el DOM ya existe)
window.addEventListener("DOMContentLoaded", () => {
  hydrateFighters();
});

// ===== ANIMACIÓN DE ENTRADA =====
// (usa body.preload + body.intro en tu CSS)
window.addEventListener('load', () => {
  document.body.classList.remove('preload');
  document.body.classList.add('intro');
});



// ===== REPRODUCTOR FLOTANTE (AUTOPLAY + CONTROLES) =====
(() => {
  const music = document.getElementById('music');
  const player = document.getElementById('player');
  const toggle = document.getElementById('playerToggle');
  const muteBtn = document.getElementById('playerMute');
  const closeBtn = document.getElementById('playerClose');
  const vol = document.getElementById('pVol');
  const seek = document.getElementById('pSeek');
  const tCur = document.getElementById('pTime');
  const tDur = document.getElementById('pDur');

  if (!music || !player) return;

  function fmt(s){
    if (!isFinite(s) || s < 0) return '0:00';
    const m = Math.floor(s / 60);
    const r = Math.floor(s % 60);
    return `${m}:${String(r).padStart(2,'0')}`;
  }

  function showPlayer(){
    player.classList.remove('hidden');
  }

  function setToggleIcon(){
    if (!toggle) return;
    toggle.textContent = music.paused ? '▶' : '⏸';
  }

  function setMuteIcon(){
    if (!muteBtn) return;
    muteBtn.textContent = music.muted || music.volume === 0 ? '🔇' : '🔊';
  }

  async function play(){
    try {
      await music.play();
      showPlayer();
      setToggleIcon();
      setMuteIcon();
    } catch (e) {
      // Si autoplay está bloqueado, igual mostramos el reproductor para que el usuario toque play
      showPlayer();
      setToggleIcon();
      setMuteIcon();
    }
  }

  // Autoplay al cargar (si el navegador lo permite)
  window.addEventListener('load', () => {
    music.volume = 0.85;
    if (vol) vol.value = String(music.volume);
    showPlayer();
    play();
  });

  // Controles
  toggle?.addEventListener('click', async () => {
    if (music.paused) await play();
    else {
      music.pause();
      setToggleIcon();
    }
  });

  muteBtn?.addEventListener('click', () => {
    music.muted = !music.muted;
    setMuteIcon();
  });

  closeBtn?.addEventListener('click', () => {
    player.classList.add('hidden');
  });

  vol?.addEventListener('input', () => {
    const v = Number(vol.value);
    music.volume = isFinite(v) ? v : 0.85;
    if (music.volume > 0) music.muted = false;
    setMuteIcon();
  });

  // Progreso / seek
  music.addEventListener('loadedmetadata', () => {
    tDur && (tDur.textContent = fmt(music.duration));
  });

  music.addEventListener('timeupdate', () => {
    tCur && (tCur.textContent = fmt(music.currentTime));
    if (seek && isFinite(music.duration) && music.duration > 0) {
      const p = (music.currentTime / music.duration) * 100;
      seek.value = String(p);
    }
  });

  seek?.addEventListener('input', () => {
    if (!isFinite(music.duration) || music.duration <= 0) return;
    const p = Number(seek.value);
    music.currentTime = (Math.max(0, Math.min(100, p)) / 100) * music.duration;
  });

  // Si el usuario interactúa con la página, vuelve a intentar reproducir (por Safari/iOS)
  const gesture = () => {
    if (music.paused) play();
    document.removeEventListener('click', gesture);
    document.removeEventListener('touchstart', gesture);
    document.removeEventListener('keydown', gesture);
  };
  document.addEventListener('click', gesture);
  document.addEventListener('touchstart', gesture);
  document.addEventListener('keydown', gesture);

  // Estado inicial
  setToggleIcon();
  setMuteIcon();
})();

// ===== CUENTA REGRESIVA AL EVENTO =====
(() => {
  const $d = document.getElementById('cdDays');
  const $h = document.getElementById('cdHours');
  const $m = document.getElementById('cdMinutes');
  const $s = document.getElementById('cdSeconds');

  // Si esta página no tiene el bloque de countdown, no hacemos nada
  if (!$d || !$h || !$m || !$s) return;

  // FECHA DEL EVENTO (hora local)
  // new Date(Año, Mes(0-11), Día, Hora, Minuto, Segundo)
  const eventDate = new Date(2026, 5, 6, 19, 0, 0); // EJEMPLO: 6 Junio 2026 19:00

  const pad = (n) => String(n).padStart(2, '0');

  function tick(){
    const now = new Date();
    let diff = eventDate - now;

    if (diff <= 0){
      $d.textContent = '00';
      $h.textContent = '00';
      $m.textContent = '00';
      $s.textContent = '00';
      return;
    }

    const sec = Math.floor(diff / 1000);
    const days = Math.floor(sec / 86400);
    const hours = Math.floor((sec % 86400) / 3600);
    const minutes = Math.floor((sec % 3600) / 60);
    const seconds = sec % 60;

    $d.textContent = pad(days);
    $h.textContent = pad(hours);
    $m.textContent = pad(minutes);
    $s.textContent = pad(seconds);
  }

  tick();
  setInterval(tick, 1000);
})();
// ===== LIGHTBOX PARA FOTOS DE LUCHADORES =====
(() => {
  // Crear modal una sola vez
  const modal = document.createElement('div');
  modal.className = 'lightbox';
  modal.innerHTML = `
    <div class="lbCard" role="dialog" aria-modal="true" aria-label="Foto en grande">
      <button class="lbClose" type="button" aria-label="Cerrar">✕</button>
      <img class="lbImg" alt="Foto del luchador" />
      <div class="lbCaption" id="lbCaption" style="display:none;"></div>
    </div>
  `;
  document.body.appendChild(modal);

  const lbImg = modal.querySelector('.lbImg');
  const lbClose = modal.querySelector('.lbClose');
  const lbCard = modal.querySelector('.lbCard');
  const lbCaption = modal.querySelector('#lbCaption');

  function openLightbox(src, captionText = '') {
    lbImg.src = src;

    if (captionText) {
      lbCaption.textContent = captionText;
      lbCaption.style.display = 'inline-flex';
    } else {
      lbCaption.style.display = 'none';
    }

    modal.classList.add('open');
    document.body.classList.add('modalOpen');
  }

  function closeLightbox() {
    modal.classList.remove('open');
    document.body.classList.remove('modalOpen');

    // Limpieza para que no quede cargando
    lbImg.src = '';
  }

  // Delegación: detecta clicks en cualquier foto dentro de .fighter
  document.addEventListener('click', (e) => {
    const img = e.target.closest('.fighter img');
    if (!img) return;

    // evita abrir si no hay src
    const src = img.getAttribute('src');
    if (!src) return;

    // caption opcional: usa el nombre del luchador si existe
    const nameEl = img.closest('.fighter')?.querySelector('.name');
    const caption = nameEl ? nameEl.textContent.trim() : '';

    openLightbox(src, caption);
  });

  // Cerrar: botón
  lbClose.addEventListener('click', closeLightbox);

  // Cerrar: click fuera de la tarjeta
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeLightbox();
  });

  // Evitar que click dentro cierre
  lbCard.addEventListener('click', (e) => e.stopPropagation());

  // Cerrar con ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('open')) closeLightbox();
  });
})();