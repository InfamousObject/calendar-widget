# hCaptcha Bot Protection Setup Guide

This application now includes hCaptcha bot protection for public booking and form submission endpoints. This helps prevent automated spam and abuse while maintaining a good user experience.

## Overview

hCaptcha is integrated into:
- **Booking Forms** (`/book/[widgetId]` and `/embed/booking/[widgetId]`)
- **Contact Form Submissions** (`/api/forms/submit`)

The implementation features graceful degradation - if hCaptcha keys are not configured, the system will work normally in development mode without CAPTCHA protection.

## Getting Your hCaptcha Keys

### 1. Create a Free hCaptcha Account

1. Visit [https://hcaptcha.com](https://hcaptcha.com)
2. Click "Sign Up" (top right)
3. Choose the **Free** plan (up to 1M requests/month)
4. Complete account registration

### 2. Get Your Site Keys

1. Log into your hCaptcha dashboard: [https://dashboard.hcaptcha.com](https://dashboard.hcaptcha.com)
2. Click "New Site" or select an existing site
3. Configure your site:
   - **Hostname**: Add your production domain (e.g., `yourdomain.com`)
   - **Hostname**: Add `localhost` for local development
   - Leave other settings as default
4. Click "Save"
5. You'll receive two keys:
   - **Site Key** (public) - shown to users on the frontend
   - **Secret Key** (private) - used for server-side verification

## Configuration

### Add to Environment Variables

Edit your `.env` file and add the following:

```bash
# hCaptcha Bot Protection
NEXT_PUBLIC_HCAPTCHA_SITE_KEY="your-site-key-here"
HCAPTCHA_SECRET_KEY="your-secret-key-here"
```

**Important Notes:**
- `NEXT_PUBLIC_HCAPTCHA_SITE_KEY` must start with `NEXT_PUBLIC_` to be accessible in the browser
- `HCAPTCHA_SECRET_KEY` is server-side only and should NEVER be exposed to the client
- Keep your secret key secure - never commit it to version control
- Use different keys for development and production environments

### Production Deployment

When deploying to production (Vercel, Netlify, etc.):

1. Add both environment variables to your hosting platform
2. Make sure to add your production domain to the hCaptcha site configuration
3. Restart your application after adding the variables

## How It Works

### Frontend (User Experience)

When CAPTCHA is enabled, users will see:
1. A checkbox or challenge widget below the form fields
2. The submit button is disabled until CAPTCHA is completed
3. On successful verification, the form can be submitted
4. If verification expires or fails, users must re-verify

### Backend (Security)

The server validates each submission:
1. Checks if CAPTCHA token is present (when configured)
2. Verifies the token with hCaptcha's API using your secret key
3. Validates the client's IP address
4. Only processes the request if CAPTCHA verification succeeds
5. Returns a 400 error if CAPTCHA fails

### Development Mode

If environment variables are not configured:
- Frontend: CAPTCHA widget will NOT appear
- Backend: Requests will be processed normally with a warning log
- This allows development without CAPTCHA keys

## Testing

### Local Testing (Without Keys)

1. Forms work normally without CAPTCHA widget
2. No CAPTCHA verification is performed
3. Check logs for: `[CAPTCHA] Secret key not configured, skipping verification`

### Local Testing (With Keys)

1. Add test keys from hCaptcha dashboard
2. Add `localhost` to your hCaptcha site hostnames
3. Forms will show CAPTCHA widget
4. Complete CAPTCHA to submit forms
5. Invalid/missing tokens will be rejected with error message

### Production Testing

1. Deploy with production keys
2. Ensure production domain is added to hCaptcha site configuration
3. Test booking flow end-to-end
4. Test form submission
5. Verify invalid CAPTCHA attempts are blocked

## Troubleshooting

### CAPTCHA Widget Not Showing

- Verify `NEXT_PUBLIC_HCAPTCHA_SITE_KEY` is set in `.env`
- Check the environment variable starts with `NEXT_PUBLIC_`
- Restart your development server after adding variables
- Clear browser cache and hard refresh

### "CAPTCHA verification required" Error

- This means the backend expects CAPTCHA but didn't receive a token
- Check that frontend is sending `captchaToken` in the request body
- Verify site key matches between frontend and hCaptcha dashboard

### "CAPTCHA verification failed" Error

- Invalid or expired CAPTCHA token
- Check that your secret key is correct
- Verify your domain is whitelisted in hCaptcha settings
- Token can only be used once - form must get a new token after errors

### Forms Not Working After Adding Keys

- Ensure both `NEXT_PUBLIC_HCAPTCHA_SITE_KEY` and `HCAPTCHA_SECRET_KEY` are set
- Verify keys are from the same hCaptcha site
- Check server logs for specific error messages
- Restart application after changing environment variables

## Security Best Practices

1. **Never expose your secret key** - it should only be in server-side code and environment variables
2. **Use different keys** for development and production
3. **Rotate keys periodically** - you can generate new keys in the hCaptcha dashboard
4. **Monitor failed attempts** - check your hCaptcha dashboard for abuse patterns
5. **Keep rate limiting enabled** - CAPTCHA works alongside existing rate limits for defense in depth

## Rate Limiting + CAPTCHA

This application uses both CAPTCHA and rate limiting for comprehensive protection:

- **CAPTCHA**: Prevents automated bots from submitting forms
- **Rate Limiting**: Prevents abuse even from human attackers
- **Order**: CAPTCHA is verified BEFORE rate limiting to prevent bypass attempts

Both layers work together to provide robust protection.

## API Endpoints Protected

### Booking Endpoint
- **Route**: `POST /api/appointments/book`
- **Required Field**: `captchaToken` (when CAPTCHA_SECRET_KEY is configured)
- **Error**: Returns 400 if CAPTCHA fails

### Form Submission Endpoint
- **Route**: `POST /api/forms/submit`
- **Required Field**: `captchaToken` (when CAPTCHA_SECRET_KEY is configured)
- **Error**: Returns 400 if CAPTCHA fails

## Monitoring

Check your hCaptcha dashboard for:
- Request volume
- Pass/fail rates
- Potential bot patterns
- Geographic distribution of requests

Visit: [https://dashboard.hcaptcha.com/stats](https://dashboard.hcaptcha.com/stats)

## Need Help?

- hCaptcha Documentation: [https://docs.hcaptcha.com](https://docs.hcaptcha.com)
- hCaptcha Support: [https://www.hcaptcha.com/support](https://www.hcaptcha.com/support)
- React Integration Docs: [https://docs.hcaptcha.com/sdk/react](https://docs.hcaptcha.com/sdk/react)

## Implementation Details

### Files Modified

1. **Frontend Components**:
   - `app/book/[widgetId]/page.tsx` - Main booking form
   - `app/embed/booking/[widgetId]/page.tsx` - Embedded booking widget

2. **Backend API Routes**:
   - `app/api/appointments/book/route.ts` - Booking endpoint
   - `app/api/forms/submit/route.ts` - Form submission endpoint

3. **Utilities**:
   - `lib/captcha.ts` - CAPTCHA verification helper

4. **Configuration**:
   - `.env` - Environment variables

### Code Example

Frontend usage:
```typescript
import HCaptcha from '@hcaptcha/react-hcaptcha';

// In component
const [captchaToken, setCaptchaToken] = useState('');
const captchaRef = useRef<HCaptcha>(null);

// In JSX
{process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY && (
  <HCaptcha
    ref={captchaRef}
    sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY}
    onVerify={(token) => setCaptchaToken(token)}
    onExpire={() => setCaptchaToken('')}
    onError={() => setCaptchaToken('')}
  />
)}

// In submit handler
body: JSON.stringify({
  ...formData,
  captchaToken: captchaToken || undefined,
})
```

Backend usage:
```typescript
import { verifyCaptcha } from '@/lib/captcha';

// In route handler
if (process.env.HCAPTCHA_SECRET_KEY) {
  const captchaValid = await verifyCaptcha(body.captchaToken, clientIp);
  if (!captchaValid) {
    return NextResponse.json(
      { error: 'CAPTCHA verification failed.' },
      { status: 400 }
    );
  }
}
```

## Conclusion

hCaptcha protection is now active on all public forms. Configure your keys to enable it in production, or leave unconfigured for development use. The system provides robust bot protection while maintaining a smooth user experience.
