import {worlds, buildStory, exampleStory} from './stories.js';
import {mountReader} from './reader.js';

const site = document.querySelector('#site');
const modal = document.querySelector('#modal');
const modalContent = document.querySelector('#modal-content');
const toast = document.querySelector('#toast');
const storageKey = 'whizpic-studio-v2';
const collection = Object.keys(worlds);
const labels = ['Personagem', 'História', 'Dedicatória'];
const tabs = [
  ['home','⌂','Início'], ['collection','▤','Coleção'], ['library','▥','Meus livros'],
  ['orders','◇','Pedidos'], ['profile','◉','Perfil']
];
const statusText = {draft:'Rascunho',review:'Em revisão',approved:'Aprovado',ordered:'Pedido simulado'};
let state = {account:null, books:[]};
try { state = JSON.parse(localStorage.getItem(storageKey)) || state; } catch {}
let intent = null;
let selectedWorld = 'castle';
let toastTimer;
let installPrompt;
let renderId = 0;

function save() {
  try { localStorage.setItem(storageKey, JSON.stringify(state)); return true; }
  catch { notify('O armazenamento está indisponível ou cheio. As mudanças desta sessão podem ser perdidas.'); return false; }
}

function notify(message) {
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 3200);
}

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
const brand = `<span class="brand"><span class="brand-icon" aria-hidden="true">✦</span>Whiz<span>Pic</span></span>`;
const badge = status => `<span class="status status-${status}">${statusText[status]}</span>`;
const coverUrl = world => `assets/${worlds[world].art}.webp`;
const titleFor = book => book.title || (book.name ? `${book.name} · ${worlds[book.world].title}` : 'Uma nova aventura');
const personalBooks = () => state.books.filter(book => book.owner === state.account?.email);
const findBook = id => personalBooks().find(book => book.id === id);
const money = value => value.toLocaleString('pt-BR', {style:'currency',currency:'BRL'});

function go(path) {
  if (location.hash === '#' + path) render();
  else location.hash = path;
}

function buttonsForBook(book) {
  return book.status === 'draft'
    ? `<a class="btn small" href="#/edit/${book.id}">Continuar</a>`
    : `<a class="btn small secondary" href="#/book/${book.id}">Abrir livro <span aria-hidden="true">→</span></a>`;
}

function collectionCards(app = false) {
  return collection.map(world => {
    const item = worlds[world];
    return `<article class="collection-card" style="--tint:${item.color}">
      <button type="button" class="cover-button" data-action="${app ? 'catalog-preview' : 'sample'}" data-world="${world}" aria-label="Folhear ${item.title}">
        <img src="${coverUrl(world)}" alt="" loading="lazy">
        <span class="cover-open" aria-hidden="true">→</span>
      </button>
      <div class="card-copy"><span class="category">${item.category}</span><h3>${item.title}</h3><p>${item.description}</p>
       <button class="text-link" data-action="start" data-mode="collection" data-world="${world}">Personalizar <span aria-hidden="true">→</span></button>
      </div>
    </article>`;
  }).join('');
}

