# Deployment Guide

This guide covers deploying Sale Discount Lock to production for the Shopify App Store.

## Prerequisites

1. **Shopify Partner Account** - [Create one here](https://partners.shopify.com)
2. **Fly.io Account** - [Sign up here](https://fly.io) (free tier available)
3. **Node.js 18+** installed locally
4. **Shopify CLI** installed: `npm install -g @shopify/cli`

## Step 1: Create Shopify App in Partner Dashboard

1. Go to [Shopify Partners](https://partners.shopify.com)
2. Click **Apps** → **Create app**
3. Choose **Create app manually**
4. Fill in:
   - App name: `Sale Discount Lock`
   - App URL: `https://sale-discount-lock.fly.dev` (we'll create this)
   - Redirect URLs: `https://sale-discount-lock.fly.dev/api/auth/callback`

5. Note your **API Key** and **API Secret Key**

## Step 2: Configure Local Environment

```bash
# Clone the repo
git clone https://github.com/MarkKelly00/codeBlock.git
cd codeBlock

# Copy environment template
cp env.example .env

# Edit .env with your credentials
# SHOPIFY_API_KEY=your_key
# SHOPIFY_API_SECRET=your_secret
```

## Step 3: Deploy to Fly.io

### Install Fly CLI

```bash
# macOS
brew install flyctl

# or use the install script
curl -L https://fly.io/install.sh | sh
```

### Create and Deploy App

```bash
# Login to Fly
fly auth login

# Create the app (first time only)
fly apps create sale-discount-lock

# Set secrets
fly secrets set SHOPIFY_API_KEY=your_api_key
fly secrets set SHOPIFY_API_SECRET=your_api_secret

# Deploy
fly deploy
```

### Verify Deployment

```bash
# Check app status
fly status

# View logs
fly logs

# Open the app
fly open
```

Your app should now be live at `https://sale-discount-lock.fly.dev`

## Step 4: Update Shopify App URLs

1. Go back to Partner Dashboard → Apps → Sale Discount Lock
2. Update URLs:
   - **App URL**: `https://sale-discount-lock.fly.dev`
   - **Allowed redirection URLs**: `https://sale-discount-lock.fly.dev/api/auth/callback`

## Step 5: Configure Webhooks

In Partner Dashboard → Apps → Sale Discount Lock → App Setup:

Add these webhook endpoints:

| Topic | URL |
|-------|-----|
| `customers/data_request` | `https://sale-discount-lock.fly.dev/api/webhooks/customers/data_request` |
| `customers/redact` | `https://sale-discount-lock.fly.dev/api/webhooks/customers/redact` |
| `shop/redact` | `https://sale-discount-lock.fly.dev/api/webhooks/shop/redact` |
| `app/uninstalled` | `https://sale-discount-lock.fly.dev/api/webhooks/app/uninstalled` |

## Step 6: Deploy Extension

```bash
# Link to your app
shopify app link

# Deploy the extension
shopify app deploy
```

## Step 7: Test Installation

1. Create a development store in Partner Dashboard
2. Install your app on the development store
3. Go to Settings → Checkout → Customize
4. Add the Sale Discount Lock extension
5. Enable Sale Mode and test checkout

## Step 8: Submit for App Store Review

### Prepare Listing Assets

1. **App Icon**: 1200x1200px PNG/JPEG
2. **Feature Image**: 1600x900px
3. **Screenshots**: 1600x900px (3-6 images)
4. **Demo Store URL**: Your development store

### Complete App Listing

In Partner Dashboard → Apps → Distribution → Manage listing:

1. **App name**: Sale Discount Lock
2. **Tagline**: Block discount codes during sales, keep gift cards working
3. **Category**: Checkout
4. **Description**: (Use content from README)
5. **Pricing**: Set up Basic ($2.99) and Pro ($4.99) plans
6. **Privacy Policy URL**: `https://sale-discount-lock.fly.dev/privacy`
7. **Support email**: support@codeblock.app

### Submit for Review

1. Complete all required fields
2. Provide testing instructions
3. Include a screencast showing the app in action
4. Click **Submit for review**

## Monitoring & Maintenance

### View Logs

```bash
fly logs -a sale-discount-lock
```

### Scale Resources

```bash
# Scale memory
fly scale memory 512 -a sale-discount-lock

# Scale instances
fly scale count 2 -a sale-discount-lock
```

### Update Deployment

```bash
# Make changes, then:
fly deploy
```

## Troubleshooting

### App not loading in admin

- Check webhook URLs are correct
- Verify SHOPIFY_API_KEY and SHOPIFY_API_SECRET are set
- Check Fly logs for errors

### Extension not appearing

- Run `shopify app deploy` to push extension
- Verify extension is enabled in Checkout Editor
- Check browser console for errors

### Billing not working

- Verify app has billing scopes
- Check test mode setting matches environment
- Review Fly logs for billing API errors

## Cost Estimates

### Fly.io (Hosting)

- **Free tier**: 3 shared-cpu-1x VMs with 256MB RAM
- **Paid**: ~$5-10/month for production workloads

### Shopify Revenue Share

- Shopify takes 20% of app revenue (15% for Shopify Plus)
- Your net revenue: ~$2.39/month (Basic) or ~$3.99/month (Pro)

---

For questions, contact support@codeblock.app

