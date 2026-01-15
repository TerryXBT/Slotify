export interface EmailService {
  sendBookingConfirmation(
    to: string,
    clientName: string,
    serviceName: string,
    date: string,
    providerName: string,
    cancelLink?: string,
    location?: string,
    price?: string,
  ): Promise<void>;
  sendRescheduleProposal(
    to: string,
    clientName: string,
    link: string,
  ): Promise<void>;
  sendRescheduleConfirmation(
    to: string,
    clientName: string,
    serviceName: string,
    date: string,
    providerName: string,
  ): Promise<void>;
  sendCancellationNotice(
    to: string,
    clientName: string,
    serviceName: string,
    date: string,
  ): Promise<void>;
  sendBookingReminder(
    to: string,
    clientName: string,
    serviceName: string,
    date: string,
    providerName: string,
    location?: string,
  ): Promise<void>;
}

export class ConsoleEmailService implements EmailService {
  async sendBookingConfirmation(
    to: string,
    clientName: string,
    serviceName: string,
    date: string,
    providerName: string,
    cancelLink?: string,
    location?: string,
    price?: string,
  ) {
    console.log(`
      [EMAIL SEND] To: ${to}
      Subject: Booking Confirmed: ${serviceName} with ${providerName}
      Body:
        Hi ${clientName},
        Your booking for ${serviceName} on ${date} is confirmed!
        ${location ? `Location: ${location}` : ""}
        ${price ? `Price: ${price}` : ""}
        We look forward to seeing you.
        ${cancelLink ? `Cancel: ${cancelLink}` : ""}
    `);
  }

  async sendRescheduleProposal(to: string, clientName: string, link: string) {
    console.log(`
      [EMAIL SEND] To: ${to}
      Subject: Reschedule Request
      Body:
        Hi ${clientName},
        Please click the link below to choose a new time for your appointment:
        ${link}
    `);
  }

  async sendRescheduleConfirmation(
    to: string,
    clientName: string,
    serviceName: string,
    date: string,
    providerName: string,
  ) {
    console.log(`
      [EMAIL SEND] To: ${to}
      Subject: Reschedule Confirmed: ${serviceName} with ${providerName}
      Body:
        Hi ${clientName},
        Your rescheduled appointment for ${serviceName} on ${date} is confirmed!
        We look forward to seeing you.
    `);
  }

  async sendCancellationNotice(
    to: string,
    clientName: string,
    serviceName: string,
    date: string,
  ) {
    console.log(`
      [EMAIL SEND] To: ${to}
      Subject: Appointment Cancelled
      Body:
        Hi ${clientName},
        Your appointment for ${serviceName} on ${date} has been cancelled.
    `);
  }

  async sendBookingReminder(
    to: string,
    clientName: string,
    serviceName: string,
    date: string,
    providerName: string,
    location?: string,
  ) {
    console.log(`
      [EMAIL SEND] To: ${to}
      Subject: Reminder: ${serviceName} Tomorrow
      Body:
        Hi ${clientName},
        This is a friendly reminder about your upcoming appointment:
        Service: ${serviceName}
        Date & Time: ${date}
        Provider: ${providerName}
        ${location ? `Location: ${location}` : ""}
        See you soon!
    `);
  }
}