function landing() {
  site.innerHTML = `
    <header class="landing-nav wrap">
      <a href="#/" aria-label="WhizPic, início">${brand}</a>
      <nav aria-label="Menu principal"><a href="#colecao">Coleção</a><a href="#como-funciona">Como funciona</a><a href="#duvidas">Dúvidas</a></nav>
      <div class="nav-actions"><a class="access" href="#/${state.account ? 'home' : 'login'}">${state.account ? 'Meu espaço' : 'Acessar'}</a><button class="btn small" data-action="start" data-mode="choose">Criar meu livro <span aria-hidden="true">→</span></button></div>
    </header>
    <main id="main">
      <section class="hero wrap">
        <div class="hero-copy">
          <p class="kicker"><span aria-hidden="true">✦</span> LIVROS ILUSTRADOS PERSONALIZADOS</p>
          <h1>Sua criança<br> é a <em>estrela</em><br> da história<span class="hero-period">.</span></h1>
          <p class="hero-description">O nome, o jeitinho e as ideias da sua criança viram um livro feito especialmente para ela.</p>
          <div class="hero-actions"><button class="btn" data-action="start" data-mode="choose">Criar meu livro <span aria-hidden="true">→</span></button><button class="hero-preview" data-action="sample" data-world="castle"><span aria-hidden="true">▷</span> Folhear um exemplo</button></div>
        </div>
        <div class="hero-visual">
          <img class="hero-art" src="assets/kingdom.webp" alt="Castelo lilás, uma pequena aventureira e um dragão saem das páginas de um livro aberto" fetchpriority="high">
          <span class="hero-star star-one" aria-hidden="true">✦</span><span class="hero-star star-two" aria-hidden="true">✧</span><span class="hero-star star-three" aria-hidden="true">✷</span>
          <button class="preview-float" data-action="sample" data-world="castle"><img src="assets/castle.webp" alt=""><span><strong>O Reino das Cores</strong><small>Abrir o livro de exemplo</small></span><b aria-hidden="true">→</b></button>
        </div>
      </section>
      <section class="ways wrap" id="colecao">
        <div class="section-heading reveal"><div><p class="kicker">ESCOLHA COMO COMEÇAR</p><h2>Duas formas de contar<br> uma grande história.</h2></div><p>O mundo pode nascer de uma ideia sua ou de uma aventura que já preparamos. Em ambos, quem vive a história é sua criança.</p></div>
        <div class="way-grid reveal">
          <article class="way way-collection"><span class="way-icon" aria-hidden="true">▤</span><div><h3>Coleção WhizPic</h3><p>Escolha uma aventura e personalize com nome, foto e dedicatória.</p><a class="text-link" href="#aventuras">Explorar coleção →</a></div></article>
          <article class="way way-custom"><span class="way-icon" aria-hidden="true">✦</span><div><h3>Crie do zero</h3><p>Traga uma ideia, uma memória ou um universo inventado. A Whiz ajuda a montar a história.</p><button class="text-link" data-action="start" data-mode="custom">Começar do zero →</button></div></article>
        </div>
      </section>
      <section class="collection-section" id="aventuras"><div class="wrap">
        <div class="section-heading reveal"><div><p class="kicker">COLEÇÃO WHIZPIC</p><h2>Qual mundo vamos<br>explorar hoje?</h2></div><p>Abra as capas para experimentar a leitura ou escolha uma aventura para personalizar.</p></div>
        <div class="collection-grid reveal">${collectionCards()}</div>
      </div></section>
      <section class="wrap reading-section reveal" id="leitura">
        <div class="reading-copy"><p class="kicker">PRÉVIA DIGITAL</p><h2>Vire a página.<br>O mundo muda.</h2><p>Abra a capa e arraste para os lados, com o dedo ou com o mouse.</p><div class="world-picker" aria-label="Livros de exemplo">${collection.map(world => `<button class="chip" data-action="switch-sample" data-world="${world}" aria-pressed="${world === selectedWorld}">${worlds[world].name}</button>`).join('')}</div></div>
        <div id="landing-reader"></div>
      </section>
      <section class="wrap workflow" id="como-funciona">
        <div class="section-heading reveal"><div><p class="kicker">COMO FUNCIONA</p><h2>Da primeira ideia<br>à última página.</h2></div></div>
        <div class="workflow-grid reveal">
          <article><span aria-hidden="true">◉</span><h3>Escolha quem vai viver a aventura</h3><p>Adicione nome, idade, gostos e uma foto opcional.</p></article>
          <article><span aria-hidden="true">✦</span><h3>Dê seu toque à história</h3><p>Personalize uma aventura da coleção ou converse com a Whiz para inventar outra.</p></article>
          <article><span aria-hidden="true">▤</span><h3>Folheie, revise e aprove</h3><p>Leia a prévia digital, edite o que quiser e experimente o pedido impresso.</p></article>
        </div>
      </section>
      <section class="wrap faq" id="duvidas"><h2>Dúvidas de quem cria</h2><div>
        <details><summary>Preciso usar uma foto?</summary><p>A foto é opcional. Na demonstração, ela aparece como retrato na prévia e fica neste navegador.</p></details>
        <details><summary>Posso revisar antes de aprovar?</summary><p>Sim. Folheie o livro completo e volte ao editor para ajustar personagem, história ou dedicatória.</p></details>
        <details><summary>Posso usar no celular?</summary><p>Sim. Você pode usar o estúdio no navegador e instalá-lo na tela inicial quando o navegador oferecer essa opção.</p></details>
        <details><summary>O protótipo cobra ou entrega livros?</summary><p>O pedido é demonstrativo. A confirmação permite experimentar o acompanhamento sem cobrança ou envio.</p></details>
      </div></section>
      <section class="wrap bottom-cta reveal"><div><h2>Quem vai estrelar<br>sua primeira história?</h2><button class="btn" data-action="start" data-mode="choose">Criar meu livro →</button></div><img src="assets/kingdom.webp" alt="" loading="lazy"></section>
    </main>
    <footer class="wrap landing-footer"><a href="#/">${brand}</a><a href="#/home">Abrir estúdio →</a><a href="#/">Voltar ao topo ↑</a></footer>`;
  mountReader(document.querySelector('#landing-reader'), exampleStory(selectedWorld));
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) if (entry.isIntersecting) { entry.target.classList.add('revealed'); observer.unobserve(entry.target); }
  }, {threshold:.09});
  document.querySelectorAll('.reveal').forEach(element => observer.observe(element));
  const visual = document.querySelector('.hero-visual');
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    visual.onpointermove = event => {
      if (event.pointerType !== 'mouse') return;
      const rect = visual.getBoundingClientRect();
      visual.style.setProperty('--mx', `${(event.clientX-rect.left-rect.width/2)/42}px`);
      visual.style.setProperty('--my', `${(event.clientY-rect.top-rect.height/2)/42}px`);
    };
    visual.onpointerleave = () => { visual.style.removeProperty('--mx'); visual.style.removeProperty('--my'); };
  }
}

