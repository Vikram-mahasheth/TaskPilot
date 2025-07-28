import nodemailer from 'nodemailer';
import logger from '../config/logger.js';

let etherealTransporter;

async function createEtherealTransporter() {
    if (etherealTransporter) return etherealTransporter;
    try {
        let testAccount = await nodemailer.createTestAccount();
        logger.info('Ethereal test account created.');
        logger.info(`User: ${testAccount.user}`);
        logger.info(`Pass: ${testAccount.pass}`);
        etherealTransporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email', port: 587, secure: false,
            auth: { user: testAccount.user, pass: testAccount.pass },
        });
        return etherealTransporter;
    } catch (error) {
        logger.error('Failed to create Ethereal test account', error);
        return null;
    }
}

export const sendEmail = async (options) => {
    let transporter = etherealTransporter;
    if (!transporter) {
        transporter = await createEtherealTransporter();
    }
    if (!transporter) {
        logger.error("Email not sent: transporter unavailable.");
        return;
    }
    const mailOptions = { from: process.env.EMAIL_FROM || '"Project Phoenix" <noreply@phoenix.com>', ...options };
    try {
        let info = await transporter.sendMail(mailOptions);
        logger.info(`Email sent: ${info.messageId}`);
        logger.info(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    } catch (error) {
        logger.error(`Error sending email: ${error}`);
    }
};

createEtherealTransporter();