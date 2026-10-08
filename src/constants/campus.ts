// Configurable allowed campus domains
export const allowedCampusDomains: string[] = [
  'pondiuni.ac.in', // Pondicherry University
  'campus.edu.in',
  'iitb.ac.in',
  'iitd.ac.in',
  'iitm.ac.in',
  'nitk.edu.in',
  'nitt.edu.in',
  'bits-pilani.ac.in',
  'univ.edu',
];

// Read from env if configured
const ENV_CAMPUS_DOMAIN =
  typeof import.meta !== 'undefined' && import.meta.env?.VITE_CAMPUS_DOMAIN;

export const CAMPUS_NAME =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_CAMPUS_NAME) ||
  'Pondicherry University';

export function isCampusEmail(email?: string | null): boolean {
  if (!email) return false;
  const lower = email.toLowerCase().trim();

  if (ENV_CAMPUS_DOMAIN && lower.endsWith(`@${ENV_CAMPUS_DOMAIN.toLowerCase()}`)) {
    return true;
  }

  // Check if matches allowed campus domains or standard academic extensions
  return (
    allowedCampusDomains.some((domain) => lower.endsWith(`@${domain.toLowerCase()}`)) ||
    lower.endsWith('.ac.in') ||
    lower.endsWith('.edu.in') ||
    lower.endsWith('.edu')
  );
}

export function getCollegeNameFromEmail(email?: string | null): string {
  if (!email) return CAMPUS_NAME;
  const lower = email.toLowerCase().trim();
  if (lower.includes('pondiuni.ac.in')) {
    return 'Pondicherry University';
  }
  if (lower.includes('iitb.ac.in')) return 'IIT Bombay';
  if (lower.includes('iitd.ac.in')) return 'IIT Delhi';
  if (lower.includes('iitm.ac.in')) return 'IIT Madras';
  if (lower.includes('bits-pilani.ac.in')) return 'BITS Pilani';
  return CAMPUS_NAME;
}

export const VERIFIED_CAMPUS_LABEL = '✓ Verified Campus';
export const UNVERIFIED_CAMPUS_LABEL = 'Campus verification required';
