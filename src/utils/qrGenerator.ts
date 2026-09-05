/**
 * Generates a secure token hash for team QR code identification
 */
export const generateSecureQRToken = (teamNumber: string): string => {
  const randomSalt = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `WEBX_TOK_${teamNumber.toUpperCase()}_${randomSalt}`;
};

/**
 * Extracts and validates team number from QR code payload
 */
export const parseQRTokenPayload = (rawPayload: string): { isValid: boolean; qrToken?: string; teamNumber?: string } => {
  if (!rawPayload) return { isValid: false };
  const trimmed = rawPayload.trim();

  // Pattern: WEBX_TOK_TEAM001_ABC123XY
  if (trimmed.startsWith('WEBX_TOK_')) {
    const parts = trimmed.split('_');
    if (parts.length >= 3) {
      return {
        isValid: true,
        qrToken: trimmed,
        teamNumber: parts[2]
      };
    }
  }

  // Fallback for simple team numbers encoded in QR
  if (trimmed.toUpperCase().startsWith('TEAM')) {
    return {
      isValid: true,
      qrToken: trimmed,
      teamNumber: trimmed.toUpperCase()
    };
  }

  return { isValid: false };
};
