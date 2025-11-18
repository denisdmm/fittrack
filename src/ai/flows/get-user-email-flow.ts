'use server';
/**
 * @fileOverview A secure flow to retrieve a user's email by their username.
 *
 * - getUserEmail - A function that handles fetching the user's email.
 * - GetUserEmailInput - The input type for the getUserEmail function.
 * - GetUserEmailOutput - The return type for the getUserEmail function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '@/firebase/config';

const GetUserEmailInputSchema = z.object({
  username: z.string().describe('The username to look up.'),
});
export type GetUserEmailInput = z.infer<typeof GetUserEmailInputSchema>;

const GetUserEmailOutputSchema = z.object({
  email: z.string().email().nullable().describe('The email associated with the username, or null if not found.'),
});
export type GetUserEmailOutput = z.infer<typeof GetUserEmailOutputSchema>;

// This is the exported function that the client will call.
export async function getUserEmail(input: GetUserEmailInput): Promise<GetUserEmailOutput> {
  return getUserEmailFlow(input);
}

const getUserEmailFlow = ai.defineFlow(
  {
    name: 'getUserEmailFlow',
    inputSchema: GetUserEmailInputSchema,
    outputSchema: GetUserEmailOutputSchema,
  },
  async (input) => {
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("username", "==", input.username), limit(1));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return { email: null };
      }

      const userData = querySnapshot.docs[0].data();
      const email = userData.email;

      if (!email || typeof email !== 'string') {
        return { email: null };
      }

      return { email };

    } catch (error) {
      console.error("Error in getUserEmailFlow: ", error);
      // In case of an error, return null to the client.
      return { email: null };
    }
  }
);
