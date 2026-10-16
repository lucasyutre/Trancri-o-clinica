import React, { useEffect, useRef, useState, memo } from 'react';
import { TranslationSegment, SpeakerType } from '../types';
import { 
  Copy, 
  Trash2, 
  CheckCircle2, 
  Download, 
  Pencil, 
  FileText, 
  Users, 
  Sparkles, 
  Search, 
  UserCheck, 
  User 
} from 'lucide-react';
import { anonymizeText } from '../utils/clinicalUtils';

interface TranscriptViewProps {
  segments: TranslationSegment[];
  streamText: string;
  isDiarizing: boolean;
  isAnonymized: boolean;
  onClear: () => void;
  onUpdateSegment: (id: string, text: string) => void;
  onToggleSpeaker: (id: string) => void;
  onAutoDiarize: () => void;
}

interface EditableSegmentProps {
  segment: TranslationSegment;
  isAnonymized: boolean;
  onUpdate: (val: string) => void;
  onToggleSpeaker: () => void;
}

const EditableSegment: React.FC<EditableSegmentProps> = ({
  segment,
  isAnonymized,
  onUpdate,
  onToggleSpeaker,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [segment.text]);

  const displayedText = isAnonymized ? anonymizeText(segment.text) : segment.text;

  const speakerConfig = {
    clinician: {
      label: 'Profissional de Saúde',
      icon: UserCheck,
      classes: 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100',
    },
    patient: {
      label: 'Paciente / Acompanhante',
      icon: User,
      classes: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
    },
    unassigned: {
      label: 'Não classificado',
      icon: Users,
      classes: 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200',
    },
  }[segment.speaker || 'unassigned'];

  const SpeakerIcon = speakerConfig.icon;

  return (
    <div className="group/edit relative p-3 rounded-xl hover:bg-slate-50/80 border border-slate-100 transition-all flex flex-col gap-1.5 bg-white shadow-xs">
      
      {/* Speaker Tag Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onToggleSpeaker}
          title="Clique para alternar o interlocutor (Profissional ↔ Paciente)"
          className={`flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-md border transition-all cursor-pointer ${speakerConfig.classes}`}
        >
          <SpeakerIcon size={12} />
          <span>{speakerConfig.label}</span>
          <span className="text-[9px] opacity-60">✎</span>
        </button>

        <span className="text-[10px] text-slate-400 font-mono">
          {new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date(segment.timestamp))}
        </span>
      </div>

      <div className="relative">
        <textarea
          ref={textareaRef}
          value={displayedText}
          onChange={(e) => onUpdate(e.target.value)}
          className="w-full bg-transparent resize-none outline-none text-slate-800 leading-relaxed text-sm md:text-base font-normal tracking-tight focus:ring-0 border-0 p-0 block"
          rows={1}
          spellCheck={false}
        />
        <div className="absolute right-0 top-0 opacity-0 group-hover/edit:opacity-100 transition-opacity">
          <Pencil size={13} className="text-slate-300" />
        </div>
      </div>

    </div>
  );
};

export const TranscriptView: React.FC<TranscriptViewProps> = memo(({
  segments,
  streamText,
  isDiarizing,
  isAnonymized,
  onClear,
  onUpdateSegment,
  onToggleSpeaker,
  onAutoDiarize,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showCopied, setShowCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    if (scrollRef.current) {
      const { scrollHeight, clientHeight } = scrollRef.current;
      scrollRef.current.scrollTo({ top: scrollHeight - clientHeight, behavior: 'smooth' });
    }
  }, [segments.length, streamText]);

  const getFullText = () => {
    return segments
      .map((s) => {
        const speaker = s.speaker === 'clinician' ? '[Profissional]: ' : s.speaker === 'patient' ? '[Paciente]: ' : '';
        const raw = `${speaker}${s.text}`;
        return isAnonymized ? anonymizeText(raw) : raw;
      })
      .concat(streamText ? [streamText] : [])
      .join('\n\n');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getFullText()).then(() => {
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    });
  };

  const handleDownload = () => {
    const blob = new Blob([getFullText()], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcricao-clinica-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const filteredSegments = segments.filter(seg => 
    !searchQuery.trim() || seg.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const hasContent = segments.length > 0 || streamText.length > 0;

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden relative group">
      
      {/* Header Clean */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/70">
        <div className="flex items-center gap-3">
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-widest flex items-center gap-2">
            Transcrição Médica
          </h2>
          {streamText && (
            <span className="text-[10px] bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full animate-pulse font-bold tracking-tight">
              Ouvindo fala...
            </span>
          )}
          {isAnonymized && (
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
              LGPD Ativa
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          {/* Search Toggle */}
          {segments.length > 0 && (
            <button
              onClick={() => setShowSearch(!showSearch)}
              className={`p-2 rounded-lg transition-colors ${showSearch ? 'bg-sky-100 text-sky-700' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'}`}
              title="Pesquisar termo clínico"
            >
              <Search size={16} />
            </button>
          )}

          {/* Diarize with AI */}
          {segments.length > 0 && (
            <button
              onClick={onAutoDiarize}
              disabled={isDiarizing}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-sky-700 hover:bg-sky-50 rounded-lg transition-colors border border-slate-200/60 disabled:opacity-50"
              title="Classificar quem é Médico e quem é Paciente com IA"
            >
              <Sparkles size={14} className={isDiarizing ? 'animate-spin text-sky-600' : 'text-sky-500'} />
              <span className="hidden sm:inline">{isDiarizing ? 'Diarizando...' : 'Diarizar Vozes'}</span>
            </button>
          )}

          <button 
            onClick={handleDownload}
            disabled={!hasContent}
            className="p-2 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors disabled:opacity-20"
            title="Download TXT"
          >
            <Download size={17} />
          </button>

          <button 
            onClick={handleCopy}
            disabled={!hasContent}
            className="p-2 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors disabled:opacity-20"
            title="Copiar Transcrição Completa"
          >
            {showCopied ? <CheckCircle2 size={17} className="text-emerald-500" /> : <Copy size={17} />}
          </button>

          <button 
            onClick={onClear}
            disabled={!hasContent}
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-20"
            title="Limpar Transcrição"
          >
            <Trash2 size={17} />
          </button>
        </div>
      </div>

      {/* Optional Search Bar */}
      {showSearch && (
        <div className="px-5 py-2 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
          <Search size={14} className="text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar medicamento, sintoma ou termo clínico..."
            className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 outline-none"
            autoFocus
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-xs text-slate-400 hover:text-slate-600">
              ✕
            </button>
          )}
        </div>
      )}
      
      {/* Content Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3.5 scrollbar-thin bg-slate-50/20"
      >
        {!hasContent ? (
          <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-slate-300 select-none py-12">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4 text-slate-400">
              <FileText size={32} />
            </div>
            <p className="text-center max-w-sm font-semibold text-slate-500 text-sm">
              Nenhuma fala transcrita ainda.
            </p>
            <p className="text-center max-w-xs text-xs text-slate-400 mt-1">
              Selecione o microfone ou fonte de áudio acima para iniciar o reconhecimento de voz em tempo real.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredSegments.map((segment) => (
              <EditableSegment 
                key={segment.id} 
                segment={segment}
                isAnonymized={isAnonymized}
                onUpdate={(newText) => onUpdateSegment(segment.id, newText)}
                onToggleSpeaker={() => onToggleSpeaker(segment.id)}
              />
            ))}

            {streamText && (
              <div className="p-3.5 rounded-xl bg-sky-50/80 border border-sky-100">
                <span className="text-[10px] font-bold text-sky-700 uppercase tracking-widest block mb-1">
                  Transcrevendo em tempo real:
                </span>
                <p className="text-sky-900 leading-relaxed text-sm md:text-base font-medium">
                  {streamText}
                  <span className="inline-block w-2 h-4 ml-1 bg-sky-400 align-middle animate-pulse"></span>
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="px-5 py-2.5 bg-white border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
        <span>{segments.length} {segments.length === 1 ? 'segmento capturado' : 'segmentos capturados'}</span>
        <span className="italic">Dica: clique na tag do interlocutor para alternar entre Médico e Paciente</span>
      </div>

    </div>
  );
});
