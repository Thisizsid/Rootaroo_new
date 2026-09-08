import { getTwilioClient } from '../../config/twilio';
import { env } from '../../config/env';

export async function sendSms(phoneNumber: string, message: string): Promise<void> {
  const client = getTwilioClient();
  if (!client) {
    throw new Error('Twilio is not configured (TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN missing)');
  }

  await client.messages.create({
    body: message,
    from: env.twilio.fromNumber,
    to: phoneNumber,
  });
}
