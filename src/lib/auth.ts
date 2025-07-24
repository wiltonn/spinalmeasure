import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function getAuthUser() {
  const { userId } = await auth();
  
  if (!userId) {
    return null;
  }

  const clerkUser = await currentUser();
  if (!clerkUser) {
    return null;
  }

  // Find the user in our database
  const [dbUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, clerkUser.emailAddresses[0].emailAddress))
    .limit(1);

  return dbUser || null;
}

export async function requireAuth() {
  const user = await getAuthUser();
  
  if (!user) {
    throw new Error('Unauthorized');
  }

  return user;
}

export async function requireRole(allowedRoles: string[]) {
  const user = await requireAuth();
  
  if (!allowedRoles.includes(user.role)) {
    throw new Error('Forbidden: Insufficient permissions');
  }

  return user;
}