# Cloudflare Pages Staging Deployment Checklist

## Prerequisites ✅

- [x] Cloudflare account created
- [x] Wrangler CLI installed and authenticated
- [x] Build scripts added to package.json
- [ ] Domain purchased and ready to add to Cloudflare

---

## Step 1: Add Domain to Cloudflare

1. Go to https://dash.cloudflare.com
2. Click **Add a Site**
3. Enter your domain name
4. Select **Free** plan
5. Review DNS records (Cloudflare will scan existing records)
6. Click **Continue**
7. **Update nameservers** at your domain registrar:
   - Copy the 2 nameservers provided by Cloudflare
   - Log in to your domain registrar (GoDaddy, Namecheap, etc.)
   - Replace existing nameservers with Cloudflare's nameservers
   - Save changes
8. Wait for nameserver propagation (can take up to 24-48 hours, usually much faster)
9. Return to Cloudflare and click **Done, check nameservers**

---

## Step 2: Create DNS Record for Staging Subdomain

In Cloudflare Dashboard:

1. Select your domain
2. Go to **DNS** > **Records**
3. Click **Add record**
4. Configure:
   - **Type**: `CNAME`
   - **Name**: `staging`
   - **Target**: `calendar-widget-staging.pages.dev` (your Pages project URL)
   - **Proxy status**: **Proxied** (orange cloud icon)
   - **TTL**: `Auto`
5. Click **Save**

---

## Step 3: Create Cloudflare Pages Project

### Option A: Via Dashboard (Recommended)

1. In Cloudflare Dashboard, go to **Workers & Pages**
2. Click **Create application**
3. Select **Pages** tab
4. Click **Connect to Git**
5. Authorize GitHub/GitLab if needed
6. Select your repository: `calendar-widget`
7. Configure build settings:
   - **Project name**: `calendar-widget-staging`
   - **Production branch**: `main`
   - **Preview branches**: `staging` (or All branches)
   - **Framework preset**: `Next.js`
   - **Build command**: `npm run pages:build`
   - **Build output directory**: `.vercel/output/static`
8. Click **Save and Deploy**

### Option B: Via CLI

```bash
# Create the project first in dashboard, then deploy via CLI
npm run pages:deploy:staging
```

---

## Step 4: Configure Environment Variables

In Cloudflare Dashboard:

1. Go to **Workers & Pages** > Select `calendar-widget-staging`
2. Go to **Settings** > **Environment variables**
3. Select **Preview** environment (for staging)
4. Add each variable below by clicking **Add variable**:

### Required Variables

#### Database
- `DATABASE_URL` = `your-database-connection-string` (copy from .env.local)

#### Clerk Authentication
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` = `your-clerk-publishable-key` (copy from .env.local)
- `CLERK_SECRET_KEY` = `your-clerk-secret-key` (copy from .env.local)
- `CLERK_WEBHOOK_SECRET` = `your-clerk-webhook-secret` (copy from .env.local)

#### Stripe Payments
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` = `your-stripe-publishable-key` (copy from .env.local)
- `STRIPE_SECRET_KEY` = `your-stripe-secret-key` (copy from .env.local)
- `STRIPE_WEBHOOK_SECRET` = `your-stripe-webhook-secret` (copy from .env.local)

#### Stripe Price IDs
Copy all `STRIPE_PRICE_*` variables from your `.env.local` file

#### Upstash Redis (Rate Limiting)
- `UPSTASH_REDIS_REST_URL` = `your-upstash-url` (copy from .env.local)
- `UPSTASH_REDIS_REST_TOKEN` = `your-upstash-token` (copy from .env.local)

#### Security
- `ENCRYPTION_KEY` = `your-encryption-key` (copy from .env.local)

#### App Configuration
- `NODE_ENV` = `staging`
- `NEXT_PUBLIC_APP_URL` = `https://staging.yourdomain.com` (replace with your actual domain)

