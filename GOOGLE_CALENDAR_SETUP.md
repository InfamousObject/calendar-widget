# Google Calendar Integration Setup Guide

This guide will walk you through setting up Google Calendar integration for SmartWidget.

## Prerequisites

- A Google account
- Access to [Google Cloud Console](https://console.cloud.google.com)

## Step-by-Step Setup

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click on the project dropdown (top left, next to "Google Cloud")
3. Click **"New Project"**
4. Enter a project name (e.g., "SmartWidget Calendar")
5. Click **"Create"**

### 2. Enable Google Calendar API

1. In your project, navigate to **"APIs & Services"** > **"Library"**
2. Search for **"Google Calendar API"**
3. Click on it and click **"Enable"**

### 3. Configure OAuth Consent Screen

1. Go to **"APIs & Services"** > **"OAuth consent screen"**
2. Select **"External"** user type (unless you have a Google Workspace)
3. Click **"Create"**
4. Fill in the required fields:
   - **App name**: SmartWidget
   - **User support email**: Your email
   - **Developer contact email**: Your email
5. Click **"Save and Continue"**
6. On the **Scopes** screen, click **"Add or Remove Scopes"**
7. Add these scopes:
   - `https://www.googleapis.com/auth/calendar.readonly`
   - `https://www.googleapis.com/auth/calendar.events`
8. Click **"Update"** and **"Save and Continue"**
9. On the **Test users** screen (if in testing mode), add your email
10. Click **"Save and Continue"**
11. Review and click **"Back to Dashboard"**

### 4. Create OAuth 2.0 Credentials

1. Go to **"APIs & Services"** > **"Credentials"**
2. Click **"Create Credentials"** > **"OAuth client ID"**
3. Select **"Web application"** as the application type
4. Enter a name (e.g., "SmartWidget Web Client")
5. Under **"Authorized redirect URIs"**, click **"Add URI"** and add:
   ```
   http://localhost:3000/api/calendar/callback
   ```
   (For production, you'll add your production URL like `https://yourdomain.com/api/calendar/callback`)
6. Click **"Create"**
7. A modal will appear with your **Client ID** and **Client Secret**
8. **Copy these values** - you'll need them in the next step

### 5. Add Credentials to Environment Variables

1. Open your `.env.local` file in the project root
2. Add or update these lines with your credentials:
   ```env
   GOOGLE_CLIENT_ID=your_client_id_here
   GOOGLE_CLIENT_SECRET=your_client_secret_here
   ```
3. Save the file

### 6. Restart Development Server

After adding the credentials, restart your Next.js development server:

```bash
# Stop the current server (Ctrl+C)
# Then start it again
npm run dev
```

## Testing the Integration

1. Navigate to http://localhost:3000/dashboard/calendar
2. Click **"Connect Google Calendar"**
3. You'll be redirected to Google's OAuth consent screen
4. Sign in with your Google account
5. Grant the requested permissions
6. You'll be redirected back to your app with a success message
7. Your calendar should now be connected!

## Troubleshooting

### "OAuth client ID not configured" Error

- Make sure you've added your `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to `.env.local`
- Restart your development server after adding the credentials

### "Redirect URI mismatch" Error

- Check that the redirect URI in Google Cloud Console exactly matches your callback URL
- For local development: `http://localhost:3000/api/calendar/callback`
- Make sure there are no trailing slashes

### "Access blocked: This app's request is invalid" Error

- Make sure you've added your email as a test user in the OAuth consent screen
- If your app is in "Testing" mode, only test users can access it
- Consider publishing your app to "Production" mode (requires verification for certain scopes)

### Token Expired Errors

- The integration automatically refreshes tokens when they expire
- If you continue to see errors, try disconnecting and reconnecting your calendar

## Production Deployment

When deploying to production:

1. Update the **Authorized redirect URI** in Google Cloud Console to include your production URL:
   ```
   https://yourdomain.com/api/calendar/callback
   ```
2. Add your production credentials to your hosting platform's environment variables
3. If you need more than 100 users, submit your app for OAuth verification

## Security Notes

- **Never commit** your `.env.local` file to version control
- The `.env.local` file is already in `.gitignore`
- Keep your `GOOGLE_CLIENT_SECRET` secure
- Regularly rotate your credentials if they're compromised

## What's Integrated

Once connected, the calendar integration will:

- ✅ Create Google Calendar events when appointments are booked
- ✅ Update events when appointments are rescheduled
- ✅ Delete events when appointments are cancelled
- ✅ Check for conflicts before showing available time slots
- ✅ Automatically refresh access tokens when they expire

## Need Help?

If you encounter issues:
1. Check the browser console for error messages
2. Check your Next.js server logs
3. Verify all credentials are correctly set in `.env.local`
4. Ensure the Google Calendar API is enabled in your project
