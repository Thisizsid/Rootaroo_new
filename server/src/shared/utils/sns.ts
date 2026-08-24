import { PublishCommand } from '@aws-sdk/client-sns';
import { snsClient } from '../../config/sns';

export async function sendSms(phoneNumber: string, message: string): Promise<void> {
  await snsClient.send(new PublishCommand({
    PhoneNumber: phoneNumber,
    Message: message,
    MessageAttributes: {
      'AWS.SNS.SMS.SMSType': { DataType: 'String', StringValue: 'Transactional' },
    },
  }));
}