#### Optional (if using)
- `ANTHROPIC_API_KEY` = `your-anthropic-key` (copy from .env.local if using)
- `GOOGLE_CLIENT_ID` = `your-google-client-id` (copy from .env.local if using)
- `GOOGLE_CLIENT_SECRET` = `your-google-client-secret` (copy from .env.local if using)
- `NEXTAUTH_SECRET` = `your-nextauth-secret` (if still using NextAuth)
- `NEXTAUTH_URL` = `https://staging.yourdomain.com`

5. Click **Save** after adding all variables

---

## Step 5: Update Webhook URLs

### Clerk Webhook

1. Go to https://dashboard.clerk.com
2. Select your application
3. Go to **Webhooks** in the sidebar
4. Click **Add Endpoint** (or edit existing)
5. Set **Endpoint URL** to: `https://staging.yourdomain.com/api/webhooks/clerk`
6. Select events:
   - `user.created`
   - `user.updated`
   - `user.deleted`
7. Click **Create**
8. Copy the **Signing Secret** and update `CLERK_WEBHOOK_SECRET` in Cloudflare if different

### Stripe Webhook

1. Go to https://dashboard.stripe.com/test/webhooks
2. Click **Add endpoint**
3. Set **Endpoint URL** to: `https://staging.yourdomain.com/api/webhooks/stripe`
4. Click **Select events** and choose:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Click **Add endpoint**
6. Click **Reveal** to see the webhook signing secret
7. Update `STRIPE_WEBHOOK_SECRET` in Cloudflare if the secret is different

---

## Step 6: Deploy to Staging

### Option A: Git Push (if using Git integration)

```bash
# Create staging branch if it doesn't exist
git checkout -b staging

# Push to trigger automatic deployment
git push origin staging
```

### Option B: Direct Deploy via CLI

```bash
npm run pages:deploy:staging
```

---

## Step 7: Verify Deployment

1. Wait for build to complete (check **Workers & Pages** > **Deployments**)
2. Visit your staging URL: `https://staging.yourdomain.com`
3. Test key functionality:
   - [ ] Homepage loads
   - [ ] User authentication (Clerk) works
   - [ ] Database queries work
   - [ ] Stripe checkout works
   - [ ] Webhooks are received (check logs)

---

## Troubleshooting

### Build Fails

- Check build logs in Cloudflare Dashboard
- Ensure all environment variables are set
- Verify build command is correct: `npm run pages:build`

### Environment Variables Not Working

- Make sure variables are set for **Preview** environment, not just **Production**
- Try redeploying after adding variables
- Check for typos in variable names

### DNS Not Resolving

- Verify nameservers are properly updated
- Check DNS propagation: https://www.whatsmydns.net/
- Wait up to 24-48 hours for full propagation

### Webhooks Not Working

- Verify webhook URLs are correct
- Check webhook signing secrets match
- Review application logs for webhook errors
- Test webhooks using Stripe/Clerk dashboard webhook testing tools

---

## Production Deployment (When Ready)

1. Create CNAME record for your root domain (or www subdomain)
2. Update environment variables for **Production** environment
3. Deploy to production:
   ```bash
   npm run pages:deploy:production
   ```
   Or push to `main` branch if using Git integration

---

## Useful Commands

```bash
# Build for Cloudflare Pages locally
npm run pages:build

# Preview build locally
npm run pages:preview

# Deploy to staging
npm run pages:deploy:staging

# Deploy to production
npm run pages:deploy:production

# View Wrangler help
npx wrangler pages --help
```

---

## Additional Resources

- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Next.js on Cloudflare Pages](https://developers.cloudflare.com/pages/framework-guides/nextjs/)
- [Wrangler CLI Docs](https://developers.cloudflare.com/workers/wrangler/)
- [Environment Variables](https://developers.cloudflare.com/pages/configuration/build-configuration/#environment-variables)

---

**Note**: Remember to keep your `.env.local` file secure and never commit it to git. The environment variables in Cloudflare are encrypted and securely stored.