// HTML Email Templates - Slotify Style (no gradients, dark theme)
function createBookingConfirmationHTML(
  clientName: string,
  serviceName: string,
  date: string,
  providerName: string,
  cancelLink?: string,
  location?: string,
  price?: string,
): string {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #1a1a1a;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <tr>
            <td>
                <!-- Header -->
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #2a2a2a; border-radius: 16px 16px 0 0; padding: 32px; text-align: center;">
                    <tr>
                        <td>
                            <div style="width: 56px; height: 56px; background-color: #22c55e; border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
                                <span style="color: white; font-size: 28px;">✓</span>
                            </div>
                            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">Booking Confirmed</h1>
                        </td>
                    </tr>
                </table>
                
                <!-- Body -->
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #242424; border-radius: 0 0 16px 16px; padding: 32px;">
                    <tr>
                        <td>
                            <p style="color: #e5e5e5; font-size: 16px; margin: 0 0 20px;">Hi ${clientName},</p>
                            <p style="color: #a3a3a3; font-size: 16px; margin: 0 0 24px;">Great news! Your booking has been confirmed.</p>
                            
                            <!-- Booking Details Card -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #333333; border-radius: 12px; padding: 20px; border-left: 4px solid #3b82f6;">
                                <tr>
                                    <td>
                                        <p style="color: #ffffff; font-size: 18px; font-weight: 600; margin: 0 0 16px;">${serviceName}</p>
                                        
                                        <table cellpadding="0" cellspacing="0" style="margin-bottom: 8px;">
                                            <tr>
                                                <td style="color: #a3a3a3; font-size: 14px; padding-right: 8px;">📅</td>
                                                <td style="color: #e5e5e5; font-size: 14px;">${date}</td>
                                            </tr>
                                        </table>
                                        
                                        ${
                                          location
                                            ? `
                                        <table cellpadding="0" cellspacing="0" style="margin-bottom: 8px;">
                                            <tr>
                                                <td style="color: #a3a3a3; font-size: 14px; padding-right: 8px;">📍</td>
                                                <td style="color: #e5e5e5; font-size: 14px;">${location}</td>
                                            </tr>
                                        </table>
                                        `
                                            : ""
                                        }
                                        
                                        ${
                                          price
                                            ? `
                                        <table cellpadding="0" cellspacing="0" style="margin-bottom: 8px;">
                                            <tr>
                                                <td style="color: #a3a3a3; font-size: 14px; padding-right: 8px;">💰</td>
                                                <td style="color: #e5e5e5; font-size: 14px;">${price}</td>
                                            </tr>
                                        </table>
                                        `
                                            : ""
                                        }
                                        
                                        <table cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td style="color: #a3a3a3; font-size: 14px; padding-right: 8px;">👤</td>
                                                <td style="color: #e5e5e5; font-size: 14px;">${providerName}</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="color: #a3a3a3; font-size: 16px; margin: 24px 0 0;">We look forward to seeing you!</p>
                            
                            ${
                              cancelLink
                                ? `
                            <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #404040;">
                                <p style="font-size: 14px; color: #737373; margin: 0;">
                                    Need to cancel? <a href="${cancelLink}" style="color: #3b82f6; text-decoration: none;">Click here</a>
                                </p>
                            </div>
                            `
                                : ""
                            }
                        </td>
                    </tr>
                </table>
                
                <!-- Footer -->
                <table width="100%" cellpadding="0" cellspacing="0" style="padding: 24px; text-align: center;">
                    <tr>
                        <td>
                            <p style="color: #525252; font-size: 12px; margin: 0;">Powered by Slotify</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `.trim();
}

function createRescheduleProposalHTML(
  clientName: string,
  link: string,
): string {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #1a1a1a;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <tr>
            <td>
                <!-- Header -->
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #2a2a2a; border-radius: 16px 16px 0 0; padding: 32px; text-align: center;">
                    <tr>
                        <td>
                            <div style="width: 56px; height: 56px; background-color: #f59e0b; border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
                                <span style="color: white; font-size: 28px;">🔄</span>
                            </div>
                            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">Reschedule Request</h1>
                        </td>
                    </tr>
                </table>
                
                <!-- Body -->
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #242424; border-radius: 0 0 16px 16px; padding: 32px;">
                    <tr>
                        <td>
                            <p style="color: #e5e5e5; font-size: 16px; margin: 0 0 20px;">Hi ${clientName},</p>
                            <p style="color: #a3a3a3; font-size: 16px; margin: 0 0 24px;">Your provider has requested to reschedule your appointment. Please choose a new time that works for you.</p>
                            
                            <div style="text-align: center; margin: 32px 0;">
                                <a href="${link}" style="background-color: #3b82f6; color: white; padding: 14px 32px; text-decoration: none; border-radius: 10px; display: inline-block; font-weight: 600; font-size: 16px;">Choose New Time</a>
                            </div>
                            
                            <p style="font-size: 14px; color: #737373; text-align: center;">Or copy this link: <a href="${link}" style="color: #3b82f6;">${link}</a></p>
                        </td>
                    </tr>
                </table>
                
                <!-- Footer -->
                <table width="100%" cellpadding="0" cellspacing="0" style="padding: 24px; text-align: center;">
                    <tr>
                        <td>
                            <p style="color: #525252; font-size: 12px; margin: 0;">Powered by Slotify</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `.trim();
}

