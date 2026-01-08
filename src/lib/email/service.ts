export interface EmailService {
    sendBookingConfirmation(to: string, clientName: string, serviceName: string, date: string, providerName: string, cancelLink?: string): Promise<void>
    sendRescheduleProposal(to: string, clientName: string, link: string): Promise<void>
    sendRescheduleConfirmation(to: string, clientName: string, serviceName: string, date: string, providerName: string): Promise<void>
    sendCancellationNotice(to: string, clientName: string, serviceName: string, date: string): Promise<void>
    sendBookingReminder(to: string, clientName: string, serviceName: string, date: string, providerName: string, location?: string): Promise<void>
}

export class ConsoleEmailService implements EmailService {
    async sendBookingConfirmation(to: string, clientName: string, serviceName: string, date: string, providerName: string, cancelLink?: string) {
        console.log(`
      [EMAIL SEND] To: ${to}
      Subject: Booking Confirmed: ${serviceName} with ${providerName}
      Body:
        Hi ${clientName},
        Your booking for ${serviceName} on ${date} is confirmed!
        We look forward to seeing you.
        ${cancelLink ? `Cancel: ${cancelLink}` : ''}
    `)
    }

    async sendRescheduleProposal(to: string, clientName: string, link: string) {
        console.log(`
      [EMAIL SEND] To: ${to}
      Subject: Reschedule Request
      Body:
        Hi ${clientName},
        Please click the link below to choose a new time for your appointment:
        ${link}
    `)
    }

    async sendRescheduleConfirmation(to: string, clientName: string, serviceName: string, date: string, providerName: string) {
        console.log(`
      [EMAIL SEND] To: ${to}
      Subject: Reschedule Confirmed: ${serviceName} with ${providerName}
      Body:
        Hi ${clientName},
        Your rescheduled appointment for ${serviceName} on ${date} is confirmed!
        We look forward to seeing you.
    `)
    }

    async sendCancellationNotice(to: string, clientName: string, serviceName: string, date: string) {
        console.log(`
      [EMAIL SEND] To: ${to}
      Subject: Appointment Cancelled
      Body:
        Hi ${clientName},
        Your appointment for ${serviceName} on ${date} has been cancelled.
    `)
    }

    async sendBookingReminder(to: string, clientName: string, serviceName: string, date: string, providerName: string, location?: string) {
        console.log(`
      [EMAIL SEND] To: ${to}
      Subject: Reminder: ${serviceName} Tomorrow
      Body:
        Hi ${clientName},
        This is a friendly reminder about your upcoming appointment:
        Service: ${serviceName}
        Date & Time: ${date}
        Provider: ${providerName}
        ${location ? `Location: ${location}` : ''}
        See you soon!
    `)
    }
}

// HTML Email Templates
function createBookingConfirmationHTML(clientName: string, serviceName: string, date: string, providerName: string, cancelLink?: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0;">Booking Confirmed!</h1>
    </div>
    <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px;">Hi ${clientName},</p>
        <p style="font-size: 16px;">Great news! Your booking has been confirmed.</p>
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
            <p style="margin: 5px 0;"><strong>Service:</strong> ${serviceName}</p>
            <p style="margin: 5px 0;"><strong>Date & Time:</strong> ${date}</p>
            <p style="margin: 5px 0;"><strong>Provider:</strong> ${providerName}</p>
        </div>
        <p style="font-size: 16px;">We look forward to seeing you!</p>
        ${cancelLink ? `
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            <p style="font-size: 14px; color: #666;">Need to cancel? <a href="${cancelLink}" style="color: #667eea;">Click here</a></p>
        </div>
        ` : ''}
    </div>
</body>
</html>
    `.trim()
}

function createRescheduleProposalHTML(clientName: string, link: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0;">Reschedule Request</h1>
    </div>
    <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px;">Hi ${clientName},</p>
        <p style="font-size: 16px;">Your provider has requested to reschedule your appointment.</p>
        <p style="font-size: 16px;">Please click the button below to choose a new time:</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="${link}" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Choose New Time</a>
        </div>
        <p style="font-size: 14px; color: #666;">Or copy this link: <a href="${link}" style="color: #f5576c;">${link}</a></p>
    </div>
</body>
</html>
    `.trim()
}

