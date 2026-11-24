import {worlds} from './stories.js';

const stripCount = 14;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export function mountReader(host, story) {
  const {art} = worlds[story.world];
  const last = story.pages.length;
  host.classList.add('reader');
  host.innerHTML = `
    <div class="reader-stage">
      <div class="volume" tabindex="0" role="group" aria-label="Livro interativo. Use as setas para folhear.">
        <div class="book-block">
          <div class="spread"></div>
          <div class="turn-bed" aria-hidden="true"></div>
          <div class="turn-shadow" aria-hidden="true"></div>
          <div class="turn-sheet" aria-hidden="true"></div>
        </div>
      </div>
    </div>
    <div class="reader-controls">
      <button type="button" class="round prev" aria-label="Página anterior">←</button>
      <span class="page-state" aria-live="polite"></span>
      <button type="button" class="round next" aria-label="Próxima página">→</button>
    </div>`;

  const volume = host.querySelector('.volume');
  const block = host.querySelector('.book-block');
  const spread = host.querySelector('.spread');
  const bed = host.querySelector('.turn-bed');
  const shadow = host.querySelector('.turn-shadow');
  const sheet = host.querySelector('.turn-sheet');
  const prev = host.querySelector('.prev');
  const next = host.querySelector('.next');
  const status = host.querySelector('.page-state');
  let page = 0;
  let drag;
  let flip;
  let suppressClick = false;

  function illustratedPage(index, cover = false) {
    const panel = document.createElement('div');
    panel.className = cover ? 'reader-cover' : 'reader-art';
    panel.style.backgroundImage = `url(assets/${art}.webp)`;
    if (cover) {
      const mark = document.createElement('small');
      const title = document.createElement('h3');
      mark.textContent = 'WHIZPIC';
      title.textContent = story.title;
      panel.append(mark, title);
    }
    if (story.photo && index < 2) {
      const portrait = new Image();
      portrait.className = 'portrait';
      portrait.alt = 'Foto da personagem';
      portrait.src = story.photo;
      panel.append(portrait);
    }
    return panel;
  }

  function textPage(index) {
    const panel = document.createElement('div');
    panel.className = 'reader-paper';
    panel.innerHTML = '<span class="reader-chapter"></span><h3></h3><p></p>';
    panel.children[0].textContent = index === last ? 'Fim ✦' : `Página ${index}`;
    panel.children[1].textContent = story.pages[index - 1][0];
    panel.children[2].textContent = story.pages[index - 1][1];
    return panel;
  }

  function paint() {
    volume.classList.toggle('is-cover', page === 0);
    spread.replaceChildren(...(page === 0 ? [illustratedPage(0, true)] : [illustratedPage(page), textPage(page)]));
    status.textContent = page === 0 ? 'Toque ou arraste para abrir' : `${page} / ${last}`;
    if (page === 0 && document.activeElement === prev) next.focus();
    prev.disabled = page === 0;
    next.textContent = page === last ? '↺' : '→';
    next.ariaLabel = page === 0 ? 'Abrir o livro' : page === last ? 'Fechar o livro' : 'Próxima página';
  }

  function resize() {
    if (!volume.isConnected || flip) return;
    const width = block.clientWidth / 2;
    if (!width) return;
    const measure = document.createElement('div');
    measure.className = 'reader-measure';
    measure.setAttribute('aria-hidden', 'true');
    measure.style.width = `${width}px`;
    const pages = story.pages.map((_, index) => textPage(index + 1));
    const cover = illustratedPage(0, true);
    const samples = [...pages, cover];
    measure.append(...samples);
    volume.append(measure);
    const height = Math.max(255, Math.round(width * 1.18), ...samples.map(panel => panel.offsetHeight));
    measure.remove();
    block.style.setProperty('--page-height', `${height}px`);
  }

  function begin(target) {
    const low = Math.min(page, target);
    const high = Math.max(page, target);
    const coverTurn = low === 0;
    const goesForward = target > page;
    const underLeft = coverTurn ? document.createElement('div') : illustratedPage(low);
    const underRight = textPage(high);
    const front = coverTurn ? illustratedPage(0, true) : textPage(low);
    const back = illustratedPage(high);
    const width = block.clientWidth / 2;
    const count = coverTurn ? 1 : stripCount;
    const slice = width / count;
    const strips = [];

    bed.replaceChildren(underLeft, underRight);
    sheet.replaceChildren();
    sheet.classList.toggle('hard-cover', coverTurn);
    for (let index = 0; index < count; index++) {
      const strip = document.createElement('div');
      strip.className = 'sheet-strip';
      strip.style.width = `${slice + (index === count - 1 ? 0 : .65)}px`;
      for (const [side, panel, offset] of [
        ['front', front, index * slice],
        ['back', back, (count - 1 - index) * slice]
      ]) {
        const face = document.createElement('div');
        const surface = panel.cloneNode(true);
        face.className = `sheet-face sheet-${side}`;
        surface.style.width = `${width}px`;
        surface.style.left = `${-offset}px`;
        face.append(surface);
        strip.append(face);
      }
      sheet.append(strip);
      strips.push(strip);
    }

    const start = goesForward ? 0 : 1;
    flip = {target, start, progress:start, coverTurn, width, slice, strips};
    volume.classList.add('is-turning');
    volume.classList.toggle('cover-turn', coverTurn);
    draw(start);
  }

  function draw(progress) {
    const {coverTurn, width, slice, strips} = flip;
    flip.progress = progress;
    const lift = Math.sin(Math.PI * progress);
    const bend = coverTurn ? 0 : lift * 1.3;
    let x = 0;
    let z = 0;

    // Unfold a row of narrow rigid strips along a curved cross-section of the sheet.
    for (const [index, strip] of strips.entries()) {
      const position = (index + .5) / strips.length;
      const angle = Math.PI * progress + bend * (position - .46);
      strip.style.transform = `translate3d(${x}px,0,${z + .4}px) rotateY(${-angle}rad)`;
      strip.style.setProperty('--shade', (lift * (.08 + .29 * position)).toFixed(3));
      x += Math.cos(angle) * slice;
      z += Math.sin(angle) * slice;
    }
    block.style.setProperty('--binding-offset', coverTurn ? `${-width / 2 * (1 - progress)}px` : '0px');
    shadow.style.opacity = lift * .62;
    shadow.style.transform = `translateX(${coverTurn ? 0 : -x * .13}px) scaleX(${.34 + lift * .66})`;
  }

  function finish(commit) {
    const target = flip.target;
    flip = null;
    volume.classList.remove('is-turning', 'cover-turn');
    block.style.removeProperty('--binding-offset');
    bed.replaceChildren();
    sheet.replaceChildren();
    if (commit) {
      page = target;
      paint();
    }
    resize();
  }

  function settle(commit) {
    const from = flip.progress;
    const to = commit ? 1 - flip.start : flip.start;
    const duration = reducedMotion.matches ? 0 : 190 + 610 * Math.abs(to - from);
    if (!duration || Math.abs(to - from) < .001) {
      finish(commit);
      return;
    }

    const startTime = performance.now();
    function animate(now) {
      if (!volume.isConnected) return;
      const elapsed = clamp((now - startTime) / duration, 0, 1);
      const eased = elapsed * elapsed * (3 - 2 * elapsed);
      draw(from + (to - from) * eased);
      if (elapsed < 1) requestAnimationFrame(animate);
      else finish(commit);
    }
    requestAnimationFrame(animate);
  }

  function move(direction) {
    if (drag || flip || (page === 0 && direction < 0)) return;
    const target = page === last && direction > 0 ? 0 : page + direction;
    if (reducedMotion.matches) {
      page = target;
      paint();
    } else {
      begin(target);
      settle(true);
    }
  }

  prev.onclick = () => move(-1);
  next.onclick = () => move(1);
  block.onclick = () => { if (!suppressClick && page === 0) move(1); };
  volume.onkeydown = event => {
    if (event.key === 'ArrowRight' || (page === 0 && ['Enter', ' '].includes(event.key))) {
      event.preventDefault();
      move(1);
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      move(-1);
    }
  };

  block.onpointerdown = event => {
    if (flip || !event.isPrimary || event.button !== 0) return;
    suppressClick = false;
    drag = {x:event.clientX, y:event.clientY, pointer:event.pointerId, direction:0};
    block.setPointerCapture(event.pointerId);
  };

  function track(event) {
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    if (!drag.direction && Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) {
      const direction = dx < 0 ? 1 : -1;
      if (page === 0 && direction < 0) return;
      drag.direction = direction;
      if (!reducedMotion.matches) begin(page === last && direction > 0 ? 0 : page + direction);
    }
    if (flip) {
      const travel = clamp(-dx * drag.direction / (flip.width * 1.7), 0, .98);
      draw(flip.start === 0 ? travel : 1 - travel);
    }
  }

  block.onpointermove = event => {
    if (drag?.pointer === event.pointerId) track(event);
  };
  block.onpointerup = event => {
    if (drag?.pointer !== event.pointerId) return;
    track(event);
    const {direction, x, y} = drag;
    drag = null;
    const distance = (x - event.clientX) * direction;
    const commit = distance > 32 && distance > Math.abs(event.clientY - y);
    if (direction) {
      suppressClick = true;
      setTimeout(() => { suppressClick = false; }, 0);
    }
    if (flip) settle(commit);
    else if (commit) move(direction);
  };
  block.onpointercancel = block.onlostpointercapture = () => {
    if (!drag) return;
    drag = null;
    if (flip) settle(false);
  };

  paint();
  resize();
  let measuredWidth = block.clientWidth;
  const observer = new ResizeObserver(() => {
    if (!volume.isConnected) {
      observer.disconnect();
    } else if (measuredWidth !== block.clientWidth) {
      measuredWidth = block.clientWidth;
      resize();
    }
  });
  observer.observe(block);
  document.fonts.ready.then(resize);
}
