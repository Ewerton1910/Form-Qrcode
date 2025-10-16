// 🔥 Firebase Config (sem espaços!)
const firebaseConfig = {
  apiKey: "AIzaSyAE4cDYIovbsK61qug_wgDUdlbrR5lpvGM",
  authDomain: "lanchonete-pedidos.firebaseapp.com",
  databaseURL: "https://lanchonete-pedidos-default-rtdb.firebaseio.com",
  projectId: "lanchonete-pedidos",
  storageBucket: "lanchonete-pedidos.firebasestorage.app",
  messagingSenderId: "558143780233",
  appId: "1:558143780233:web:2ddbbd6b5ef2dad6435d58"
};

(function() {
  const appScript = document.createElement('script');
  appScript.src = 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js';
  appScript.onload = () => {
    const dbScript = document.createElement('script');
    dbScript.src = 'https://www.gstatic.com/firebasejs/10.12.0/firebase-database-compat.js';
    dbScript.onload = () => {
      firebase.initializeApp(firebaseConfig);
      const db = firebase.database();

      db.ref('servico/ativo').on('value', (snapshot) => {
        const ativo = snapshot.val() !== false;
        const statusEl = document.getElementById('status');
        if (statusEl) {
          statusEl.textContent = ativo ? '🟢 Ativo' : '🔴 Desativado';
        }
      });

      document.getElementById('btnAtivar')?.addEventListener('click', () => {
        db.ref('servico/ativo').set(true);
        alert('✅ Pedidos ativados com sucesso!');
      });

      document.getElementById('btnDesativar')?.addEventListener('click', () => {
        db.ref('servico/ativo').set(false);
        alert('❌ Pedidos desativados com sucesso!');
      });
    };
    document.head.appendChild(dbScript);
  };
  document.head.appendChild(appScript);
})();
