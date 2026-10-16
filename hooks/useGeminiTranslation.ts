import { useState, useRef, useCallback, useEffect } from 'react';
import { fileToBase64 } from '../utils/clinicalUtils';
import {
  ConnectionStatus,
  TranslationSegment,
  AudioSourceType,
  SpeakerType,
  ClinicalDocument,
  ClinicalTemplateType,
  ConsultationRecord,
  StructuredSoap,
  StructuredAnamnese,
  ClinicalEntities
} from '../types';

const STORAGE_KEY = 'clinica_consultas_v1';

const SAMPLE_CONSULTATION: TranslationSegment[] = [
  {
    id: 'sample-1',
    speaker: 'clinician',
    text: 'Boa tarde, dona Maria. Pode me contar com detalhes o que a trouxe aqui hoje?',
    timestamp: Date.now() - 180000,
    isFinal: true,
  },
  {
    id: 'sample-2',
    speaker: 'patient',
    text: 'Boa tarde, doutor. Eu estou sentindo uma dor no peito que aperta e uma queimação forte no estômago há uns 3 dias, que piora bastante depois que eu almoço.',
    timestamp: Date.now() - 150000,
    isFinal: true,
  },
  {
    id: 'sample-3',
    speaker: 'clinician',
    text: 'Essa dor no peito espalha para o braço esquerdo, mandíbula ou costas? Teve falta de ar ou suor frio?',
    timestamp: Date.now() - 120000,
    isFinal: true,
  },
  {
    id: 'sample-4',
    speaker: 'patient',
    text: 'Não espalha não, doutor. Fica mais no meio do peito, tipo um aperto com refluxo subindo pela garganta.',
    timestamp: Date.now() - 100000,
    isFinal: true,
  },
  {
    id: 'sample-5',
    speaker: 'clinician',
    text: 'A senhora tem alguma doença crônica ou toma remédios de uso contínuo?',
    timestamp: Date.now() - 80000,
    isFinal: true,
  },
  {
    id: 'sample-6',
    speaker: 'patient',
    text: 'Eu sou hipertensa há 5 anos, tomo Losartana 50mg uma vez ao dia pela manhã, mas às vezes acabo esquecendo. Minha pressão aferida na farmácia hoje deu 150 por 90 mmHg.',
    timestamp: Date.now() - 60000,
    isFinal: true,
  },
  {
    id: 'sample-7',
    speaker: 'clinician',
    text: 'Tem alguma alergia a medicamentos conhecida?',
    timestamp: Date.now() - 40000,
    isFinal: true,
  },
  {
    id: 'sample-8',
    speaker: 'patient',
    text: 'Tenho alergia grave a Dipirona e anti-inflamatórios! Uma vez tomei e fiquei cheia de placas vermelhas no corpo e com falta de ar.',
    timestamp: Date.now() - 30000,
    isFinal: true,
  },
  {
    id: 'sample-9',
    speaker: 'clinician',
    text: 'Vou registrar seu alerta de alergia no prontuário. Ao exame físico a senhora está eupneica, corada, murmúrio vesicular presente sem ruídos adventícios, abdome doloroso à palpação profunda em epigástrio sem sinais de peritonite. Vamos prescrever Omeprazol 40mg em jejum por 30 dias para o refluxo e dispepsia, manter a Losartana 50mg com rigor diário, e solicitar ECG e endoscopia digestiva alta.',
    timestamp: Date.now() - 10000,
    isFinal: true,
  },
];

const getSpeechRecognition = (): any => {
  if (typeof window === 'undefined') return null;
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
};