function createRescheduleConfirmationHTML(clientName: string, serviceName: string, date: string, providerName: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0;">Reschedule Confirmed!</h1>
    </div>
    <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px;">Hi ${clientName},</p>
        <p style="font-size: 16px;">Your appointment has been successfully rescheduled.</p>
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #84fab0;">
            <p style="margin: 5px 0;"><strong>Service:</strong> ${serviceName}</p>
            <p style="margin: 5px 0;"><strong>New Date & Time:</strong> ${date}</p>
            <p style="margin: 5px 0;"><strong>Provider:</strong> ${providerName}</p>
        </div>
        <p style="font-size: 16px;">We look forward to seeing you at the new time!</p>
    </div>
</body>
</html>
    `.trim()
}

function createCancellationNoticeHTML(clientName: string, serviceName: string, date: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0;">Appointment Cancelled</h1>
    </div>
    <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px;">Hi ${clientName},</p>
        <p style="font-size: 16px;">Your appointment has been cancelled.</p>
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff6b6b;">
            <p style="margin: 5px 0;"><strong>Service:</strong> ${serviceName}</p>
            <p style="margin: 5px 0;"><strong>Date & Time:</strong> ${date}</p>
        </div>
        <p style="font-size: 16px;">If you'd like to book again in the future, we'd be happy to see you.</p>
    </div>
</body>
</html>
    `.trim()
}

