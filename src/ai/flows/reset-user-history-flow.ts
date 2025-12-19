'use server';
/**
 * @fileOverview A flow to reset the workout history for a specific user.
 * 
 * - resetUserHistory - The main function to trigger the history reset.
 * - ResetUserHistoryInput - The input schema for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { collection, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '@/firebase/config';

// The input schema is now defined in the calling component (admin/users/page.tsx)
// to avoid exporting a non-function from a 'use server' file.
const ResetUserHistoryInputSchema = z.object({
  userId: z.string().describe("The ID of the user whose history should be reset."),
});

export type ResetUserHistoryInput = z.infer<typeof ResetUserHistoryInputSchema>;

export async function resetUserHistory(input: ResetUserHistoryInput): Promise<{ success: boolean; message: string }> {
  return resetUserHistoryFlow(input);
}

const resetUserHistoryFlow = ai.defineFlow(
  {
    name: 'resetUserHistoryFlow',
    inputSchema: ResetUserHistoryInputSchema,
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string(),
    }),
  },
  async ({ userId }) => {
    if (!userId) {
      return { success: false, message: 'User ID is required.' };
    }

    console.log(`resetUserHistoryFlow: Starting to reset history for user ${userId}...`);

    try {
      const logsCollectionRef = collection(db, `users/${userId}/workout_logs`);
      const logsSnapshot = await getDocs(logsCollectionRef);

      if (logsSnapshot.empty) {
        console.log(`resetUserHistoryFlow: No history found for user ${userId}. Nothing to do.`);
        return { success: true, message: 'No history found to reset.' };
      }

      // Firestore allows a maximum of 500 operations in a single batch.
      // We process deletions in chunks to stay within this limit.
      const batchSize = 500;
      let i = 0;
      while (i < logsSnapshot.docs.length) {
        const batch = writeBatch(db);
        const chunk = logsSnapshot.docs.slice(i, i + batchSize);
        chunk.forEach((doc) => {
          batch.delete(doc.ref);
        });
        await batch.commit();
        i += chunk.length;
        console.log(`resetUserHistoryFlow: Deleted a chunk of ${chunk.length} logs for user ${userId}.`);
      }

      console.log(`resetUserHistoryFlow: Successfully reset history for user ${userId}. Total logs deleted: ${logsSnapshot.docs.length}.`);
      return { success: true, message: 'User history has been reset successfully.' };

    } catch (error: any) {
      console.error(`resetUserHistoryFlow: Failed to reset history for user ${userId}.`, error);
      return { success: false, message: `An error occurred: ${error.message}` };
    }
  }
);
