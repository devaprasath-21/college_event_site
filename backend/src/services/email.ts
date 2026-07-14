import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.ethereal.email';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_USER = process.env.SMTP_USER || 'mock_smtp_user';
const SMTP_PASS = process.env.SMTP_PASS || 'mock_smtp_pass';
const SENDER_EMAIL = process.env.SENDER_EMAIL || 'noreply@campushub.edu';

// Setup email transporter
const getTransporter = () => {
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
};

// Check if credentials are mock placeholders
const isMockSMTP = () => {
  return SMTP_USER.startsWith('mock_') || SMTP_PASS.startsWith('mock_');
};

interface MailOptions {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async (options: MailOptions) => {
  const mailDetails = {
    from: `"CampusHub" <${SENDER_EMAIL}>`,
    to: options.to,
    subject: options.subject,
    html: options.html,
  };

  if (isMockSMTP()) {
    console.log('\n--- 📧 MOCK EMAIL BROADCAST ---');
    console.log(`To: ${mailDetails.to}`);
    console.log(`Subject: ${mailDetails.subject}`);
    console.log('HTML Body Preview (First 400 chars):');
    console.log(mailDetails.html.substring(0, 400) + '...\n--------------------------------\n');
    return { messageId: 'mock_message_id_' + Date.now() };
  }

  try {
    const transporter = getTransporter();
    const info = await transporter.sendMail(mailDetails);
    console.log(`Email sent successfully: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('Error sending email via Nodemailer:', error);
    // Silent fail so it doesn't break booking flow if SMTP parameters are invalid
    return null;
  }
};

// --- Custom HTML Templates ---

export const getRegistrationTemplate = (studentName: string, eventTitle: string, regId: string, date: string, time: string, venue: string) => {
  return `
    <div style="font-family: Arial, sans-serif; background-color: #f3f4f6; padding: 20px; color: #1f2937;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
        <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 30px; text-align: center; color: #ffffff;">
          <h1 style="margin: 0; font-size: 24px; font-weight: bold;">CampusHub</h1>
          <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">Your event pass is confirmed!</p>
        </div>
        <div style="padding: 30px;">
          <h2 style="margin-top: 0; color: #111827; font-size: 20px;">Hi ${studentName},</h2>
          <p style="font-size: 15px; line-height: 1.6;">You have successfully registered for <strong>${eventTitle}</strong>. Below are your registration details and event pass details:</p>
          
          <div style="background-color: #f9fafb; border-left: 4px solid #6366f1; padding: 15px; border-radius: 4px; margin: 20px 0;">
            <p style="margin: 5px 0; font-size: 14px;"><strong>Registration ID:</strong> ${regId}</p>
            <p style="margin: 5px 0; font-size: 14px;"><strong>Date:</strong> ${date}</p>
            <p style="margin: 5px 0; font-size: 14px;"><strong>Time:</strong> ${time}</p>
            <p style="margin: 5px 0; font-size: 14px;"><strong>Venue:</strong> ${venue}</p>
          </div>

          <p style="font-size: 14px; line-height: 1.5; color: #4b5563;">Please carry your digital QR code (available on your CampusHub Dashboard) for check-in on the day of the event.</p>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="http://localhost:5173/dashboard" style="background-color: #6366f1; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500; font-size: 14px; display: inline-block;">Go to Dashboard</a>
          </div>
        </div>
        <div style="background-color: #f3f4f6; padding: 15px 30px; text-align: center; font-size: 12px; color: #9ca3af;">
          &copy; 2026 CampusHub Platform. All rights reserved.
        </div>
      </div>
    </div>
  `;
};

export const getCancellationTemplate = (studentName: string, eventTitle: string) => {
  return `
    <div style="font-family: Arial, sans-serif; background-color: #f3f4f6; padding: 20px; color: #1f2937;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
        <div style="background-color: #ef4444; padding: 30px; text-align: center; color: #ffffff;">
          <h1 style="margin: 0; font-size: 24px; font-weight: bold;">CampusHub</h1>
          <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">Registration Cancelled</p>
        </div>
        <div style="padding: 30px;">
          <h2 style="margin-top: 0; color: #111827; font-size: 20px;">Hi ${studentName},</h2>
          <p style="font-size: 15px; line-height: 1.6;">Your registration for <strong>${eventTitle}</strong> has been cancelled.</p>
          <p style="font-size: 14px; line-height: 1.5; color: #4b5563;">If this was done in error or you have queries, please contact the student coordinator of the event.</p>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="http://localhost:5173/dashboard" style="background-color: #ef4444; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500; font-size: 14px; display: inline-block;">Go to Dashboard</a>
          </div>
        </div>
        <div style="background-color: #f3f4f6; padding: 15px 30px; text-align: center; font-size: 12px; color: #9ca3af;">
          &copy; 2026 CampusHub Platform. All rights reserved.
        </div>
      </div>
    </div>
  `;
};