function desktopNav(active) {
  return tabs.map(([path, icon, text]) => `<a class="app-nav-item" href="#/${path}" ${path === active ? 'aria-current="page"' : ''}><span aria-hidden="true">${icon}</span>${text}</a>`).join('');
}

function shell(active, markup) {
  const name = escapeHtml(state.account.name);
  const nav = desktopNav(active);
  site.innerHTML = `<div class="app-shell">
    <aside class="sidebar"><a href="#/home" aria-label="WhizPic, início do estúdio">${brand}</a><nav aria-label="Estúdio">${nav}</nav><a class="back-site" href="#/">← Voltar ao site</a></aside>
    <div class="app-body"><header class="app-header"><a class="mobile-brand" href="#/home">${brand}</a><span class="desktop-header">Estúdio WhizPic</span><a class="user-link" href="#/profile"><span class="avatar" aria-hidden="true">${name[0] || 'W'}</span><span>${name}</span></a></header>
    <main id="main" class="app-main">${markup}</main></div>
    <nav class="mobile-nav" aria-label="Estúdio no celular">${nav}</nav>
  </div>`;
}

function auth(login) {
  const title = login ? 'Abra seu estúdio' : 'Crie seu perfil';
  site.innerHTML = `<main class="auth" id="main">
    <div class="auth-main"><a href="#/" aria-label="Voltar à página inicial">${brand}</a>
      <section class="auth-box"><h1>${title}</h1><p>${login ? 'Use o e-mail do seu perfil neste navegador para acessar sua estante.' : 'Comece seu primeiro livro. O perfil e os livros de demonstração ficam neste navegador.'}</p>
        <form data-form="${login ? 'login' : 'signup'}">
          ${login ? '' : '<label>Seu nome<input name="name" autocomplete="name" required maxlength="60" placeholder="Como podemos chamar você?"></label>'}
          <label>Seu e-mail<input name="email" type="email" autocomplete="email" required maxlength="120" placeholder="voce@exemplo.com"></label>
          <p class="error" role="alert" hidden></p><button class="btn">${login ? 'Acessar estúdio' : 'Criar perfil'} →</button>
        </form>
        <button class="btn secondary" data-action="demo">Experimentar demonstração</button>
        <p class="auth-switch">${login ? 'Primeira vez? <a href="#/signup">Crie um perfil</a>' : 'Já tem um perfil? <a href="#/login">Acesse aqui</a>'}</p>
      </section>
    </div><div class="auth-art"><img src="assets/kingdom.webp" alt=""></div>
  </main>`;
}

function choose() {
  return `<div class="app-heading"><p class="kicker">NOVO LIVRO</p><h1>Como começa sua história?</h1></div>
    <div class="choose-grid"><article class="way way-collection"><img src="assets/castle.webp" alt=""><div><h2>Coleção WhizPic</h2><p>Uma aventura pronta para receber sua personagem.</p><a class="btn" href="#/collection">Escolher aventura →</a></div></article>
    <article class="way way-custom"><img src="assets/space.webp" alt=""><div><h2>Crie do zero</h2><p>Invente o cenário, escolha o que acontece e conte com a ajuda da Whiz.</p><button class="btn" data-action="start" data-mode="custom">Começar do zero →</button></div></article></div>`;
}

function bookCards(books) {
  return books.length ? `<div class="books-grid">${books.map(book => `<article class="saved-book">
      <div class="saved-art" style="background-image:url(${coverUrl(book.world)})">${badge(book.status)}</div>
      <div class="saved-body"><h3>${escapeHtml(titleFor(book))}</h3><p>${book.mode === 'custom' ? 'Crie do zero' : 'Coleção WhizPic'}</p>${buttonsForBook(book)}</div>
    </article>`).join('')}</div>` : `<div class="empty"><span aria-hidden="true">▥</span><h3>Sua estante começa com um livro</h3><p>Rascunhos e histórias criadas aparecem aqui.</p><a class="btn small" href="#/new">Criar primeiro livro</a></div>`;
}

function home() {
  const name = escapeHtml(state.account.name.split(' ')[0]);
  shell('home', `<div class="dashboard-hero"><div><p class="kicker">SEU ESTÚDIO</p><h1>Olá, ${name}!</h1><p>Qual história vamos contar hoje?</p><a class="btn" href="#/new">Criar novo livro →</a></div><img src="assets/kingdom.webp" alt=""></div>
    <div class="app-section-head"><h2>Meus livros</h2><a class="text-link" href="#/library">Ver estante →</a></div>${bookCards(personalBooks().slice(0,3))}
    <div class="app-section-head"><h2>Explore a coleção</h2><a class="text-link" href="#/collection">Ver coleção →</a></div><div class="collection-grid">${collectionCards(true)}</div>`);
}

