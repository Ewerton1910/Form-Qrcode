import React, { useState, useEffect } from "react";
import { db, OperationType, handleFirestoreError, loginWithGoogle, auth } from "../lib/firebase";
import { 
  collection, 
  addDoc, 
  doc, 
  onSnapshot, 
  updateDoc, 
  increment 
} from "firebase/firestore";
import { Lock, CheckCircle, XCircle, AlertTriangle, LogIn } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";

const HORARIOS_ALMOCO = {
  central: ["10:30","10:45","11:00","11:15","11:30","11:45","12:00", "12:15", "12:30", "12:45", "13:00","13:15","13:30","13:45","14:00"],
  campo: ["11:00","11:15","11:30","11:45","12:00", "12:15", "12:30", "12:45", "13:00","13:15","13:30", "13:45", "14:00", "14:15", "14:30","14:45","15:00"]
};

export default function CustomerForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nomePessoa: "",
    matricula: "",
    nomeEmpresa: "",
    turno: "",
    diaRetirada: "",
    restaurante: "",
    horarioRetirada: "",
    prato: "",
    contato: ""
  });

  const [servicoAtivo, setServicoAtivo] = useState(true);
  const [diasAtivos, setDiasAtivos] = useState<any>({
    segunda: true, terca: true, quarta: true, quinta: true, sexta: true
  });
  const [horariosDisponiveis, setHorariosDisponiveis] = useState<string[]>([]);
  const [showLogin, setShowLogin] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [showSuspended, setShowSuspended] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Se o usuário já estiver logado e for um dos emails permitidos, podemos redirecionar ou apenas permitir o acesso
        const allowedEmails = ["restaurantegrsa@gmail.com", "restaurantegrs@gmail.com", "ewerton.jhonatas@gmail.com"];
        if (allowedEmails.includes(user.email || "")) {
          // Opcional: Redirecionar automaticamente se já estiver logado?
          // Talvez seja melhor deixar o botão de login manual
        }
      }
    });

    // Sincronização Global (Serviço Ativo)
    const configRef = doc(db, 'configuracoes', 'servico');
    const unsubscribeConfig = onSnapshot(configRef, (snapshot) => {
      if (snapshot.exists()) {
        setServicoAtivo(snapshot.data().ativo !== false);
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, 'configuracoes/servico'));

    // Sincronização Dias Ativos
    const dias = ['segunda', 'terca', 'quarta', 'quinta', 'sexta'];
    const unsubscribesDias = dias.map(dia => {
      return onSnapshot(doc(db, 'dias', dia), (snapshot) => {
        if (snapshot.exists()) {
          setDiasAtivos((prev: any) => ({ ...prev, [dia]: snapshot.data().ativo }));
        }
      }, (err) => handleFirestoreError(err, OperationType.GET, `dias/${dia}`));
    });

    return () => {
      unsubscribeAuth();
      unsubscribeConfig();
      unsubscribesDias.forEach(u => u());
    };
  }, []);

  useEffect(() => {
    if (formData.turno === "Almoço" && formData.restaurante) {
      const restKey = formData.restaurante.toLowerCase();
      const horarios = HORARIOS_ALMOCO[restKey as keyof typeof HORARIOS_ALMOCO] || [];
      
      const unsubscribes: (() => void)[] = [];
      const statusMap: Record<string, boolean> = {};

      horarios.forEach(h => {
        const hRef = doc(db, 'horarios', `${restKey}_${h}`);
        const unsub = onSnapshot(hRef, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            statusMap[h] = data.ativo !== false;
            
            const disponiveis = horarios.filter(hor => statusMap[hor] !== false);
            setHorariosDisponiveis(disponiveis);
          }
        }, (err) => handleFirestoreError(err, OperationType.GET, `horarios/${restKey}_${h}`));
        unsubscribes.push(unsub);
      });

      return () => unsubscribes.forEach(u => u());
    } else {
      setHorariosDisponiveis([]);
    }
  }, [formData.turno, formData.restaurante]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const formatPhone = (value: string) => {
    let v = value.replace(/\D/g, "");
    if (v.length > 11) v = v.slice(0, 11);
    if (v.length <= 2) return v;
    if (v.length <= 7) return `(${v.slice(0, 2)}) ${v.slice(2)}`;
    return `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, contato: formatPhone(e.target.value) }));
    if (errors.contato) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.contato;
        return newErrors;
      });
    }
  };

  const calcularProximaData = (diaSemana: number) => {
    const hoje = new Date();
    const diaAtual = hoje.getDay();
    let diasParaAdicionar = 0;
    if (diaAtual < diaSemana) diasParaAdicionar = diaSemana - diaAtual;
    else if (diaAtual === diaSemana) diasParaAdicionar = 7;
    else diasParaAdicionar = (7 - diaAtual) + diaSemana;
    const data = new Date();
    data.setDate(data.getDate() + diasParaAdicionar);
    return data;
  };

  const formatarDataExibicao = (data: Date) => {
    const diasSemana = ["Domingo", "Segunda-Feira", "Terça-Feira", "Quarta-Feira", "Quinta-Feira", "Sexta-Feira", "Sábado"];
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const ano = data.getFullYear();
    return `${diasSemana[data.getDay()]}, ${dia}/${mes}/${ano}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!servicoAtivo) {
      setShowSuspended(true);
      return;
    }

    const newErrors: Record<string, string> = {};
    
    // Validação de campos obrigatórios
    if (!formData.nomePessoa.trim()) newErrors.nomePessoa = "Nome é obrigatório";
    if (!formData.matricula.trim()) newErrors.matricula = "Matrícula é obrigatória";
    if (!formData.nomeEmpresa.trim()) newErrors.nomeEmpresa = "Empresa é obrigatória";
    if (!formData.turno) newErrors.turno = "Turno é obrigatório";
    if (!formData.diaRetirada) newErrors.diaRetirada = "Dia da retirada é obrigatório";
    if (!formData.restaurante) newErrors.restaurante = "Restaurante é obrigatório";
    if (formData.turno === "Almoço" && !formData.horarioRetirada) newErrors.horarioRetirada = "Horário é obrigatório";
    if (!formData.prato) newErrors.prato = "Prato é obrigatório";

    const contatoLimpo = formData.contato.replace(/\D/g, "");
    if (!contatoLimpo) {
      newErrors.contato = "WhatsApp é obrigatório";
    } else if (!/^\d{2}9\d{8}$/.test(contatoLimpo)) {
      newErrors.contato = "Formato inválido! Ex: (94) 98765-4321";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // Rolar para o primeiro erro
      const firstErrorField = Object.keys(newErrors)[0];
      const element = document.getElementsByName(firstErrorField)[0];
      if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const dataRetirada = calcularProximaData(parseInt(formData.diaRetirada));
    const dataFormatada = formatarDataExibicao(dataRetirada);

    try {
      const orderData = {
        ...formData,
        contato: formatPhone(contatoLimpo),
        diaRetiradaFormatado: dataFormatada,
        createdAt: new Date().toISOString(),
        status: 'pendente'
      };
      
      // 1. Salvar Pedido
      await addDoc(collection(db, 'pedidos'), orderData);

      // 2. Atualizar Contadores
      const restKey = formData.restaurante.toLowerCase();
      
      // Incrementar contador geral (Almoço ou Janta) no banco
      const contadorGeralRef = doc(db, 'contadores', restKey);
      const fieldToIncrement = formData.turno === "Almoço" ? 'almoco' : 'janta';
      
      try {
        await updateDoc(contadorGeralRef, {
          [fieldToIncrement]: increment(1)
        });
      } catch (err) {
        console.error("Erro ao atualizar contador geral:", err);
        // Se o documento não existir, não falha o pedido, mas loga o erro
      }

      if (formData.turno === "Almoço" && formData.horarioRetirada) {
        const hRef = doc(db, 'horarios', `${restKey}_${formData.horarioRetirada}`);
        await updateDoc(hRef, {
          contador: increment(1)
        });
      }

      setShowSuccess(true);
      
      setTimeout(() => {
        setFormData({
          nomePessoa: "", matricula: "", nomeEmpresa: "", turno: "", diaRetirada: "", restaurante: "", horarioRetirada: "", prato: "", contato: ""
        });
        setShowSuccess(false);
      }, 3000);

    } catch (err) {
      console.error(err);
      setShowError(true);
      handleFirestoreError(err, OperationType.CREATE, 'pedidos');
    }
  };

  const handleAdminLogin = async () => {
    setIsLoggingIn(true);
    try {
      const result = await loginWithGoogle();
      const user = result.user;
      const allowedEmails = ["restaurantegrsa@gmail.com", "restaurantegrs@gmail.com", "ewerton.jhonatas@gmail.com"];
      
      if (allowedEmails.includes(user.email || "")) {
        navigate("/admin");
      } else {
        alert("Acesso negado: Este e-mail não tem permissão de administrador.");
        auth.signOut();
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao fazer login com Google.");
    } finally {
      setIsLoggingIn(false);
      setShowLogin(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/*<button 
        onClick={() => setShowLogin(true)}
        className="btn-admin-fixed"
      >
        <Lock size={16} /> Painel Admin
      </button>*/}

      <div className="container">
        <h1>🍽️ Escolha sua refeição</h1>
        <p>Preencha os dados abaixo para solicitar sua refeição.</p>

        <form onSubmit={handleSubmit} id="empresaForm">
          <div className="form-group">
            <label htmlFor="nomePessoa">Nome Completo</label>
            <input 
              type="text" 
              id="nomePessoa" 
              name="nomePessoa" 
              className={errors.nomePessoa ? 'has-error' : ''}
              value={formData.nomePessoa} 
              onChange={handleInputChange} 
              placeholder="Ex: João Silva" 
              required 
            />
            {errors.nomePessoa && <span className="error-message">{errors.nomePessoa}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="matricula">Matrícula</label>
            <input 
              type="text" 
              id="matricula" 
              name="matricula" 
              className={errors.matricula ? 'has-error' : ''}
              value={formData.matricula} 
              onChange={handleInputChange} 
              placeholder="Ex: 123456" 
              required 
            />
            {errors.matricula && <span className="error-message">{errors.matricula}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="nomeEmpresa">Nome da Empresa</label>
            <input 
              type="text" 
              id="nomeEmpresa" 
              name="nomeEmpresa" 
              className={errors.nomeEmpresa ? 'has-error' : ''}
              value={formData.nomeEmpresa} 
              onChange={handleInputChange} 
              placeholder="Ex: Tech Solutions" 
              required 
            />
            {errors.nomeEmpresa && <span className="error-message">{errors.nomeEmpresa}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="turno">Turno (Refeição)</label>
            <select 
              id="turno" 
              name="turno" 
              className={errors.turno ? 'has-error' : ''}
              value={formData.turno} 
              onChange={handleInputChange} 
              required
            >
              <option value="" disabled>Escolha o horário</option>
              <option value="Almoço">Almoço</option>
              <option value="Janta">Janta</option>
            </select>
            {errors.turno && <span className="error-message">{errors.turno}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="diaRetirada">Dia da Retirada</label>
            <select 
              id="diaRetirada" 
              name="diaRetirada" 
              className={errors.diaRetirada ? 'has-error' : ''}
              value={formData.diaRetirada} 
              onChange={handleInputChange} 
              required
            >
              <option value="" disabled>Escolha o dia</option>
              {diasAtivos.segunda && <option value="1">Segunda-Feira</option>}
              {diasAtivos.terca && <option value="2">Terça-Feira</option>}
              {diasAtivos.quarta && <option value="3">Quarta-Feira</option>}
              {diasAtivos.quinta && <option value="4">Quinta-Feira</option>}
              {diasAtivos.sexta && <option value="5">Sexta-Feira</option>}
            </select>
            {errors.diaRetirada && <span className="error-message">{errors.diaRetirada}</span>}
          </div>

          <div className="form-group">
            <label className="group-label">Restaurante (Retirada)</label>
            <div className={`radio-group ${errors.restaurante ? 'has-error' : ''}`} style={{ padding: errors.restaurante ? '8px' : '0', borderRadius: '8px' }}>
              <label className="radio-label">
                <input type="radio" name="restaurante" value="Central" checked={formData.restaurante === 'Central'} onChange={handleInputChange} required />
                <span className="radio-custom"></span>
                <span className="radio-text">Central</span>
              </label>
              <label className="radio-label">
                <input type="radio" name="restaurante" value="Campo" checked={formData.restaurante === 'Campo'} onChange={handleInputChange} required />
                <span className="radio-custom"></span>
                <span className="radio-text">Campo</span>
              </label>
            </div>
            {errors.restaurante && <span className="error-message">{errors.restaurante}</span>}
          </div>

          {formData.turno === "Almoço" && formData.restaurante && (
            <div className="form-group">
              <label htmlFor="horarioRetirada">Horário da Retirada</label>
              <select 
                id="horarioRetirada" 
                name="horarioRetirada" 
                className={errors.horarioRetirada ? 'has-error' : ''}
                value={formData.horarioRetirada} 
                onChange={handleInputChange} 
                required
              >
                <option value="" disabled>Escolha o horário</option>
                {horariosDisponiveis.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
              {errors.horarioRetirada && <span className="error-message">{errors.horarioRetirada}</span>}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="prato">Prato Desejado</label>
            <select 
              id="prato" 
              name="prato" 
              className={errors.prato ? 'has-error' : ''}
              value={formData.prato} 
              onChange={handleInputChange} 
              required
            >
              <option value="" disabled>Escolha seu prato</option>
              <option value="Gourmet">Gourmet</option>
            </select>
            {errors.prato && <span className="error-message">{errors.prato}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="contato">Seu WhatsApp (com DDD)</label>
            <input 
              type="tel" 
              id="contato" 
              name="contato" 
              className={errors.contato ? 'has-error' : ''}
              value={formData.contato} 
              onChange={handlePhoneChange} 
              placeholder="Ex: (94) 98765-4321" 
              required 
              maxLength={15} 
            />
            {errors.contato && <span className="error-message">{errors.contato}</span>}
          </div>

          <button 
            type="submit" 
            id="btnEnviar"
            className={!servicoAtivo ? 'btn-suspenso' : ''}
            disabled={!servicoAtivo}
          >
            {servicoAtivo ? '📤 Enviar Pedido' : '❌ Serviço Suspenso'}
          </button>
        </form>

        <div className="footer" style={{ marginTop: "20px" }}>
          <small>Escaneie o QR Code na parede para acessar este formulário.</small>
        </div>
      </div>

      {/* Modais */}
      <div className={`modal ${showLogin ? 'show' : ''}`}>
        <div className="modal-content">
          <span className="close" onClick={() => setShowLogin(false)}>&times;</span>
          <h2>Acesso Administrativo</h2>
          <p style={{ marginBottom: "20px", fontSize: "14px", color: "#666" }}>
            Para acessar o painel, faça login com um e-mail autorizado.
          </p>
          <button 
            onClick={handleAdminLogin} 
            disabled={isLoggingIn}
            className="btn btn-outline w-full"
            style={{ gap: "12px", padding: "14px" }}
          >
            {isLoggingIn ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
            ) : (
              <>
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{ width: "18px" }} />
                Entrar com Google
              </>
            )}
          </button>
        </div>
      </div>

      <div className={`modal ${showSuccess ? 'show' : ''}`}>
        <div className="modal-content">
          <div className="flex justify-center mb-4">
            <CheckCircle size={64} color="#10b981" />
          </div>
          <h2 style={{ color: "#10b981" }}>Pedido Enviado!</h2>
          <p>Seu pedido foi processado com sucesso e já está na nossa lista.</p>
          <button onClick={() => setShowSuccess(false)} className="btn btn-success w-full">Entendido</button>
        </div>
      </div>

      <div className={`modal ${showError ? 'show' : ''}`}>
        <div className="modal-content">
          <div className="flex justify-center mb-4">
            <XCircle size={64} color="#ef4444" />
          </div>
          <h2 style={{ color: "#ef4444" }}>Ops! Algo deu errado</h2>
          <p>Não conseguimos registrar seu pedido automaticamente. Por favor, tente novamente.</p>
          <button onClick={() => setShowError(false)} className="btn btn-danger w-full">Fechar</button>
        </div>
      </div>

      <div className={`modal ${showSuspended ? 'show' : ''}`}>
        <div className="modal-content">
          <div className="flex justify-center mb-4">
            <AlertTriangle size={64} color="#f59e0b" />
          </div>
          <h2 style={{ color: "#f59e0b" }}>Serviço Suspenso</h2>
          <p>No momento, não estamos recebendo novos pedidos. Por favor, tente novamente mais tarde.</p>
          <button onClick={() => setShowSuspended(false)} className="btn btn-primary w-full">Fechar</button>
        </div>
      </div>
    </div>
  );
}
