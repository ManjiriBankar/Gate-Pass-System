const nodemailer = require("nodemailer");

// Check if we have valid email credentials
const hasValidEmailConfig = process.env.EMAIL_USER && 
                           process.env.EMAIL_PASSWORD && 
                           process.env.EMAIL_PASSWORD !== 'your-college-email-password';

// Create a production transporter if we have valid credentials
const createProductionTransporter = () => {
  const config = {
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: process.env.EMAIL_SECURE === "true",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  };
  
  // Add service if specified
  if (process.env.EMAIL_SERVICE) {
    config.service = process.env.EMAIL_SERVICE;
  }
  
  console.log("Creating email transport with config:", {
    ...config,
    auth: {
      ...config.auth,
      pass: '*********' // Don't log the actual password
    }
  });
  
  return nodemailer.createTransport(config);
};

// Create a test account with Ethereal Email for development
const createTestTransporter = async () => {
  console.log("Creating test email account for development...");
  const testAccount = await nodemailer.createTestAccount();
  
  console.log("Test email account created:");
  console.log(`- Email: ${testAccount.user}`);
  console.log(`- Password: ${testAccount.pass}`);
  console.log("- View sent emails at: https://ethereal.email/messages");
  
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
};

// Initialize transporter to null, we'll create it on demand
let transporter = null;

/**
 * Send an email
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} text - Plain text content
 * @param {string} html - HTML content (optional)
 */
const sendEmail = async (to, subject, text, html) => {
  try {
    // Create transporter if it doesn't exist
    if (!transporter) {
      if (hasValidEmailConfig) {
        transporter = createProductionTransporter();
        console.log("Using organization email configuration");
      } else {
        transporter = await createTestTransporter();
        console.log("Using test email configuration (Ethereal Email)");
      }
    }

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'KBT College Gate Pass System'}" <${process.env.EMAIL_FROM || 'gatepass@kbtcoe.org'}>`,
      to,
      subject,
      text,
    };

    // Add HTML content if provided
    if (html) {
      mailOptions.html = html;
    }

    console.log(`Sending email to: ${to}`);
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent: ${info.messageId}`);
    
    // If using test account, log the URL where the message can be viewed
    if (!hasValidEmailConfig && info.messageUrl) {
      console.log(`View email preview at: ${nodemailer.getTestMessageUrl(info)}`);
    }
    
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
};

module.exports = { sendEmail };
