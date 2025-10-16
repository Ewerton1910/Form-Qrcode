// 🔥 Seu firebaseConfig (mesmo usado no index.html)
const firebaseConfig = {
  apiKey: "AIzaSyAE4cDYIovbsK61qug_wgDUdlbrR5lpvGM",
  authDomain: "lanchonete-pedidos.firebaseapp.com",
  databaseURL: "https://lanchonete-pedidos-default-rtdb.firebaseio.com",
  projectId: "lanchonete-pedidos",
  storageBucket: "lanchonete-pedidos.firebasestorage.app",
  messagingSenderId: "558143780233",
  appId: "1:558143780233:web:2ddbbd6b5ef2dad6435d58"
};

// Carrega e inicializa o Firebase em modo compatível
(function() {
  // Carrega firebase-app-compat
  const appScript = document.createElement('script');
  appScript.src = 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js';
  appScript.onload = () => {
    // Carrega firebase-database-compat
    const dbScript = document.createElement('script');
    dbScript.src = 'https://www.gstatic.com/firebasejs/10.12.0/firebase-database-compat.js';
    dbScript.onload = () => {
      // Inicializa o Firebase
      firebase.initializeApp(firebaseConfig);
      const db = firebase.database();

      // Atualiza o status em tempo real
      db.ref('servico/ativo').on('value', (snapshot) => {
        const ativo = snapshot.val() !== false;
        const statusEl = document.getElementById('status');
        if (statusEl) {
          statusEl.textContent = ativo ? '🟢 Ativo' : '🔴 Desativado';
        }
      });

      // Botão Ativar
      const btnAtivar = document.getElementById('btnAtivar');
      if (btnAtivar) {
        btnAtivar.addEventListener('click', () => {
          db.ref('servico/ativo').set(true);
          alert('✅ Pedidos ativados com sucesso!');
        });
      }

      // Botão Desativar
      const btnDesativar = document.getElementById('btnDesativar');
      if (btnDesativar) {
        btnDesativar.addEventListener('click', () => {
          db.ref('servico/ativo').set(false);
          alert('❌ Pedidos desativados com sucesso!');
        });
      }
    };
    document.head.appendChild(dbScript);
  };
  document.head.appendChild(appScript);
})();
