import { Router } from 'express';
import { ensureAdmin } from '../middlewares/admin-auth';
import { storage } from '../storage';
import { format } from 'date-fns';
import { sendApplicationStatusUpdateEmail } from '../email-notifications';

const router = Router();

// Get all livestreamer applications
router.get('/livestreamer-applications', ensureAdmin, async (req, res, next) => {
  try {
    const applications = await storage.getAllLivestreamerApplications();
    res.json(applications);
  } catch (error) {
    next(error);
  }
});

// Get a specific application by ID
router.get('/livestreamer-applications/:id', ensureAdmin, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid application ID" });
    }
    
    const application = await storage.getLivestreamerApplicationById(id);
    
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }
    
    res.json(application);
  } catch (error) {
    next(error);
  }
});

// Update application status (approve or reject)
router.put('/livestreamer-applications/:id', ensureAdmin, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid application ID" });
    }
    
    const { status, reviewNotes } = req.body;
    
    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: "Invalid status. Must be 'approved' or 'rejected'" });
    }
    
    // Update the application status
    const updatedApplication = await storage.updateLivestreamerApplication(
      id, 
      status, 
      reviewNotes || '', 
      req.user!.id
    );
    
    if (!updatedApplication) {
      return res.status(404).json({ message: "Application not found" });
    }
    
    // Get applicant details to send email notification
    const applicant = await storage.getUser(updatedApplication.userId);
    
    if (applicant) {
      // Send email notification to the applicant
      await sendApplicationStatusUpdateEmail({
        email: applicant.email,
        applicantName: applicant.displayName || applicant.username,
        status: status === 'approved' ? 'APPROVED' : 'REJECTED',
        ministryName: updatedApplication.ministryName || 'your ministry',
        reviewNotes: reviewNotes || '',
        platformLink: 'https://theconnection.app/livestream'
      });
    }
    
    res.json({
      message: `Application ${status === 'approved' ? 'approved' : 'rejected'} successfully`,
      application: updatedApplication
    });
  } catch (error) {
    next(error);
  }
});

// Get application statistics
router.get('/livestreamer-applications/stats', ensureAdmin, async (req, res, next) => {
  try {
    const applications = await storage.getAllLivestreamerApplications();
    
    const stats = {
      total: applications.length,
      pending: applications.filter(app => app.status === 'pending').length,
      approved: applications.filter(app => app.status === 'approved').length,
      rejected: applications.filter(app => app.status === 'rejected').length,
      reviewedToday: applications.filter(app => {
        if (!app.reviewedAt) return false;
        const today = new Date();
        const reviewDate = new Date(app.reviewedAt);
        return today.getDate() === reviewDate.getDate() && 
               today.getMonth() === reviewDate.getMonth() && 
               today.getFullYear() === reviewDate.getFullYear();
      }).length
    };
    
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

export default router;