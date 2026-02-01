/**
 * Assign all questions to Janelle (user ID 19)
 */

import "dotenv/config";
import { db } from './db';
import { userQuestions, questionAssignments } from '@shared/schema';
import { eq } from 'drizzle-orm';

const JANELLE_USER_ID = 19;

async function reassignAllToJanelle() {
  try {
    console.log(`Reassigning all questions to Janelle (user ID ${JANELLE_USER_ID})...\n`);

    // Get all questions
    const allQuestions = await db
      .select({
        id: userQuestions.id,
        questionText: userQuestions.questionText,
        status: userQuestions.status,
        askerUserId: userQuestions.askerUserId
      })
      .from(userQuestions);

    console.log(`Found ${allQuestions.length} questions total.\n`);

    for (const question of allQuestions) {
      // Check if assignment already exists for this question
      const existingAssignment = await db
        .select()
        .from(questionAssignments)
        .where(eq(questionAssignments.questionId, question.id));

      if (existingAssignment.length > 0) {
        // Update existing assignment to Janelle
        await db
          .update(questionAssignments)
          .set({
            assignedToUserId: JANELLE_USER_ID,
            status: 'assigned'
          })
          .where(eq(questionAssignments.questionId, question.id));
        console.log(`  [${question.id}] Updated existing assignment -> Janelle`);
      } else {
        // Create new assignment for Janelle
        await db
          .insert(questionAssignments)
          .values({
            questionId: question.id,
            assignedToUserId: JANELLE_USER_ID,
            assignedByUserId: JANELLE_USER_ID,
            status: 'assigned'
          } as any);
        console.log(`  [${question.id}] Created new assignment -> Janelle`);
      }
    }

    console.log(`\n✅ All ${allQuestions.length} questions now assigned to Janelle (user ${JANELLE_USER_ID})`);

    // Verify assignments
    const assignments = await db
      .select()
      .from(questionAssignments);

    console.log(`\nCurrent assignments (${assignments.length} total):`);
    for (const a of assignments) {
      console.log(`  Question ${a.questionId} -> User ${a.assignedToUserId} (status: ${a.status})`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

reassignAllToJanelle();
