import { createHmac, timingSafeEqual } from 'crypto';
import { Request } from 'express';
import { env } from '../config/env.config';

/**
 * Validates Mercado Pago webhook x-signature (HMAC-SHA256).
 * @see https://www.mercadopago.com.br/developers/en/docs/your-integrations/notifications/webhooks
 */
export function validateMercadoPagoWebhookSignature(req: Request): {
  valid: boolean;
  reason?: string;
} {
  const secret = env.mercadopagoWebhookSecret?.trim();

  if (!secret) {
    if (env.nodeEnv === 'production') {
      return { valid: false, reason: 'MERCADOPAGO_WEBHOOK_SECRET não configurado' };
    }
    // Dev: allow but warn
    console.warn('⚠️ [WEBHOOK] Assinatura não validada — secret ausente (dev only)');
    return { valid: true };
  }

  const xSignature = (req.headers['x-signature'] as string) || '';
  const xRequestId = (req.headers['x-request-id'] as string) || '';

  if (!xSignature) {
    return { valid: false, reason: 'Header x-signature ausente' };
  }

  const parts = xSignature.split(',');
  let ts = '';
  let v1 = '';
  for (const part of parts) {
    const [key, value] = part.split('=');
    if (key?.trim() === 'ts') ts = value?.trim() || '';
    if (key?.trim() === 'v1') v1 = value?.trim() || '';
  }

  if (!ts || !v1) {
    return { valid: false, reason: 'x-signature malformado' };
  }

  // data.id from query (preferred) or body
  const queryDataId =
    (req.query['data.id'] as string) ||
    (req.query.id as string) ||
    '';
  const bodyDataId =
    req.body?.data?.id != null
      ? String(req.body.data.id)
      : req.body?.id != null
        ? String(req.body.id)
        : '';
  let dataId = (queryDataId || bodyDataId || '').toLowerCase();

  // Build manifest — omit missing pairs
  let manifest = '';
  if (dataId) {
    manifest += `id:${dataId};`;
  }
  if (xRequestId) {
    manifest += `request-id:${xRequestId};`;
  }
  manifest += `ts:${ts};`;

  const expected = createHmac('sha256', secret).update(manifest).digest('hex');

  try {
    const a = Buffer.from(expected, 'utf8');
    const b = Buffer.from(v1, 'utf8');
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return { valid: false, reason: 'Assinatura inválida' };
    }
  } catch {
    return { valid: false, reason: 'Falha ao comparar assinatura' };
  }

  return { valid: true };
}
