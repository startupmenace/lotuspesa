export function generatePassword(shortcode: string, passkey: string, timestamp: string): string {
  const data = `${shortcode}${passkey}${timestamp}`;
  return Buffer.from(data).toString('base64');
}

export function generateTimestamp(): string {
  const now = new Date();
  // Safaricom requires timestamp in EAT (UTC+3) format: YYYYMMDDHHmmss
  const eatOffset = 3 * 60 * 60 * 1000;
  const eatTime = new Date(now.getTime() + eatOffset);
  const year = eatTime.getUTCFullYear();
  const month = String(eatTime.getUTCMonth() + 1).padStart(2, '0');
  const day = String(eatTime.getUTCDate()).padStart(2, '0');
  const hours = String(eatTime.getUTCHours()).padStart(2, '0');
  const minutes = String(eatTime.getUTCMinutes()).padStart(2, '0');
  const seconds = String(eatTime.getUTCSeconds()).padStart(2, '0');
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}
