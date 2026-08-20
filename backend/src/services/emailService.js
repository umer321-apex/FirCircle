const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const sendPasswordResetEmail = async (toEmail, resetCode) => {
  try {
    await resend.emails.send({
      from: 'FitCircle <onboarding@resend.dev>',
      to: toEmail,
      subject: 'Reset your FitCircle password',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #FF5A3C;">FitCircle</h2>
          <p>You requested a password reset. Use this code in the app:</p>
          <p style="font-size: 32px; font-weight: bold; letter-spacing: 4px;">${resetCode}</p>
          <p style="color: #888; font-size: 13px;">This code expires in 15 minutes. If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error(`[emailService.sendPasswordResetEmail] Error: ${error.message}`);
    return false;
  }
};

module.exports = { sendPasswordResetEmail };