import nodemailer from 'nodemailer';
import logger from '../config/logger.js';

let transporter;
let testAccount;

const initializeTransporter = async () => {
    if (process.env.NODE_ENV === 'production' && process.env.EMAIL_HOST) {
        transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            secure: process.env.EMAIL_PORT == 465,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });
    } else {
        if (!testAccount) {
            testAccount = await nodemailer.createTestAccount();
            logger.info('Ethereal test account created.');
            logger.info(`User: ${testAccount.user}`);
            logger.info(`Pass: ${testAccount.pass}`);
        }
        transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass,
            },
        });
    }
};

initializeTransporter();

export const sendEmail = async (options) => {
    if (!transporter) {
        await initializeTransporter();
    }
    const mailOptions = {
        from: process.env.EMAIL_FROM || '"Project Phoenix" <noreply@example.com>',
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
    };
    try {
        const info = await transporter.sendMail(mailOptions);
        logger.info(`Email sent: ${info.messageId}`);
        if (process.env.NODE_ENV !== 'production' && nodemailer.getTestMessageUrl(info)) {
            logger.info(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
        }
    } catch (error) {
        logger.error(`Error sending email: ${error}`);
    }
};