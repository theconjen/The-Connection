/**
 * Ordinations Routes (User-facing)
 *
 * Allows users to:
 * - View available ordination programs
 * - Submit applications
 * - View their application status
 */

import { Router, Request, Response } from 'express';
import { storage } from '../storage';
import { requireAuth } from '../middleware/auth';
import { requireSessionUserId, getSessionUserId } from '../utils/session';
import { requireOrgFeature } from '../services/orgTierService';
import { z } from 'zod/v4';

const router = Router();

/**
 * GET /api/ordinations/programs - Get all available ordination programs
 * Returns enabled programs from orgs with the ordinations feature
 */
router.get('/programs', async (req: Request, res: Response) => {
  try {
    // Get all organizations (could be optimized with a join query)
    const { items: orgs } = await storage.getPublicOrganizations({ limit: 100 });

    const programs: any[] = [];

    for (const org of orgs) {
      // Check if org has ordinations feature
      const hasFeature = await requireOrgFeature(org.id, 'org.ordinations');
      if (!hasFeature) continue;

      // Get enabled programs for this org
      const orgPrograms = await storage.getOrdinationPrograms(org.id);
      const enabledPrograms = orgPrograms.filter(p => p.enabled);

      for (const program of enabledPrograms) {
        programs.push({
          id: program.id,
          title: program.title,
          description: program.description,
          organization: {
            id: org.id,
            name: org.name,
            slug: org.slug,
            denomination: org.denomination,
          },
          // Don't expose the form schema here - that comes when applying
        });
      }
    }

    res.json(programs);
  } catch (error) {
    console.error('Error fetching ordination programs:', error);
    res.status(500).json({ error: 'Failed to fetch programs' });
  }
});

/**
 * GET /api/ordinations/programs/:id - Get a specific ordination program
 * Includes form schema for application
 */
router.get('/programs/:id', async (req: Request, res: Response) => {
  try {
    const programId = parseInt(req.params.id, 10);
    if (isNaN(programId)) {
      return res.status(400).json({ error: 'Invalid program ID' });
    }

    const program = await storage.getOrdinationProgram(programId);
    if (!program || !program.enabled) {
      return res.status(404).json({ error: 'Program not found' });
    }

    // Check if org has ordinations feature
    const hasFeature = await requireOrgFeature(program.organizationId, 'org.ordinations');
    if (!hasFeature) {
      return res.status(404).json({ error: 'Program not found' });
    }

    const org = await storage.getOrganization(program.organizationId);

    res.json({
      id: program.id,
      title: program.title,
      description: program.description,
      formSchema: program.formSchema,
      schemaVersion: program.schemaVersion,
      organization: org ? {
        id: org.id,
        name: org.name,
        slug: org.slug,
        denomination: org.denomination,
      } : null,
    });
  } catch (error) {
    console.error('Error fetching ordination program:', error);
    res.status(500).json({ error: 'Failed to fetch program' });
  }
});

/**
 * GET /api/ordinations/my-applications - Get user's applications
 */
router.get('/my-applications', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = requireSessionUserId(req);

    const applications = await storage.getUserOrdinationApplications(userId);

    // Enrich with program and org info
    const enrichedApplications = await Promise.all(
      applications.map(async (app) => {
        const program = await storage.getOrdinationProgram(app.programId);
        const org = program ? await storage.getOrganization(program.organizationId) : null;
        const reviews = await storage.getOrdinationReviews(app.id);

        return {
          id: app.id,
          status: app.status,
          submittedAt: app.submittedAt,
          updatedAt: app.updatedAt,
          program: program ? {
            id: program.id,
            title: program.title,
          } : null,
          organization: org ? {
            id: org.id,
            name: org.name,
            slug: org.slug,
          } : null,
          // Only show latest review decision, not notes
          latestReviewDecision: reviews[0]?.decision || null,
        };
      })
    );

    res.json(enrichedApplications);
  } catch (error) {
    console.error('Error fetching ordination applications:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

/**
 * POST /api/ordinations/apply - Submit an ordination application
 */
router.post('/apply', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = requireSessionUserId(req);

    const schema = z.object({
      programId: z.number(),
      answers: z.record(z.any()), // Form answers as key-value pairs
    });

    const { programId, answers } = schema.parse(req.body);

    // Get the program
    const program = await storage.getOrdinationProgram(programId);
    if (!program || !program.enabled) {
      return res.status(404).json({ error: 'Program not found' });
    }

    // Check if org has ordinations feature
    const hasFeature = await requireOrgFeature(program.organizationId, 'org.ordinations');
    if (!hasFeature) {
      return res.status(404).json({ error: 'Program not found' });
    }

    // Check if user already has an application for this program
    const existingApplications = await storage.getUserOrdinationApplications(userId);
    const existingForProgram = existingApplications.find(
      a => a.programId === programId && ['pending', 'under_review'].includes(a.status)
    );

    if (existingForProgram) {
      return res.status(400).json({ error: 'You already have a pending application for this program' });
    }

    // Create the application with schema snapshot
    const application = await storage.createOrdinationApplication({
      programId,
      userId,
      status: 'pending',
      answers,
      programSchemaVersion: program.schemaVersion || 1,
      programSchemaSnapshot: program.formSchema || {},
    });

    // Log activity
    await storage.logOrganizationActivity({
      organizationId: program.organizationId,
      actorId: userId,
      action: 'ordination.applied',
      targetType: 'ordination_application',
      targetId: application.id,
      metadata: { programId },
    });

    res.status(201).json({
      success: true,
      applicationId: application.id,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request', details: error.errors });
    }
    console.error('Error submitting ordination application:', error);
    res.status(500).json({ error: 'Failed to submit application' });
  }
});

export default router;
