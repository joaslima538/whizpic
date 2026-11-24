import {worlds} from './stories.js';

export function mountReader(host, story) {
  const world = worlds[story.world];
  host.classList.add('reader');
  host.innerHTML = `
    <div class="reader-stage">
      <div class="volume" tabindex="0" role="group" aria-label="Livro interativo. Use as setas para folhear.">
        <div class="spread"></div>
        <div class="leaf" aria-hidden="true"></div>
      </div>
    </div>
    <div class="reader-controls">
      <button type="button" class="round prev" aria-label="Página anterior">←</button>
      <span class="page-state" aria-live="polite"></span>
      <button type="button" class="round next" aria-label="Próxima página">→</button>
    </div>`;
  const volume = host.querySelector('.volume');
  const spread = host.querySelector('.spread');
  const leaf = host.querySelector('.leaf');
  const prev = host.querySelector('.prev');
  const next = host.querySelector('.next');
  const status = host.querySelector('.page-state');
  let page = 0;
  let drag;
  let suppressClick = false;

  function paint() {
    volume.classList.toggle('is-cover', page === 0);
    spread.innerHTML = page === 0
      ? '<div class="reader-cover"><small>WHIZPIC</small><h3></h3></div>'
      : '<div class="reader-art"></div><div class="reader-paper"><span class="reader-chapter"></span><h3></h3><p></p></div>';
    const art = spread.firstElementChild;
    art.style.backgroundImage = `url(assets/${world.art}.webp)`;
    spread.querySelector('h3').textContent = page === 0 ? story.title : story.pages[page-1][0];
    if (page > 0) {
      spread.querySelector('.reader-chapter').textContent = page === story.pages.length ? 'Fim ✦' : `Página ${page}`;
      spread.querySelector('p').textContent = story.pages[page-1][1];
    }
    if (story.photo && page < 2) {
      const portrait = new Image();
      portrait.className = 'portrait';
      portrait.alt = 'Foto da personagem';
      portrait.src = story.photo;
      art.append(portrait);
    }
    status.textContent = page === 0 ? 'Toque ou arraste para abrir' : `${page} / ${story.pages.length}`;
    prev.disabled = page === 0;
    next.textContent = page === story.pages.length ? '↺' : '→';
    next.ariaLabel = page === 0 ? 'Abrir o livro' : page === story.pages.length ? 'Voltar à capa' : 'Próxima página';
  }

  function turn(direction) {
    if (page === 0 && direction < 0) return;
    leaf.replaceChildren(...Array.from(spread.children, element => element.cloneNode(true)));
    leaf.className = `leaf ${page === 0 ? 'leaf-cover' : ''}`;
    void leaf.offsetWidth;
    leaf.classList.add(direction > 0 ? 'turn-forward' : 'turn-back');
    page = page === story.pages.length && direction > 0 ? 0 : page + direction;
    if (page === 0 && document.activeElement === prev) next.focus();
    paint();
  }

  prev.onclick = () => turn(-1);
  next.onclick = () => turn(1);
  volume.onclick = () => { if (!suppressClick && page === 0) turn(1); };
  volume.onkeydown = event => {
    if (event.key === 'ArrowRight' || (page === 0 && ['Enter',' '].includes(event.key))) { event.preventDefault(); turn(1); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); turn(-1); }
  };
  volume.onpointerdown = event => {
    if (!event.isPrimary || event.button !== 0) return;
    suppressClick = false;
    drag = {x:event.clientX,y:event.clientY};
    volume.setPointerCapture(event.pointerId);
  };
  volume.onpointermove = event => {
    if (drag) volume.style.setProperty('--pull', `${Math.max(-12,Math.min(12,(event.clientX-drag.x)/8))}deg`);
  };
  volume.onpointercancel = () => { drag = null; volume.style.removeProperty('--pull'); };
  volume.onpointerup = event => {
    if (!drag) return;
    const dx = event.clientX-drag.x;
    const dy = event.clientY-drag.y;
    volume.style.removeProperty('--pull');
    drag = null;
    if (Math.abs(dx) > 32 && Math.abs(dx) > Math.abs(dy)) {
      suppressClick = true;
      turn(dx < 0 || page === 0 ? 1 : -1);
      setTimeout(() => { suppressClick = false; }, 0);
    }
  };
  paint();
}
