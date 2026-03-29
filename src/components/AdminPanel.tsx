import React, { useState, useEffect } from "react";
import { db, OperationType, handleFirestoreError, auth } from "../lib/firebase";
import { 
  doc, 
  onSnapshot, 
  updateDoc, 
  writeBatch,
  collection,
  getDocs
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { LayoutDashboard, ClipboardList, RefreshCw, Check, X, ArrowLeft, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const HORARIOS = {
  central: ["10:30","10:45","11:00","11:15","11:30","11:45","12:00", "12:15", "12:30", "12:45", "13:00","13:15","13:30","13:45","14:00"],
  campo: ["11:00","11:15","11:30","11:45","12:00", "12:15", "12:30", "12:45", "13:00","13:15","13:30", "13:45", "14:00", "14:15", "14:30","14:45","15:00"]
};

export default function AdminPanel() {
  const navigate = useNavigate();
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [servicoAtivo, setServicoAtivo] = useState(true);
  const [contadores, setContadores] = useState({
    central: { almoco: 0, janta: 0 },
    campo: { almoco: 0, janta: 0 }
  });
  const [diasAtivos, setDiasAtivos] = useState<any>({
    segunda: true, terca: true, quarta: true, quinta: true, sexta: true
  });
  const [horariosStatus, setHorariosStatus] = useState<any>({ central: {}, campo: {} });
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<'central' | 'campo'>('central');

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate("/");
      } else {
        const allowedEmails = ["restaurantegrsa@gmail.com", "restaurantegrs@gmail.com", "ewerton.jhonatas@gmail.com"];
        if (!allowedEmails.includes(user.email || "")) {
          alert("Acesso negado.");
          auth.signOut();
          navigate("/");
        } else {
          setIsAuthChecking(false);
        }
      }
    });

    return () => unsubscribeAuth();
  }, [navigate]);

  useEffect(() => {
    if (isAuthChecking) return;

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

    // Sincronização Horários
    const unsubscribesHorarios: (() => void)[] = [];
    ['central', 'campo'].forEach(rest => {
      HORARIOS[rest as keyof typeof HORARIOS].forEach(h => {
        const hRef = doc(db, 'horarios', `${rest}_${h}`);
        const unsub = onSnapshot(hRef, (snapshot) => {
          if (snapshot.exists()) {
            setHorariosStatus((prev: any) => ({
              ...prev,
              [rest]: { ...prev[rest], [h]: snapshot.data() }
            }));
          }
        }, (err) => handleFirestoreError(err, OperationType.GET, `horarios/${rest}_${h}`));
        unsubscribesHorarios.push(unsub);
      });
    });

    return () => {
      unsubscribeConfig();
      unsubscribesDias.forEach(u => u());
      unsubscribesHorarios.forEach(u => u());
    };
  }, [isAuthChecking]);

  // Sincronização Contadores Gerais
  useEffect(() => {
    if (isAuthChecking) return;
    
    const unsubscribesContadores: (() => void)[] = [];
    ['central', 'campo'].forEach(rest => {
      const cRef = doc(db, 'contadores', rest);
      const unsub = onSnapshot(cRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setContadores(prev => ({
            ...prev,
            [rest]: { 
              almoco: Number(data.almoco) || 0, 
              janta: Number(data.janta) || 0 
            }
          }));
        }
      }, (err) => handleFirestoreError(err, OperationType.GET, `contadores/${rest}`));
      unsubscribesContadores.push(unsub);
    });

    return () => unsubscribesContadores.forEach(u => u());
  }, [isAuthChecking]);

  if (isAuthChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  const toggleServico = async (ativo: boolean) => {
    try {
      await updateDoc(doc(db, 'configuracoes', 'servico'), { ativo });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'configuracoes/servico');
    }
  };

  const toggleDia = async (dia: string, ativo: boolean) => {
    try {
      await updateDoc(doc(db, 'dias', dia), { ativo });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `dias/${dia}`);
    }
  };

  const toggleHorario = async (rest: string, horario: string, ativo: boolean) => {
    try {
      await updateDoc(doc(db, 'horarios', `${rest}_${horario}`), { ativo });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `horarios/${rest}_${horario}`);
    }
  };

  const zerarTudo = async () => {
    try {
      const batch = writeBatch(db);
      
      // Zerar horários individuais
      ['central', 'campo'].forEach(rest => {
        HORARIOS[rest as keyof typeof HORARIOS].forEach(h => {
          batch.update(doc(db, 'horarios', `${rest}_${h}`), { ativo: true, contador: 0 });
        });
      });

      // Zerar contadores gerais
      ['central', 'campo'].forEach(rest => {
        batch.update(doc(db, 'contadores', rest), { almoco: 0, janta: 0 });
      });

      await batch.commit();
      setShowConfirmReset(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'batch_reset');
    }
  };

  return (
    <div className="admin-body min-h-screen">
      <div className="admin-container">
        {/* Header Section */}
        <div className="admin-header-section">
          <div className="admin-header-top">
            <div className="admin-title-group">
              <h2>⚙️ Painel de Administração</h2>
              <p>Gerencie horários, dias de funcionamento e status do serviço.</p>
            </div>
            <div className={`admin-status-badge ${servicoAtivo ? 'ativo' : 'inativo'}`}>
              {servicoAtivo ? '🟢 Serviço Ativo' : '🔴 Serviço Suspenso'}
            </div>
          </div>

          <div className="admin-actions-grid">
            <button className="btn btn-success" onClick={() => toggleServico(true)}>
              <Check size={18} /> Ativar Pedidos
            </button>
            <button className="btn btn-danger" onClick={() => toggleServico(false)}>
              <X size={18} /> Desativar Pedidos
            </button>
            <button 
              onClick={() => navigate("/admin/orders")}
              className="btn btn-primary"
            >
              <ClipboardList size={18} /> Ver Pedidos no Banco
            </button>
          </div>
        </div>

        <div className="admin-grid">
          {/* Main Content Column */}
          <div className="admin-main-column">
            <div className="admin-card">
              <div className="flex items-center justify-between mb-6">
                <h3 className="m-0 flex items-center gap-2">
                  <RefreshCw size={20} className="text-indigo-600" />
                  Controle de Horários de Almoço
                </h3>
              </div>
              
              {/* Restaurant Selector (Radio Style) */}
              <div className="restaurant-selector-container mb-8">
                <div className="restaurant-selector-grid">
                  <label className={`restaurant-option ${selectedRestaurant === 'central' ? 'active' : ''}`}>
                    <input 
                      type="radio" 
                      name="restaurant-select" 
                      value="central" 
                      checked={selectedRestaurant === 'central'} 
                      onChange={() => setSelectedRestaurant('central')}
                    />
                    <div className="radio-custom"></div>
                    <div className="option-content">
                      <span className="option-icon">🏪</span>
                      <span className="option-name">CENTRAL</span>
                    </div>
                  </label>

                  <label className={`restaurant-option ${selectedRestaurant === 'campo' ? 'active' : ''}`}>
                    <input 
                      type="radio" 
                      name="restaurant-select" 
                      value="campo" 
                      checked={selectedRestaurant === 'campo'} 
                      onChange={() => setSelectedRestaurant('campo')}
                    />
                    <div className="radio-custom"></div>
                    <div className="option-content">
                      <span className="option-icon">🏕️</span>
                      <span className="option-name">CAMPO</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Filtered Horarios Section */}
              <div className="horarios-section">
                <div className="horarios-grid">
                  {HORARIOS[selectedRestaurant].map(h => {
                    const status = horariosStatus[selectedRestaurant]?.[h] || { ativo: true, contador: 0 };
                    return (
                      <div key={h} className="horario-card">
                        <div className="horario-header">
                          <span className="horario-time">{h}</span>
                          <span className="horario-count">{status.contador} pedidos</span>
                        </div>
                        <div className="horario-toggles">
                          <button className="btn btn-success small" onClick={() => toggleHorario(selectedRestaurant, h, true)}>Ativar</button>
                          <button className="btn btn-danger small" onClick={() => toggleHorario(selectedRestaurant, h, false)}>Parar</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-center mt-8">
                <button className="btn btn-primary py-4 px-8" onClick={() => setShowConfirmReset(true)}>
                  <RefreshCw size={20} /> Zerar Tudo e Reativar Horários
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar Column */}
          <div className="admin-sidebar-column">
            <div className="contador-card mb-6">
              <h3 className="flex items-center gap-2">
                <LayoutDashboard size={20} className="text-indigo-400" />
                Contadores Gerais
              </h3>
              
              <div className="contador-group">
                <div className="contador-label">🏪 Central</div>
                <div className="contador-values">
                  <div className="contador-val">
                    <span>Almoço</span>
                    <strong>{contadores.central.almoco}</strong>
                  </div>
                  <div className="contador-val">
                    <span>Janta</span>
                    <strong>{contadores.central.janta}</strong>
                  </div>
                </div>
              </div>

              <div className="contador-group">
                <div className="contador-label">🏕️ Campo</div>
                <div className="contador-values">
                  <div className="contador-val">
                    <span>Almoço</span>
                    <strong>{contadores.campo.almoco}</strong>
                  </div>
                  <div className="contador-val">
                    <span>Janta</span>
                    <strong>{contadores.campo.janta}</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="admin-card">
              <h3 className="flex items-center gap-2">
                <ClipboardList size={20} className="text-indigo-600" />
                Controle de Dias
              </h3>
              <div className="dias-grid">
                {['segunda', 'terca', 'quarta', 'quinta', 'sexta'].map(dia => (
                  <div key={dia} className="dia-row">
                    <div className="dia-info">
                      <span className="dia-name capitalize">{dia}-Feira</span>
                      <span className={`dia-status ${diasAtivos[dia as keyof typeof diasAtivos] ? 'ativo' : 'inativo'}`}>
                        {diasAtivos[dia as keyof typeof diasAtivos] ? 'Ativo' : 'Desativado'}
                      </span>
                    </div>
                    <div className="dia-toggles">
                      <button className="btn btn-success small px-2" onClick={() => toggleDia(dia, true)} title="Ativar"><Check size={14} /></button>
                      <button className="btn btn-danger small px-2" onClick={() => toggleDia(dia, false)} title="Desativar"><X size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Modal de Confirmação de Reset */}
        {showConfirmReset && (
          <div className="modal show">
            <div className="modal-content">
              <div className="flex justify-center mb-4">
                <AlertTriangle size={64} color="#ef4444" />
              </div>
              <h2 style={{ color: "#ef4444" }}>Confirmar Reset Total?</h2>
              <p>Isso irá zerar TODOS os contadores e reativar todos os horários de almoço. Esta ação não pode ser desfeita.</p>
              <div className="modal-actions">
                <button onClick={zerarTudo} className="btn btn-danger">Sim, Zerar Tudo</button>
                <button onClick={() => setShowConfirmReset(false)} className="btn btn-outline">Cancelar</button>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-center mt-12 pb-12">
          <button 
            onClick={() => navigate("/")}
            className="btn btn-outline px-8 py-3"
          >
            <ArrowLeft size={20} />
            Voltar ao formulário
          </button>
        </div>
      </div>
    </div>
  );
}
