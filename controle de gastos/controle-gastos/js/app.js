/**
 * app.js
 * Inicialização comum a todas as páginas internas:
 * tema, proteção de rota, injeção de sidebar/cabeçalho e logout.
 *
 * Cada página interna deve ter no <body>:
 *   data-pagina="dashboard" data-titulo="Dashboard" data-subtitulo="..."
 * e os containers <aside id="sidebar"></aside> e <header id="topo"></header>
 * dentro de .app-shell.
 */

const MENU_ITENS = [
  { href: 'dashboard.html', icone: '▦', label: 'Dashboard' },
  { href: 'receitas.html', icone: '＋', label: 'Receitas' },
  { href: 'despesas.html', icone: '－', label: 'Despesas' },
  { href: 'metas.html', icone: '◎', label: 'Metas' },
  { href: 'relatorios.html', icone: '▤', label: 'Relatórios' },
  { href: 'perfil.html', icone: '◐', label: 'Perfil' },
];

const MENU_ADMIN = { href: 'admin.html', icone: '⚙', label: 'Painel Admin' };

const App = (() => {
  function aplicarTema(tema) {
    document.documentElement.setAttribute('data-tema', tema);
    Storage.setTheme(tema);
    const icone = document.getElementById('icone-tema');
    if (icone) icone.textContent = tema === 'dark' ? '☀' : '☾';
  }

  function alternarTema() {
    const atual = document.documentElement.getAttribute('data-tema');
    aplicarTema(atual === 'dark' ? 'light' : 'dark');
  }

  function protegerRota() {
    const user = Storage.getCurrentUser();
    if (!user) {
      window.location.href = 'login.html';
      return null;
    }
    return user;
  }

  function protegerRotaAdmin() {
    const user = protegerRota();
    if (user && user.tipo !== 'admin') {
      window.location.href = 'dashboard.html';
      return null;
    }
    return user;
  }

  function logout() {
    Storage.clearSession();
    window.location.href = 'login.html';
  }

  function renderSidebar(paginaAtiva, user) {
    const itens = user.tipo === 'admin' ? [...MENU_ITENS, MENU_ADMIN] : MENU_ITENS;

    const linksHtml = itens.map(item => `
      <a href="${item.href}" class="menu-item${item.href === paginaAtiva ? ' menu-item--ativo' : ''}">
        <span class="icone">${item.icone}</span>
        <span>${item.label}</span>
      </a>
    `).join('');

    return `
      <div class="marca">
        <div class="marca-selo">R</div>
        <div>
          <div class="marca-nome">Razão</div>
          <div class="marca-subtitulo">Controle financeiro</div>
        </div>
      </div>
      <nav>${linksHtml}</nav>
      <div style="margin-top:auto;">
        <button class="menu-item" id="botao-logout" style="width:100%; border:none; background:none; text-align:left;">
          <span class="icone">⏻</span>
          <span>Sair</span>
        </button>
      </div>
    `;
  }

  function renderTopo(titulo, subtitulo, user) {
    return `
      <button class="botao-icone" id="sidebar-toggle" title="Recolher menu">☰</button>
      <div class="topo-titulo" style="margin-right:auto; margin-left:16px;">
        <h1>${titulo}</h1>
        ${subtitulo ? `<p>${subtitulo}</p>` : ''}
      </div>
      <div class="topo-acoes">
        <button class="botao-icone" id="botao-tema" title="Alternar tema">
          <span id="icone-tema">☾</span>
        </button>
        <div class="avatar-usuario">
          <div class="avatar-circulo" id="usuario-iniciais">${Utils.gerarIniciais(user.nome)}</div>
          <span id="usuario-nome" style="font-size:0.86rem; font-weight:500;">${user.nome}</span>
        </div>
      </div>
    `;
  }

  function initSidebar() {
    const toggleBtn = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('sidebar');
    if (!toggleBtn || !sidebar) return;

    toggleBtn.addEventListener('click', () => {
      if (window.innerWidth <= 640) {
        sidebar.classList.toggle('sidebar--movel-aberta');
      } else {
        sidebar.classList.toggle('sidebar--recolhida');
      }
    });
  }

  function initPaginaInterna({ exigirAdmin = false } = {}) {
    aplicarTema(Storage.getTheme());
    const user = exigirAdmin ? protegerRotaAdmin() : protegerRota();
    if (!user) return null;

    const body = document.body;
    const paginaAtiva = body.dataset.pagina + '.html';
    const titulo = body.dataset.titulo || '';
    const subtitulo = body.dataset.subtitulo || '';

    const sidebarEl = document.getElementById('sidebar');
    const topoEl = document.getElementById('topo');
    if (sidebarEl) sidebarEl.innerHTML = renderSidebar(paginaAtiva, user);
    if (topoEl) topoEl.innerHTML = renderTopo(titulo, subtitulo, user);

    initSidebar();
    aplicarTema(Storage.getTheme());

    const btnTema = document.getElementById('botao-tema');
    if (btnTema) btnTema.addEventListener('click', alternarTema);

    const btnLogout = document.getElementById('botao-logout');
    if (btnLogout) btnLogout.addEventListener('click', logout);

    return user;
  }

  return { aplicarTema, alternarTema, protegerRota, protegerRotaAdmin, logout, initPaginaInterna };
})();
