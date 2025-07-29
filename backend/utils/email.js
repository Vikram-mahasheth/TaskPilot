import nodemailer from 'nodemailer';
import logger from '../config/logger.js';

let testAccount;

export const sendEmail = async (options) => {
    if (process.env.NODE_ENV === 'development' && !testAccount) {
        try {
            testAccount = await nodemailer.createTestAccount();
            logger.info("Ethereal test account created successfully.");
            logger.info(`Ethereal User: ${testAccount.user}`);
            logger.info(`Ethereal Pass: ${testAccount.pass}`);
        } catch (error) {
            logger.error("Failed to create Ethereal test account", error);
            return;
        }
    }

    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || testAccount?.smtp?.host,
        port: process.env.EMAIL_PORT || testAccount?.smtp?.port,
        secure: (process.env.EMAIL_PORT || testAccount?.smtp?.port) == 465,
        auth: {
            user: process.env.EMAIL_USER || testAccount?.user,
            pass: process.env.EMAIL_PASS || testAccount?.pass,
        },
    });

    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        logger.info(`Email sent to ${options.to}: ${info.messageId}`);
        if (process.env.NODE_ENV === 'development') {
            logger.info(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
        }
    } catch (error) {
        logger.error(`Error sending email: ${error}`);
    }
};