function library() {
  shell('library', `<div class="app-heading row-heading"><div><p class="kicker">SUA ESTANTE</p><h1>Meus livros</h1></div><a class="btn" href="#/new">Criar novo livro <span aria-hidden="true">✦</span></a></div>${bookCards(personalBooks())}`);
}

function catalog() {
  shell('collection', `<div class="app-heading"><p class="kicker">COLEÇÃO WHIZPIC</p><h1>Escolha uma aventura</h1><p>Folheie um exemplo e depois personalize com os detalhes da sua criança.</p></div><div class="collection-grid">${collectionCards(true)}</div>`);
}

function orders() {
  const books = personalBooks().filter(book => book.order);
  shell('orders', `<div class="app-heading"><p class="kicker">ACOMPANHAMENTO</p><h1>Meus pedidos</h1><p>Confira o andamento dos seus pedidos simulados.</p></div>${books.length ? `<div class="order-list">${books.map(book => `<article class="order-card"><img src="${coverUrl(book.world)}" alt=""><div><span class="category">#${book.id.slice(-6).toUpperCase()}</span><h3>${escapeHtml(titleFor(book))}</h3><p>${book.order.quantity} ${book.order.quantity === 1 ? 'exemplar' : 'exemplares'} · ${money(book.order.quantity * 119)}</p></div><a class="btn small secondary" href="#/order/${book.id}">Acompanhar →</a></article>`).join('')}</div>` : '<div class="empty"><span aria-hidden="true">◇</span><h3>Nenhum pedido ainda</h3><p>Depois de aprovar um livro, você pode simular um pedido impresso.</p><a class="btn small" href="#/library">Abrir minha estante</a></div>'}`);
}

function profile() {
  shell('profile', `<div class="app-heading"><p class="kicker">MEU ESPAÇO</p><h1>Seu perfil</h1></div><section class="panel compact">
    <form data-form="profile"><label>Seu nome<input name="name" value="${escapeHtml(state.account.name)}" required maxlength="60"></label>
      <label>Seu e-mail<input value="${escapeHtml(state.account.email)}" type="email" readonly></label><button class="btn">Salvar perfil</button></form>
    <div class="profile-actions"><button class="btn secondary" data-action="install">Instalar app</button><button class="text-link" data-action="logout">Sair do perfil</button><a class="text-link" href="#/">Voltar ao site</a></div>
  </section>`);
}

