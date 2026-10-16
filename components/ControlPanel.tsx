import React, { useRef, useState } from 'react';
import { 
  Mic, 
  MonitorPlay, 
  UploadCloud, 
  Pause, 
  Play, 
  Square, 
  Activity, 
  Clock, 
  Sparkles, 
  FileText, 
  Send 
} from 'lucide-react';
import { ConnectionStatus, AudioSourceType } from '../types';
import { AudioWaveform } from './AudioWaveform';
import { formatDuration } from '../utils/clinicalUtils';

interface ControlPanelProps {
  status: ConnectionStatus;
  audioSource: AudioSourceType;
  setAudioSource: (source: AudioSourceType) => void;
  isPaused: boolean;
  onTogglePause: () => void;
  durationSeconds: number;
  volume: number;
  analyserNode: AnalyserNode | null;
  isProcessingFile: boolean;
  onStart: () => void;
  onStop: () => void;
  onFileUpload: (file: File) => void;
  onLoadSample: () => void;
  onManualTextSubmit: (text: string) => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  status,
  audioSource,
  setAudioSource,
  isPaused,
  onTogglePause,
  durationSeconds,
  volume,
  analyserNode,
  isProcessingFile,
  onStart,
  onStop,
  onFileUpload,
  onLoadSample,
  onManualTextSubmit,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pastedText, setPastedText] = useState('');

  const isConnected = status === ConnectionStatus.CONNECTED;
  const isConnecting = status === ConnectionStatus.CONNECTING;
  const isBusy = isConnected || isConnecting || status === ConnectionStatus.PAUSED;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file);
      e.target.value = '';
    }
  };

  const handlePasteSubmit = () => {
    if (pastedText.trim()) {
      onManualTextSubmit(pastedText);
      setPastedText('');
      setShowPasteModal(false);
    }
  };

  return (
    <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200/90 shadow-sm relative overflow-hidden">
      
      {/* Background Accent glow */}
      {isConnected && !isPaused && (
        <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 bg-sky-100/60 rounded-full blur-3xl pointer-events-none"></div>
      )}

      <div className="flex flex-col gap-5 relative z-10">
        
        {/* Top Row: Source Selection Tabs & Quick Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          
          {/* Source Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl border border-slate-200/70 flex-wrap">
            <button
              onClick={() => !isBusy && setAudioSource('mic')}
              disabled={isBusy}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                audioSource === 'mic'
                  ? 'bg-white text-sky-700 shadow-sm border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 disabled:opacity-50'
              }`}
            >
              <Mic size={14} />
              <span>Microfone</span>
            </button>

            <button
              onClick={() => !isBusy && setAudioSource('display')}
              disabled={isBusy}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                audioSource === 'display'
                  ? 'bg-white text-sky-700 shadow-sm border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 disabled:opacity-50'
              }`}
            >
              <MonitorPlay size={14} />
              <span>Aba / Telemedicina</span>
            </button>

            <button
              onClick={() => !isBusy && setAudioSource('file')}
              disabled={isBusy}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                audioSource === 'file'
                  ? 'bg-white text-sky-700 shadow-sm border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 disabled:opacity-50'
              }`}
            >
              <UploadCloud size={14} />
              <span>Arquivo Gravado</span>
            </button>
          </div>

          {/* Quick Test / Paste shortcuts */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={onLoadSample}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-bold rounded-lg border border-sky-200 transition-all active:scale-95 shadow-xs"
              title="Carregar consulta médica demonstrativa para testar imediatamente"
            >
              <Sparkles size={14} className="text-sky-600" />
              <span>Caso Exemplo (Teste Rápido)</span>
            </button>

            <button
              onClick={() => setShowPasteModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-all shadow-xs"
              title="Digitar ou colar diálogo da consulta"
            >
              <FileText size={14} className="text-slate-500" />
              <span>Colar Diálogo</span>
            </button>
          </div>

        </div>

        {/* Middle / Bottom: Waveform Visualizer & Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          
          {/* Waveform Area */}
          <div className="md:col-span-7 flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs text-slate-500 px-1">
              <span className="flex items-center gap-1.5 font-medium">
                <Activity size={13} className="text-sky-600" />
                Osciloscópio Acústico Clínico
              </span>
              <div className="flex items-center gap-2 font-mono text-[11px] text-slate-500">
                <Clock size={12} className="text-slate-400" />
                <span>{formatDuration(durationSeconds)}</span>
                {isConnected && <span className="text-sky-600 font-bold">• Sinal: {volume}%</span>}
              </div>
            </div>

            <AudioWaveform
              analyserNode={analyserNode}
              isActive={isConnected}
              isPaused={isPaused}
              className="h-14 border border-slate-200/80"
            />
          </div>

          {/* Action Buttons */}
          <div className="md:col-span-5 flex items-center justify-end gap-2.5">
            
            {audioSource === 'file' ? (
              <>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="audio/*,.mp3,.wav,.m4a,.ogg,.webm,.aac"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessingFile}
                  className={`w-full flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-bold text-sm uppercase tracking-wide transition-all ${
                    isProcessingFile
                      ? 'bg-slate-100 text-slate-400 cursor-wait border border-slate-200'
                      : 'bg-sky-600 hover:bg-sky-700 text-white shadow-md shadow-sky-600/15 border border-sky-500 active:scale-[0.98]'
                  }`}
                >
                  {isProcessingFile ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                      Processando com IA...
                    </>
                  ) : (
                    <>
                      <UploadCloud size={18} />
                      Carregar Áudio (.mp3, .m4a, .wav)
                    </>
                  )}
                </button>
              </>
            ) : isConnected || isPaused ? (
              <>
                {/* Pause / Resume Button */}
                <button
                  onClick={onTogglePause}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wide transition-all border ${
                    isPaused
                      ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600'
                      : 'bg-white hover:bg-amber-50 text-amber-700 border-amber-200'
                  }`}
                  title={isPaused ? 'Retomar captura de voz' : 'Pausar áudio temporariamente'}
                >
                  {isPaused ? <Play size={16} /> : <Pause size={16} />}
                  <span>{isPaused ? 'Retomar' : 'Pausar'}</span>
                </button>

                {/* Stop Button */}
                <button
                  onClick={onStop}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white hover:bg-red-50 text-red-600 border border-red-200 rounded-xl font-bold text-xs uppercase tracking-wide transition-all active:scale-[0.98]"
                >
                  <Square size={16} className="fill-red-600" />
                  <span>Finalizar</span>
                </button>
              </>
            ) : (
              <button
                onClick={onStart}
                disabled={isConnecting}
                className={`w-full flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-bold text-sm uppercase tracking-wide transition-all ${
                  isConnecting
                    ? 'bg-slate-100 text-slate-400 cursor-wait border border-slate-200'
                    : 'bg-sky-600 hover:bg-sky-700 text-white shadow-md shadow-sky-600/15 border border-sky-500 active:scale-[0.98]'
                }`}
              >
                {isConnecting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                    <span>Conectando...</span>
                  </>
                ) : (
                  <>
                    {audioSource === 'mic' ? <Mic size={18} /> : <MonitorPlay size={18} />}
                    <span>{audioSource === 'mic' ? 'Iniciar Microfone' : 'Selecionar Guia / Tela'}</span>
                  </>
                )}
              </button>
            )}

          </div>

        </div>

      </div>

      {/* Paste Dialog Modal */}
      {showPasteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-800">Digitar ou Colar Diálogo Clínico</h3>
              <button onClick={() => setShowPasteModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>
            <p className="text-xs text-slate-500">
              Cole o diálogo da consulta abaixo. Se desejar, inicie cada linha com <code>Médico:</code> ou <code>Paciente:</code> para classificação automática de interlocutores.
            </p>
            <textarea
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="Exemplo:&#10;Médico: Boa tarde, o que está sentindo?&#10;Paciente: Doutor, sinto dor no peito há 2 dias..."
              rows={6}
              className="w-full p-3 border border-slate-200 rounded-xl text-xs font-mono outline-none focus:border-sky-500"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowPasteModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handlePasteSubmit}
                disabled={!pastedText.trim()}
                className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold disabled:opacity-40"
              >
                <Send size={13} />
                <span>Inserir na Consulta</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
