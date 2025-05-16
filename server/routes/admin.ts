import { Router } from 'express';
import { storage } from '../storage';
import { isAdmin } from '../middlewares/admin-auth';
import { sendEmail } from '../email';
import { db } from '../db';
import { users } from '../../shared/schema';
import { eq } from 'drizzle-orm';

const router = Router();

// Require admin authentication for all routes in this router
router.use(isAdmin);

// Get all pending livestreamer applications
router.get('/applications/livestreamer', async (req, res) => {
  try {
    const applications = await storage.getPendingLivestreamerApplications();
    res.json(applications);
  } catch (error) {
    console.error('Error fetching pending livestreamer applications:', error);
    res.status(500).json({ message: 'Failed to fetch applications' });
  }
});

// Approve a livestreamer application
router.post('/applications/livestreamer/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { reviewNotes } = req.body;
    const reviewerId = req.user.id;
    
    const updatedApplication = await storage.updateLivestreamerApplication(
      parseInt(id), 
      'approved', 
      reviewNotes || '',
      reviewerId
    );
    
    // Get the applicant's information to send notification
    const applicant = await storage.getUser(updatedApplication.userId);
    
    if (applicant && applicant.email) {
      // Send approval notification email to the applicant
      await sendEmail({
        to: applicant.email,
        subject: 'Livestreamer Application Approved',
        template: 'notification',
        templateData: {
          username: applicant.username,
          message: 'Congratulations! Your application to become a livestreamer has been approved.',
          callToAction: 'You can now start creating livestreams on our platform.',
          actionUrl: '/livestreams/create',
          actionText: 'Create Livestream'
        }
      });
    }
    
    res.json(updatedApplication);
  } catch (error) {
    console.error('Error approving livestreamer application:', error);
    res.status(500).json({ message: 'Failed to approve application' });
  }
});

// Reject a livestreamer application
router.post('/applications/livestreamer/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { reviewNotes } = req.body;
    const reviewerId = req.user.id;
    
    const updatedApplication = await storage.updateLivestreamerApplication(
      parseInt(id), 
      'rejected', 
      reviewNotes || '',
      reviewerId
    );
    
    // Get the applicant's information to send notification
    const applicant = await storage.getUser(updatedApplication.userId);
    
    if (applicant && applicant.email) {
      // Send rejection notification email to the applicant
      await sendEmail({
        to: applicant.email,
        subject: 'Livestreamer Application Status Update',
        template: 'notification',
        templateData: {
          username: applicant.username,
          message: 'Your application to become a livestreamer has been reviewed. Unfortunately, it was not approved at this time.',
          callToAction: reviewNotes || 'Please review the feedback provided and consider reapplying in the future.',
          actionUrl: '/livestreamer/apply',
          actionText: 'View Application'
        }
      });
    }
    
    res.json(updatedApplication);
  } catch (error) {
    console.error('Error rejecting livestreamer application:', error);
    res.status(500).json({ message: 'Failed to reject application' });
  }
});

// Get all users with admin capabilities
router.get('/admin-users', async (req, res) => {
  try {
    const adminUsers = await db.select({
      id: users.id,
      username: users.username,
      email: users.email
    })
    .from(users)
    .where(eq(users.isAdmin, true));
    
    res.json(adminUsers);
  } catch (error) {
    console.error('Error fetching admin users:', error);
    res.status(500).json({ message: 'Failed to fetch admin users' });
  }
});

export default router;