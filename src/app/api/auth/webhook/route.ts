import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users, institutions } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: Request) {
  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new SVIX instance with your secret.
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || '');

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occured', {
      status: 400,
    });
  }

  // Handle the webhook
  const eventType = evt.type;

  if (eventType === 'user.created' || eventType === 'user.updated') {
    const { id, email_addresses, first_name, last_name } = evt.data;
    const primaryEmail = email_addresses[0]?.email_address;

    if (!primaryEmail) {
      return new Response('No email address found', { status: 400 });
    }

    try {
      // Check if user already exists
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, primaryEmail))
        .limit(1);

      if (existingUser.length === 0) {
        // Get or create a default institution
        let institutionId: string;
        const defaultInstitution = await db
          .select()
          .from(institutions)
          .where(eq(institutions.name, 'Default Institution'))
          .limit(1);

        if (defaultInstitution.length === 0) {
          const [newInstitution] = await db
            .insert(institutions)
            .values({
              name: 'Default Institution',
              address: 'Default Address',
            })
            .returning();
          institutionId = newInstitution.id;
        } else {
          institutionId = defaultInstitution[0].id;
        }

        // Create new user
        await db.insert(users).values({
          email: primaryEmail,
          firstName: first_name || '',
          lastName: last_name || '',
          institutionId,
          role: 'viewer', // Default role
          isActive: true,
        });
      } else if (eventType === 'user.updated') {
        // Update existing user
        await db
          .update(users)
          .set({
            firstName: first_name || existingUser[0].firstName,
            lastName: last_name || existingUser[0].lastName,
            updatedAt: new Date(),
          })
          .where(eq(users.email, primaryEmail));
      }
    } catch (error) {
      console.error('Error handling user webhook:', error);
      return new Response('Error processing webhook', { status: 500 });
    }
  }

  if (eventType === 'user.deleted') {
    const { id } = evt.data;
    // We might want to soft delete or handle this differently
    // For now, we'll just deactivate the user
    try {
      const userEmail = evt.data.email_addresses?.[0]?.email_address;
      if (userEmail) {
        await db
          .update(users)
          .set({
            isActive: false,
            updatedAt: new Date(),
          })
          .where(eq(users.email, userEmail));
      }
    } catch (error) {
      console.error('Error handling user deletion:', error);
      return new Response('Error processing webhook', { status: 500 });
    }
  }

  return new Response('', { status: 200 });
}