# Setup Guide

This guide walks you through setting up the Sale Discount Lock extension from scratch.

## Prerequisites

Before you begin, ensure you have:

1. **Shopify Partner Account** - [Create one here](https://partners.shopify.com/signup)
2. **Development Store** - Create from your Partner Dashboard
3. **Node.js** - Version 18+ recommended
4. **Shopify CLI** - Install with `npm install -g @shopify/cli@latest`

## Step-by-Step Setup

### 1. Install Dependencies

```bash
cd sale-discount-lock
npm install
```

### 2. Authenticate with Shopify

```bash
shopify auth login
```

This will open a browser window for you to log in to your Partner account.

### 3. Create or Link Your App

```bash
shopify app link
```

You'll be prompted to either:
- **Create a new app** in your Partner Dashboard
- **Link to an existing app**

Choose the option that fits your needs.

### 4. Update Configuration

After linking, update `shopify.app.toml` with your app's details:

```toml
name = "sale-discount-lock"
client_id = "YOUR_CLIENT_ID" # Auto-filled by CLI
application_url = "https://your-app-url.com"

[auth]
redirect_urls = [
  "https://your-app-url.com/auth/callback"
]
```

### 5. Start Development Server

```bash
shopify app dev
```

This command will:
1. Build your extension
2. Start a local development server
3. Provide you with a preview URL
4. Open your development store

### 6. Install in Development Store

When prompted, install the app on your development store.

### 7. Configure in Checkout Editor

1. Go to your store admin: **Settings** → **Checkout**
2. Click **Customize** to open the Checkout Editor
3. Find your extension in the left sidebar under **App blocks**
4. Drag "Sale Discount Lock" to your desired location
5. Configure the settings:
   - Toggle **Enable Sale Mode** ON to test
   - Customize the **Sale banner message** if desired
6. Click **Save**

### 8. Test the Extension

1. Add items to your cart
2. Go to checkout
3. Try applying a discount code
4. If Sale Mode is ON, the code should be removed and banner should appear
5. Try applying a gift card - it should work normally

## Testing Checklist

Use this checklist to verify everything works:

- [ ] Extension appears in Checkout Editor
- [ ] Settings can be configured in Checkout Editor
- [ ] When Sale Mode is OFF, discount codes work normally
- [ ] When Sale Mode is ON:
  - [ ] Discount codes are removed automatically
  - [ ] Banner message appears
  - [ ] Gift cards still work
  - [ ] Checkout can still be completed
- [ ] No console errors appear

## Deployment

When you're ready to deploy to production:

### 1. Deploy the Extension

```bash
shopify app deploy
```

This will:
- Build production version
- Upload to Shopify
- Create a new version in Partner Dashboard

### 2. Create App Listing (Optional)

If you want to make this available to other merchants:

1. Go to Partner Dashboard
2. Select your app
3. Click **Distribution** → **Create listing**
4. Fill out the required information
5. Submit for review

### 3. Install on Production Store

For your own store:

1. Go to Partner Dashboard
2. Select your app
3. Click **Test your app**
4. Select your production store
5. Install and configure as you did in development

## Troubleshooting

### Extension Not Showing in Checkout Editor

**Possible causes:**
- Extension hasn't been deployed yet
- App isn't installed on the store
- Checkout customizations are disabled

**Solutions:**
1. Run `shopify app deploy`
2. Reinstall the app on your store
3. Check store settings for checkout customization permissions

### Discount Codes Not Being Removed

**Possible causes:**
- Sale Mode is OFF
- Testing in accelerated checkout (Apple Pay, Google Pay)
- `canUpdateDiscountCodes` is false

**Solutions:**
1. Verify Sale Mode is enabled in Checkout Editor
2. Test with standard checkout flow (not accelerated)
3. Check browser console for error messages

### Changes Not Appearing

**Possible causes:**
- Browser cache
- Shopify's CDN cache
- Old version of extension still loaded

**Solutions:**
1. Hard refresh browser (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)
2. Clear browser cache
3. Wait a few minutes for CDN to update
4. Try in incognito/private browsing mode

### Local Development Issues

**Common issues:**

```bash
# If you get authentication errors
shopify auth logout
shopify auth login

# If you get port conflicts
shopify app dev --port 3457

# If you need to reset everything
shopify app dev --reset
```

## Advanced Configuration

### Custom Styling

The extension uses Polaris web components which inherit the store's checkout theme. You cannot add custom CSS, but you can:

- Change the banner `tone` (info, warning, critical, success)
- Adjust the message text
- Choose different placement targets

### Multiple Targets

The extension targets both:
1. `purchase.checkout.block.render` - Merchant controlled placement
2. `purchase.checkout.reductions.render-after` - Fixed placement near discounts

You can modify `shopify.extension.toml` to change or add targets:

```toml
[[extensions.targeting]]
target = "purchase.checkout.actions.render-before"
module = "./Extension.jsx"
```

See [all available targets](https://shopify.dev/docs/api/checkout-ui-extensions/extension-targets-overview).

### Additional Settings

You can add more merchant-configurable settings in `shopify.extension.toml`:

```toml
[[extensions.settings.fields]]
key = "show_icon"
type = "boolean"
name = "Show warning icon"
description = "Display an icon in the banner"
```

Then use in your extension:

```javascript
const showIcon = settings.show_icon;
```

## Support Resources

- [Shopify Dev Docs](https://shopify.dev/)
- [Checkout UI Extensions Reference](https://shopify.dev/docs/api/checkout-ui-extensions)
- [Shopify CLI Documentation](https://shopify.dev/docs/apps/tools/cli)
- [Shopify Community Forums](https://community.shopify.com/)
- [Shopify Partners Slack](https://partners.shopify.com/slack)

## Next Steps

After successful setup:

1. **Test thoroughly** with different scenarios
2. **Document any custom changes** you make
3. **Set up monitoring** for production
4. **Plan for updates** and maintenance
5. **Gather feedback** from merchants

Happy building! 🚀

