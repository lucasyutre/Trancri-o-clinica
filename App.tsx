import React, { useState } from 'react';
import { ControlPanel } from './components/ControlPanel';
import { TranscriptView } from './components/TranscriptView';
import { SoapView } from './components/SoapView';
import { ConsultationHistoryModal } from './components/ConsultationHistoryModal';
import { useGeminiTranslation } from './hooks/useGeminiTranslation';
import { Stethoscope, History, Plus, ShieldCheck, Sparkles } from 'lucide-react';

const App: React.FC = () => {
  const { 
    status,
    audioSource,
    setAudioSource,
    isPaused,
    togglePause,
    durationSeconds,
    volume,
    analyserNode,
    segments,
    streamText,
    error,
    isProcessingFile,
    isDiarizing,
    connect,
    disconnect,
    processAudioFile,
    clearSegments,
    updateSegment,
    toggleSegmentSpeaker,
    autoDiarizeSegments,
    clinicalDoc,
    isGeneratingDoc,
    generateClinicalDocument,
    isAnonymized,
    setIsAnonymized,
    history,
    loadConsultation,
    deleteHistoryItem,
    startNewConsultation,
    insertSampleConsultation,
    insertManualText
  } = useGeminiTranslation();

  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const hasContent = segments.length > 0 || streamText.length > 0;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col p-4 md:p-6 lg:p-8 selection:bg-sky-100 selection:text-sky-900">
      
      {/* Header Clinical Light */}
      <header className="max-w-7xl mx-auto w-full mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        
        {/* Brand */}
        <div className="flex items-center gap-3.5">
          <div className="bg-sky-600 p-2.5 rounded-xl shadow-md shadow-sky-600/10 border border-sky-500/20 text-white flex items-center justify-center">
            <Stethoscope size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
                Transcrição Clínica & PEP
              </h1>
              <span className="text-[10px] bg-sky-100 text-sky-800 font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                MedASR 3.5
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Suporte Inteligente à Documentação Médica e Enfermagem
            </p>
          </div>
        </div>

        {/* Action Header Tools */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
          
          {/* Quick Sample Button in Header */}
          <button
            onClick={insertSampleConsultation}
            className="flex items-center gap-1.5 px-3 py-2 bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-bold rounded-xl border border-sky-200 shadow-xs transition-all active:scale-95"
            title="Carregar consulta teste de cardiologia com hipertensão e alergia a dipirona"
          >
            <Sparkles size={14} className="text-sky-600" />
            <span className="hidden sm:inline">Caso Demonstrativo</span>
          </button>

          {/* History Button */}
          <button
            onClick={() => setShowHistoryModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 shadow-xs transition-all"
            title="Ver histórico de consultas salvas"
          >
            <History size={15} className="text-slate-400" />
            <span>Histórico</span>
            {history.length > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded-full text-[10px] font-bold">
                {history.length}
              </span>
            )}
          </button>

          {/* New Consultation Button */}
          <button
            onClick={startNewConsultation}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-sky-50 text-sky-700 text-xs font-bold rounded-xl border border-sky-200 shadow-xs transition-all active:scale-95"
            title="Iniciar novo atendimento zerando o registro atual"
          >
            <Plus size={15} />
            <span>Novo Atendimento</span>
          </button>

          {/* LGPD Pill */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 text-xs font-semibold">
            <ShieldCheck size={14} className="text-emerald-600" />
            <span>LGPD / Sigilo Médico</span>
          </div>

        </div>

      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full flex flex-col gap-6">
        
        {error && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl text-xs sm:text-sm flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <span className="text-base">ℹ️</span>
              <span>{error}</span>
            </div>
            <button 
              onClick={() => {}} 
              className="text-xs font-bold text-amber-900 hover:underline shrink-0"
            >
              OK
            </button>
          </div>
        )}

        {/* Top Control Panel */}
        <ControlPanel 
          status={status}
          audioSource={audioSource}
          setAudioSource={setAudioSource}
          isPaused={isPaused}
          onTogglePause={togglePause}
          durationSeconds={durationSeconds}
          volume={volume}
          analyserNode={analyserNode}
          isProcessingFile={isProcessingFile}
          onStart={() => connect()} 
          onStop={disconnect}
          onFileUpload={processAudioFile}
          onLoadSample={insertSampleConsultation}
          onManualTextSubmit={insertManualText}
        />

        {/* Split View */}
        <div className="flex-1 min-h-[550px] grid grid-cols-1 lg:grid-cols-12 gap-6 pb-6">
          
          {/* Transcript (Left - 7 cols) */}
          <div className="lg:col-span-7 h-full flex flex-col">
            <TranscriptView 
              segments={segments} 
              streamText={streamText}
              isDiarizing={isDiarizing}
              isAnonymized={isAnonymized}
              onClear={clearSegments} 
              onUpdateSegment={updateSegment}
              onToggleSpeaker={toggleSegmentSpeaker}
              onAutoDiarize={autoDiarizeSegments}
            />
          </div>

          {/* SOAP / Clinical Doc (Right - 5 cols) */}
          <div className="lg:col-span-5 h-full flex flex-col">
            <SoapView 
              document={clinicalDoc}
              isGenerating={isGeneratingDoc}
              hasContent={hasContent}
              isAnonymized={isAnonymized}
              onToggleAnonymize={() => setIsAnonymized(!isAnonymized)}
              onGenerate={generateClinicalDocument}
            />
          </div>

        </div>

      </main>
      
      {/* Footer */}
      <footer className="max-w-7xl mx-auto w-full py-4 text-center border-t border-slate-200/60 mt-4 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2">
        <p className="font-medium tracking-wide">
          Ambiente Clínico Seguro • Inteligência Artificial sob Supervisão do Profissional de Saúde
        </p>
        <p className="font-mono text-[10px]">
          Conformidade com Resoluções CFM & COFEN de Telemedicina
        </p>
      </footer>

      {/* History Modal */}
      {showHistoryModal && (
        <ConsultationHistoryModal
          history={history}
          onSelect={loadConsultation}
          onDelete={deleteHistoryItem}
          onClose={() => setShowHistoryModal(false)}
        />
      )}

    </div>
  );
};

export default App;
