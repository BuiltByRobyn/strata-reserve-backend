export const STRATA_ID_PATTERN = /^[A-Za-z]{3}\s\d{1,5}$/;

export const VALID_LOCATION_CODES = ['LM', 'VI', 'OK', 'TH', 'N/BC', 'Virtual'] as const;

export const LOCATION_CODE_MAP: Record<string, string> = {
  'LLVI': 'VI',
  'NB': 'N/BC',
};
