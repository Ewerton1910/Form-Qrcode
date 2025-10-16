// 🔥 Firebase Config (sem espaços extras!)
const firebaseConfig = {
  apiKey: "AIzaSyAE4cDYIovbsK61qug_wgDUdlbrR5lpvGM",
  authDomain: "lanchonete-pedidos.firebaseapp.com",
  databaseURL: "https://lanchonete-pedidos-default-rtdb.firebaseio.com",
  projectId: "lanchonete-pedidos",
  storageBucket: "lanchonete-pedidos.firebasestorage.app",
  messagingSenderId: "558143780233",
  appId: "1:558143780233:web:2ddbbd6b5ef2dad6435d58"
};

// Credenciais de login
const ADMIN_USER = "admin";
const ADMIN_PASS = "senha123";

// Carrega o Firebase via CDN (modo compatível)
(function() {
  const script = document.createElement('script');
  script.src = 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js';
  script.onload = () => {
    const script2 = document.createElement('script');
    script2.src = 'https://www.gstatic.com/firebasejs/10.12.0/firebase-database-compat.js';
    script2.onload = () => {
      // Inicializa Firebase
      firebase.initializeApp(firebaseConfig);
      const db = firebase.database();

      // Estado do serviço
      let servicoAtivo = true;

      // Sincroniza com Firebase
      db.ref('servico/ativo').on('value', (snapshot) => {
        servicoAtivo = snapshot.val() !== false;
        const btn = document.getElementById('btnEnviar');
        if (btn) {
          btn.disabled = !servicoAtivo;
          btn.textContent = servicoAtivo ? '📤 Enviar Pedido para WhatsApp' : '❌ Serviço Suspenso';
          btn.style.backgroundColor = servicoAtivo ? '#25D366' : '#ccc';
        }
      });

      // Mostra modal de login
      document.getElementById('btnLogin')?.addEventListener('click', () => {
        document.getElementById('modalLogin').style.display = 'block';
      });

      // Fecha modal
      document.querySelector('.close')?.addEventListener('click', () => {
        document.getElementById('modalLogin').style.display = 'none';
      });

      // Login
      document.getElementById('btnSubmitLogin')?.addEventListener('click', () => {
        const user = document.getElementById('loginUser')?.value;
        const pass = document.getElementById('loginPass')?.value;
        if (user === ADMIN_USER && pass === ADMIN_PASS) {
          window.location.href = 'admin.html';
        } else {
          document.getElementById('loginError').style.display = 'block';
          setTimeout(() => {
            document.getElementById('loginError').style.display = 'none';
          }, 3000);
        }
      });

      // Fecha modal de suspenso
      document.getElementById('btnFecharSuspenso')?.addEventListener('click', () => {
        document.getElementById('modalSuspenso').style.display = 'none';
      });

      // Intercepta envio
      document.getElementById('empresaForm')?.addEventListener('submit', function(e) {
        if (!servicoAtivo) {
          e.preventDefault();
          document.getElementById('modalSuspenso').style.display = 'block';
          return;
        }

        e.preventDefault();
        const nomePessoa = document.getElementById("nomePessoa").value;
        const matricula = document.getElementById("matricula").value;
        const nomeEmpresa = document.getElementById("nomeEmpresa").value;
        const turno = document.getElementById("turno").value;
        const contato = document.getElementById("contato").value.replace(/\D/g, "");
        const prato = document.getElementById("prato").value;

        const regexContato = /^\d{2}9\d{8}$/;
        if (!regexContato.test(contato)) {
          document.getElementById("erroContato").style.display = "block";
          document.getElementById("contato").focus();
          return;
        } else {
          document.getElementById("erroContato").style.display = "none";
        }

        const restauranteInput = document.querySelector('input[name="restaurante"]:checked');
        if (!restauranteInput) {
          document.getElementById("erroRestaurante").style.display = "block";
          document.querySelector('input[name="restaurante"]').focus();
          return;
        } else {
          document.getElementById("erroRestaurante").style.display = "none";
        }
        const restaurante = restauranteInput.value;

        const numeroWhatsApp = "5584987443832";
        const mensagem =
          `📋 *NOVO PEDIDO DE REFEIÇÃO!*\n` +
          `\n` +
          `👤 *Nome:* ${nomePessoa}\n` +
          `🔢 *Matrícula:* ${matricula}\n` +
          `📱 *Contato:* ${formatarTelefone(contato)}\n` +
          `🏢 *Empresa:* ${nomeEmpresa}\n` +
          `🕒 *Turno:* ${turno}\n` +
          `🏪 *Restaurante:* ${restaurante}\n` +
          `🍲 *Prato Escolhido:* ${prato}\n` +
          `\n` +
          `✅ Pedido registrado com sucesso!\n` +
          `📲 Entraremos em contato se houver alteração.`;

        // ✅ Corrigido: removido espaço extra
        window.open(`https://wa.me/${numeroWhatsApp}?text=${encodeURI(mensagem)}`, '_blank');
        alert("Seu pedido será aberto no WhatsApp. Por favor, confirme o envio.");
      });

      // Função de formatação de telefone
      function formatarTelefone(numero) {
        if (numero.length !== 11) return numero;
        return `(${numero.slice(0, 2)}) ${numero.slice(2, 7)}-${numero.slice(7)}`;
      }

      document.getElementById("contato")?.addEventListener("input", function (e) {
        let valor = e.target.value.replace(/\D/g, "");
        const pos = e.target.selectionStart;
        const campo = e.target;

        if (valor.length > 11) valor = valor.slice(0, 11);

        let formatado = "";
        if (valor.length === 0) {
          formatado = "";
        } else if (valor.length === 1) {
          formatado = `(${valor}`;
        } else if (valor.length === 2) {
          formatado = `(${valor})`;
        } else if (valor.length <= 7) {
          formatado = `(${valor.slice(0, 2)}) ${valor.slice(2)}`;
        } else {
          formatado = `(${valor.slice(0, 2)}) ${valor.slice(2, 7)}-${valor.slice(7)}`;
        }

        const diff = formatado.length - valor.length;
        campo.value = formatado;

        setTimeout(function() {
          let novaPos;
          if (pos <= 1) {
            novaPos = pos + 1;
          } else if (pos === 2) {
            novaPos = pos + 2;
          } else if (pos <= 7) {
            novaPos = pos + 3;
          } else {
            novaPos = pos + diff;
          }
          novaPos = Math.min(novaPos, formatado.length);
          campo.selectionStart = novaPos;
          campo.selectionEnd = novaPos;
        }, 0);
      });
    };
    document.head.appendChild(script2);
  };
  document.head.appendChild(script);
})();
