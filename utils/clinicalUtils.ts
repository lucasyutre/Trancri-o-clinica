/**
 * Utilities for Brazilian clinical documentation, LGPD anonymization, and formatting.
 */

// Regex patterns for sensitive Brazilian clinical data (LGPD)
const CPF_REGEX = /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g;
const PHONE_REGEX = /\b(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?(?:9\d{4}|\d{4})[-.\s]?\d{4}\b/g;
const RG_REGEX = /\b\d{1,2}\.?\d{3}\.?\d{3}-?[0-9Xx]\b/g;
const SUS_REGEX = /\b\d{3}\s?\d{4}\s?\d{4}\s?\d{4}\b/g;
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b/g;

/**
 * Anonymizes sensitive patient data in compliance with LGPD / medical secrecy.
 */
export function anonymizeText(text: string): string {
  if (!text) return '';
  
  let anonymized = text
    .replace(CPF_REGEX, '[CPF-PROTEGIDO]')
    .replace(RG_REGEX, '[RG-PROTEGIDO]')
    .replace(SUS_REGEX, '[CARTÃO-SUS-PROTEGIDO]')
    .replace(PHONE_REGEX, '[TELEFONE-PROTEGIDO]')
    .replace(EMAIL_REGEX, '[E-MAIL-PROTEGIDO]');

  // Common clinical introduction names: "Paciente Fulano da Silva", "Sr(a) João", "Nome: Maria"
  anonymized = anonymized.replace(
    /(?:paciente|sr\.?|sra\.?|dona|seu|nome(?:\s+do\s+paciente)?\s*[:=]?)\s+([A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ][a-záéíóúâêîôûãõç]+(?:\s+[A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ][a-záéíóúâêîôûãõç]+)+)/gi,
    (match, p1) => match.replace(p1, '[PACIENTE-ANONIMIZADO]')
  );

  return anonymized;
}

/**
 * Format duration in seconds to mm:ss format.
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Formats timestamp to Brazilian date/time.
 */
export function formatClinicalDate(timestamp: number): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp));
}

/**
 * Converts File to base64 string.
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // remove data:audio/...;base64, prefix
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
}