function editor(book) {
  const step = book.step;
  const item = worlds[book.world];
  const intro = ['Conte um pouco sobre quem vai viver essa aventura.', 'Escolha os detalhes que dão vida à história.', 'Deixe uma mensagem para a primeira página.'];
  const character = `
    <div class="form-row"><label>Nome da personagem<input name="name" value="${escapeHtml(book.name)}" required maxlength="36" placeholder="Ex. Luna"></label>
      <label>Idade<input name="age" type="number" min="1" max="17" required value="${escapeHtml(book.age)}" placeholder="7"></label></div>
    <label>Algo de que ela gosta <small>Opcional</small><input name="interest" maxlength="65" value="${escapeHtml(book.interest)}" placeholder="Ex. mapas, dinossauros ou seu urso de pelúcia"></label>
    <div class="upload"><div class="upload-preview" id="portrait-preview">${book.photo ? '<img alt="Foto selecionada">' : '<span aria-hidden="true">◉</span>'}</div>
    <div><label for="photo">Foto da personagem <small>Opcional</small></label><p>JPG, PNG ou WebP. A foto aparece como retrato na prévia e fica neste navegador.</p><input id="photo" type="file" accept="image/jpeg,image/png,image/webp"><button type="button" class="text-link remove-photo" data-action="remove-photo" ${book.photo ? '' : 'hidden'}>Remover foto</button><p class="error" id="upload-error" role="alert" hidden></p></div></div>`;
  const story = `
    ${book.mode === 'custom' ? `<label>Universo visual<select name="world">${collection.map(key => `<option value="${key}" ${key === book.world ? 'selected' : ''}>${worlds[key].name}</option>`).join('')}</select></label><label>Onde acontece? <small>Opcional</small><input name="setting" value="${escapeHtml(book.setting)}" placeholder="Ex. uma ilha flutuante" maxlength="65"></label>` : `<div class="chosen-world"><span aria-hidden="true">${item.symbol}</span><div><strong>${item.title}</strong><p>${item.description}</p></div></div>`}
    <label>Qual é o tema da história? <small>Opcional</small><input name="lesson" value="${escapeHtml(book.lesson)}" maxlength="65" placeholder="Ex. coragem para tentar algo novo"></label>
    ${book.mode === 'custom' ? `<section class="whiz-chat"><div class="chat-header"><span class="brand-icon" aria-hidden="true">✦</span><div><strong>Whiz</strong><small>Assistente simulada</small></div></div><div class="chat-log" role="log" aria-label="Conversa com a Whiz"><p><strong>Whiz</strong> · Que surpresa ${escapeHtml(book.name)} poderia encontrar no caminho?</p>${book.ideas.map(idea => `<p class="my-message"><strong>Você</strong> · ${escapeHtml(idea)}</p><p><strong>Whiz</strong> · ${escapeHtml(reply(idea))}</p>`).join('')}</div><div class="suggestions">${['Um mapa que brilha', 'Uma chave que canta', 'Um gigante gentil'].map(idea => `<button type="button" class="chip" data-action="suggest" data-idea="${idea}">${idea}</button>`).join('')}</div><div class="chat-input"><input name="idea" maxlength="90" placeholder="Escreva uma ideia" aria-label="Ideia para a história"><button type="button" class="btn small" data-action="send">Enviar</button></div></section>` : ''}`;
  const dedication = `<label>Título do livro <small>Opcional</small><input name="title" value="${escapeHtml(book.title)}" maxlength="70" placeholder="${escapeHtml(titleFor(book))}"></label><label>Dedicatória <small>Opcional</small><textarea name="dedication" rows="4" maxlength="220" placeholder="Para você, que transforma todos os dias em uma aventura…">${escapeHtml(book.dedication)}</textarea></label>`;
  shell('library', `<a class="text-link" href="#/library">← Meus livros</a><div class="app-heading"><p class="kicker">${book.mode === 'custom' ? 'CRIE DO ZERO' : 'COLEÇÃO WHIZPIC'}</p><h1>Crie seu livro</h1></div>
    <ol class="steps-nav" aria-label="Etapas da criação">${labels.map((label,index) => `<li><button type="button" data-action="editor-step" data-step="${index}" ${index === step ? 'aria-current="step"' : ''} ${index > (book.progress ?? step) ? 'disabled' : ''}><span aria-hidden="true">${index < step ? '✓' : index+1}</span>${label}</button></li>`).join('')}</ol>
    <div class="editor-grid"><section class="panel"><h2>${labels[step]}</h2><p>${intro[step]}</p>${book.revision ? `<p class="revision"><strong>Ajuste solicitado</strong> · ${escapeHtml(book.revision)}</p>` : ''}<form data-form="editor" data-id="${book.id}">
      ${[character,story,dedication][step]}<div class="form-actions"><button type="button" class="btn secondary" data-action="editor-back">${step ? '← Voltar' : 'Sair do editor'}</button><button class="btn">${step === 2 ? 'Gerar prévia ✦' : 'Continuar →'}</button></div>
    </form></section><aside class="editor-preview"><div class="mock-book" style="background-image:url(${coverUrl(book.world)})"><span>WHIZPIC</span><strong>${escapeHtml(titleFor(book))}</strong></div><p>Prévia da capa</p></aside></div>`);
  if (step === 0 && book.photo) document.querySelector('#portrait-preview img').src = book.photo;
  const log = document.querySelector('.chat-log');
  if (log) log.scrollTop = log.scrollHeight;
}

function reply(idea) {
  if (idea.includes('mapa')) return 'O mapa pode revelar um caminho que só aparece ao luar!';
  if (idea.includes('chave')) return 'A melodia da chave pode ser a pista que abre uma passagem secreta.';
  if (idea.includes('gigante')) return 'Que tal o gigante ser o primeiro a oferecer ajuda quando tudo parecer difícil?';
  return `Vou incluir “${idea}” como a descoberta que muda a aventura.`;
}

function bookView(book) {
  const revision = book.revision ? `<p class="revision"><strong>Ajuste solicitado</strong> · ${escapeHtml(book.revision)}</p>` : '';
  const actions = {
    review: `<button class="btn secondary" data-action="revise" data-id="${book.id}">Pedir ajuste</button><a class="text-link" href="#/edit/${book.id}">Editar livro</a><button class="btn" data-action="approve" data-id="${book.id}">Aprovar prévia ✓</button>`,
    approved: `<button class="btn secondary" data-action="reopen" data-id="${book.id}">Voltar à revisão</button><a class="btn" href="#/checkout/${book.id}">Simular pedido →</a>`,
    ordered: `<a class="btn" href="#/order/${book.id}">Acompanhar pedido →</a>`
  };
  shell('library', `<a class="text-link" href="#/library">← Meus livros</a><div class="app-heading row-heading"><div><p class="kicker">PRÉVIA DO LIVRO</p><h1>${escapeHtml(titleFor(book))}</h1></div>${badge(book.status)}</div>
    ${revision}<div class="book-view"><div id="project-reader"></div></div><div class="review-actions">${actions[book.status]}</div>`);
  mountReader(document.querySelector('#project-reader'), buildStory(book));
}

