import { env } from '../../../config/env';

jest.mock('../../../config/resend', () => ({ getResendClient: jest.fn() }));
import { getResendClient } from '../../../config/resend';
import { sendEmail, sendAdminAlertEmail } from '../mailer';

describe('mailer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    env.resend.apiKey = 'test-key';
    env.adminEmail = '';
  });

  describe('sendEmail', () => {
    it('should throw if Resend is not configured', async () => {
      (getResendClient as jest.Mock).mockReturnValue(null);

      await expect(sendEmail('user@test.com', 'Subject', 'Body')).rejects.toThrow(
        'Resend is not configured',
      );
    });

    it('should send successfully when the API returns no error', async () => {
      const send = jest.fn().mockResolvedValue({ data: { id: 'email-1' }, error: null });
      (getResendClient as jest.Mock).mockReturnValue({ emails: { send } });

      await sendEmail('user@test.com', 'Subject', 'Body');

      expect(send).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'user@test.com', subject: 'Subject', text: 'Body' }),
      );
    });

    // Resend's SDK never throws for API-level failures (unverified
    // domain, rate limit, bad recipient, etc.) — it always resolves with
    // { data, error }, even for network errors. sendEmail must check
    // `error` explicitly and throw itself, or a failed send would
    // silently look like success to every caller relying on try/catch.
    it('should throw when the API returns an error, even though the promise resolved', async () => {
      const send = jest.fn().mockResolvedValue({
        data: null,
        error: { statusCode: 403, message: 'The example.com domain is not verified.', name: 'validation_error' },
      });
      (getResendClient as jest.Mock).mockReturnValue({ emails: { send } });

      await expect(sendEmail('user@test.com', 'Subject', 'Body')).rejects.toThrow(
        'domain is not verified',
      );
    });
  });

  describe('sendAdminAlertEmail', () => {
    it('should log and return without sending when ADMIN_EMAIL is unset', async () => {
      env.adminEmail = '';
      const send = jest.fn();
      (getResendClient as jest.Mock).mockReturnValue({ emails: { send } });

      await sendAdminAlertEmail('Subject', 'Body');

      expect(send).not.toHaveBeenCalled();
    });

    it('should log and return without sending when Resend is unconfigured', async () => {
      env.adminEmail = 'admin@rootaroo.com';
      env.resend.apiKey = '';
      const send = jest.fn();
      (getResendClient as jest.Mock).mockReturnValue({ emails: { send } });

      await sendAdminAlertEmail('Subject', 'Body');

      expect(send).not.toHaveBeenCalled();
    });

    it('should send to the admin inbox when both are configured', async () => {
      env.adminEmail = 'admin@rootaroo.com';
      env.resend.apiKey = 'test-key';
      const send = jest.fn().mockResolvedValue({ data: { id: 'email-1' }, error: null });
      (getResendClient as jest.Mock).mockReturnValue({ emails: { send } });

      await sendAdminAlertEmail('Subject', 'Body');

      expect(send).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'admin@rootaroo.com', subject: 'Subject', text: 'Body' }),
      );
    });
  });
});
