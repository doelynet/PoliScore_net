const nodemailerAvailable = (() => {
    try {
        require.resolve('nodemailer');
        return true;
    } catch (e) {
        return false;
    }
})();

let transporter = null;
if (nodemailerAvailable && process.env.SMTP_HOST) {
    const nodemailer = require('nodemailer');
    transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_SECURE === 'true',
        auth: process.env.SMTP_USER ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        } : undefined
    });
}

async function sendEmail({ to, subject, text, html }) {
    if (transporter) {
        try {
            await transporter.sendMail({ from: process.env.EMAIL_FROM || 'no-reply@example.com', to, subject, text, html });
            return true;
        } catch (err) {
            console.error('mailer error', err);
            // fallthrough to console log
        }
    }
    // fallback: log the email to console
    console.info('Email fallback — not sent via SMTP. Email payload:', { to, subject, text, html });
    return true;
}

module.exports = { sendEmail };
