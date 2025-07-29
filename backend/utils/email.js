import nodemailer from 'nodemailer';
import logger from '../config/logger.js';

let transporter;

const setupTransporter = async () => {
    if (process.env.NODE_ENV === 'development' || !process.env.EMAIL_HOST) {
        // Use Ethereal for development/testing
        try {
            const testAccount = await nodemailer.createTestAccount();
            logger.info('Ethereal test account created.');
            logger.info(`User: ${testAccount.user}`);
            logger.info(`Pass: ${testAccount.pass}`);
            transporter = nodemailer.createTransport({
                host: 'smtp.ethereal.email',
                port: 587,
                secure: false,
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass,
                },
            });
        } catch (error) {
            logger.error(`Failed to create Ethereal account: ${error.message}`);
        }
    } else {
        // Use production transporter
        transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            secure: process.env.EMAIL_PORT === '465',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });
    }
};

setupTransporter().catch(err => logger.error(`Failed to setup email transporter: ${err}`));

export const sendEmail = async (options) => {
    if (!transporter) {
        logger.error('Email transporter is not initialized. Trying to set up again...');
        await setupTransporter();
        if(!transporter) {
             logger.error('Failed to initialize email transporter. Email not sent.');
             return;
        }
    }
    const mailOptions = {
        from: process.env.EMAIL_FROM || '"Project Phoenix" <noreply@phoenix.com>',
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
    };
    try {
        const info = await transporter.sendMail(mailOptions);
        logger.info(`Email sent: ${info.messageId}`);
        if (info.messageId.includes('ethereal.email')) {
             logger.info(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
        }
    } catch (error) {
        logger.error(`Error sending email: ${error}`);
    }
};