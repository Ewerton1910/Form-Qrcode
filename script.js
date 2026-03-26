const ADMIN_USER = "admin";
const ADMIN_PASS = atob("bDRuY2gwbjN0My0yMDI1IQ==");
let servicoAtivo = true;

// Sincroniza status
firebase.database().ref('servico/ativo').on('value', (snapshot) => {
  servicoAtivo = snapshot.val() !== false;
  const btn = document.getElementById('btnEnviar');
  if (btn) {
    btn.classList.toggle('btn-suspenso', !servicoAtivo);
    btn.textContent = servicoAtivo
      ? '📤 Enviar Pedido para WhatsApp'
      : '❌ Serviço Suspenso';
  }
});

// ✅ Sincroniza dias da semana (ADICIONADOS: segunda, quarta, sexta)
let diasAtivos = {
  segunda: true,
  terca: true,
  quarta: true,
  quinta: true,
  sexta: true
};

firebase.database().ref('dias/segunda').on('value', (snapshot) => {
  diasAtivos.segunda = snapshot.val() !== false;
  atualizarOpcoesDias();
});

firebase.database().ref('dias/terca').on('value', (snapshot) => {
  diasAtivos.terca = snapshot.val() !== false;
  atualizarOpcoesDias();
});

firebase.database().ref('dias/quarta').on('value', (snapshot) => {
  diasAtivos.quarta = snapshot.val() !== false;
  atualizarOpcoesDias();
});

firebase.database().ref('dias/quinta').on('value', (snapshot) => {
  diasAtivos.quinta = snapshot.val() !== false;
  atualizarOpcoesDias();
});

firebase.database().ref('dias/sexta').on('value', (snapshot) => {
  diasAtivos.sexta = snapshot.val() !== false;
  atualizarOpcoesDias();
});

// Atualiza opções de dias no select
function atualizarOpcoesDias() {
  const select = document.getElementById('diaRetirada');
  if (!select) return;

  // Limpa opções
  select.innerHTML = '<option value="" disabled selected>Escolha o dia</option>';

  // Configuração dos dias
  const diasConfig = [
    { key: 'segunda', value: "1", label: "Segunda-Feira" },
    { key: 'terca', value: "2", label: "Terça-Feira" },
    { key: 'quarta', value: "3", label: "Quarta-Feira" },
    { key: 'quinta', value: "4", label: "Quinta-Feira" },
    { key: 'sexta', value: "5", label: "Sexta-Feira" }
  ];

  let algumAtivo = false;
  diasConfig.forEach(dia => {
    if (diasAtivos[dia.key]) {
      const option = document.createElement('option');
      option.value = dia.value;
      option.textContent = dia.label;
      select.appendChild(option);
      algumAtivo = true;
    }
  });

  // Se nenhum dia estiver ativo
  if (!algumAtivo) {
    select.innerHTML = '<option value="" disabled selected>Nenhum dia disponível</option>';
  }
}

// Calcula próxima data (Lógica universal para qualquer dia da semana)
function calcularProximaData(diaSemana) {
  const hoje = new Date();
  const diaAtual = hoje.getDay();
  let diasParaAdicionar = 0;

  if (diaAtual < diaSemana) {
    diasParaAdicionar = diaSemana - diaAtual;
  } else if (diaAtual === diaSemana) {
    diasParaAdicionar = 7; // Próxima semana
  } else {
    diasParaAdicionar = (7 - diaAtual) + diaSemana;
  }

  const data = new Date();
  data.setDate(data.getDate() + diasParaAdicionar);
  return data;
}

// Formata data como "Terça-Feira, 21/10/2025"
function formatarDataExibicao(data) {
  const diasSemana = ["Domingo", "Segunda-Feira", "Terça-Feira", "Quarta-Feira", "Quinta-Feira", "Sexta-Feira", "Sábado"];
  const dia = String(data.getDate()).padStart(2, '0');
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const ano = data.getFullYear();
  const nomeDia = diasSemana[data.getDay()];
  return `${nomeDia}, ${dia}/${mes}/${ano}`;
}

// Horários por restaurante
const HORARIOS_ALMOCO = {
  central: ["10:30","10:45","11:00","11:15","11:30","11:45","12:00", "12:15", "12:30", "12:45", "13:00","13:15","13:30","13:45","14:00"],
  campo: ["11:00","11:15","11:30","11:45","12:00", "12:15", "12:30", "12:45", "13:00","13:15","13:30", "13:45", "14:00", "14:15", "14:30","14:45","15:00"]
};

// ✅ Incrementa contador por restaurante e turno (AGORA USADO APENAS PARA JANTA)
function incrementarContadorPorTurno(restaurante, turno) {
  const db = firebase.database();
  const restauranteKey = restaurante.toLowerCase();
  const turnoKey = turno.toLowerCase();
  return db.ref(`contadores/${restauranteKey}/${turnoKey}`).transaction(current => (current || 0) + 1)
    .catch(err => {
      console.error("Erro na transação:", err);
      document.getElementById('modalErro').style.display = 'flex';
    });
}

