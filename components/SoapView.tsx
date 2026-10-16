import React, { useState } from 'react';
import { 
  Copy, 
  Download, 
  Sparkles, 
  RefreshCw, 
  ShieldCheck, 
  Printer, 
  Pill, 
  AlertTriangle, 
  Stethoscope, 
  Tag, 
  MessageSquareText, 
  FileCheck2, 
  Check, 
  ChevronDown 
} from 'lucide-react';
import { 
  ClinicalDocument, 
  ClinicalTemplateType, 
  StructuredSoap, 
  StructuredAnamnese 
} from '../types';
import { anonymizeText } from '../utils/clinicalUtils';
import { ClinicalPrintModal } from './ClinicalPrintModal';

interface SoapViewProps {
  document: ClinicalDocument | null;
  isGenerating: boolean;
  hasContent: boolean;
  isAnonymized: boolean;
  onToggleAnonymize: () => void;
  onGenerate: (template?: ClinicalTemplateType) => void;
}

export const SoapView: React.FC<SoapViewProps> = ({
  document,
  isGenerating,
  hasContent,
  isAnonymized,
  onToggleAnonymize,
  onGenerate,
}) => {
  const [activeTab, setActiveTab] = useState<'soap' | 'anamnese' | 'entities' | 'patient'>('soap');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);

  const copyToClipboard = (text: string, sectionId: string) => {
    const processedText = isAnonymized ? anonymizeText(text) : text;
    navigator.clipboard.writeText(processedText).then(() => {
      setCopiedSection(sectionId);
      setTimeout(() => setCopiedSection(null), 1800);
    });
  };

  const getCleanText = (text: string) => (isAnonymized ? anonymizeText(text) : text);

  const handleDownloadFullDoc = () => {
    if (!document) return;
    let content = `REGISTRO DE ATENDIMENTO CLÍNICO\nData: ${new Date(document.generatedAt).toLocaleString('pt-BR')}\n\n`;

    if (document.soap) {
      content += `=== REGISTRO SOAP ===\n`;
      content += `[SUBJETIVO]\n${document.soap.subjective}\n\n`;
      content += `[OBJETIVO]\n${document.soap.objective}\n\n`;
      content += `[AVALIAÇÃO]\n${document.soap.assessment}\n\n`;
      content += `[PLANO & CONDUTA]\n${document.soap.plan}\n\n`;
    }

    if (document.entities.medications.length > 0) {
      content += `=== MEDICAMENTOS CITADOS ===\n`;
      document.entities.medications.forEach(m => {
        content += `- ${m.name} (${m.dose || ''}): ${m.posology || ''} [${m.route || 'Oral'}]\n`;
      });
      content += `\n`;
    }

    if (document.entities.cid10.length > 0) {
      content += `=== SUGESTÕES CID-10 ===\n`;
      document.entities.cid10.forEach(c => {
        content += `- ${c.code}: ${c.description} (${c.relevance})\n`;
      });
    }

    const finalContent = isAnonymized ? anonymizeText(content) : content;
    const blob = new Blob([finalContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prontuario-clinico-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <>
      <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden relative group">
        
        {/* Header Bar */}
        <div className="flex flex-col gap-2.5 px-4 md:px-5 py-3.5 border-b border-slate-100 bg-slate-50/70">
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-emerald-600 p-1.5 rounded-lg text-white shadow-xs">
                <FileCheck2 size={16} />
              </div>
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Documentação Clínica
              </h2>
            </div>

            <div className="flex items-center gap-1.5">
              {/* LGPD Toggle */}
              <button
                onClick={onToggleAnonymize}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all border ${
                  isAnonymized
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-xs'
                    : 'bg-white text-slate-500 border-slate-200 hover:text-slate-800'
                }`}
                title="Ativar/desativar anonimização de nomes, CPFs e dados sensíveis (LGPD)"
              >
                <ShieldCheck size={13} className={isAnonymized ? 'text-emerald-600' : 'text-slate-400'} />
                <span>{isAnonymized ? 'LGPD Ativa' : 'Anonimizar'}</span>
              </button>

              {document && (
                <>
                  <button
                    onClick={() => setShowPrintModal(true)}
                    className="p-1.5 text-slate-400 hover:text-sky-700 hover:bg-sky-50 rounded-lg transition-colors"
                    title="Visualizar e Imprimir Prontuário"
                  >
                    <Printer size={16} />
                  </button>

                  <button
                    onClick={handleDownloadFullDoc}
                    className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                    title="Baixar Registro TXT"
                  >
                    <Download size={16} />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-200/50 rounded-xl overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveTab('soap')}
              className={`flex-1 min-w-[70px] py-1.5 px-2 text-center text-xs font-bold rounded-lg transition-all ${
                activeTab === 'soap'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              SOAP Integral
            </button>

            <button
              onClick={() => setActiveTab('anamnese')}
              className={`flex-1 min-w-[75px] py-1.5 px-2 text-center text-xs font-bold rounded-lg transition-all ${
                activeTab === 'anamnese'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Anamnese PEP
            </button>

            <button
              onClick={() => setActiveTab('entities')}
              className={`flex-1 min-w-[75px] py-1.5 px-2 text-center text-xs font-bold rounded-lg transition-all relative ${
                activeTab === 'entities'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Entidades</span>
              {document?.entities && (document.entities.medications.length > 0 || document.entities.allergies.length > 0) && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block ml-1"></span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('patient')}
              className={`flex-1 min-w-[75px] py-1.5 px-2 text-center text-xs font-bold rounded-lg transition-all ${
                activeTab === 'patient'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Paciente
            </button>
          </div>

        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-5 scrollbar-thin bg-white">
          {!document ? (
            <div className="h-full min-h-[320px] flex flex-col items-center justify-center text-slate-400 select-none py-10 px-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4 text-emerald-600 border border-emerald-100">
                <Sparkles size={28} />
              </div>
              <h3 className="font-bold text-slate-700 text-sm mb-1">
                Análise Clínica Não Gerada
              </h3>
              <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                Após capturar a fala da consulta médica, clique no botão abaixo para gerar o registro técnico (SOAP, Anamnese, Medicamentos e CID-10).
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              
              {/* TAB 1: SOAP INTEGRAL */}
              {activeTab === 'soap' && document.soap && (
                <div className="space-y-3.5 animate-in fade-in duration-200">
                  {/* S */}
                  <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/40 relative group/sec">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                        S — Subjetivo (História e Queixa)
                      </span>
                      <button
                        onClick={() => copyToClipboard(document.soap!.subjective, 'soap_s')}
                        className="text-xs text-slate-400 hover:text-emerald-700 p-1 rounded hover:bg-emerald-50 transition-colors"
                        title="Copiar apenas o Subjetivo"
                      >
                        {copiedSection === 'soap_s' ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                      </button>
                    </div>
                    <p className="text-xs md:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {getCleanText(document.soap.subjective)}
                    </p>
                  </div>

                  {/* O */}
                  <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/40 relative group/sec">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                        O — Objetivo (Exame Físico / Sinais)
                      </span>
                      <button
                        onClick={() => copyToClipboard(document.soap!.objective, 'soap_o')}
                        className="text-xs text-slate-400 hover:text-emerald-700 p-1 rounded hover:bg-emerald-50 transition-colors"
                        title="Copiar apenas o Objetivo"
                      >
                        {copiedSection === 'soap_o' ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                      </button>
                    </div>
                    <p className="text-xs md:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {getCleanText(document.soap.objective)}
                    </p>
                  </div>

                  {/* A */}
                  <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/40 relative group/sec">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                        A — Avaliação (Hipóteses Diagnósticas)
                      </span>
                      <button
                        onClick={() => copyToClipboard(document.soap!.assessment, 'soap_a')}
                        className="text-xs text-slate-400 hover:text-emerald-700 p-1 rounded hover:bg-emerald-50 transition-colors"
                        title="Copiar apenas a Avaliação"
                      >
                        {copiedSection === 'soap_a' ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                      </button>
                    </div>
                    <p className="text-xs md:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {getCleanText(document.soap.assessment)}
                    </p>
                  </div>

                  {/* P */}
                  <div className="p-3.5 rounded-xl border border-emerald-200/80 bg-emerald-50/20 relative group/sec">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                        P — Plano (Conduta, Prescrição & Retorno)
                      </span>
                      <button
                        onClick={() => copyToClipboard(document.soap!.plan, 'soap_p')}
                        className="text-xs text-slate-400 hover:text-emerald-700 p-1 rounded hover:bg-emerald-50 transition-colors"
                        title="Copiar apenas o Plano/Conduta"
                      >
                        {copiedSection === 'soap_p' ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                      </button>
                    </div>
                    <p className="text-xs md:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {getCleanText(document.soap.plan)}
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 2: ANAMNESE TRADICIONAL PEP */}
              {activeTab === 'anamnese' && document.anamnese && (
                <div className="space-y-3 animate-in fade-in duration-200 text-xs md:text-sm text-slate-700">
                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50">
                    <div className="flex justify-between items-center mb-1">
                      <strong className="text-[11px] uppercase tracking-wider text-slate-900">Queixa Principal:</strong>
                      <button onClick={() => copyToClipboard(document.anamnese!.chiefComplaint, 'an_qp')} className="text-slate-400 hover:text-emerald-600 p-1">
                        {copiedSection === 'an_qp' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                      </button>
                    </div>
                    <p>{getCleanText(document.anamnese.chiefComplaint)}</p>
                  </div>

                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50">
                    <div className="flex justify-between items-center mb-1">
                      <strong className="text-[11px] uppercase tracking-wider text-slate-900">HMA (História da Doença):</strong>
                      <button onClick={() => copyToClipboard(document.anamnese!.hma, 'an_hma')} className="text-slate-400 hover:text-emerald-600 p-1">
                        {copiedSection === 'an_hma' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                      </button>
                    </div>
                    <p className="whitespace-pre-wrap">{getCleanText(document.anamnese.hma)}</p>
                  </div>

                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50">
                    <div className="flex justify-between items-center mb-1">
                      <strong className="text-[11px] uppercase tracking-wider text-slate-900">Antecedentes & Comorbidades:</strong>
                      <button onClick={() => copyToClipboard(document.anamnese!.personalHistory, 'an_ant')} className="text-slate-400 hover:text-emerald-600 p-1">
                        {copiedSection === 'an_ant' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                      </button>
                    </div>
                    <p>{getCleanText(document.anamnese.personalHistory)}</p>
                  </div>

                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50">
                    <div className="flex justify-between items-center mb-1">
                      <strong className="text-[11px] uppercase tracking-wider text-slate-900">Conduta / Hipótese:</strong>
                      <button onClick={() => copyToClipboard(document.anamnese!.assessmentConduct, 'an_cond')} className="text-slate-400 hover:text-emerald-600 p-1">
                        {copiedSection === 'an_cond' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                      </button>
                    </div>
                    <p className="whitespace-pre-wrap">{getCleanText(document.anamnese.assessmentConduct)}</p>
                  </div>
                </div>
              )}

              {/* TAB 3: ENTIDADES CLÍNICAS */}
              {activeTab === 'entities' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  
                  {/* Alergias (Destaque de Segurança do Paciente) */}
                  <div className="p-3.5 rounded-xl border border-red-200 bg-red-50/40">
                    <div className="flex items-center gap-2 mb-2 text-red-800">
                      <AlertTriangle size={16} />
                      <span className="text-xs font-bold uppercase tracking-wider">Alergias Relatadas</span>
                    </div>
                    {document.entities.allergies.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">Nenhuma alergia relatada durante a consulta.</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {document.entities.allergies.map((al, idx) => (
                          <span key={idx} className="px-2.5 py-1 bg-red-600 text-white text-xs font-bold rounded-lg shadow-xs">
                            ⚠️ {al}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Medicamentos Detectados com Posologia */}
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/30">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-slate-800">
                        <Pill size={16} className="text-sky-600" />
                        <span className="text-xs font-bold uppercase tracking-wider">Medicamentos & Prescrições</span>
                      </div>
                      <span className="text-[11px] text-slate-400">{document.entities.medications.length} identificados</span>
                    </div>

                    {document.entities.medications.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">Nenhum medicamento específico citado no diálogo.</p>
                    ) : (
                      <div className="space-y-2">
                        {document.entities.medications.map((med, idx) => (
                          <div key={idx} className="p-2.5 rounded-lg bg-white border border-slate-200 text-xs flex justify-between items-start gap-2">
                            <div>
                              <strong className="text-slate-900 block text-xs">{med.name} {med.dose && `• ${med.dose}`}</strong>
                              <span className="text-slate-600 text-[11px]">{med.posology || 'Posologia não especificada'}</span>
                              {med.route && <span className="ml-2 text-[10px] text-slate-400">Via: {med.route}</span>}
                            </div>
                            <button
                              onClick={() => copyToClipboard(`${med.name} ${med.dose || ''} - ${med.posology || ''}`, `med_${idx}`)}
                              className="text-slate-400 hover:text-sky-600 p-1"
                              title="Copiar medicamento"
                            >
                              {copiedSection === `med_${idx}` ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Sugestões de CID-10 */}
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/30">
                    <div className="flex items-center gap-2 mb-2 text-slate-800">
                      <Tag size={16} className="text-emerald-600" />
                      <span className="text-xs font-bold uppercase tracking-wider">Sugestões de CID-10</span>
                    </div>

                    {document.entities.cid10.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">Nenhuma hipótese diagnóstica clara para codificação.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {document.entities.cid10.map((c, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                                {c.code}
                              </span>
                              <span className="text-slate-700 text-xs">{c.description}</span>
                            </div>
                            <button
                              onClick={() => copyToClipboard(`${c.code} - ${c.description}`, `cid_${idx}`)}
                              className="text-slate-400 hover:text-sky-600 p-1"
                              title="Copiar CID-10"
                            >
                              {copiedSection === `cid_${idx}` ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Sinais de Alarme (Red Flags) */}
                  {document.entities.redFlags.length > 0 && (
                    <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/30">
                      <strong className="text-xs font-bold text-amber-800 uppercase tracking-wider block mb-1.5">
                        Sinais de Alerta / Critérios de Gravidade:
                      </strong>
                      <ul className="list-disc list-inside text-xs text-amber-900 space-y-1">
                        {document.entities.redFlags.map((rf, idx) => (
                          <li key={idx}>{rf}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                </div>
              )}

              {/* TAB 4: ORIENTAÇÕES AO PACIENTE */}
              {activeTab === 'patient' && (
                <div className="p-4 rounded-xl border border-sky-100 bg-sky-50/20 space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-sky-900 flex items-center gap-1.5">
                      <MessageSquareText size={16} className="text-sky-600" />
                      Instruções Didáticas para o Paciente
                    </span>
                    <button
                      onClick={() => copyToClipboard(document.patientSummary || '', 'patient_sum')}
                      className="flex items-center gap-1 text-xs text-sky-700 hover:text-sky-900 font-semibold px-2 py-1 rounded bg-white border border-sky-200 shadow-xs"
                    >
                      {copiedSection === 'patient_sum' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                      <span>Copiar para WhatsApp</span>
                    </button>
                  </div>
                  <p className="text-xs md:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {getCleanText(document.patientSummary || 'Orientações ao paciente não geradas.')}
                  </p>
                </div>
              )}

            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="p-3.5 md:p-4 border-t border-slate-100 bg-slate-50/60">
          <button
            onClick={() => onGenerate()}
            disabled={!hasContent || isGenerating}
            className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${
              !hasContent
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/15 active:scale-[0.98]'
            }`}
          >
            {isGenerating ? (
              <>
                <RefreshCw size={17} className="animate-spin" />
                <span>Processando Inteligência Clínica...</span>
              </>
            ) : (
              <>
                <Sparkles size={17} />
                <span>{document ? 'Atualizar Documentação Clínica' : 'Gerar Prontuário & SOAP Completo'}</span>
              </>
            )}
          </button>
          <p className="text-[10px] text-center text-slate-400 mt-2 font-medium">
            IA AUDITORA: GERAÇÃO MULTIDOCUMENTAL (SOAP, ANAMNESE PEP, MEDICAMENTOS E CID-10)
          </p>
        </div>

      </div>

      {/* Printable Modal */}
      {showPrintModal && document && (
        <ClinicalPrintModal
          document={document}
          isAnonymized={isAnonymized}
          onClose={() => setShowPrintModal(false)}
        />
      )}
    </>
  );
};
