export type AudioSourceType = 'mic' | 'display' | 'file';

export type SpeakerType = 'clinician' | 'patient' | 'unassigned';

export interface TranslationSegment {
  id: string;
  text: string;
  timestamp: number;
  isFinal: boolean;
  speaker?: SpeakerType;
}

export enum ConnectionStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  PAUSED = 'paused',
  ERROR = 'error',
}

export type ClinicalTemplateType = 'soap' | 'anamnese' | 'patient_summary';

export interface MedicationEntity {
  name: string;
  dose?: string;
  posology?: string;
  route?: string;
}

export interface Cid10Entity {
  code: string;
  description: string;
  relevance: string;
}

export interface VitalSignEntity {
  label: string;
  value: string;
}

export interface ClinicalEntities {
  medications: MedicationEntity[];
  allergies: string[];
  redFlags: string[];
  vitalSigns: VitalSignEntity[];
  cid10: Cid10Entity[];
}

export interface StructuredSoap {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

export interface StructuredAnamnese {
  chiefComplaint: string;
  hma: string;
  personalHistory: string;
  lifestyle: string;
  medicationsInUse: string;
  allergies: string;
  assessmentConduct: string;
}

export interface ClinicalDocument {
  template: ClinicalTemplateType;
  soap?: StructuredSoap;
  anamnese?: StructuredAnamnese;
  patientSummary?: string;
  rawText: string;
  entities: ClinicalEntities;
  generatedAt: number;
}

export interface ConsultationRecord {
  id: string;
  title: string;
  date: number;
  durationSeconds: number;
  segments: TranslationSegment[];
  clinicalDocument?: ClinicalDocument;
}
