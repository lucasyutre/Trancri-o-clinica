import React from 'react';
import { X, History, Trash2, Clock, Calendar, ChevronRight, FileText, FileSpreadsheet } from 'lucide-react';
import { ConsultationRecord } from '../types';
import { formatClinicalDate, formatDuration } from '../utils/clinicalUtils';

interface ConsultationHistoryModalProps {
  history: ConsultationRecord[];
  onSelect: (record: ConsultationRecord) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export const ConsultationHistoryModal: React.FC<ConsultationHistoryModalProps> = ({
  history,
  onSelect,
  onDelete,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-sky-100 text-sky-700 rounded-xl">
              <History size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">Histórico de Atendimentos</h2>
              <p className="text-[11px] text-slate-500">Consultas registradas nesta sessão de trabalho</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 scrollbar-thin">
          {history.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <FileText size={36} className="mx-auto opacity-30" />
              <p className="text-xs font-semibold text-slate-500">Nenhum atendimento salvo ainda</p>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                Ao finalizar ou gerar a documentação de uma consulta, ela será guardada aqui localmente para consulta rápida.
              </p>
            </div>
          ) : (
            history.map((record) => (
              <div
                key={record.id}
                className="group p-3.5 rounded-xl border border-slate-200/80 hover:border-sky-300 hover:bg-sky-50/30 transition-all flex items-center justify-between gap-3 bg-white shadow-xs"
              >
                <div 
                  onClick={() => {
                    onSelect(record);
                    onClose();
                  }}
                  className="flex-1 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-slate-800 group-hover:text-sky-700 transition-colors">
                      {record.title}
                    </h3>
                    {record.clinicalDocument && (
                      <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                        SOAP
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 mt-1 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {formatClinicalDate(record.date)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {formatDuration(record.durationSeconds)}
                    </span>
                    <span>
                      {record.segments.length} {record.segments.length === 1 ? 'segmento' : 'segmentos'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onDelete(record.id)}
                    className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Excluir do histórico"
                  >
                    <Trash2 size={15} />
                  </button>
                  <button
                    onClick={() => {
                      onSelect(record);
                      onClose();
                    }}
                    className="p-2 text-slate-400 group-hover:text-sky-600 hover:bg-sky-100/50 rounded-lg transition-colors"
                    title="Carregar atendimento"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-[11px] text-slate-400">
          <span>Armazenamento local no navegador (privado)</span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-slate-200/80 hover:bg-slate-300 text-slate-700 rounded-lg font-semibold transition-colors"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
