import Nodemailer from "nodemailer";
import { MailtrapTransport } from "mailtrap";

const token = process.env.MAILTRAP_TOKEN;
const senderAddress = process.env.MAILTRAP_FROM_EMAIL || "hello@demomailtrap.com";
const senderName = "Maa Santoshi Indane Gramin Vitrak";

let transport;

if (token && token !== "YOUR_API_TOKEN") {
  try {
    transport = Nodemailer.createTransport(
      MailtrapTransport({
        token: token,
      })
    );
    console.log("Mailtrap transport successfully initialized.");
  } catch (err) {
    console.error("Failed to initialize Mailtrap transport:", err.message);
  }
}

// Resilient sending helper
async function sendMailHelper({ to, subject, html, category }) {
  const mailOptions = {
    from: {
      address: senderAddress,
      name: senderName
    },
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
    category
  };

  if (transport) {
    try {
      const info = await transport.sendMail(mailOptions);
      console.log(`[Mailtrap Email Sent] Category: ${category}, Info:`, info);
      return { success: true, info };
    } catch (error) {
      console.error(`[Mailtrap Email Failed] Category: ${category}, Error:`, error.message);
      return { success: false, error: error.message };
    }
  } else {
    // Console log fallback for local testing without Mailtrap API tokens configured
    console.log("\n==================================================");
    console.log(`[LOCAL DEV EMAIL EMULATOR] Category: ${category}`);
    console.log(`To: ${mailOptions.to.join(", ")}`);
    console.log(`Subject: ${subject}`);
    console.log("Content:");
    console.log(html.replace(/<[^>]*>/g, '').trim()); // Strip HTML tags for clean console display
    console.log("==================================================\n");
    return { success: true, mocked: true };
  }
}

// 1. Employee Onboarding Invite
export async function sendEmployeeInvite(email, name, inviteLink, expiryDays = 7) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #E8EAF0; border-radius: 8px;">
      <h2 style="color: #02164F;">Welcome to MSIGV SecureLedger</h2>
      <p>Hello ${name},</p>
      <p>You have been invited to access the Maa Santoshi Indane Gramin Vitrak operations portal.</p>
      <p>Please click the button below to complete your onboarding and create your account password:</p>
      <div style="margin: 24px 0;">
        <a href="${inviteLink}" style="background: #F37022; color: white; padding: 12px 20px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">
          Create Account
        </a>
      </div>
      <p style="font-size: 0.8rem; color: #6B7280;">This invite link will expire in ${expiryDays} days.</p>
      <hr style="border: none; border-top: 1px solid #E8EAF0; margin: 20px 0;" />
      <p style="font-size: 0.8rem; color: #9CA3AF;">Regards,<br/>Maa Santoshi Indane Gramin Vitrak</p>
    </div>
  `;
  return sendMailHelper({
    to: email,
    subject: "Invitation to Join MSIGV SecureLedger",
    html,
    category: "Employee Invite"
  });
}

// 2. Commercial Payment Reminder
export async function sendCommercialPaymentReminder(email, customerName, invoiceNo, amountDue, dueDate) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #E8EAF0; border-radius: 8px;">
      <h2 style="color: #02164F;">Commercial Payment Reminder</h2>
      <p>Dear ${customerName},</p>
      <p>This is a reminder regarding your pending commercial LPG payment details.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 0.9rem;">
        <tr>
          <td style="padding: 8px 0; font-weight: bold; border-bottom: 1px solid #E8EAF0;">Invoice No.</td>
          <td style="padding: 8px 0; text-align: right; border-bottom: 1px solid #E8EAF0;">${invoiceNo}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold; border-bottom: 1px solid #E8EAF0;">Pending Amount Due</td>
          <td style="padding: 8px 0; text-align: right; border-bottom: 1px solid #E8EAF0; color: #DC2626; font-weight: bold;">₹${amountDue.toLocaleString()}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold; border-bottom: 1px solid #E8EAF0;">Due Date</td>
          <td style="padding: 8px 0; text-align: right; border-bottom: 1px solid #E8EAF0;">${new Date(dueDate).toLocaleDateString()}</td>
        </tr>
      </table>
      <p>Please complete the payment outstanding at the earliest convenience.</p>
      <hr style="border: none; border-top: 1px solid #E8EAF0; margin: 20px 0;" />
      <p style="font-size: 0.8rem; color: #9CA3AF;">Regards,<br/>Maa Santoshi Indane Gramin Vitrak</p>
    </div>
  `;
  return sendMailHelper({
    to: email,
    subject: `Payment Reminder — ${customerName}`,
    html,
    category: "Commercial Payment Reminder"
  });
}

