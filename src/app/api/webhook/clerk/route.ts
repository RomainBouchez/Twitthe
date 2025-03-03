import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  // Get the headers
  const headerPayload = headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  // If there are no svix headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error: Missing svix headers', {
      status: 400,
    });
  }

  // Get the webhook secret
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    return new Response('Error: Missing webhook secret', {
      status: 500,
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret
  const wh = new Webhook(secret);

  let evt: WebhookEvent;

  // Verify the webhook
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error verifying webhook', {
      status: 400,
    });
  }

  // Handle the webhook based on the type
  const eventType = evt.type;
  
  if (eventType === 'user.created') {
    const { id, username, email_addresses, first_name, last_name, image_url } = evt.data;
    
    try {
      // Create the user in your database
      await prisma.user.create({
        data: {
          clerkId: id,
          email: email_addresses[0].email_address,
          username: username || email_addresses[0].email_address.split('@')[0],
          name: `${first_name || ''} ${last_name || ''}`.trim(),
          image: image_url,
        },
      });
      
      return NextResponse.json({ success: true, message: 'User created successfully' });
    } catch (error) {
      console.error('Error creating user:', error);
      return NextResponse.json({ success: false, error: 'Error creating user' }, { status: 500 });
    }
  }
  
  if (eventType === 'user.updated') {
    const { id, username, email_addresses, first_name, last_name, image_url } = evt.data;
    
    try {
      // Get the existing user to find out what changed
      const existingUser = await prisma.user.findUnique({
        where: { clerkId: id },
      });
      
      if (!existingUser) {
        return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
      }
      
      // Only update specific fields from Clerk
      // This helps preserve changes made directly in your app
      const updates: any = {};
      
      // Always keep email in sync with Clerk
      if (email_addresses[0].email_address !== existingUser.email) {
        updates.email = email_addresses[0].email_address;
      }
      
      // Only update username from Clerk if it's different and not customized in the app
      if (username && username !== existingUser.username) {
        // Only update if the existing username follows the email pattern
        // This preserves custom usernames set in your app
        const emailUsername = existingUser.email.split('@')[0];
        if (existingUser.username === emailUsername) {
          updates.username = username;
        }
      }
      
      // Only apply updates if there are changes to make
      if (Object.keys(updates).length > 0) {
        await prisma.user.update({
          where: { clerkId: id },
          data: updates,
        });
      }
      
      return NextResponse.json({ success: true, message: 'User updated successfully' });
    } catch (error) {
      console.error('Error updating user:', error);
      return NextResponse.json({ success: false, error: 'Error updating user' }, { status: 500 });
    }
  }
  
  if (eventType === 'user.deleted') {
    const { id } = evt.data;
    
    try {
      // Delete the user from your database
      await prisma.user.delete({
        where: { clerkId: id },
      });
      
      return NextResponse.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
      console.error('Error deleting user:', error);
      return NextResponse.json({ success: false, error: 'Error deleting user' }, { status: 500 });
    }
  }

  // Return a response
  return NextResponse.json({ success: true, message: 'Webhook received' });
}