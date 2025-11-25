import Shopify from '@shopify/shopify-api';

// Initialize Shopify API
const shopify = new Shopify.Shopify({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET,
  scopes: ['read_checkouts', 'write_checkouts'],
  hostName: process.env.HOST?.replace('https://', '') || 'code-block.vercel.app',
  isEmbeddedApp: true,
  apiVersion: '2024-10',
});

// Billing plans configuration
const BILLING_PLANS = {
  'Basic Plan': {
    amount: 2.99,
    currencyCode: 'USD',
    interval: 'EVERY_30_DAYS',
    trialDays: 14,
  },
  'Pro Plan': {
    amount: 4.99,
    currencyCode: 'USD',
    interval: 'EVERY_30_DAYS',
    trialDays: 14,
  },
};

export default async function handler(req, res) {
  const { method, url } = req;
  const path = url.split('?')[0];

  // Health check
  if (path === '/api/health' || path === '/health') {
    return res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  }

  // Privacy Policy
  if (path === '/privacy') {
    return res.status(200).send(getPrivacyPolicy());
  }

  // Terms of Service
  if (path === '/terms') {
    return res.status(200).send(getTermsOfService());
  }

  // App Home
  if (path === '/' || path === '/api' || path === '/api/index') {
    return res.status(200).send(getAppHome());
  }

  // OAuth Start
  if (path === '/api/auth') {
    const shop = req.query.shop;
    if (!shop) {
      return res.status(400).json({ error: 'Missing shop parameter' });
    }
    
    const authUrl = await shopify.auth.begin({
      shop,
      callbackPath: '/api/auth/callback',
      isOnline: false,
    });
    
    return res.redirect(authUrl);
  }

  // OAuth Callback
  if (path === '/api/auth/callback') {
    try {
      const callback = await shopify.auth.callback({
        rawRequest: req,
        rawResponse: res,
      });
      
      // Redirect to app in admin
      const shop = callback.session.shop;
      return res.redirect(`https://${shop}/admin/apps/${process.env.SHOPIFY_API_KEY}`);
    } catch (error) {
      console.error('OAuth callback error:', error);
      return res.status(500).json({ error: 'OAuth failed' });
    }
  }

  // GDPR Webhooks
  if (path === '/api/webhooks/customers/data_request') {
    console.log('[GDPR] Customer data request received');
    return res.status(200).json({ success: true });
  }

  if (path === '/api/webhooks/customers/redact') {
    console.log('[GDPR] Customer redact request received');
    return res.status(200).json({ success: true });
  }

  if (path === '/api/webhooks/shop/redact') {
    console.log('[GDPR] Shop redact request received');
    return res.status(200).json({ success: true });
  }

  if (path === '/api/webhooks/app/uninstalled') {
    console.log('[Webhook] App uninstalled');
    return res.status(200).json({ success: true });
  }

  // Default 404
  return res.status(404).json({ error: 'Not found' });
}

