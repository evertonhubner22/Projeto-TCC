/**
 * perfil.js
 * Edição de dados pessoais e troca de senha do usuário logado.
 */

let usuarioAtual = null;

document.addEventListener('DOMContentLoaded', () => {
  usuarioAtual = App.initPaginaInterna();
  if (!usuarioAtual) return;

  preencherDados();
  initFormPerfil();
  initFormSenha();
  initBotaoTema();
});

function preencherDados() {
  document.getElementById('perfil-nome').value = usuarioAtual.nome;
  document.getElementById('perfil-email').value = usuarioAtual.email;
  document.getElementById('perfil-iniciais').textContent = Utils.gerarIniciais(usuarioAtual.nome);
  document.getElementById('perfil-nome-exibicao').textContent = usuarioAtual.nome;
  document.getElementById('perfil-email-exibicao').textContent = usuarioAtual.email;

  const criadoEm = usuarioAtual.criadoEm ? new Date(usuarioAtual.criadoEm) : null;
  document.getElementById('perfil-membro-desde').textContent = criadoEm
    ? `Membro desde ${criadoEm.toLocaleDateString('pt-BR')}`
    : '';
}

function initFormPerfil() {
  const form = document.getElementById('form-perfil');
  const campoNome = document.getElementById('campo-perfil-nome');
  const campoEmail = document.getElementById('campo-perfil-email');

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const nome = document.getElementById('perfil-nome').value.trim();
    const email = document.getElementById('perfil-email').value.trim();

    let valido = true;
    campoNome.classList.remove('campo--invalido');
    campoEmail.classList.remove('campo--invalido');

    if (!nome) { campoNome.classList.add('campo--invalido'); valido = false; }

    const emailValido = Utils.validarEmail(email);
    const emailEmUso = emailValido && Storage.findUserByEmail(email) && Storage.findUserByEmail(email).id !== usuarioAtual.id;

    if (!emailValido || emailEmUso) { campoEmail.classList.add('campo--invalido'); valido = false; }

    if (!valido) return;

    usuarioAtual = Storage.updateUser(usuarioAtual.id, { nome, email });
    preencherDados();
    Utils.mostrarToast('Dados atualizados com sucesso.', 'sucesso');
  });
}

function initFormSenha() {
  const form = document.getElementById('form-senha');
  const campoAtual = document.getElementById('campo-senha-atual');
  const campoNova = document.getElementById('campo-nova-senha');
  const campoConfirmar = document.getElementById('campo-confirmar-nova-senha');

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const atual = document.getElementById('senha-atual').value;
    const nova = document.getElementById('nova-senha').value;
    const confirmar = document.getElementById('confirmar-nova-senha').value;

    let valido = true;
    [campoAtual, campoNova, campoConfirmar].forEach(c => c.classList.remove('campo--invalido'));

    if (atual !== usuarioAtual.senha) { campoAtual.classList.add('campo--invalido'); valido = false; }
    if (!Utils.validarSenha(nova)) { campoNova.classList.add('campo--invalido'); valido = false; }
    if (nova !== confirmar) { campoConfirmar.classList.add('campo--invalido'); valido = false; }

    if (!valido) return;

    usuarioAtual = Storage.updateUser(usuarioAtual.id, { senha: nova });
    form.reset();
    Utils.mostrarToast('Senha atualizada com sucesso.', 'sucesso');
  });
}

function initBotaoTema() {
  document.getElementById('botao-alternar-tema-perfil').addEventListener('click', App.alternarTema);
}
