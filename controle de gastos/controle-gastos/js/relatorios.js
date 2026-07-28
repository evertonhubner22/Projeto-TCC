/**
 * relatorios.js
 * Agrega receitas/despesas por período e renderiza os gráficos analíticos.
 */

let usuarioAtual = null;
let listaGraficos = [];

document.addEventListener('DOMContentLoaded', () => {
  usuarioAtual = App.initPaginaInterna();
  if (!usuarioAtual) return;

  document.getElementById('filtro-periodo').addEventListener('change', renderizarRelatorios);
  renderizarRelatorios();
});

function mesISO(data) {
  return data.toISOString().slice(0, 7);
}

function filtrarPorMes(lista, anoMes) {
  return lista.filter(item => item.data && item.data.slice(0, 7) === anoMes);
}

function somar(lista) {
  return lista.reduce((total, item) => total + Number(item.valor || 0), 0);
}

function ultimosMeses(qtd) {
  const meses = [];
  const nomesMes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const hoje = new Date();
  for (let i = qtd - 1; i >= 0; i--) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    meses.push({ chave: mesISO(d), rotulo: `${nomesMes[d.getMonth()]}/${String(d.getFullYear()).slice(2)}` });
  }
  return meses;
}

function coresGrafico() {
  const estilo = getComputedStyle(document.documentElement);
  return {
    texto: estilo.getPropertyValue('--cor-texto-suave').trim(),
    borda: estilo.getPropertyValue('--cor-borda').trim(),
    receita: estilo.getPropertyValue('--cor-receita').trim(),
    despesa: estilo.getPropertyValue('--cor-despesa').trim(),
    destaque: estilo.getPropertyValue('--cor-destaque').trim(),
  };
}

const PALETA_CATEGORIAS = ['#2F6F4E', '#B8860B', '#5B7FA6', '#8B3A3A', '#6B5B95', '#4E8098', '#A66B4E', '#7A8B5B', '#9C6B9C'];

function destruirGraficos() {
  listaGraficos.forEach(g => g.destroy());
  listaGraficos = [];
}

function renderizarRelatorios() {
  destruirGraficos();

  const qtdMeses = Number(document.getElementById('filtro-periodo').value);
  const meses = ultimosMeses(qtdMeses);
  const cores = coresGrafico();

  const receitas = Storage.Receitas.listar(usuarioAtual.id);
  const despesas = Storage.Despesas.listar(usuarioAtual.id);
  const metas = Storage.Metas.listar(usuarioAtual.id);

  const receitasPorMes = meses.map(m => somar(filtrarPorMes(receitas, m.chave)));
  const despesasPorMes = meses.map(m => somar(filtrarPorMes(despesas, m.chave)));
  const saldoPorMes = receitasPorMes.map((r, i) => r - despesasPorMes[i]);

  // Receitas x Despesas
  listaGraficos.push(new Chart(document.getElementById('grafico-receitas-despesas'), {
    type: 'bar',
    data: {
      labels: meses.map(m => m.rotulo),
      datasets: [
        { label: 'Receitas', data: receitasPorMes, backgroundColor: cores.receita, borderRadius: 4 },
        { label: 'Despesas', data: despesasPorMes, backgroundColor: cores.despesa, borderRadius: 4 },
      ],
    },
    options: opcoesBase(cores),
  }));

  // Evolução financeira (saldo acumulado)
  let acumulado = 0;
  const saldoAcumulado = saldoPorMes.map(v => (acumulado += v));
  listaGraficos.push(new Chart(document.getElementById('grafico-evolucao'), {
    type: 'line',
    data: {
      labels: meses.map(m => m.rotulo),
      datasets: [{
        label: 'Saldo acumulado', data: saldoAcumulado, borderColor: cores.receita,
        backgroundColor: 'transparent', tension: 0.3, pointRadius: 3,
      }],
    },
    options: opcoesBase(cores),
  }));

  // Gastos por categoria (período selecionado)
  const chavesMes = meses.map(m => m.chave);
  const despesasPeriodo = despesas.filter(d => chavesMes.includes(d.data.slice(0, 7)));
  const porCategoria = {};
  despesasPeriodo.forEach(d => { porCategoria[d.categoria] = (porCategoria[d.categoria] || 0) + Number(d.valor); });

  listaGraficos.push(new Chart(document.getElementById('grafico-categoria-pizza'), {
    type: 'pie',
    data: {
      labels: Object.keys(porCategoria),
      datasets: [{ data: Object.values(porCategoria), backgroundColor: PALETA_CATEGORIAS, borderWidth: 0 }],
    },
    options: { responsive: true, plugins: { legend: { position: 'bottom', labels: { color: cores.texto, boxWidth: 10, font: { size: 11 } } } } },
  }));

  // Economia mensal (área)
  listaGraficos.push(new Chart(document.getElementById('grafico-economia-area'), {
    type: 'line',
    data: {
      labels: meses.map(m => m.rotulo),
      datasets: [{
        label: 'Economia', data: saldoPorMes, borderColor: cores.destaque,
        backgroundColor: hexParaRgba(cores.destaque, 0.18), fill: true, tension: 0.3, pointRadius: 3,
      }],
    },
    options: opcoesBase(cores),
  }));

  // Receitas por mês
  listaGraficos.push(new Chart(document.getElementById('grafico-receitas-mes'), {
    type: 'bar',
    data: { labels: meses.map(m => m.rotulo), datasets: [{ label: 'Receitas', data: receitasPorMes, backgroundColor: cores.receita, borderRadius: 4 }] },
    options: opcoesBase(cores, true),
  }));

  // Despesas por mês
  listaGraficos.push(new Chart(document.getElementById('grafico-despesas-mes'), {
    type: 'bar',
    data: { labels: meses.map(m => m.rotulo), datasets: [{ label: 'Despesas', data: despesasPorMes, backgroundColor: cores.despesa, borderRadius: 4 }] },
    options: opcoesBase(cores, true),
  }));

  // Progresso das metas (indicador)
  const canvasMetas = document.getElementById('grafico-metas-indicador');
  if (metas.length === 0) {
    canvasMetas.getContext('2d').clearRect(0, 0, canvasMetas.width, canvasMetas.height);
  } else {
    const progressos = metas.map(m => Math.min(Math.round((Number(m.valorAtual) / Number(m.valorAlvo)) * 100), 100));
    listaGraficos.push(new Chart(canvasMetas, {
      type: 'bar',
      data: {
        labels: metas.map(m => m.descricao),
        datasets: [{ label: '% concluído', data: progressos, backgroundColor: cores.destaque, borderRadius: 4 }],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          x: { max: 100, ticks: { color: cores.texto, callback: v => v + '%' }, grid: { color: cores.borda } },
          y: { ticks: { color: cores.texto }, grid: { display: false } },
        },
      },
    }));
  }
}

function opcoesBase(cores, semLegenda = false) {
  return {
    responsive: true,
    plugins: { legend: { display: !semLegenda, position: 'bottom', labels: { color: cores.texto, boxWidth: 10, font: { size: 11 } } } },
    scales: {
      x: { ticks: { color: cores.texto }, grid: { display: false } },
      y: { ticks: { color: cores.texto }, grid: { color: cores.borda } },
    },
  };
}

function hexParaRgba(hex, alpha) {
  const h = hex.replace('#', '');
  const bigint = parseInt(h, 16);
  const r = (bigint >> 16) & 255, g = (bigint >> 8) & 255, b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