function checkout(book) {
  shell('orders', `<a class="text-link" href="#/book/${book.id}">← Voltar ao livro</a><div class="app-heading"><p class="kicker">EDIÇÃO IMPRESSA</p><h1>Simular pedido</h1><p>Confira seu livro e a quantidade de exemplares. Nenhum pagamento será solicitado.</p></div>
    <div class="checkout-grid"><section class="panel"><h2>Seu pedido</h2><form data-form="checkout" data-id="${book.id}"><label>Exemplares<select name="quantity"><option value="1">1 exemplar</option><option value="2">2 exemplares</option><option value="3">3 exemplares</option></select></label>
      <label>CEP para estimativa <small>Opcional, use um CEP fictício</small><input name="postal" inputmode="numeric" pattern="[0-9]{5}-?[0-9]{3}" maxlength="9" placeholder="00000-000"></label><button class="btn">Confirmar pedido de teste →</button></form></section>
    <aside class="panel order-summary"><img src="${coverUrl(book.world)}" alt=""><div><span class="category">CAPA DURA</span><h3>${escapeHtml(titleFor(book))}</h3><p>Total simulado <strong id="total">${money(119)}</strong></p></div></aside></div>`);
}

const milestones = ['Pedido confirmado', 'Em impressão', 'A caminho', 'Entregue'];
function orderView(book) {
  shell('orders', `<a class="text-link" href="#/orders">← Meus pedidos</a><div class="app-heading"><p class="kicker">PEDIDO #${book.id.slice(-6).toUpperCase()}</p><h1>${escapeHtml(titleFor(book))}</h1><p>Pedido demonstrativo · ${book.order.quantity} ${book.order.quantity === 1 ? 'exemplar' : 'exemplares'} · ${money(book.order.quantity*119)}</p></div>
    <section class="panel compact"><h2>Acompanhe seu livro</h2><ol class="timeline">${milestones.map((label,index) => `<li class="${book.order.stage >= index ? 'reached' : ''}" ${book.order.stage === index ? 'aria-current="step"' : ''}><span aria-hidden="true">${index < book.order.stage ? '✓' : index+1}</span>${label}</li>`).join('')}</ol>
    ${book.order.stage < milestones.length-1 ? `<button class="btn secondary" data-action="advance-order" data-id="${book.id}">Simular próxima etapa →</button>` : '<p>Fluxo de entrega concluído na demonstração.</p>'}</section>`);
}

function readFields(form, book) {
  for (const field of ['name','age','interest','world','setting','lesson','title','dedication']) {
    if (form.elements[field]) book[field] = form.elements[field].value.trim();
  }
  save();
}

function currentEditor() {
  const form = document.querySelector('[data-form="editor"]');
  return form && {form, book:findBook(form.dataset.id)};
}

function create(mode, world) {
  if (mode === 'choose') return go('/new');
  const book = {id:crypto.randomUUID(),owner:state.account.email,mode,world:world || 'castle',step:0,progress:0,status:'draft',ideas:[]};
  state.books.unshift(book);
  save();
  go('/edit/' + book.id);
}

function start(mode, world) {
  if (state.account) return create(mode,world);
  intent = {mode,world};
  go('/signup');
}

function onSignedIn() {
  save();
  const next = intent;
  intent = null;
  if (next) create(next.mode,next.world);
  else go('/home');
}

function showModal(title, body) {
  modalContent.innerHTML = `<div class="modal-inner"><button type="button" class="round modal-close" data-action="close-modal" aria-label="Fechar">×</button><h2 id="modal-title">${title}</h2>${body}</div>`;
  if (!modal.open) modal.showModal();
}

function sample(world, canCreate) {
  showModal(worlds[world].title, `<div class="modal-reader" id="sample-reader"></div><div class="modal-actions"><button class="btn" data-action="start" data-mode="collection" data-world="${world}">${canCreate ? 'Personalizar aventura' : 'Criar com este livro'} →</button></div>`);
  mountReader(document.querySelector('#sample-reader'), exampleStory(world));
}

function render() {
  const token = ++renderId;
  const hash = location.hash;
  const [page, id] = hash.startsWith('#/') ? hash.slice(2).split('/') : ['', ''];
  if (modal.open) modal.close();
  if (!page) {
    if (!site.querySelector('.landing-nav')) landing();
    requestAnimationFrame(() => {
      if (token !== renderId) return;
      const section = hash && !hash.startsWith('#/') ? document.getElementById(hash.slice(1)) : null;
      if (section) section.scrollIntoView();
      else window.scrollTo(0,0);
    });
    return;
  }
  window.scrollTo(0,0);
  if (page === 'signup' || page === 'login') {
    if (state.account) return go('/home');
    return auth(page === 'login');
  }
  if (!state.account) return go('/login');
  const book = findBook(id);
  switch (page) {
    case 'home': home(); break;
    case 'new': shell('',choose()); break;
    case 'library': library(); break;
    case 'collection': catalog(); break;
    case 'orders': orders(); break;
    case 'profile': profile(); break;
    case 'edit':
      if (!book) return go('/library');
      if (book.status === 'approved' || book.status === 'ordered') return go('/book/' + id);
      editor(book);
      break;
    case 'book':
      if (!book) return go('/library');
      if (book.status === 'draft') return go('/edit/' + id);
      bookView(book);
      break;
    case 'checkout':
      if (book?.status !== 'approved') return go('/library');
      checkout(book);
      break;
    case 'order':
      if (!book?.order) return go('/orders');
      orderView(book);
      break;
    default: go('/home');
  }
}