function createRescheduleConfirmationHTML(
  clientName: string,
  serviceName: string,
  date: string,
  providerName: string,
): string {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #1a1a1a;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <tr>
            <td>
                <!-- Header -->
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #2a2a2a; border-radius: 16px 16px 0 0; padding: 32px; text-align: center;">
                    <tr>
                        <td>
                            <div style="width: 56px; height: 56px; background-color: #22c55e; border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
                                <span style="color: white; font-size: 28px;">✓</span>
                            </div>
                            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">Reschedule Confirmed</h1>
                        </td>
                    </tr>
                </table>
                
                <!-- Body -->
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #242424; border-radius: 0 0 16px 16px; padding: 32px;">
                    <tr>
                        <td>
                            <p style="color: #e5e5e5; font-size: 16px; margin: 0 0 20px;">Hi ${clientName},</p>
                            <p style="color: #a3a3a3; font-size: 16px; margin: 0 0 24px;">Your appointment has been successfully rescheduled.</p>
                            
                            <!-- Booking Details Card -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #333333; border-radius: 12px; padding: 20px; border-left: 4px solid #22c55e;">
                                <tr>
                                    <td>
                                        <p style="color: #ffffff; font-size: 18px; font-weight: 600; margin: 0 0 16px;">${serviceName}</p>
                                        
                                        <table cellpadding="0" cellspacing="0" style="margin-bottom: 8px;">
                                            <tr>
                                                <td style="color: #a3a3a3; font-size: 14px; padding-right: 8px;">📅</td>
                                                <td style="color: #e5e5e5; font-size: 14px;"><strong>New Time:</strong> ${date}</td>
                                            </tr>
                                        </table>
                                        
                                        <table cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td style="color: #a3a3a3; font-size: 14px; padding-right: 8px;">👤</td>
                                                <td style="color: #e5e5e5; font-size: 14px;">${providerName}</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="color: #a3a3a3; font-size: 16px; margin: 24px 0 0;">We look forward to seeing you at the new time!</p>
                        </td>
                    </tr>
                </table>
                
                <!-- Footer -->
                <table width="100%" cellpadding="0" cellspacing="0" style="padding: 24px; text-align: center;">
                    <tr>
                        <td>
                            <p style="color: #525252; font-size: 12px; margin: 0;">Powered by Slotify</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `.trim();
}

function createCancellationNoticeHTML(
  clientName: string,
  serviceName: string,
  date: string,
): string {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #1a1a1a;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <tr>
            <td>
                <!-- Header -->
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #2a2a2a; border-radius: 16px 16px 0 0; padding: 32px; text-align: center;">
                    <tr>
                        <td>
                            <div style="width: 56px; height: 56px; background-color: #ef4444; border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
                                <span style="color: white; font-size: 28px;">✕</span>
                            </div>
                            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">Appointment Cancelled</h1>
                        </td>
                    </tr>
                </table>
                
                <!-- Body -->
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #242424; border-radius: 0 0 16px 16px; padding: 32px;">
                    <tr>
                        <td>
                            <p style="color: #e5e5e5; font-size: 16px; margin: 0 0 20px;">Hi ${clientName},</p>
                            <p style="color: #a3a3a3; font-size: 16px; margin: 0 0 24px;">Your appointment has been cancelled.</p>
                            
                            <!-- Booking Details Card -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #333333; border-radius: 12px; padding: 20px; border-left: 4px solid #ef4444;">
                                <tr>
                                    <td>
                                        <p style="color: #ffffff; font-size: 18px; font-weight: 600; margin: 0 0 16px;">${serviceName}</p>
                                        
                                        <table cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td style="color: #a3a3a3; font-size: 14px; padding-right: 8px;">📅</td>
                                                <td style="color: #737373; font-size: 14px; text-decoration: line-through;">${date}</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="color: #a3a3a3; font-size: 16px; margin: 24px 0 0;">If you'd like to book again in the future, we'd be happy to see you.</p>
                        </td>
                    </tr>
                </table>
                
                <!-- Footer -->
                <table width="100%" cellpadding="0" cellspacing="0" style="padding: 24px; text-align: center;">
                    <tr>
                        <td>
                            <p style="color: #525252; font-size: 12px; margin: 0;">Powered by Slotify</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `.trim();
}