export const useGeminiTranslation = () => {
  const [status, setStatus] = useState<ConnectionStatus>(ConnectionStatus.DISCONNECTED);
  const [audioSource, setAudioSource] = useState<AudioSourceType>('mic');
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [durationSeconds, setDurationSeconds] = useState<number>(0);
  const [segments, setSegments] = useState<TranslationSegment[]>([]);
  const [streamText, setStreamText] = useState<string>('');
  const [volume, setVolume] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState<boolean>(false);
  const [isDiarizing, setIsDiarizing] = useState<boolean>(false);

  // Clinical Document state
  const [clinicalDoc, setClinicalDoc] = useState<ClinicalDocument | null>(null);
  const [isGeneratingDoc, setIsGeneratingDoc] = useState<boolean>(false);
  const [isAnonymized, setIsAnonymized] = useState<boolean>(false);

  // History state
  const [history, setHistory] = useState<ConsultationRecord[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const recognitionRef = useRef<any>(null);
  const isPausedRef = useRef<boolean>(false);
  const isExplicitDisconnectRef = useRef<boolean>(false);
  const timerIntervalRef = useRef<number | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  // Duration timer
  useEffect(() => {
    if (status === ConnectionStatus.CONNECTED && !isPaused) {
      timerIntervalRef.current = window.setInterval(() => {
        setDurationSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [status, isPaused]);

  // Auto-save consultation
  const saveCurrentSession = useCallback((doc?: ClinicalDocument) => {
    if (segments.length === 0 && !doc) return;

    const currentDoc = doc || clinicalDoc;
    const title = currentDoc?.entities?.cid10?.[0]?.description 
      ? `Consulta - ${currentDoc.entities.cid10[0].description}`
      : `Atendimento Clínico (${new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date())})`;

    const newRecord: ConsultationRecord = {
      id: crypto.randomUUID(),
      title,
      date: Date.now(),
      durationSeconds,
      segments,
      clinicalDocument: currentDoc || undefined,
    };

    setHistory(prev => {
      const updated = [newRecord, ...prev.filter(r => r.id !== newRecord.id)].slice(0, 30);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save history', e);
      }
      return updated;
    });
  }, [segments, clinicalDoc, durationSeconds]);

  const disconnect = useCallback(() => {
    isExplicitDisconnectRef.current = true;

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    if (analyserRef.current) {
      try { analyserRef.current.disconnect(); } catch {}
      analyserRef.current = null;
    }

    if (audioContextRef.current) {
      try { audioContextRef.current.close(); } catch {}
      audioContextRef.current = null;
    }

    setStreamText('');
    setVolume(0);
    setIsPaused(false);
    setStatus(ConnectionStatus.DISCONNECTED);
  }, []);

  const togglePause = useCallback(() => {
    if (status !== ConnectionStatus.CONNECTED && status !== ConnectionStatus.PAUSED) return;

    if (isPaused) {
      setIsPaused(false);
      setStatus(ConnectionStatus.CONNECTED);
      if (recognitionRef.current) {
        try { recognitionRef.current.start(); } catch {}
      }
    } else {
      setIsPaused(true);
      setStatus(ConnectionStatus.PAUSED);
      setVolume(0);
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
    }
  }, [status, isPaused]);

  const connect = useCallback(async (sourceTypeOverride?: AudioSourceType) => {
    setError(null);
    setStatus(ConnectionStatus.CONNECTING);
    setIsPaused(false);
    isExplicitDisconnectRef.current = false;

    const sourceToUse = sourceTypeOverride || audioSource;

    try {
      let stream: MediaStream;

      if (sourceToUse === 'mic') {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: false,
        });
      } else {
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
          },
        });
      }

      const audioTrack = stream.getAudioTracks()[0];
      if (!audioTrack) {
        stream.getTracks().forEach(t => t.stop());
        throw new Error(
          sourceToUse === 'mic'
            ? 'Nenhum microfone detectado. Verifique as permissões de áudio.'
            : "Nenhum áudio detectado. Marque a opção 'Compartilhar áudio da guia/sistema'."
        );
      }

      mediaStreamRef.current = stream;
      audioTrack.onended = () => disconnect();

      // AudioContext + Analyser for live oscilloscope
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass();
      audioContextRef.current = audioContext;

      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      // Volume calculation loop
      const updateVolume = () => {
        if (!analyserRef.current || isPausedRef.current) {
          setVolume(0);
        } else {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          const vol = Math.min(100, Math.round((avg / 255) * 150));
          setVolume(vol);
        }
        animFrameRef.current = requestAnimationFrame(updateVolume);
      };
      updateVolume();

      // Check SpeechRecognition
      const SpeechRecognitionClass = getSpeechRecognition();
      if (!SpeechRecognitionClass) {
        // Connected to microphone (waveform works), inform user about SpeechRecognition in current browser
        setStatus(ConnectionStatus.CONNECTED);
        setError('O áudio está sendo captado pelo microfone! Para transcrição contínua em tempo real pelo navegador, recomendamos usar o Google Chrome ou Edge, ou você pode usar o botão "Carregar Caso Exemplo" para testar agora.');
        return;
      }

      const recognition = new SpeechRecognitionClass();
      recognition.lang = 'pt-BR';
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setStatus(ConnectionStatus.CONNECTED);
      };

      recognition.onresult = (event: any) => {
        if (isPausedRef.current) return;

        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          const transcript = item[0].transcript;

          if (item.isFinal) {
            const trimmed = transcript.trim();
            if (trimmed) {
              let inferredSpeaker: SpeakerType = 'unassigned';
              const lower = trimmed.toLowerCase();
              if (
                lower.startsWith('você ') ||
                lower.startsWith('o senhor ') ||
                lower.startsWith('a senhora ') ||
                lower.includes('como posso ajudar') ||
                lower.includes('vamos auscultar') ||
                lower.includes('vou prescrever') ||
                lower.includes('vamos medir') ||
                lower.endsWith('?')
              ) {
                inferredSpeaker = 'clinician';
              } else if (
                lower.startsWith('eu ') ||
                lower.startsWith('estou sentindo') ||
                lower.startsWith('minha dor') ||
                lower.startsWith('minha pressão') ||
                lower.includes('doutor') ||
                lower.includes('doutora')
              ) {
                inferredSpeaker = 'patient';
              }

              const newSegment: TranslationSegment = {
                id: crypto.randomUUID(),
                text: trimmed,
                timestamp: Date.now(),
                isFinal: true,
                speaker: inferredSpeaker,
              };

              setSegments(prev => [...prev, newSegment]);
            }
          } else {
            interim += transcript;
          }
        }
        setStreamText(interim);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error event:', event.error);
        if (event.error === 'not-allowed') {
          setError('Acesso ao microfone negado ou bloqueado no navegador.');
          disconnect();
        } else if (event.error === 'network') {
          // In some iframes, speech server might report network glitch, keep connection alive
          console.warn('Network glitch on speech server');
        }
      };

      recognition.onend = () => {
        if (!isExplicitDisconnectRef.current && !isPausedRef.current) {
          try {
            recognition.start();
          } catch (e) {}
        }
      };

      recognitionRef.current = recognition;
      try {
        recognition.start();
      } catch (recErr: any) {
        console.warn('Could not start recognition directly:', recErr);
        setStatus(ConnectionStatus.CONNECTED);
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao iniciar captura de áudio.');
      setStatus(ConnectionStatus.ERROR);
      disconnect();
    }
  }, [audioSource, disconnect]);

  // Transcribe recorded audio file
  const processAudioFile = useCallback(async (file: File) => {
    setError(null);
    setIsProcessingFile(true);
    setStatus(ConnectionStatus.CONNECTING);

    try {
      const base64Data = await fileToBase64(file);
      
      const res = await fetch('/api/gemini/transcribe-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base64Data,
          mimeType: file.type || 'audio/mp3',
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Erro no servidor ao transcrever áudio');
      }

      const data = await res.json();
      const parsed = data.segments || [];

      if (Array.isArray(parsed) && parsed.length > 0) {
        const newSegments: TranslationSegment[] = parsed.map((item: any, idx: number) => ({
          id: crypto.randomUUID(),
          text: item.text,
          timestamp: Date.now() + idx * 1000,
          isFinal: true,
          speaker: item.speaker === 'clinician' || item.speaker === 'patient' ? item.speaker : 'unassigned',
        }));
        setSegments(newSegments);
      } else {
        throw new Error('Nenhuma fala audível encontrada no arquivo.');
      }

      setStatus(ConnectionStatus.DISCONNECTED);
    } catch (err: any) {
      console.error(err);
      setError('Falha ao processar arquivo de áudio: ' + (err.message || 'Erro desconhecido'));
      setStatus(ConnectionStatus.ERROR);
    } finally {
      setIsProcessingFile(false);
    }
  }, []);

  const clearSegments = useCallback(() => {
    setSegments([]);
    setStreamText('');
    setClinicalDoc(null);
    setDurationSeconds(0);
    setError(null);
  }, []);

  const updateSegment = useCallback((id: string, newText: string) => {
    setSegments(prev => prev.map(seg => seg.id === id ? { ...seg, text: newText } : seg));
  }, []);

  const toggleSegmentSpeaker = useCallback((id: string) => {
    setSegments(prev => prev.map(seg => {
      if (seg.id !== id) return seg;
      const nextSpeaker: SpeakerType = 
        seg.speaker === 'clinician' ? 'patient' :
        seg.speaker === 'patient' ? 'unassigned' : 'clinician';
      return { ...seg, speaker: nextSpeaker };
    }));
  }, []);

  // Diarize existing segments
  const autoDiarizeSegments = useCallback(async () => {
    if (segments.length === 0) return;
    setIsDiarizing(true);
    try {
      const res = await fetch('/api/gemini/diarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          segments: segments.map(s => ({ id: s.id, text: s.text })),
        }),
      });

      if (!res.ok) {
        throw new Error('Falha ao diarizar falas');
      }

      const data = await res.json();
      if (data.classifications && Array.isArray(data.classifications)) {
        const map = new Map<string, SpeakerType>(data.classifications.map((c: any) => [c.id, c.speaker]));
        setSegments(prev => prev.map(s => map.has(s.id) ? { ...s, speaker: map.get(s.id)! } : s));
      }
    } catch (e: any) {
      console.error('Diarization error', e);
      setError('Não foi possível diarizar automaticamente: ' + (e.message || ''));
    } finally {
      setIsDiarizing(false);
    }
  }, [segments]);

  // Generate structured clinical documentation
  const generateClinicalDocument = useCallback(async (template: ClinicalTemplateType = 'soap') => {
    const fullTranscript = segments
      .map(s => {
        const prefix = s.speaker === 'clinician' ? '[Profissional]: ' : s.speaker === 'patient' ? '[Paciente]: ' : '';
        return `${prefix}${s.text}`;
      })
      .join('\n');

    if (!fullTranscript.trim()) {
      setError('Transcrição vazia. Fale no microfone ou clique em "Caso Exemplo" para testar a geração.');
      return;
    }

    setIsGeneratingDoc(true);
    setError(null);

    try {
      const res = await fetch('/api/gemini/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: fullTranscript }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Erro ao processar documentação clínica');
      }

      const parsedData = await res.json();

      const newDoc: ClinicalDocument = {
        template,
        soap: parsedData.soap as StructuredSoap,
        anamnese: parsedData.anamnese as StructuredAnamnese,
        patientSummary: parsedData.patientSummary || '',
        rawText: JSON.stringify(parsedData),
        entities: (parsedData.entities || {
          medications: [],
          allergies: [],
          redFlags: [],
          vitalSigns: [],
          cid10: []
        }) as ClinicalEntities,
        generatedAt: Date.now(),
      };

      setClinicalDoc(newDoc);
      saveCurrentSession(newDoc);
    } catch (err: any) {
      console.error('Error generating clinical doc', err);
      setError('Erro ao gerar registro clínico médico: ' + (err.message || 'Erro de conexão'));
    } finally {
      setIsGeneratingDoc(false);
    }
  }, [segments, saveCurrentSession]);

  // Insert realistic Brazilian clinical consultation for instant 1-click test
  const insertSampleConsultation = useCallback(() => {
    disconnect();
    setSegments(SAMPLE_CONSULTATION);
    setClinicalDoc(null);
    setDurationSeconds(180);
    setError(null);
  }, [disconnect]);

  // Insert pasted text manually
  const insertManualText = useCallback((rawText: string) => {
    if (!rawText.trim()) return;
    const lines = rawText.split('\n').filter(l => l.trim().length > 0);
    const newSegments: TranslationSegment[] = lines.map((line, idx) => {
      let speaker: SpeakerType = 'unassigned';
      let cleanText = line.trim();

      if (cleanText.toLowerCase().startsWith('médico:') || cleanText.toLowerCase().startsWith('profissional:')) {
        speaker = 'clinician';
        cleanText = cleanText.replace(/^(médico|profissional)\s*:\s*/i, '');
      } else if (cleanText.toLowerCase().startsWith('paciente:')) {
        speaker = 'patient';
        cleanText = cleanText.replace(/^paciente\s*:\s*/i, '');
      }

      return {
        id: crypto.randomUUID(),
        text: cleanText,
        speaker,
        timestamp: Date.now() + idx * 1000,
        isFinal: true,
      };
    });

    setSegments(prev => [...prev, ...newSegments]);
  }, []);

  const loadConsultation = useCallback((record: ConsultationRecord) => {
    disconnect();
    setSegments(record.segments || []);
    setClinicalDoc(record.clinicalDocument || null);
    setDurationSeconds(record.durationSeconds || 0);
    setStreamText('');
  }, [disconnect]);

  const deleteHistoryItem = useCallback((id: string) => {
    setHistory(prev => {
      const updated = prev.filter(r => r.id !== id);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  const startNewConsultation = useCallback(() => {
    disconnect();
    clearSegments();
  }, [disconnect, clearSegments]);

  return {
    status,
    audioSource,
    setAudioSource,
    isPaused,
    togglePause,
    durationSeconds,
    volume,
    analyserNode: analyserRef.current,
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
    insertManualText,
  };
};