function getPrivacyPolicy() {
  const date = new Date().toLocaleDateString();
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Privacy Policy - Sale Discount Lock</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.6; }
        h1 { margin-bottom: 20px; }
        h2 { margin-top: 30px; margin-bottom: 10px; }
        p { margin-bottom: 15px; color: #333; }
        .updated { color: #666; font-size: 14px; margin-bottom: 30px; }
      </style>
    </head>
    <body>
      <h1>Privacy Policy</h1>
      <p class="updated">Last updated: ${date}</p>
      
      <h2>Introduction</h2>
      <p>Sale Discount Lock ("we", "our", or "the App") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard information when you use our Shopify application.</p>
      
      <h2>Information We Collect</h2>
      <p><strong>Store Information:</strong> When you install our app, we receive basic store information from Shopify including your store name, domain, and email address. This is required for app functionality and communication.</p>
      <p><strong>Checkout Data:</strong> Our checkout extension operates entirely within Shopify's checkout environment. We do not collect, store, or transmit any customer personal data, payment information, or order details.</p>
      
      <h2>How We Use Information</h2>
      <p>We use store information solely to:</p>
      <ul>
        <li>Provide and maintain the App functionality</li>
        <li>Process billing through Shopify's Billing API</li>
        <li>Send important service updates</li>
        <li>Provide customer support</li>
      </ul>
      
      <h2>Data Storage</h2>
      <p>We store minimal data required for app operation:</p>
      <ul>
        <li>Shopify session tokens (for authentication)</li>
        <li>Billing subscription status</li>
      </ul>
      <p>We do NOT store customer data, order information, or payment details.</p>
      
      <h2>Data Sharing</h2>
      <p>We do not sell, trade, or share your information with third parties except:</p>
      <ul>
        <li>Shopify (as required for app functionality)</li>
        <li>When required by law</li>
      </ul>
      
      <h2>GDPR Compliance</h2>
      <p>We comply with GDPR requirements. You have the right to:</p>
      <ul>
        <li>Access your data</li>
        <li>Request data deletion</li>
        <li>Request data portability</li>
      </ul>
      <p>To exercise these rights, contact us at support@codeblock.app</p>
      
      <h2>Data Retention</h2>
      <p>We retain store data only while your app is installed. Upon uninstallation, we delete all associated data within 48 hours.</p>
      
      <h2>Security</h2>
      <p>We implement industry-standard security measures including encrypted connections (HTTPS) and secure authentication via Shopify's OAuth system.</p>
      
      <h2>Changes to This Policy</h2>
      <p>We may update this Privacy Policy periodically. We will notify you of significant changes via email or in-app notification.</p>
      
      <h2>Contact Us</h2>
      <p>For privacy-related questions, contact us at:<br>
      Email: support@codeblock.app</p>
    </body>
    </html>
  `;
}

function getTermsOfService() {
  const date = new Date().toLocaleDateString();
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Terms of Service - Sale Discount Lock</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.6; }
        h1 { margin-bottom: 20px; }
        h2 { margin-top: 30px; margin-bottom: 10px; }
        p { margin-bottom: 15px; color: #333; }
        .updated { color: #666; font-size: 14px; margin-bottom: 30px; }
      </style>
    </head>
    <body>
      <h1>Terms of Service</h1>
      <p class="updated">Last updated: ${date}</p>
      
      <h2>1. Acceptance of Terms</h2>
      <p>By installing and using Sale Discount Lock ("the App"), you agree to these Terms of Service. If you do not agree, please uninstall the App.</p>
      
      <h2>2. Description of Service</h2>
      <p>Sale Discount Lock is a Shopify checkout extension that allows merchants to block discount codes during sales while preserving gift card functionality.</p>
      
      <h2>3. Subscription and Billing</h2>
      <p>The App offers paid subscription plans billed through Shopify's Billing API. All charges appear on your Shopify invoice. Subscriptions include a 14-day free trial. You may cancel at any time through the App or Shopify admin.</p>
      
      <h2>4. Limitations</h2>
      <p>The App operates within Shopify's checkout extension framework and is subject to platform limitations:</p>
      <ul>
        <li>Cannot hide the discount code input field</li>
        <li>May not function in all accelerated checkout scenarios (Apple Pay, Google Pay)</li>
        <li>Operates on a best-effort basis for discount removal</li>
      </ul>
      
      <h2>5. Disclaimer of Warranties</h2>
      <p>THE APP IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. We do not guarantee uninterrupted or error-free operation.</p>
      
      <h2>6. Limitation of Liability</h2>
      <p>We shall not be liable for any indirect, incidental, special, or consequential damages arising from App use.</p>
      
      <h2>7. Modifications</h2>
      <p>We reserve the right to modify these terms at any time. Continued use after changes constitutes acceptance.</p>
      
      <h2>8. Termination</h2>
      <p>We may terminate or suspend access to the App at our discretion, with or without notice.</p>
      
      <h2>9. Contact</h2>
      <p>For questions about these terms, contact us at support@codeblock.app</p>
    </body>
    </html>
  `;
}

function getAppHome() {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Sale Discount Lock</title>
      <script src="https://cdn.shopify.com/shopifycloud/app-bridge.js"></script>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: #f6f6f7;
          color: #202223;
          line-height: 1.5;
        }
        .container { max-width: 800px; margin: 0 auto; padding: 20px; }
        .card {
          background: white;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          padding: 24px;
          margin-bottom: 20px;
        }
        h1 { font-size: 24px; margin-bottom: 8px; }
        h2 { font-size: 18px; margin-bottom: 12px; color: #6d7175; }
        .subtitle { color: #6d7175; margin-bottom: 20px; }
        .feature { display: flex; align-items: flex-start; margin-bottom: 16px; }
        .feature-icon { 
          width: 24px; height: 24px; 
          background: #008060; 
          border-radius: 50%; 
          margin-right: 12px;
          display: flex; align-items: center; justify-content: center;
          color: white; font-size: 14px; flex-shrink: 0;
        }
        .feature-text h3 { font-size: 14px; font-weight: 600; margin-bottom: 4px; }
        .feature-text p { font-size: 14px; color: #6d7175; }
        .btn {
          display: inline-block;
          background: #008060;
          color: white;
          padding: 10px 20px;
          border-radius: 4px;
          text-decoration: none;
          font-weight: 500;
          border: none;
          cursor: pointer;
        }
        .btn:hover { background: #006e52; }
        .steps { counter-reset: step; }
        .step { 
          display: flex; 
          margin-bottom: 16px;
          padding-left: 40px;
          position: relative;
        }
        .step::before {
          counter-increment: step;
          content: counter(step);
          position: absolute;
          left: 0;
          width: 28px; height: 28px;
          background: #008060;
          color: white;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; font-weight: 600;
        }
        .step-content h3 { font-size: 14px; font-weight: 600; margin-bottom: 4px; }
        .step-content p { font-size: 14px; color: #6d7175; }
        .pricing { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-top: 16px; }
        .plan {
          border: 1px solid #c9cccf;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
        }
        .plan.featured { border-color: #008060; border-width: 2px; }
        .plan-name { font-weight: 600; margin-bottom: 8px; }
        .plan-price { font-size: 28px; font-weight: 700; color: #008060; }
        .plan-price span { font-size: 14px; font-weight: 400; color: #6d7175; }
        .plan-features { text-align: left; margin: 16px 0; font-size: 14px; }
        .plan-features li { margin-bottom: 8px; list-style: none; }
        .plan-features li::before { content: "✓ "; color: #008060; }
        .badge { 
          background: #008060; 
          color: white; 
          font-size: 11px; 
          padding: 2px 8px; 
          border-radius: 10px;
          margin-left: 8px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="card">
          <h1>🔒 Sale Discount Lock</h1>
          <p class="subtitle">Block discount codes during sales while keeping gift cards active</p>
          
          <div class="feature">
            <div class="feature-icon">✓</div>
            <div class="feature-text">
              <h3>Automatic Discount Blocking</h3>
              <p>Instantly removes discount codes when Sale Mode is enabled</p>
            </div>
          </div>
          
          <div class="feature">
            <div class="feature-icon">✓</div>
            <div class="feature-text">
              <h3>Gift Cards Always Work</h3>
              <p>Gift cards are never affected - customers can always use them</p>
            </div>
          </div>
          
          <div class="feature">
            <div class="feature-icon">✓</div>
            <div class="feature-text">
              <h3>Customizable Messaging</h3>
              <p>Show your own message explaining why discounts are disabled</p>
            </div>
          </div>
          
          <div class="feature">
            <div class="feature-icon">✓</div>
            <div class="feature-text">
              <h3>One-Click Toggle</h3>
              <p>Enable/disable Sale Mode instantly from the Checkout Editor</p>
            </div>
          </div>
        </div>

        <div class="card">
          <h2>Quick Setup</h2>
          <div class="steps">
            <div class="step">
              <div class="step-content">
                <h3>Go to Checkout Settings</h3>
                <p>Navigate to Settings → Checkout → Customize</p>
              </div>
            </div>
            <div class="step">
              <div class="step-content">
                <h3>Add the Extension</h3>
                <p>Find "Sale Discount Lock" in the Apps section and add it</p>
              </div>
            </div>
            <div class="step">
              <div class="step-content">
                <h3>Configure Settings</h3>
                <p>Enable Sale Mode and customize your banner message</p>
              </div>
            </div>
            <div class="step">
              <div class="step-content">
                <h3>Save & Publish</h3>
                <p>Save your checkout customizations to go live</p>
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <h2>Pricing Plans</h2>
          <p class="subtitle">Start with a 14-day free trial on any plan</p>
          
          <div class="pricing">
            <div class="plan">
              <div class="plan-name">Basic</div>
              <div class="plan-price">$2.99<span>/month</span></div>
              <ul class="plan-features">
                <li>Discount code blocking</li>
                <li>Gift card preservation</li>
                <li>Custom banner message</li>
                <li>Email support</li>
              </ul>
            </div>
            
            <div class="plan featured">
              <div class="plan-name">Pro <span class="badge">Popular</span></div>
              <div class="plan-price">$4.99<span>/month</span></div>
              <ul class="plan-features">
                <li>Everything in Basic</li>
                <li>Priority support</li>
                <li>Usage analytics</li>
                <li>Multiple checkout targets</li>
              </ul>
            </div>
          </div>
        </div>

        <div class="card">
          <h2>Need Help?</h2>
          <p>Contact us at <a href="mailto:support@codeblock.app">support@codeblock.app</a></p>
          <p style="margin-top: 8px;"><a href="/privacy" target="_blank">Privacy Policy</a> | <a href="/terms" target="_blank">Terms of Service</a></p>
        </div>
      </div>
    </body>
    </html>
  `;
}