// ✅ FUNÇÃO DEFINITIVA: Atualiza campos com base no turno e restaurante (SEM REPETIÇÃO)
function atualizarCamposPorTurnoERestaurante() {
  const turno = document.getElementById('turno')?.value;
  const restauranteSelecionado = document.querySelector('input[name="restaurante"]:checked')?.value;
  const containerHorario = document.getElementById('horarioContainer');
  const select = document.getElementById('horarioRetirada');

  // ✅ Limpa listeners anteriores corretamente
  if (window.firebaseListeners) {
    window.firebaseListeners.forEach(item => {
      item.ref.off('value', item.callback);
    });
  }
  window.firebaseListeners = [];

  if (turno === "Almoço" && restauranteSelecionado) {
    const restauranteKey = restauranteSelecionado.toLowerCase();
    const horarios = HORARIOS_ALMOCO[restauranteKey] || [];

    const carregarHorarios = () => {
      // ✅ Limpa select antes de recarregar
      select.innerHTML = '<option value="" disabled selected>Carregando...</option>';
      let carregados = 0;
      let opcoesAtivas = [];

      horarios.forEach(horario => {
        firebase.database().ref(`horarios/${restauranteKey}/${horario}`).once('value', (snapshot) => {
          const data = snapshot.val() || { ativo: true, contador: 0 };
          carregados++;

          if (data.ativo) {
            opcoesAtivas.push({ value: horario, text: horario });
          }

          if (carregados === horarios.length) {
            select.innerHTML = '<option value="" disabled selected>Escolha o horário</option>';
            opcoesAtivas.forEach(opt => {
              const option = document.createElement('option');
              option.value = opt.value;
              option.textContent = opt.text;
              select.appendChild(option);
            });

            if (opcoesAtivas.length === 0) {
              select.innerHTML = '<option value="" disabled selected>Nenhum horário disponível</option>';
            }

            containerHorario.style.display = 'block';
          }
        }).catch(err => console.error("Erro ao carregar horário:", err));
      });
    };

    carregarHorarios();

    // ✅ Escuta mudanças em tempo real corretamente
    horarios.forEach(horario => {
      const ref = firebase.database().ref(`horarios/${restauranteKey}/${horario}`);
      ref.on('value', carregarHorarios);
      window.firebaseListeners.push({ ref, callback: carregarHorarios });
    });
  } else {
    containerHorario.style.display = 'none';
  }
}

// Eventos
document.getElementById('turno')?.addEventListener('change', atualizarCamposPorTurnoERestaurante);
document.querySelectorAll('input[name="restaurante"]').forEach(radio => {
  radio.addEventListener('change', atualizarCamposPorTurnoERestaurante);
});

// Login
document.getElementById('btnLogin')?.addEventListener('click', () => {
  document.getElementById('modalLogin').style.display = 'flex';
});
document.querySelector('.close')?.addEventListener('click', () => {
  document.getElementById('modalLogin').style.display = 'none';
});
document.getElementById('btnSubmitLogin')?.addEventListener('click', () => {
  const user = document.getElementById('loginUser')?.value;
  const pass = document.getElementById('loginPass')?.value;
  if (user === ADMIN_USER && pass === ADMIN_PASS) {
    // ✅ Redireciona com chave secreta
    window.location.href = 'painel-controle-interno-a1b2c3.html?chave=AcessoLiberado123';
  } else {
    document.getElementById('loginError').style.display = 'block';
    setTimeout(() => document.getElementById('loginError').style.display = 'none', 3000);
  }
});

// Fecha modal suspenso
document.getElementById('btnFecharSuspenso')?.addEventListener('click', () => {
  document.getElementById('modalSuspenso').style.display = 'none';
});

// ✅ Verifica chave secreta no admin (segurança básica) - Funçao não utilizada no index.js
function verificarAcessoAdmin() {
  const urlParams = new URLSearchParams(window.location.search);
  const chave = urlParams.get('chave');
  if (chave !== 'AcessoLiberado123') {
    alert("Acesso negado!");
    window.location.href = 'index.html';
    throw new Error("Acesso negado!");
  }
}

