import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { createClient } from '@/lib/supabase-server';
import { prisma } from '@/lib/prisma';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/drive/callback`
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(new URL('/settings?drive_error=cancelled', origin));
    }

    if (!code) {
      return NextResponse.redirect(new URL('/settings?drive_error=no_code', origin));
    }

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user and their workspace
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.redirect(new URL('/login', origin));
    }

    // Get user's workspace
    const membership = await prisma.workspaceMember.findFirst({
      where: { userId: user.id },
    });

    if (!membership) {
      return NextResponse.redirect(new URL('/settings?drive_error=no_workspace', origin));
    }

    const workspaceId = membership.workspaceId;

    // Store tokens in Config table for this workspace
    await prisma.config.upsert({
      where: { workspaceId_key: { workspaceId, key: 'google_drive_access_token' } },
      create: {
        workspaceId,
        key: 'google_drive_access_token',
        value: tokens.access_token || '',
      },
      update: {
        value: tokens.access_token || '',
      },
    });

    // Store refresh token if provided
    if (tokens.refresh_token) {
      await prisma.config.upsert({
        where: { workspaceId_key: { workspaceId, key: 'google_drive_refresh_token' } },
        create: {
          workspaceId,
          key: 'google_drive_refresh_token',
          value: tokens.refresh_token,
        },
        update: {
          value: tokens.refresh_token,
        },
      });
    }

    return NextResponse.redirect(new URL('/settings?drive_connected=true', origin));
  } catch (err) {
    console.error('Drive callback error:', err);
    return NextResponse.redirect(new URL('/settings?drive_error=auth_failed', origin));
  }
}
