export const FILE_NUMBER_REGEX = /^\d{5}-\d{2}$/;

export function validateFileNumber(value: string): boolean {
  return FILE_NUMBER_REGEX.test(value.trim());
}
