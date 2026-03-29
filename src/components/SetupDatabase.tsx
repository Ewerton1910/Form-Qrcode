import React, { useState } from "react";
import { db } from "../lib/firebase";
import { doc, writeBatch } from "firebase/firestore";
import { Database, Play, CheckCircle, AlertCircle } from "lucide-react";

const SETUP_KEY = "l4nch0n3t3-2025!";

const DATA = {
  contadores: {
    campo: { almoco: 0, janta: 0 },
    central: { almoco: 0, janta: 0 }
  },
  dias: {
    segunda: true,
    terca: true,
    quarta: true,
    quinta: true,
    sexta: true
  },
  horarios: {
    campo: ["11:00", "11:15", "11:30", "11:45", "12:00", "12:15", "12:30", "12:45", "13:00", "13:15", "13:30", "13:45", "14:00", "14:15", "14:30", "14:45", "15:00"],
    central: ["10:30", "10:45", "11:00", "11:15", "11:30", "11:45", "12:00", "12:15", "12:30", "12:45", "13:00", "13:15", "13:30", "13:45", "14:00"]
  },
  servico: { ativo: false }
};

export default function SetupDatabase() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const runInjection = async () => {
    setStatus("loading");
    setMessage("Iniciando injeção de dados...");

    try {
      const batch = writeBatch(db);

      // 1. Configuração de Serviço
      batch.set(doc(db, "configuracoes", "servico"), { 
        ativo: DATA.servico.ativo,
        setupKey: SETUP_KEY 
      });

      // 2. Dias da Semana
      Object.entries(DATA.dias).forEach(([dia, ativo]) => {
        batch.set(doc(db, "dias", dia), { 
          ativo,
          setupKey: SETUP_KEY 
        });
      });

      // 3. Horários
      Object.entries(DATA.horarios).forEach(([restaurante, lista]) => {
        lista.forEach(horario => {
          batch.set(doc(db, "horarios", `${restaurante}_${horario}`), {
            ativo: true,
            contador: 0,
            setupKey: SETUP_KEY
          });
        });
      });

      // 4. Contadores (Opcional, mas incluído conforme seu JSON)
      Object.entries(DATA.contadores).forEach(([restaurante, valores]) => {
        batch.set(doc(db, "contadores", restaurante), {
          ...valores,
          setupKey: SETUP_KEY
        });
      });

      await batch.commit();
      setStatus("success");
      setMessage("Dados injetados com sucesso! Você já pode fechar esta página.");
    } catch (error: any) {
      console.error(error);
      setStatus("error");
      setMessage(`Erro ao injetar dados: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-gray-800 rounded-2xl p-8 shadow-2xl border border-gray-700">
        <div className="flex items-center gap-3 mb-6">
          <Database className="text-indigo-400" size={32} />
          <h1 className="text-2xl font-bold">Database Injector</h1>
        </div>

        <p className="text-gray-400 mb-8">
          Esta ferramenta irá configurar as coleções iniciais do seu novo banco de dados Firestore usando a chave de segurança temporária.
        </p>

        {status === "idle" && (
          <button
            onClick={runInjection}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <Play size={20} /> Iniciar Injeção
          </button>
        )}

        {status === "loading" && (
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-400"></div>
            <p className="text-indigo-300 font-medium">{message}</p>
          </div>
        )}

        {status === "success" && (
          <div className="bg-green-900/30 border border-green-500/50 p-4 rounded-xl flex items-start gap-3">
            <CheckCircle className="text-green-400 shrink-0" size={24} />
            <p className="text-green-200 text-sm">{message}</p>
          </div>
        )}

        {status === "error" && (
          <div className="bg-red-900/30 border border-red-500/50 p-4 rounded-xl flex items-start gap-3">
            <AlertCircle className="text-red-400 shrink-0" size={24} />
            <p className="text-red-200 text-sm">{message}</p>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-gray-700">
          <p className="text-[10px] text-gray-500 uppercase tracking-widest text-center">
            Acesso Restrito • Chave de Segurança Ativa
          </p>
        </div>
      </div>
    </div>
  );
}
