import React, { useState, useEffect } from "react";
import { db, OperationType, handleFirestoreError, auth } from "../lib/firebase";
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  updateDoc, 
  deleteDoc, 
  doc,
  writeBatch
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { ClipboardList, Search, Filter, Trash2, CheckCircle, Clock, ArrowLeft, Calendar, User, Building, Phone, Utensils, MapPin, CheckSquare, Square, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Order {
  id: string;
  nomePessoa: string;
  matricula: string;
  nomeEmpresa: string;
  turno: string;
  diaRetiradaFormatado: string;
  restaurante: string;
  horarioRetirada?: string;
  prato: string;
  contato: string;
  createdAt: string;
  status: string;
}

export default function OrdersPage() {
  const navigate = useNavigate();
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: "",
    restaurante: "",
    turno: "",
    status: "",
    data: ""
  });
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

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

    const q = query(collection(db, 'pedidos'), orderBy('createdAt', 'desc'));
    const unsubscribeOrders = onSnapshot(q, (snapshot) => {
      const ordersList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
      setOrders(ordersList);
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'pedidos');
      setLoading(false);
    });

    return () => unsubscribeOrders();
  }, [isAuthChecking]);

  useEffect(() => {
    if (isAuthChecking) return;
    
    let result = orders;

    if (filters.search) {
      const s = filters.search.toLowerCase();
      result = result.filter(o => 
        o.nomePessoa.toLowerCase().includes(s) || 
        o.matricula.toLowerCase().includes(s) ||
        o.nomeEmpresa.toLowerCase().includes(s)
      );
    }

    if (filters.restaurante) {
      result = result.filter(o => o.restaurante === filters.restaurante);
    }

    if (filters.turno) {
      result = result.filter(o => o.turno === filters.turno);
    }

    if (filters.status) {
      result = result.filter(o => o.status === filters.status);
    }

    if (filters.data) {
      result = result.filter(o => {
        try {
          const datePart = o.diaRetiradaFormatado.split(', ')[1];
          if (datePart) {
            const [day, month, year] = datePart.split('/');
            const orderDate = `${year}-${month}-${day}`;
            return orderDate === filters.data;
          }
          return false;
        } catch (e) {
          return false;
        }
      });
    }

    setFilteredOrders(result);
    setSelectedOrders(new Set());
  }, [filters, orders, isAuthChecking]);

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

  const updateStatus = async (id: string, status: string) => {
    try {
      await updateDoc(doc(db, 'pedidos', id), { status });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `pedidos/${id}`);
    }
  };

  const deleteOrder = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'pedidos', id));
      setOrderToDelete(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `pedidos/${id}`);
    }
  };

  const toggleSelectOrder = (id: string) => {
    const newSelection = new Set(selectedOrders);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedOrders(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedOrders.size === filteredOrders.length && filteredOrders.length > 0) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(filteredOrders.map(o => o.id)));
    }
  };

  const bulkUpdateStatus = async (status: string) => {
    if (selectedOrders.size === 0) return;
    try {
      const batch = writeBatch(db);
      selectedOrders.forEach(id => {
        batch.update(doc(db, 'pedidos', id), { status });
      });
      await batch.commit();
      setSelectedOrders(new Set());
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'bulk_update');
    }
  };

  const bulkDelete = async () => {
    if (selectedOrders.size === 0) return;
    try {
      const batch = writeBatch(db);
      selectedOrders.forEach(id => {
        batch.delete(doc(db, 'pedidos', id));
      });
      await batch.commit();
      setSelectedOrders(new Set());
      setShowBulkDeleteConfirm(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'bulk_delete');
    }
  };

  const formatOrderDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), "dd/MM/yyyy HH:mm", { locale: ptBR });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="admin-body min-h-screen p-4 md:p-8">
      <div className="admin-container" style={{ maxWidth: '1280px', margin: '0 auto', background: 'transparent' }}>
        <div className="admin-header-section">
          <div className="admin-header-top">
            <div className="admin-title-group">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => navigate("/admin")} 
                  className="btn btn-outline px-4 py-2"
                >
                  <ArrowLeft size={18} />
                  <span>Voltar</span>
                </button>
                <h2>📋 Pedidos Recebidos</h2>
              </div>
              <p>{filteredOrders.length} pedidos encontrados na base de dados.</p>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="admin-card">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="form-group mb-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Buscar..." 
                  className="pl-10"
                  value={filters.search}
                  onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
                />
              </div>
            </div>
            <div className="form-group mb-0">
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="date" 
                  className="pl-10"
                  value={filters.data}
                  onChange={e => setFilters(prev => ({ ...prev, data: e.target.value }))}
                />
              </div>
            </div>
            <div className="form-group mb-0">
              <select 
                value={filters.restaurante}
                onChange={e => setFilters(prev => ({ ...prev, restaurante: e.target.value }))}
              >
                <option value="">Todos Restaurantes</option>
                <option value="Central">Central</option>
                <option value="Campo">Campo</option>
              </select>
            </div>
            <div className="form-group mb-0">
              <select 
                value={filters.turno}
                onChange={e => setFilters(prev => ({ ...prev, turno: e.target.value }))}
              >
                <option value="">Todos Turnos</option>
                <option value="Almoço">Almoço</option>
                <option value="Janta">Janta</option>
              </select>
            </div>
            <div className="form-group mb-0">
              <select 
                value={filters.status}
                onChange={e => setFilters(prev => ({ ...prev, status: e.target.value }))}
              >
                <option value="">Todos Status</option>
                <option value="pendente">Pendente</option>
                <option value="concluido">Concluído</option>
              </select>
            </div>
          </div>

          {/* Ações em Massa */}
          {filteredOrders.length > 0 && (
            <div className="mt-8 pt-6 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <button 
                  onClick={toggleSelectAll}
                  className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-indigo-600 transition"
                >
                  {selectedOrders.size === filteredOrders.length && filteredOrders.length > 0 ? (
                    <CheckSquare className="text-indigo-600" size={22} />
                  ) : (
                    <Square size={22} />
                  )}
                  Selecionar Todos
                </button>
                {selectedOrders.size > 0 && (
                  <span className="text-xs font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                    {selectedOrders.size} selecionados
                  </span>
                )}
              </div>

              {selectedOrders.size > 0 && (
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => bulkUpdateStatus('concluido')}
                    className="btn btn-success"
                  >
                    <CheckCircle size={18} />
                    Concluir Selecionados
                  </button>
                  <button 
                    onClick={() => setShowBulkDeleteConfirm(true)}
                    className="btn btn-danger"
                  >
                    <Trash2 size={18} />
                    Excluir Selecionados
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-500">Carregando pedidos...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm">
            <ClipboardList className="mx-auto text-gray-300 mb-4" size={64} />
            <p className="text-gray-500 text-xl">Nenhum pedido encontrado.</p>
          </div>
        ) : (
          <div className="orders-grid">
            {filteredOrders.map(order => (
              <div 
                key={order.id} 
                className={`receipt-card ${selectedOrders.has(order.id) ? 'ring-4 ring-indigo-500' : ''} ${order.status === 'concluido' ? 'opacity-80' : ''}`}
                onClick={() => toggleSelectOrder(order.id)}
              >
                {/* Checkbox de Seleção Individual */}
                <div className="absolute top-4 right-4 z-10">
                  {selectedOrders.has(order.id) ? (
                    <CheckSquare className="text-indigo-600" size={24} />
                  ) : (
                    <Square className="text-slate-200" size={24} />
                  )}
                </div>

                <div className="receipt-header">
                  <h3>Pedido</h3>
                  <div className={`receipt-status-badge receipt-status-${order.status}`}>
                    {order.status === 'concluido' ? '✅ Concluído' : '⏳ Pendente'}
                  </div>
                </div>

                <div className="receipt-body">
                  <div className="receipt-row">
                    <span className="receipt-label">Cliente:</span>
                    <span className="receipt-value">{order.nomePessoa}</span>
                  </div>
                  <div className="receipt-row">
                    <span className="receipt-label">Matrícula:</span>
                    <span className="receipt-value">{order.matricula}</span>
                  </div>
                  <div className="receipt-row">
                    <span className="receipt-label">Empresa:</span>
                    <span className="receipt-value">{order.nomeEmpresa}</span>
                  </div>
                  
                  <div className="receipt-divider"></div>
                  
                  <div className="receipt-row">
                    <span className="receipt-label">Data Retirada:</span>
                    <span className="receipt-value">{order.diaRetiradaFormatado}</span>
                  </div>
                  <div className="receipt-row">
                    <span className="receipt-label">Turno:</span>
                    <span className="receipt-value">{order.turno}</span>
                  </div>
                  {order.horarioRetirada && (
                    <div className="receipt-row">
                      <span className="receipt-label">Horário:</span>
                      <span className="receipt-value">{order.horarioRetirada}</span>
                    </div>
                  )}
                  <div className="receipt-row">
                    <span className="receipt-label">Local:</span>
                    <span className="receipt-value">Rest. {order.restaurante}</span>
                  </div>
                  
                  <div className="receipt-divider"></div>
                  
                  <div className="receipt-row">
                    <span className="receipt-label">Prato:</span>
                    <span className="receipt-value" style={{ fontSize: '1.125rem', fontWeight: '800', color: '#6366f1' }}>{order.prato}</span>
                  </div>
                  <div className="receipt-row">
                    <span className="receipt-label">Contato:</span>
                    <span className="receipt-value">{order.contato}</span>
                  </div>
                </div>

                <div className="receipt-footer" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-between items-center mb-4">
                    <span className="receipt-id">#{order.id.substring(0, 8).toUpperCase()}</span>
                    <span className="receipt-id">{formatOrderDate(order.createdAt)}</span>
                  </div>
                  
                  <div className="flex gap-3 justify-center">
                    {order.status !== 'concluido' && (
                      <button 
                        onClick={() => updateStatus(order.id, 'concluido')}
                        className="btn btn-success small flex-1"
                        title="Marcar como concluído"
                      >
                        <CheckCircle size={18} /> Concluir
                      </button>
                    )}
                    <button 
                      onClick={() => setOrderToDelete(order.id)}
                      className="btn btn-danger small flex-1"
                      title="Excluir pedido"
                    >
                      <Trash2 size={18} /> Excluir
                    </button>
                  </div>
                  
                  <div className="receipt-id" style={{ fontSize: '9px', marginTop: '20px', letterSpacing: '2px' }}>*** OBRIGADO PELA PREFERÊNCIA ***</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal de Confirmação de Exclusão Individual */}
        {orderToDelete && (
          <div className="modal show">
            <div className="modal-content">
              <div className="flex justify-center mb-4">
                <AlertTriangle size={64} color="#ef4444" />
              </div>
              <h2 style={{ color: "#ef4444" }}>Confirmar Exclusão</h2>
              <p>Tem certeza que deseja excluir este pedido? Esta ação não pode ser desfeita.</p>
              <div className="modal-actions">
                <button onClick={() => deleteOrder(orderToDelete)} className="btn btn-danger">Sim, Excluir</button>
                <button onClick={() => setOrderToDelete(null)} className="btn btn-outline">Cancelar</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Confirmação de Exclusão em Massa */}
        {showBulkDeleteConfirm && (
          <div className="modal show">
            <div className="modal-content">
              <div className="flex justify-center mb-4">
                <AlertTriangle size={64} color="#ef4444" />
              </div>
              <h2 style={{ color: "#ef4444" }}>Excluir {selectedOrders.size} Pedidos</h2>
              <p>Tem certeza que deseja excluir todos os pedidos selecionados? Esta ação não pode ser desfeita.</p>
              <div className="modal-actions">
                <button onClick={bulkDelete} className="btn btn-danger">Sim, Excluir Todos</button>
                <button onClick={() => setShowBulkDeleteConfirm(false)} className="btn btn-outline">Cancelar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