async function changePhoto(input, book) {
  const file = input.files[0];
  const error = document.querySelector('#upload-error');
  if (!file || !error) return;
  error.hidden = true;
  if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 12*1024*1024) {
    error.textContent = 'Escolha uma foto JPG, PNG ou WebP de até 12 MB.';
    error.hidden = false;
    input.value = '';
    return;
  }
  try {
    const image = await createImageBitmap(file);
    const canvas = document.createElement('canvas');
    const scale = Math.min(1,480/Math.max(image.width,image.height));
    canvas.width = Math.max(1,Math.round(image.width*scale));
    canvas.height = Math.max(1,Math.round(image.height*scale));
    canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);
    image.close();
    if (!input.isConnected || input.files[0] !== file) return;
    book.photo = canvas.toDataURL('image/webp',.82);
    book.status = 'draft';
    save();
    const photo = new Image();
    photo.src = book.photo;
    photo.alt = 'Foto selecionada';
    document.querySelector('#portrait-preview').replaceChildren(photo);
    document.querySelector('.remove-photo').hidden = false;
  } catch {
    error.textContent = 'Não foi possível abrir esta foto. Escolha outra imagem.';
    error.hidden = false;
    input.value = '';
  }
}

site.addEventListener('input', event => {
  const form = event.target.closest('[data-form="editor"]');
  if (form && event.target.type !== 'file') {
    const book = findBook(form.dataset.id);
    if (event.target.name !== 'idea' && book.status === 'review') book.status = 'draft';
    readFields(form,book);
    if (event.target.name === 'name' || event.target.name === 'title') document.querySelector('.mock-book strong').textContent = titleFor(book);
  }
});

site.addEventListener('change', event => {
  if (event.target.id === 'photo') changePhoto(event.target,currentEditor().book);
  if (event.target.name === 'world' && currentEditor()) {
    const {book} = currentEditor();
    document.querySelector('.mock-book').style.backgroundImage = `url(${coverUrl(book.world)})`;
    document.querySelector('.mock-book strong').textContent = titleFor(book);
  }
  if (event.target.name === 'quantity') document.querySelector('#total').textContent = money(Number(event.target.value)*119);
});

function sendIdea(value) {
  const {form,book} = currentEditor();
  const idea = value.trim();
  if (!idea) return form.elements.idea.focus();
  readFields(form,book);
  book.ideas = [...book.ideas.slice(-5),idea];
  book.status = 'draft';
  save();
  const log = form.querySelector('.chat-log');
  if (log.children.length > 11) {
    log.children[1].remove();
    log.children[1].remove();
  }
  for (const [name, body] of [['Você',idea],['Whiz',reply(idea)]]) {
    const line = document.createElement('p');
    const speaker = document.createElement('strong');
    speaker.textContent = name;
    if (name === 'Você') line.className = 'my-message';
    line.append(speaker, ' · ', body);
    log.append(line);
  }
  form.elements.idea.value = '';
  log.scrollTop = log.scrollHeight;
}

