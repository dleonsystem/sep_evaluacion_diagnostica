const nodemailer = require('nodemailer');
require('dotenv').config();

async function run() {
  console.log('--- Testing SMTP Connection ---');
  console.log('Host:', process.env.SMTP_HOST);
  console.log('Port:', process.env.SMTP_PORT);
  console.log('User:', process.env.SMTP_USER);
  console.log('Secure:', process.env.SMTP_SECURE);

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  try {
    console.log('Verifying connection...');
    await transporter.verify();
    console.log('Connection VERIFIED!');

    console.log('Sending test email...');
    const info = await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'Sistema de Evaluación'}" <${process.env.SMTP_USER}>`,
      to: 'jose_mx@hotmail.com',
      subject: 'Test Email - SiCRER',
      text: 'This is a test email to verify SMTP configuration.',
    });
    console.log('Email sent successfully:', info.messageId);

  } catch (err) {
    console.error('SMTP Error:', err);
  }
}

run();