// 3. Empty Cylinder Pending Reminder
export async function sendEmptyCylinderReminder(email, customerName, emptyPending) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #E8EAF0; border-radius: 8px;">
      <h2 style="color: #02164F;">Empty Cylinder Return Reminder</h2>
      <p>Dear ${customerName},</p>
      <p>Our records show that <strong>${emptyPending}</strong> empty cylinder(s) are pending from your side.</p>
      <p>Please coordinate with our delivery staff for return collection during the next cycle.</p>
      <hr style="border: none; border-top: 1px solid #E8EAF0; margin: 20px 0;" />
      <p style="font-size: 0.8rem; color: #9CA3AF;">Regards,<br/>Maa Santoshi Indane Gramin Vitrak</p>
    </div>
  `;
  return sendMailHelper({
    to: email,
    subject: `Empty Cylinder Return Pending — ${customerName}`,
    html,
    category: "Empty Cylinder Reminder"
  });
}

// 4. Security Stock Mismatch Alert
export async function sendSecurityAlert(email, date, expectedStock, physicalStock, mismatch, severity = "HIGH") {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #FCA5A5; background: #FEF2F2; border-radius: 8px;">
      <h2 style="color: #991B1B;">⚠️ Stock Mismatch Alert Detected</h2>
      <p>A stock discrepancy mismatch has been logged during the daily closing audit run.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 0.9rem;">
        <tr>
          <td style="padding: 8px 0; font-weight: bold; border-bottom: 1px solid #FCA5A5;">Audit Date</td>
          <td style="padding: 8px 0; text-align: right; border-bottom: 1px solid #FCA5A5;">${new Date(date).toLocaleDateString()}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold; border-bottom: 1px solid #FCA5A5;">Expected Stock</td>
          <td style="padding: 8px 0; text-align: right; border-bottom: 1px solid #FCA5A5;">${expectedStock}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold; border-bottom: 1px solid #FCA5A5;">Physical Stock counted</td>
          <td style="padding: 8px 0; text-align: right; border-bottom: 1px solid #FCA5A5;">${physicalStock}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold; border-bottom: 1px solid #FCA5A5;">Difference</td>
          <td style="padding: 8px 0; text-align: right; border-bottom: 1px solid #FCA5A5; color: #DC2626; font-weight: bold;">${mismatch}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold; border-bottom: 1px solid #FCA5A5;">Severity</td>
          <td style="padding: 8px 0; text-align: right; border-bottom: 1px solid #FCA5A5; font-weight: bold; color: #991B1B;">${severity}</td>
        </tr>
      </table>
      <p>Please review the security alerts dashboard immediately for accountability tagging.</p>
    </div>
  `;
  return sendMailHelper({
    to: email,
    subject: "Security Alert — Stock Mismatch Detected",
    html,
    category: "Security Alert"
  });
}