document.addEventListener('click', async event => {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const {action,world,mode,id} = button.dataset;
  const book = findBook(id);
  switch (action) {
    case 'sample': case 'catalog-preview': sample(world,action === 'catalog-preview'); break;
    case 'close-modal': modal.close(); break;
    case 'start': if (modal.open) modal.close(); start(mode,world); break;
    case 'switch-sample':
      selectedWorld = world;
      document.querySelectorAll('[data-action="switch-sample"]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      mountReader(document.querySelector('#landing-reader'),exampleStory(world));
      break;
    case 'demo':
      state.account = {name:'Família Demo',email:'demo@whizpic.example'};
      onSignedIn();
      break;
    case 'logout':
      state.account = null;
      save();
      go('/');
      break;
    case 'install':
      if (installPrompt) {
        const prompt = installPrompt;
        installPrompt = null;
        await prompt.prompt();
      } else showModal('Instale o WhizPic', '<p>No iPhone, abra o menu Compartilhar no Safari e toque em “Adicionar à Tela de Início”. No Android ou no computador, procure “Instalar app” no menu do navegador.</p>');
      break;
    case 'editor-step': case 'editor-back': {
      const editorState = currentEditor();
      if (!editorState.book) return;
      const current = editorState.book;
      if (action === 'editor-back' && !current.step) return go('/library');
      const step = action === 'editor-back' ? current.step-1 : Number(button.dataset.step);
      if (step > current.step && !editorState.form.reportValidity()) return;
      readFields(editorState.form,current);
      current.step = step;
      save();
      render();
      document.querySelector('.panel h2').setAttribute('tabindex','-1');
      document.querySelector('.panel h2').focus();
      break;
    }
    case 'remove-photo': {
      const {book:current} = currentEditor();
      delete current.photo;
      current.status = 'draft';
      save();
      document.querySelector('#photo').value = '';
      document.querySelector('#portrait-preview').innerHTML = '<span aria-hidden="true">◉</span>';
      button.hidden = true;
      break;
    }
    case 'suggest': sendIdea(button.dataset.idea); break;
    case 'send': sendIdea(currentEditor().form.elements.idea.value); break;
    case 'revise':
      showModal('Pedir ajuste', `<form data-form="revision" data-id="${id}"><label>O que você quer mudar?<textarea required maxlength="240" name="revision" rows="4" placeholder="Ex. quero trocar a dedicatória"></textarea></label><p>O ajuste será registrado. Você pode aplicá-lo no editor.</p><button class="btn">Registrar e abrir editor →</button></form>`);
      break;
    case 'approve':
      if (book?.status === 'review') { book.status = 'approved'; save(); notify('Prévia aprovada!'); render(); }
      break;
    case 'reopen':
      if (book?.status === 'approved') { book.status = 'review'; save(); render(); }
      break;
    case 'advance-order':
      if (book?.order && book.order.stage < milestones.length-1) {
        book.order.stage++; save(); render(); notify(milestones[book.order.stage]);
      }
      break;
  }
});

document.addEventListener('keydown', event => {
  if (event.key === 'Enter' && event.target.name === 'idea' && !event.isComposing) {
    event.preventDefault();
    sendIdea(event.target.value);
  }
});

document.addEventListener('submit', event => {
  const form = event.target;
  const type = form.dataset.form;
  if (!type) return;
  event.preventDefault();
  const fields = new FormData(form);
  const name = String(fields.get('name') || '').trim();
  const email = String(fields.get('email') || '').trim().toLowerCase();
  const book = findBook(form.dataset.id);
  if (type === 'signup' || type === 'login') {
    state.profiles ||= [];
    const previous = state.profiles.find(profile => profile.email === email);
    const error = form.querySelector('.error');
    if ((type === 'login' && !previous) || (type === 'signup' && (!name || previous || email === 'demo@whizpic.example'))) {
      error.textContent = type === 'login' ? 'Perfil não encontrado neste navegador. Crie um perfil para começar.' : previous ? 'Já existe um perfil com este e-mail. Use a opção Acessar.' : 'Informe um nome e um e-mail válido para o seu perfil.';
      error.hidden = false;
      return;
    }
    state.account = previous || {name,email};
    if (!previous) state.profiles.push(state.account);
    onSignedIn();
  }
  if (type === 'profile' && name) {
    state.account.name = name;
    const previous = state.profiles?.find(profile => profile.email === state.account.email);
    if (previous) previous.name = name;
    save();
    render();
    notify('Perfil atualizado.');
  }
  if (type === 'editor' && book) {
    readFields(form,book);
    if (book.step === 0 && !book.name) { form.elements.name.focus(); return; }
    if (book.step === 1 && form.elements.idea?.value.trim()) sendIdea(form.elements.idea.value);
    if (book.step < 2) {
      book.step++;
      book.progress = Math.max(book.progress || 0,book.step);
      save();
      render();
      document.querySelector('.panel h2').setAttribute('tabindex','-1');
      document.querySelector('.panel h2').focus();
    } else {
      book.status = 'review';
      save();
      go('/book/' + book.id);
    }
  }
  if (type === 'revision' && book?.status === 'review') {
    book.revision = String(fields.get('revision')).trim();
    if (!book.revision) { form.elements.revision.focus(); return; }
    book.step = 1;
    book.status = 'draft';
    save();
    modal.close();
    go('/edit/' + book.id);
  }
  if (type === 'checkout' && book?.status === 'approved') {
    book.order = {quantity:Number(fields.get('quantity')),stage:0};
    book.status = 'ordered';
    save();
    go('/order/' + book.id);
    notify('Pedido de teste confirmado!');
  }
});

document.querySelector('.skip').addEventListener('click', event => {
  event.preventDefault();
  const main = document.querySelector('#main');
  main.setAttribute('tabindex','-1');
  main.focus();
});
window.addEventListener('hashchange',render);
window.addEventListener('beforeinstallprompt',event => { event.preventDefault(); installPrompt = event; });
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {});
render();
