import { Router } from "express";
import { z } from "zod/v4";
import { requireAuth } from "../../middleware/auth";
import { sendEmail } from "../../email";
import type { User } from "@shared/schema";

const router = Router();

// Schema for contact form validation
const contactFormSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  message: z.string().min(10, "Message must be at least 10 characters long"),
});

// POST /api/support/contact - Send support email
router.post("/contact", async (req, res) => {
  try {
    const validatedData = contactFormSchema.parse(req.body);
    const { name, email, message } = validatedData;

    // Get user info if authenticated (optional)
    const user = req.user as any || null;
    
    // Prepare email content
    const senderInfo = name || email || (user ? `${user.username} (${user.email})` : "Anonymous User");
    const replyTo = email || (user ? user.email : undefined);

    const emailSubject = `Support Request from ${senderInfo}`;
    const emailContent = `
      <h2>New Support Request</h2>
      <p><strong>From:</strong> ${senderInfo}</p>
      ${email ? `<p><strong>Email:</strong> ${email}</p>` : ''}
      ${user ? `<p><strong>User ID:</strong> ${user.id}</p>` : ''}
      ${user ? `<p><strong>Username:</strong> ${user.username}</p>` : ''}
      <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
      
      <h3>Message:</h3>
      <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
        ${message.replace(/\n/g, '<br>')}
      </div>
      
      ${replyTo ? `<p><em>Reply to: ${replyTo}</em></p>` : '<p><em>No reply email provided</em></p>'}
    `;

    // Send email to support
    await sendEmail({
      to: 'hello@theconnection.app',
      from: process.env.EMAIL_FROM || 'noreply@theconnection.app',
      subject: emailSubject,
      html: emailContent,
    });

    // If user provided email, send confirmation
    if (replyTo) {
      const confirmationSubject = "We've received your message - The Connection Support";
      const confirmationContent = `
        <h2>Thank you for contacting The Connection!</h2>
        <p>Hi${name ? ` ${name}` : ''},</p>
        
        <p>We've successfully received your message and our support team will review it shortly. You can expect a response within 24-48 hours.</p>
        
        <h3>Your message:</h3>
        <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
          ${message.replace(/\n/g, '<br>')}
        </div>
        
        <p>If you need immediate assistance, you can also reach us directly at hello@theconnection.app.</p>
        
        <p>Blessings,<br>
        The Connection Support Team</p>
      `;

      await sendEmail({
        to: replyTo,
        from: process.env.EMAIL_FROM || 'noreply@theconnection.app',
        subject: confirmationSubject,
        html: confirmationContent,
      });
    }

    res.json({ 
      success: true, 
      message: 'Support request sent successfully' 
    });

  } catch (error) {
    console.error('Error sending support email:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.issues.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }

    res.status(500).json({ 
      error: 'Failed to send support request. Please try again later.' 
    });
  }
});

// GET /api/support/status - Check support system status (optional)
router.get("/status", (req, res) => {
  res.json({
    status: "operational",
    supportEmail: "hello@theconnection.app",
    responseTime: "24-48 hours"
  });
});

export default router;
