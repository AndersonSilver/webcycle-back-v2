export function normalizePhoneDigits(input: string): string {
  return (input || '').replace(/\D/g, '');
}

export function isValidBrazilianPhone(input: string): boolean {
  const digits = normalizePhoneDigits(input);
  return digits.length >= 10 && digits.length <= 11;
}

/** Split BR phone into Mercado Pago payer.phone shape. */
export function toMercadoPagoPhone(
  input: string
): { area_code: string; number: string } | null {
  if (!isValidBrazilianPhone(input)) {
    return null;
  }
  const digits = normalizePhoneDigits(input);
  return {
    area_code: digits.slice(0, 2),
    number: digits.slice(2),
  };
}
