import React from 'react';
import { X, Printer, Download, ShieldCheck, HeartPulse } from 'lucide-react';
import { ClinicalDocument } from '../types';
import { anonymizeText, formatClinicalDate } from '../utils/clinicalUtils';

interface ClinicalPrintModalProps {
  document: ClinicalDocument;
  isAnonymized: boolean;
  onClose: () => void;
}

export const ClinicalPrintModal: React.FC<ClinicalPrintModalProps> = ({
  document,
  isAnonymized,
  onClose,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const getCleanText = (text: string) => (isAnonymized ? anonymizeText(text) : text);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 flex flex-col max-h-[90vh]">
        
        {/* Modal Top Actions (Hidden on print) */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200 print:hidden">
          <div className="flex items-center gap-2">
            <HeartPulse className="text-sky-600" size={20} />
            <span className="font-bold text-sm text-slate-800">Visualização de Impressão Clínica</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              <Printer size={15} />
              Imprimir / Salvar PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-all"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Document Paper */}
        <div className="p-8 md:p-12 overflow-y-auto space-y-6 text-slate-800 font-sans print:p-0">
          
          {/* Clinical Header */}
          <div className="border-b-2 border-slate-800 pb-4 flex justify-between items-start">
            <div>
              <h1 className="text-xl font-bold uppercase tracking-tight text-slate-900">
                Registro de Atendimento Clínico
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Prontuário Eletrônico do Paciente • Suporte Digital à Saúde
              </p>
            </div>
            <div className="text-right text-xs text-slate-600 font-mono">
              <p className="font-bold">{formatClinicalDate(document.generatedAt)}</p>
              {isAnonymized && (
                <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded mt-1">
                  LGPD Anonimizado
                </span>
              )}
            </div>
          </div>

          {/* Sinais Vitais & Alertas */}
          {(document.entities.allergies.length > 0 || document.entities.vitalSigns.length > 0) && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              {document.entities.allergies.length > 0 && (
                <div className="flex items-start gap-2">
                  <span className="text-xs font-bold text-red-700 uppercase tracking-wide">
                    ⚠️ Alergias Conhecidas:
                  </span>
                  <span className="text-xs font-semibold text-red-900">
                    {document.entities.allergies.join(', ')}
                  </span>
                </div>
              )}

              {document.entities.vitalSigns.length > 0 && (
                <div className="flex flex-wrap gap-4 pt-1 border-t border-slate-200/60 text-xs">
                  {document.entities.vitalSigns.map((v, i) => (
                    <div key={i} className="flex gap-1.5">
                      <span className="text-slate-500 font-medium">{v.label}:</span>
                      <span className="font-bold text-slate-800">{v.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SOAP Body */}
          {document.soap && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-sky-800 border-b border-sky-100 pb-1 mb-1.5">
                  S - Subjetivo (História Clínica)
                </h3>
                <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
                  {getCleanText(document.soap.subjective)}
                </p>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-sky-800 border-b border-sky-100 pb-1 mb-1.5">
                  O - Objetivo (Exame Físico / Achados)
                </h3>
                <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
                  {getCleanText(document.soap.objective)}
                </p>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-sky-800 border-b border-sky-100 pb-1 mb-1.5">
                  A - Avaliação (Hipóteses Diagnósticas)
                </h3>
                <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
                  {getCleanText(document.soap.assessment)}
                </p>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-sky-800 border-b border-sky-100 pb-1 mb-1.5">
                  P - Plano Terapêutico & Conduta
                </h3>
                <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
                  {getCleanText(document.soap.plan)}
                </p>
              </div>
            </div>
          )}

          {/* Medicamentos Estruturados */}
          {document.entities.medications.length > 0 && (
            <div className="border border-slate-200 rounded-xl p-4 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Prescrição / Medicamentos Citados
              </h3>
              <ul className="text-xs space-y-1.5 text-slate-800 list-disc list-inside">
                {document.entities.medications.map((m, i) => (
                  <li key={i}>
                    <strong>{m.name}</strong> {m.dose && `(${m.dose})`} - {m.posology || 'Conforme orientação médica'} {m.route && `[Via: ${m.route}]`}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Sugestão CID-10 */}
          {document.entities.cid10.length > 0 && (
            <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="font-bold text-slate-800">Sugestão CID-10: </span>
              {document.entities.cid10.map((c) => `${c.code} - ${c.description}`).join(' | ')}
            </div>
          )}

          {/* Legal / Ethical Footer */}
          <div className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center text-[10px] text-slate-400 gap-4">
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-slate-400" />
              <span>Documento gerado com suporte de IA clínica supervisionada pelo profissional responsável.</span>
            </div>
            <div className="text-center sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 w-48 border-slate-300">
              <p className="border-t border-slate-400 pt-1 text-slate-600 font-medium">Assinatura / Carimbo</p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
