/**
 * Africa's Talking SMS Service
 * Sends SMS messages for verification codes and notifications
 */

export interface SMSResponse {
  success: boolean;
  message: string;
  recipients?: Array<{
    statusCode: number;
    number: string;
    status: string;
    cost: string;
    messageId: string;
  }>;
}

export class AfricasTalkingSMS {
  private apiKey: string;
  private username: string;
  private baseUrl: string = 'https://api.africastalking.com/version1';

  constructor(apiKey: string, username: string) {
    this.apiKey = apiKey;
    this.username = username;
  }

  /**
   * Send SMS message
   */
  async sendSMS(to: string, message: string): Promise<SMSResponse> {
    try {
      // Format phone number for Africa's Talking (must start with +)
      const formattedNumber = to.startsWith('+') ? to : `+${to}`;

      const response = await fetch(`${this.baseUrl}/messaging`, {
        method: 'POST',
        headers: {
          'apiKey': this.apiKey,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: new URLSearchParams({
          username: this.username,
          to: formattedNumber,
          message: message,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Africa\'s Talking API error:', data);
        return {
          success: false,
          message: data.message || 'Failed to send SMS',
        };
      }

      // Check if message was sent successfully
      const recipients = data.SMSMessageData?.Recipients || [];
      const allSuccess = recipients.every((r: any) => 
        r.statusCode === 101 || r.statusCode === 102
      );

      return {
        success: allSuccess,
        message: allSuccess ? 'SMS sent successfully' : 'Some messages failed',
        recipients: recipients,
      };
    } catch (error) {
      console.error('SMS sending error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to send SMS',
      };
    }
  }

  /**
   * Send verification code SMS
   */
  async sendVerificationCode(phoneNumber: string, code: string): Promise<SMSResponse> {
    const message = `Your Dereva Smart verification code is: ${code}. Valid for 10 minutes. Do not share this code with anyone.`;
    return this.sendSMS(phoneNumber, message);
  }

  /**
   * Send password reset code SMS
   */
  async sendPasswordResetCode(phoneNumber: string, code: string): Promise<SMSResponse> {
    const message = `Your Dereva Smart password reset code is: ${code}. Valid for 10 minutes. If you didn't request this, please ignore.`;
    return this.sendSMS(phoneNumber, message);
  }

  /**
   * Send welcome SMS
   */
  async sendWelcomeSMS(phoneNumber: string, name: string): Promise<SMSResponse> {
    const message = `Welcome to Dereva Smart, ${name}! Start your journey to becoming a confident driver. Download the app and begin learning today.`;
    return this.sendSMS(phoneNumber, message);
  }

  /**
   * Send subscription confirmation SMS
   */
  async sendSubscriptionConfirmation(
    phoneNumber: string,
    subscriptionType: string,
    expiryDate: string
  ): Promise<SMSResponse> {
    const message = `Your Dereva Smart ${subscriptionType} subscription is now active! Valid until ${expiryDate}. Happy learning!`;
    return this.sendSMS(phoneNumber, message);
  }

  /**
   * Send payment confirmation SMS
   */
  async sendPaymentConfirmation(
    phoneNumber: string,
    amount: number,
    receiptNumber: string
  ): Promise<SMSResponse> {
    const message = `Payment of KES ${amount} received. Receipt: ${receiptNumber}. Thank you for choosing Dereva Smart!`;
    return this.sendSMS(phoneNumber, message);
  }

  /**
   * Send school link code SMS
   */
  async sendSchoolLinkCode(
    phoneNumber: string,
    schoolName: string,
    linkCode: string
  ): Promise<SMSResponse> {
    const message = `Your link code for ${schoolName} is: ${linkCode}. Share this code with your driving school to sync your progress.`;
    return this.sendSMS(phoneNumber, message);
  }

  /**
   * Check SMS delivery status
   */
  async checkDeliveryStatus(messageId: string): Promise<any> {
    try {
      const response = await fetch(
        `${this.baseUrl}/messaging?username=${this.username}&messageId=${messageId}`,
        {
          method: 'GET',
          headers: {
            'apiKey': this.apiKey,
            'Accept': 'application/json',
          },
        }
      );

      return await response.json();
    } catch (error) {
      console.error('Error checking delivery status:', error);
      return null;
    }
  }

  /**
   * Get account balance
   */
  async getBalance(): Promise<any> {
    try {
      const response = await fetch(
        `${this.baseUrl}/user?username=${this.username}`,
        {
          method: 'GET',
          headers: {
            'apiKey': this.apiKey,
            'Accept': 'application/json',
          },
        }
      );

      return await response.json();
    } catch (error) {
      console.error('Error getting balance:', error);
      return null;
    }
  }
}

/**
 * Create SMS service instance
 */
export function createSMSService(apiKey: string, username: string): AfricasTalkingSMS {
  return new AfricasTalkingSMS(apiKey, username);
}