function createBookingReminderHTML(
  clientName: string,
  serviceName: string,
  date: string,
  providerName: string,
  location?: string,
): string {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #1a1a1a;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <tr>
            <td>
                <!-- Header -->
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #2a2a2a; border-radius: 16px 16px 0 0; padding: 32px; text-align: center;">
                    <tr>
                        <td>
                            <div style="width: 56px; height: 56px; background-color: #3b82f6; border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
                                <span style="color: white; font-size: 28px;">⏰</span>
                            </div>
                            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">Appointment Reminder</h1>
                        </td>
                    </tr>
                </table>
                
                <!-- Body -->
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #242424; border-radius: 0 0 16px 16px; padding: 32px;">
                    <tr>
                        <td>
                            <p style="color: #e5e5e5; font-size: 16px; margin: 0 0 20px;">Hi ${clientName},</p>
                            <p style="color: #a3a3a3; font-size: 16px; margin: 0 0 24px;">This is a friendly reminder about your upcoming appointment tomorrow!</p>
                            
                            <!-- Booking Details Card -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #333333; border-radius: 12px; padding: 20px; border-left: 4px solid #3b82f6;">
                                <tr>
                                    <td>
                                        <p style="color: #ffffff; font-size: 18px; font-weight: 600; margin: 0 0 16px;">${serviceName}</p>
                                        
                                        <table cellpadding="0" cellspacing="0" style="margin-bottom: 8px;">
                                            <tr>
                                                <td style="color: #a3a3a3; font-size: 14px; padding-right: 8px;">📅</td>
                                                <td style="color: #e5e5e5; font-size: 14px;">${date}</td>
                                            </tr>
                                        </table>
                                        
                                        <table cellpadding="0" cellspacing="0" style="margin-bottom: 8px;">
                                            <tr>
                                                <td style="color: #a3a3a3; font-size: 14px; padding-right: 8px;">👤</td>
                                                <td style="color: #e5e5e5; font-size: 14px;">${providerName}</td>
                                            </tr>
                                        </table>
                                        
                                        ${
                                          location
                                            ? `
                                        <table cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td style="color: #a3a3a3; font-size: 14px; padding-right: 8px;">📍</td>
                                                <td style="color: #e5e5e5; font-size: 14px;">${location}</td>
                                            </tr>
                                        </table>
                                        `
                                            : ""
                                        }
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="color: #a3a3a3; font-size: 16px; margin: 24px 0 0;">We're looking forward to seeing you!</p>
                            <p style="font-size: 14px; color: #737373; margin: 16px 0 0;">If you need to reschedule or cancel, please contact us as soon as possible.</p>
                        </td>
                    </tr>
                </table>
                
                <!-- Footer -->
                <table width="100%" cellpadding="0" cellspacing="0" style="padding: 24px; text-align: center;">
                    <tr>
                        <td>
                            <p style="color: #525252; font-size: 12px; margin: 0;">Powered by Slotify</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `.trim();
}

export class SMTPEmailService implements EmailService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private transporter: any;
  private fromEmail: string;

  constructor() {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const nodemailer = require("nodemailer");
    this.fromEmail = process.env.SMTP_FROM_EMAIL || "noreply@slotify.com";

    const port = parseInt(process.env.SMTP_PORT || "587");
    const isGmail = process.env.SMTP_HOST?.includes("gmail.com");

    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "127.0.0.1",
      port: port,
      secure: port === 465,
      auth: process.env.SMTP_USER
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          }
        : undefined,
      ...(isGmail && {
        service: "gmail",
      }),
    });

    console.log("[SMTP] Transporter created:", {
      host: process.env.SMTP_HOST || "127.0.0.1",
      port: port,
      secure: port === 465,
      from: this.fromEmail,
      service: isGmail ? "Gmail" : "Custom SMTP",
    });
  }

  async sendBookingConfirmation(
    to: string,
    clientName: string,
    serviceName: string,
    date: string,
    providerName: string,
    cancelLink?: string,
    location?: string,
    price?: string,
  ): Promise<void> {
    try {
      const info = await this.transporter.sendMail({
        from: this.fromEmail,
        to,
        subject: `Booking Confirmed: ${serviceName} with ${providerName}`,
        html: createBookingConfirmationHTML(
          clientName,
          serviceName,
          date,
          providerName,
          cancelLink,
          location,
          price,
        ),
      });
      console.log("[SMTP] Email sent successfully:", info.messageId);
    } catch (error) {
      console.error("[SMTP] Failed to send booking confirmation email:", error);
      throw error;
    }
  }

  async sendRescheduleProposal(
    to: string,
    clientName: string,
    link: string,
  ): Promise<void> {
    try {
      const info = await this.transporter.sendMail({
        from: this.fromEmail,
        to,
        subject: "Reschedule Request for Your Appointment",
        html: createRescheduleProposalHTML(clientName, link),
      });
      console.log("[SMTP] Reschedule proposal sent:", info.messageId);
    } catch (error) {
      console.error("[SMTP] Failed to send reschedule proposal email:", error);
      throw error;
    }
  }

  async sendRescheduleConfirmation(
    to: string,
    clientName: string,
    serviceName: string,
    date: string,
    providerName: string,
  ): Promise<void> {
    try {
      const info = await this.transporter.sendMail({
        from: this.fromEmail,
        to,
        subject: `Reschedule Confirmed: ${serviceName} with ${providerName}`,
        html: createRescheduleConfirmationHTML(
          clientName,
          serviceName,
          date,
          providerName,
        ),
      });
      console.log("[SMTP] Reschedule confirmation sent:", info.messageId);
    } catch (error) {
      console.error(
        "[SMTP] Failed to send reschedule confirmation email:",
        error,
      );
      throw error;
    }
  }

  async sendCancellationNotice(
    to: string,
    clientName: string,
    serviceName: string,
    date: string,
  ): Promise<void> {
    try {
      const info = await this.transporter.sendMail({
        from: this.fromEmail,
        to,
        subject: "Appointment Cancelled",
        html: createCancellationNoticeHTML(clientName, serviceName, date),
      });
      console.log("[SMTP] Cancellation notice sent:", info.messageId);
    } catch (error) {
      console.error("[SMTP] Failed to send cancellation notice email:", error);
      throw error;
    }
  }

  async sendBookingReminder(
    to: string,
    clientName: string,
    serviceName: string,
    date: string,
    providerName: string,
    location?: string,
  ): Promise<void> {
    try {
      const info = await this.transporter.sendMail({
        from: this.fromEmail,
        to,
        subject: `Reminder: ${serviceName} Tomorrow!`,
        html: createBookingReminderHTML(
          clientName,
          serviceName,
          date,
          providerName,
          location,
        ),
      });
      console.log("[SMTP] Booking reminder sent:", info.messageId);
    } catch (error) {
      console.error("[SMTP] Failed to send booking reminder email:", error);
      throw error;
    }
  }
}

export class ResendEmailService implements EmailService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private resend: any;
  private fromEmail: string;

  constructor() {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Resend } = require("resend");
    this.resend = new Resend(process.env.RESEND_API_KEY);
    this.fromEmail = process.env.RESEND_FROM_EMAIL || "noreply@slotify.com";
  }

  async sendBookingConfirmation(
    to: string,
    clientName: string,
    serviceName: string,
    date: string,
    providerName: string,
    cancelLink?: string,
    location?: string,
    price?: string,
  ): Promise<void> {
    try {
      const result = await this.resend.emails.send({
        from: this.fromEmail,
        to,
        subject: `Booking Confirmed: ${serviceName} with ${providerName}`,
        html: createBookingConfirmationHTML(
          clientName,
          serviceName,
          date,
          providerName,
          cancelLink,
          location,
          price,
        ),
      });
      console.log(
        "[RESEND] Email send result:",
        JSON.stringify(result, null, 2),
      );

      if (result.error) {
        throw new Error(`Resend API error: ${result.error.message}`);
      }
    } catch (error) {
      console.error(
        "[RESEND] Failed to send booking confirmation email:",
        error,
      );
      throw error;
    }
  }

  async sendRescheduleProposal(
    to: string,
    clientName: string,
    link: string,
  ): Promise<void> {
    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to,
        subject: "Reschedule Request for Your Appointment",
        html: createRescheduleProposalHTML(clientName, link),
      });
    } catch (error) {
      console.error("Failed to send reschedule proposal email:", error);
      throw error;
    }
  }

  async sendRescheduleConfirmation(
    to: string,
    clientName: string,
    serviceName: string,
    date: string,
    providerName: string,
  ): Promise<void> {
    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to,
        subject: `Reschedule Confirmed: ${serviceName} with ${providerName}`,
        html: createRescheduleConfirmationHTML(
          clientName,
          serviceName,
          date,
          providerName,
        ),
      });
    } catch (error) {
      console.error("Failed to send reschedule confirmation email:", error);
      throw error;
    }
  }

  async sendCancellationNotice(
    to: string,
    clientName: string,
    serviceName: string,
    date: string,
  ): Promise<void> {
    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to,
        subject: "Appointment Cancelled",
        html: createCancellationNoticeHTML(clientName, serviceName, date),
      });
    } catch (error) {
      console.error("Failed to send cancellation notice email:", error);
      throw error;
    }
  }

  async sendBookingReminder(
    to: string,
    clientName: string,
    serviceName: string,
    date: string,
    providerName: string,
    location?: string,
  ): Promise<void> {
    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to,
        subject: `Reminder: ${serviceName} Tomorrow!`,
        html: createBookingReminderHTML(
          clientName,
          serviceName,
          date,
          providerName,
          location,
        ),
      });
    } catch (error) {
      console.error("Failed to send booking reminder email:", error);
      throw error;
    }
  }
}

// Choose email service based on environment variable
const useSmtp = !!process.env.SMTP_HOST || process.env.USE_SMTP === "true";
const useResend = !useSmtp && !!process.env.RESEND_API_KEY;

console.log("[EMAIL SERVICE] Initializing...", {
  useSMTP: useSmtp,
  hasResendKey: !!process.env.RESEND_API_KEY,
  smtpHost: process.env.SMTP_HOST,
  fromEmail: process.env.SMTP_FROM_EMAIL || process.env.RESEND_FROM_EMAIL,
  service: useSmtp
    ? "SMTPEmailService (Mailpit)"
    : useResend
      ? "ResendEmailService"
      : "ConsoleEmailService",
});

export const emailService = useSmtp
  ? new SMTPEmailService()
  : useResend
    ? new ResendEmailService()
    : new ConsoleEmailService();
