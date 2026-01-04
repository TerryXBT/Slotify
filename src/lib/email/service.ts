export interface EmailService {
    sendBookingConfirmation(to: string, clientName: string, serviceName: string, date: string, providerName: string): Promise<void>
    sendRescheduleProposal(to: string, clientName: string, link: string): Promise<void>
    sendCancellationNotice(to: string, clientName: string, serviceName: string, date: string): Promise<void>
}

export class ConsoleEmailService implements EmailService {
    async sendBookingConfirmation(to: string, clientName: string, serviceName: string, date: string, providerName: string) {
        console.log(`
      [EMAIL SEND] To: ${to}
      Subject: Booking Confirmed: ${serviceName} with ${providerName}
      Body:
        Hi ${clientName},
        Your booking for ${serviceName} on ${date} is confirmed!
        We look forward to seeing you.
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

    async sendCancellationNotice(to: string, clientName: string, serviceName: string, date: string) {
        console.log(`
      [EMAIL SEND] To: ${to}
      Subject: Appointment Cancelled
      Body:
        Hi ${clientName},
        Your appointment for ${serviceName} on ${date} has been cancelled.
    `)
    }
}

// In P0, we instantiate the mock service. In P1, we'd check ENV for Resend vs Console.
export const emailService = new ConsoleEmailService()