// 5. Cylinder Incident defect Report
export async function sendIncidentReport(email, incidentType, cylinderType, quantity, location, reportedBy, remarks, actionRequired = "Isolate and check spindle") {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #E8EAF0; border-radius: 8px;">
      <h2 style="color: #02164F;">LPG Cylinder Incident Report</h2>
      <p>An operational cylinder defect has been recorded in the ledger database.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 0.9rem;">
        <tr>
          <td style="padding: 8px 0; font-weight: bold; border-bottom: 1px solid #E8EAF0;">Incident Type</td>
          <td style="padding: 8px 0; text-align: right; border-bottom: 1px solid #E8EAF0;">${incidentType}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold; border-bottom: 1px solid #E8EAF0;">Cylinder Classification</td>
          <td style="padding: 8px 0; text-align: right; border-bottom: 1px solid #E8EAF0;">${cylinderType === 'DOMESTIC_14_2' ? '14.2 kg Domestic' : '19 kg Commercial'}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold; border-bottom: 1px solid #E8EAF0;">Quantity Affected</td>
          <td style="padding: 8px 0; text-align: right; border-bottom: 1px solid #E8EAF0;">${quantity}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold; border-bottom: 1px solid #E8EAF0;">Detected Location</td>
          <td style="padding: 8px 0; text-align: right; border-bottom: 1px solid #E8EAF0;">${location}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold; border-bottom: 1px solid #E8EAF0;">Reported By Staff</td>
          <td style="padding: 8px 0; text-align: right; border-bottom: 1px solid #E8EAF0;">${reportedBy}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold; border-bottom: 1px solid #E8EAF0;">Action Required</td>
          <td style="padding: 8px 0; text-align: right; border-bottom: 1px solid #E8EAF0; font-weight: bold; color: #F37022;">${actionRequired}</td>
        </tr>
      </table>
      <p><strong>Remarks:</strong> ${remarks || "None"}</p>
      <hr style="border: none; border-top: 1px solid #E8EAF0; margin: 20px 0;" />
      <p style="font-size: 0.8rem; color: #9CA3AF;">Regards,<br/>Maa Santoshi Indane Gramin Vitrak</p>
    </div>
  `;
  return sendMailHelper({
    to: email,
    subject: `LPG Incident Report — ${incidentType}`,
    html,
    category: "Incident Report"
  });
}

// 6. EOD Daily Closing Summary
export async function sendDailyClosingReport(email, date, physical14Filled, physical14Empty, expected14Filled, expected14Empty, mismatch14Filled, mismatch14Empty) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #E8EAF0; border-radius: 8px;">
      <h2 style="color: #02164F;">Daily Closing Stock Summary</h2>
      <p>Here is the automated EOD stock count summary for Maa Santoshi Indane Gramin Vitrak.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 0.9rem;">
        <thead>
          <tr style="background: #F9FAFB;">
            <th style="padding: 8px; border: 1px solid #E8EAF0; text-align: left;">Item Class</th>
            <th style="padding: 8px; border: 1px solid #E8EAF0; text-align: center;">Physical Count</th>
            <th style="padding: 8px; border: 1px solid #E8EAF0; text-align: center;">Expected Count</th>
            <th style="padding: 8px; border: 1px solid #E8EAF0; text-align: center;">Mismatch</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 8px; border: 1px solid #E8EAF0;">14.2 kg Filled</td>
            <td style="padding: 8px; border: 1px solid #E8EAF0; text-align: center;">${physical14Filled}</td>
            <td style="padding: 8px; border: 1px solid #E8EAF0; text-align: center;">${expected14Filled}</td>
            <td style="padding: 8px; border: 1px solid #E8EAF0; text-align: center; color: ${mismatch14Filled !== 0 ? '#DC2626' : 'inherit'}; font-weight: ${mismatch14Filled !== 0 ? 'bold' : 'normal'};">${mismatch14Filled}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #E8EAF0;">14.2 kg Empty</td>
            <td style="padding: 8px; border: 1px solid #E8EAF0; text-align: center;">${physical14Empty}</td>
            <td style="padding: 8px; border: 1px solid #E8EAF0; text-align: center;">${expected14Empty}</td>
            <td style="padding: 8px; border: 1px solid #E8EAF0; text-align: center; color: ${mismatch14Empty !== 0 ? '#DC2626' : 'inherit'}; font-weight: ${mismatch14Empty !== 0 ? 'bold' : 'normal'};">${mismatch14Empty}</td>
          </tr>
        </tbody>
      </table>
      <p style="font-size: 0.8rem; color: #6B7280;">Audit closing date: ${new Date(date).toLocaleDateString()}</p>
      <hr style="border: none; border-top: 1px solid #E8EAF0; margin: 20px 0;" />
      <p style="font-size: 0.8rem; color: #9CA3AF;">Regards,<br/>Maa Santoshi Indane Gramin Vitrak</p>
    </div>
  `;
  return sendMailHelper({
    to: email,
    subject: `Daily Closing Stock Summary — ${new Date(date).toLocaleDateString()}`,
    html,
    category: "Daily Closing"
  });
}
