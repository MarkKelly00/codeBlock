# Sale Discount Lock

> A Shopify App Store app that blocks discount codes during sales while keeping gift cards active.

[![Shopify App Store](https://img.shields.io/badge/Shopify-App%20Store-green)](https://apps.shopify.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## 🎯 What It Does

**Sale Discount Lock** is a Shopify checkout extension that helps merchants protect their profit margins during sales events:

- **🔒 Block Discount Codes**: Automatically removes discount codes when Sale Mode is enabled
- **🎁 Preserve Gift Cards**: Gift cards always work, regardless of Sale Mode
- **💬 Custom Messaging**: Show customers a customizable banner explaining why discounts are disabled
- **⚡ One-Click Toggle**: Enable/disable Sale Mode instantly from the Checkout Editor

## 📋 Features

| Feature | Description |
|---------|-------------|
| Automatic Blocking | Instantly removes any applied discount codes |
| Gift Card Support | Never affects gift cards - they always work |
| Custom Banner | Configurable message shown to customers |
| Easy Toggle | No code deploy needed - toggle in Checkout Editor |
| Multiple Targets | Works in order summary and as a placeable block |

## 💰 Pricing

| Plan | Price | Features |
|------|-------|----------|
| **Basic** | $2.99/month | Full discount blocking, custom messaging, email support |
| **Pro** | $4.99/month | Everything in Basic + priority support, analytics |

All plans include a **14-day free trial**.

## 🚀 Installation

### For Merchants

1. Install from the [Shopify App Store](#)
2. Go to **Settings → Checkout → Customize**
3. Add "Sale Discount Lock" from the Apps section
4. Enable Sale Mode and customize your message
5. Save and publish!

### For Developers

#### Prerequisites

- Node.js 18+
- Shopify Partner account
- Shopify CLI (`npm install -g @shopify/cli`)

#### Setup

```bash
# Clone the repository
git clone https://github.com/MarkKelly00/codeBlock.git
cd codeBlock

# Install dependencies
npm install
cd web && npm install && cd ..

# Link to your Shopify app
shopify app link

# Start development
shopify app dev
```

#### Deployment

The app is configured for deployment on [Fly.io](https://fly.io):

```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Login to Fly
fly auth login

# Deploy
fly deploy
```

## 📁 Project Structure

```
sale-discount-lock/
├── extensions/
│   └── checkout-ui/
│       ├── Extension.jsx    # Checkout UI extension
│       ├── package.json
│       └── shopify.extension.toml
├── web/
│   ├── index.js             # Express server (OAuth, webhooks, billing)
│   └── package.json
├── shopify.app.toml         # Shopify app configuration
├── fly.toml                 # Fly.io deployment config
├── Dockerfile
└── package.json
```

## 🔧 Configuration

### Environment Variables

Copy `env.example` to `.env` and fill in your credentials:

```env
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_api_secret
HOST=https://your-app-domain.com
```

### Extension Settings

Merchants configure these in the Checkout Editor:

| Setting | Type | Description |
|---------|------|-------------|
| Enable Sale Mode | Boolean | Toggle discount blocking on/off |
| Sale banner message | Text | Custom message shown to customers |

## 🔐 Security & Compliance

- **GDPR Compliant**: Implements all required compliance webhooks
- **No Customer Data**: Extension doesn't collect or store customer data
- **Secure Auth**: Uses Shopify OAuth and session tokens
- **Minimal Scopes**: Only requests necessary permissions

## 📚 Documentation

- [Setup Guide](SETUP.md)
- [Merchant Guide](MERCHANT_GUIDE.md)
- [Limitations](LIMITATIONS.md)
- [Privacy Policy](/privacy)
- [Terms of Service](/terms)

## 🤝 Support

- **Email**: support@codeblock.app
- **Issues**: [GitHub Issues](https://github.com/MarkKelly00/codeBlock/issues)

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙏 Credits

Built with:
- [Shopify CLI](https://shopify.dev/docs/apps/tools/cli)
- [Checkout UI Extensions](https://shopify.dev/docs/api/checkout-ui-extensions)
- [Shopify App Express](https://github.com/Shopify/shopify-app-js)
- [Fly.io](https://fly.io)

---

Made with ❤️ by [Mark Kelly](https://github.com/MarkKelly00)