// ✅ CLIQUE NO BOTÃO — COM CONTADORES CORRIGIDOS
document.getElementById('btnEnviar').addEventListener('click', function(e) {
  e.preventDefault();

  if (!servicoAtivo) {
    document.getElementById('modalSuspenso').style.display = 'flex';
    return;
  }

  // Validação do Dia da Retirada
  const diaSelecionado = document.getElementById("diaRetirada").value;
  if (!diaSelecionado) {
    alert("Selecione o dia da retirada!");
    return;
  }

  // Calcula data exata
  const dataRetirada = calcularProximaData(parseInt(diaSelecionado));
  const linhaDataExibida = formatarDataExibicao(dataRetirada);

  // Captura demais valores
  const nomePessoa = document.getElementById("nomePessoa").value;
  const matricula = document.getElementById("matricula").value;
  const nomeEmpresa = document.getElementById("nomeEmpresa").value;
  const turno = document.getElementById("turno").value;
  const contato = document.getElementById("contato").value.replace(/\D/g, "");
  const prato = document.getElementById("prato").value;
  const restauranteInput = document.querySelector('input[name="restaurante"]:checked');
  if (!restauranteInput) {
    alert("Selecione um restaurante!");
    return;
  }
  const restaurante = restauranteInput.value;
  
  // ✅ Validação do campo "Prato"
  if (!prato) {
    alert("Por favor, selecione um prato!");
    document.getElementById("prato").focus();
    return;
  }
  // Validação do contato
  if (!/^\d{2}9\d{8}$/.test(contato)) {
    alert("Número de WhatsApp inválido!");
    return;
  }

  // Horário (só se for Almoço)
  let linhaHorario = "";
  let horarioRetirada = "";
  const horarioContainer = document.getElementById('horarioContainer');
  
  // ✅ Só valida se o campo estiver visível (Almoço)
  if (horarioContainer.style.display !== 'none' && turno === "Almoço") {
    horarioRetirada = document.getElementById("horarioRetirada").value;
    
    // ✅ Obriga a selecionar um horário
    if (!horarioRetirada) {
      alert("Por favor, selecione o horário da retirada!");
      document.getElementById("horarioRetirada").focus();
      return;
    }
    
    linhaHorario = `🕒 *Horário da Retirada:* ${horarioRetirada}\n`;
  }

  // 🛑 LÓGICA DE CONTADORES CORRIGIDA (EVITA DUPLICAÇÃO)
  let dbPromise;
  if (turno === "Almoço" && horarioRetirada) {
    // Se for Almoço, incrementa APENAS o contador por HORÁRIO.
    const db = firebase.database();
    const ref = db.ref(`horarios/${restaurante.toLowerCase()}/${horarioRetirada}/contador`);
    dbPromise = ref.transaction(current => (current || 0) + 1);
    
  } else if (turno === "Janta") {
    // Se for Janta, incrementa o contador GERAL.
    dbPromise = incrementarContadorPorTurno(restaurante.toLowerCase(), turno);
    
  } else if (turno === "Almoço" && horarioContainer.style.display !== 'none' && !horarioRetirada) {
      // Caso de segurança para Almoço sem horário selecionado
      alert("Erro interno na seleção de horário. Por favor, tente novamente.");
      return;
  }

  // Se houver uma promessa do banco, lidamos com o sucesso/erro
  if (dbPromise) {
    dbPromise.then(() => {
      // Mostra modal de sucesso
      document.getElementById('modalSucesso').style.display = 'flex';
      
      // Monta mensagem e redireciona
      const numeroWhatsApp = "55"; 
      const agora = new Date();
      const carimboPedido = agora.toLocaleString('pt-BR');
      
      const mensagem =
        `📋 *NOVO PEDIDO DE REFEIÇÃO!*\n` +
        `\n` +
        `👤 *Nome:* ${nomePessoa}\n` +
        `🔢 *Matrícula:* ${matricula}\n` +
        `📱 *Contato:* ${formatarTelefone(contato)}\n` +
        `🏢 *Empresa:* ${nomeEmpresa}\n` +
        `🕓 *Turno:* ${turno}\n` +
        `📅 *Dia da Retirada:* ${linhaDataExibida}\n` +
        linhaHorario +
        `🏪 *Restaurante:* ${restaurante}\n` +
        `🍲 *Prato Escolhido:* ${prato}\n` +
        `\n` +
        `🕒 *Pedido gerado em:* ${carimboPedido}\n` +
        `✅ Pedido registrado com sucesso!\n` +
        `📲 Entraremos em contato se houver alteração.`;

      const whatsappUrl = `https://api.whatsapp.com/send?phone=${numeroWhatsApp}&text=${encodeURIComponent(mensagem)}`;
      
      // Pequeno delay para o usuário ver o modal antes de abrir o WhatsApp
      setTimeout(() => {
        const win = window.open(whatsappUrl, '_blank');
        if (!win || win.closed || typeof win.closed === 'undefined') {
            window.location.href = whatsappUrl;
        }
        
        // Limpa o formulário
        document.getElementById("empresaForm").reset();
        atualizarCamposPorTurnoERestaurante();
      }, 1500);
    }).catch(err => {
      console.error("Erro ao processar pedido:", err);
      document.getElementById('modalErro').style.display = 'flex';
    });
  }
});

// Formatação de telefone
function formatarTelefone(numero) {
  if (numero.length !== 11) return numero;
  return `(${numero.slice(0, 2)}) ${numero.slice(2, 7)}-${numero.slice(7)}`;
}
document.getElementById("contato")?.addEventListener("input", function (e) {
  let valor = e.target.value.replace(/\D/g, "");
  if (valor.length > 11) valor = valor.slice(0, 11);
  let formatado = "";
  if (valor.length === 0) formatado = "";
  else if (valor.length === 1) formatado = `(${valor}`;
  else if (valor.length === 2) formatado = `(${valor})`;
  else if (valor.length <= 7) formatado = `(${valor.slice(0, 2)}) ${valor.slice(2)}`;
  else formatado = `(${valor.slice(0, 2)}) ${valor.slice(2, 7)}-${valor.slice(7)}`;
  e.target.value = formatado;
});