function createBookingReminderHTML(clientName: string, serviceName: string, date: string, providerName: string, location?: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #ffa500 0%, #ff8c00 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0;">⏰ Reminder: Tomorrow's Appointment</h1>
    </div>
    <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px;">Hi ${clientName},</p>
        <p style="font-size: 16px;">This is a friendly reminder about your upcoming appointment tomorrow!</p>
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffa500;">
            <p style="margin: 5px 0;"><strong>Service:</strong> ${serviceName}</p>
            <p style="margin: 5px 0;"><strong>Date & Time:</strong> ${date}</p>
            <p style="margin: 5px 0;"><strong>Provider:</strong> ${providerName}</p>
            ${location ? `<p style="margin: 5px 0;"><strong>Location:</strong> ${location}</p>` : ''}
        </div>
        <p style="font-size: 16px;">We're looking forward to seeing you!</p>
        <p style="font-size: 14px; color: #666;">If you need to reschedule or cancel, please contact us as soon as possible.</p>
    </div>
</body>
</html>
    `.trim()
}

export class SMTPEmailService implements EmailService {
    private transporter: any
    private fromEmail: string

    constructor() {
        const nodemailer = require('nodemailer')
        this.fromEmail = process.env.SMTP_FROM_EMAIL || 'noreply@slotify.com'

        const port = parseInt(process.env.SMTP_PORT || '587')
        const isGmail = process.env.SMTP_HOST?.includes('gmail.com')

        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || '127.0.0.1',
            port: port,
            secure: port === 465, // true for 465, false for other ports
            auth: process.env.SMTP_USER ? {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            } : undefined,
            // Gmail specific settings
            ...(isGmail && {
                service: 'gmail'
            })
        })

        console.log('[SMTP] Transporter created:', {
            host: process.env.SMTP_HOST || '127.0.0.1',
            port: port,
            secure: port === 465,
            from: this.fromEmail,
            service: isGmail ? 'Gmail' : 'Custom SMTP'
        })
    }

    async sendBookingConfirmation(to: string, clientName: string, serviceName: string, date: string, providerName: string, cancelLink?: string): Promise<void> {
        try {
            const info = await this.transporter.sendMail({
                from: this.fromEmail,
                to,
                subject: `Booking Confirmed: ${serviceName} with ${providerName}`,
                html: createBookingConfirmationHTML(clientName, serviceName, date, providerName, cancelLink)
            })
            console.log('[SMTP] Email sent successfully:', info.messageId)
        } catch (error) {
            console.error('[SMTP] Failed to send booking confirmation email:', error)
            throw error
        }
    }

    async sendRescheduleProposal(to: string, clientName: string, link: string): Promise<void> {
        try {
            const info = await this.transporter.sendMail({
                from: this.fromEmail,
                to,
                subject: 'Reschedule Request for Your Appointment',
                html: createRescheduleProposalHTML(clientName, link)
            })
            console.log('[SMTP] Reschedule proposal sent:', info.messageId)
        } catch (error) {
            console.error('[SMTP] Failed to send reschedule proposal email:', error)
            throw error
        }
    }

    async sendRescheduleConfirmation(to: string, clientName: string, serviceName: string, date: string, providerName: string): Promise<void> {
        try {
            const info = await this.transporter.sendMail({
                from: this.fromEmail,
                to,
                subject: `Reschedule Confirmed: ${serviceName} with ${providerName}`,
                html: createRescheduleConfirmationHTML(clientName, serviceName, date, providerName)
            })
            console.log('[SMTP] Reschedule confirmation sent:', info.messageId)
        } catch (error) {
            console.error('[SMTP] Failed to send reschedule confirmation email:', error)
            throw error
        }
    }

    async sendCancellationNotice(to: string, clientName: string, serviceName: string, date: string): Promise<void> {
        try {
            const info = await this.transporter.sendMail({
                from: this.fromEmail,
                to,
                subject: 'Appointment Cancelled',
                html: createCancellationNoticeHTML(clientName, serviceName, date)
            })
            console.log('[SMTP] Cancellation notice sent:', info.messageId)
        } catch (error) {
            console.error('[SMTP] Failed to send cancellation notice email:', error)
            throw error
        }
    }

    async sendBookingReminder(to: string, clientName: string, serviceName: string, date: string, providerName: string, location?: string): Promise<void> {
        try {
            const info = await this.transporter.sendMail({
                from: this.fromEmail,
                to,
                subject: `Reminder: ${serviceName} Tomorrow!`,
                html: createBookingReminderHTML(clientName, serviceName, date, providerName, location)
            })
            console.log('[SMTP] Booking reminder sent:', info.messageId)
        } catch (error) {
            console.error('[SMTP] Failed to send booking reminder email:', error)
            throw error
        }
    }
}

export class ResendEmailService implements EmailService {
    private resend: any
    private fromEmail: string

    constructor() {
        const { Resend } = require('resend')
        this.resend = new Resend(process.env.RESEND_API_KEY)
        this.fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@slotify.com'
    }

    async sendBookingConfirmation(to: string, clientName: string, serviceName: string, date: string, providerName: string, cancelLink?: string): Promise<void> {
        try {
            const result = await this.resend.emails.send({
                from: this.fromEmail,
                to,
                subject: `Booking Confirmed: ${serviceName} with ${providerName}`,
                html: createBookingConfirmationHTML(clientName, serviceName, date, providerName, cancelLink)
            })
            console.log('[RESEND] Email send result:', JSON.stringify(result, null, 2))

            // Check if Resend returned an error
            if (result.error) {
                throw new Error(`Resend API error: ${result.error.message}`)
            }
        } catch (error) {
            console.error('[RESEND] Failed to send booking confirmation email:', error)
            throw error
        }
    }

    async sendRescheduleProposal(to: string, clientName: string, link: string): Promise<void> {
        try {
            await this.resend.emails.send({
                from: this.fromEmail,
                to,
                subject: 'Reschedule Request for Your Appointment',
                html: createRescheduleProposalHTML(clientName, link)
            })
        } catch (error) {
            console.error('Failed to send reschedule proposal email:', error)
            throw error
        }
    }

    async sendRescheduleConfirmation(to: string, clientName: string, serviceName: string, date: string, providerName: string): Promise<void> {
        try {
            await this.resend.emails.send({
                from: this.fromEmail,
                to,
                subject: `Reschedule Confirmed: ${serviceName} with ${providerName}`,
                html: createRescheduleConfirmationHTML(clientName, serviceName, date, providerName)
            })
        } catch (error) {
            console.error('Failed to send reschedule confirmation email:', error)
            throw error
        }
    }

    async sendCancellationNotice(to: string, clientName: string, serviceName: string, date: string): Promise<void> {
        try {
            await this.resend.emails.send({
                from: this.fromEmail,
                to,
                subject: 'Appointment Cancelled',
                html: createCancellationNoticeHTML(clientName, serviceName, date)
            })
        } catch (error) {
            console.error('Failed to send cancellation notice email:', error)
            throw error
        }
    }

    async sendBookingReminder(to: string, clientName: string, serviceName: string, date: string, providerName: string, location?: string): Promise<void> {
        try {
            await this.resend.emails.send({
                from: this.fromEmail,
                to,
                subject: `Reminder: ${serviceName} Tomorrow!`,
                html: createBookingReminderHTML(clientName, serviceName, date, providerName, location)
            })
        } catch (error) {
            console.error('Failed to send booking reminder email:', error)
            throw error
        }
    }
}

// Choose email service based on environment variable
const useSmtp = !!process.env.SMTP_HOST || process.env.USE_SMTP === 'true'
const useResend = !useSmtp && !!process.env.RESEND_API_KEY

console.log('[EMAIL SERVICE] Initializing...', {
    useSMTP: useSmtp,
    hasResendKey: !!process.env.RESEND_API_KEY,
    smtpHost: process.env.SMTP_HOST,
    fromEmail: process.env.SMTP_FROM_EMAIL || process.env.RESEND_FROM_EMAIL,
    service: useSmtp ? 'SMTPEmailService (Mailpit)' : useResend ? 'ResendEmailService' : 'ConsoleEmailService'
})

export const emailService = useSmtp
    ? new SMTPEmailService()
    : useResend
        ? new ResendEmailService()
        : new ConsoleEmailService()
