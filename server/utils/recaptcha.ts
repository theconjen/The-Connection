export async function verifyRecaptchaToken(token: string | undefined) {
  if (!process.env.RECAPTCHA_SECRET) {
    return true;
  }
  if (!token) return false;

  const params = new URLSearchParams();
  params.append('secret', process.env.RECAPTCHA_SECRET);
  params.append('response', token);

  const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!response.ok) return false;
  const data = await response.json() as { success?: boolean; score?: number };
  if (!data.success) return false;
  if (typeof data.score === 'number' && data.score < 0.5) return false;
  return true;
}
