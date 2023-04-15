import { LogApp, LogLevel, log } from '@shared';
import nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

interface EmailService {
  getTransporter(): nodemailer.Transporter<SMTPTransport.SentMessageInfo>;
  sendConfirmationMail(receiver: string, code: string): Promise<boolean>;
  sendBannedEmail(receiver: string, reason: string): Promise<boolean>;
}

async function sendConfirmationMail(receiver: string, code: string) {
  console.log('Sending confirmation email');
  await this.getTransporter().sendMail({
    from: '"Virtcon" <virtcon.game@gmail.com>', // sender address
    to: receiver, // list of receivers
    subject: 'Virtcon email confirmation code: ' + code, // Subject line
    text: 'Your code is: ' + code, // plain text body
  });
  console.log('Email confirmation for ' + receiver + ' was sent.');
  return true;
}

async function sendBannedEmail(receiver: string, reason: string) {
  console.log('Sending banned email');
  await this.getTransporter().sendMail({
    from: '"Virtcon" <virtcon.game@gmail.com>', // sender address
    to: receiver, // list of receivers
    subject: 'Your account was banned on Virtcon: ' + reason, // Subject line
    text: 'Appeal the ban on discord: https://discord.gg/sznAEAj4mR , your reason was: ' + reason, // plain text body
  });
  console.log('Email to ' + receiver + ' was sent.');
  return true;
}

const getTransporter = () =>
  nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.MAIL_USERNAME, // generated ethereal user
      pass: process.env.MAIL_PASSWORD, // generated ethereal password
    },
  });

const ProdEmailSerice: EmailService = {
  getTransporter,
  sendConfirmationMail,
  sendBannedEmail,
};

const DevEmailService: EmailService = {
  getTransporter: () =>
    ({
      sendMail: async (mailOptions): Promise<SMTPTransport.SentMessageInfo> => {
        log(`Sending email to ${mailOptions.to} with subject ${mailOptions.subject}`, LogLevel.INFO, LogApp.API);
        return { accepted: [], rejected: [], messageId: '' } as SMTPTransport.SentMessageInfo;
      },
    } as nodemailer.Transporter<SMTPTransport.SentMessageInfo>),
  sendConfirmationMail,
  sendBannedEmail,
};

export const EmailService = process.env.NODE_ENV === 'production' ? ProdEmailSerice : DevEmailService;
