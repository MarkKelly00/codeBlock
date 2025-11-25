// Lazy initialization of Shopify API (only when needed for OAuth)
let shopifyInstance = null;

function getShopify() {
  if (!shopifyInstance) {
    const Shopify = require('@shopify/shopify-api').default;
    shopifyInstance = new Shopify.Shopify({
      apiKey: process.env.SHOPIFY_API_KEY,
      apiSecretKey: process.env.SHOPIFY_API_SECRET,
      scopes: ['read_checkouts', 'write_checkouts'],
      hostName: process.env.HOST?.replace('https://', '') || 'code-block-wheat.vercel.app',
      isEmbeddedApp: true,
      apiVersion: '2024-10',
    });
  }
  return shopifyInstance;
}

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
  try {
    const { method, url } = req;
    const path = url ? url.split('?')[0] : '/';

    // Health check
    if (path === '/api/health' || path === '/health') {
      return res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
    }

    // Privacy Policy
    if (path === '/privacy') {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(getPrivacyPolicy());
    }

    // Terms of Service
    if (path === '/terms') {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(getTermsOfService());
    }

    // App Home
    if (path === '/' || path === '/api' || path === '/api/index') {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(getAppHome());
    }

    // OAuth Start
    if (path === '/api/auth') {
      const shop = req.query.shop;
      if (!shop) {
        return res.status(400).json({ error: 'Missing shop parameter' });
      }
      
      const shopify = getShopify();
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
        const shopify = getShopify();
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
  } catch (error) {
    console.error('Handler error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}

function getPrivacyPolicy() {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Privacy Policy - Code Blocker Pro</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.6; color: #333; }
        h1 { margin-bottom: 10px; color: #202223; }
        h2 { margin-top: 30px; margin-bottom: 10px; color: #202223; }
        p { margin-bottom: 15px; }
        ul { margin-bottom: 15px; padding-left: 20px; }
        li { margin-bottom: 8px; }
        .updated { color: #666; font-size: 14px; margin-bottom: 30px; }
        a { color: #008060; }
        strong { color: #202223; }
      </style>
    </head>
    <body>
      <h1>Privacy Policy</h1>
      <p class="updated">Last updated: November 25, 2025</p>
      
      <p>MKP operates Code Blocker Pro, a Shopify application that helps merchants manage discount codes during sales (the "App" or "Services"). MKP is powered by Shopify, which enables us to provide the Services to you. This Privacy Policy describes how we collect, use, and disclose your personal information when you install, use, or interact with the App. If there is a conflict between our Terms of Service and this Privacy Policy, this Privacy Policy controls with respect to the collection, processing, and disclosure of your personal information.</p>
      
      <p>Please read this Privacy Policy carefully. By installing and using the App, you acknowledge that you have read this Privacy Policy and understand the collection, use, and disclosure of your information as described herein.</p>

      <h2>Personal Information We Collect or Process</h2>
      <p>When we use the term "personal information," we are referring to information that identifies or can reasonably be linked to you or another person. We may collect or process the following categories of personal information:</p>
      <ul>
        <li><strong>Store Information:</strong> Your Shopify store name, domain, and store owner email address (provided by Shopify during app installation).</li>
        <li><strong>Account Information:</strong> Your Shopify merchant account details as provided through Shopify's OAuth authentication.</li>
        <li><strong>Billing Information:</strong> Subscription status and billing history processed through Shopify's Billing API (we do not directly collect payment card information).</li>
        <li><strong>Usage Information:</strong> Basic app usage data including when Sale Mode is enabled/disabled.</li>
      </ul>
      
      <h2>Information We Do NOT Collect</h2>
      <p>Code Blocker Pro operates entirely within Shopify's checkout extension framework. We do NOT collect, store, or transmit:</p>
      <ul>
        <li>Customer personal data (names, emails, addresses)</li>
        <li>Payment or financial information</li>
        <li>Order details or transaction history</li>
        <li>Discount code values or gift card information</li>
        <li>Any protected customer data as defined by Shopify</li>
      </ul>

      <h2>Personal Information Sources</h2>
      <p>We collect personal information from the following sources:</p>
      <ul>
        <li><strong>From Shopify:</strong> When you install the App, Shopify provides us with basic store information through their OAuth authentication system.</li>
        <li><strong>Automatically through the App:</strong> Basic usage data when you interact with the App settings.</li>
      </ul>

      <h2>How We Use Your Personal Information</h2>
      <p>We use personal information for the following purposes:</p>
      <ul>
        <li><strong>Provide the Services:</strong> To authenticate your store, enable App functionality, and process billing through Shopify's Billing API.</li>
        <li><strong>Customer Support:</strong> To respond to your inquiries and provide technical assistance.</li>
        <li><strong>Service Communications:</strong> To send important updates about the App, including changes to features or terms.</li>
        <li><strong>Legal Compliance:</strong> To comply with applicable laws, respond to legal requests, and protect our rights.</li>
      </ul>

      <h2>How We Disclose Personal Information</h2>
      <p>We may disclose your personal information to third parties in the following circumstances:</p>
      <ul>
        <li>With Shopify, as required for App functionality and billing.</li>
        <li>When required by law or to respond to legal process.</li>
        <li>To protect our rights, privacy, safety, or property.</li>
      </ul>
      <p>We do NOT sell, trade, or share your information with third parties for marketing purposes.</p>

      <h2>Relationship with Shopify</h2>
      <p>The App is hosted and distributed through Shopify's platform. Shopify collects and processes personal information about your access to and use of the App in order to provide and improve their services. Information you submit through the App may be transmitted to and shared with Shopify. To learn more about how Shopify uses your personal information, visit the <a href="https://www.shopify.com/legal/privacy/app-users">Shopify Consumer Privacy Policy</a>. You may exercise certain rights with respect to your personal information through the <a href="https://privacy.shopify.com/en">Shopify Privacy Portal</a>.</p>

      <h2>Data Retention</h2>
      <p>We retain store information only while the App is installed on your store. Upon uninstallation, we delete all associated data within 48 hours, except where retention is required by law.</p>

      <h2>Security</h2>
      <p>We implement industry-standard security measures including encrypted connections (HTTPS) and secure authentication via Shopify's OAuth system. Please be aware that no security measures are perfect or impenetrable.</p>

      <h2>Children's Data</h2>
      <p>The App is intended for use by Shopify merchants and is not directed to children under the age of majority. We do not knowingly collect personal information from children.</p>

      <h2>Your Rights and Choices</h2>
      <p>Depending on where you live, you may have certain rights regarding your personal information:</p>
      <ul>
        <li><strong>Right to Access:</strong> Request access to personal information we hold about you.</li>
        <li><strong>Right to Delete:</strong> Request deletion of your personal information.</li>
        <li><strong>Right to Correct:</strong> Request correction of inaccurate information.</li>
        <li><strong>Right to Portability:</strong> Request a copy of your personal information in a portable format.</li>
      </ul>
      <p>To exercise these rights, contact us using the information below.</p>

      <h2>International Transfers</h2>
      <p>Your information may be transferred to and processed in countries other than where you reside. We rely on recognized transfer mechanisms to ensure appropriate protection of your data.</p>

      <h2>Changes to This Privacy Policy</h2>
      <p>We may update this Privacy Policy from time to time. We will post the revised Privacy Policy on this page and update the "Last updated" date. Material changes will be communicated via email or in-app notification.</p>

      <h2>Contact</h2>
      <p>For privacy-related questions or to exercise your rights, contact us at:</p>
      <p>
        MKP<br>
        Email: makellipse@gmail.com<br>
        Address: 1769 Prevedel Drive, West Haven, UT, 84401, US
      </p>
    </body>
    </html>
  `;
}

function getTermsOfService() {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Terms of Service - Code Blocker Pro</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.6; color: #333; }
        h1 { margin-bottom: 10px; color: #202223; }
        h2 { margin-top: 30px; margin-bottom: 10px; color: #202223; }
        p { margin-bottom: 15px; }
        ul { margin-bottom: 15px; padding-left: 20px; }
        li { margin-bottom: 8px; }
        .updated { color: #666; font-size: 14px; margin-bottom: 30px; }
        a { color: #008060; }
      </style>
    </head>
    <body>
      <h1>Terms of Service</h1>
      <p class="updated">Last updated: November 25, 2025</p>
      
      <h2>Overview</h2>
      <p>Welcome to Code Blocker Pro! The terms "we", "us" and "our" refer to MKP. MKP operates Code Blocker Pro, a Shopify application that allows merchants to block discount codes during sales while preserving gift card functionality (the "App" or "Services"). The App is powered by Shopify, which enables us to provide the Services to you.</p>
      <p>The below terms and conditions, together with any policies referenced herein (these "Terms of Service" or "Terms") describe your rights and responsibilities when you use the Services.</p>
      <p>Please read these Terms of Service carefully, as they include important information about your legal rights and cover areas such as warranty disclaimers and limitations of liability.</p>
      <p>By installing, accessing, or using the App, you agree to be bound by these Terms of Service and our <a href="/privacy">Privacy Policy</a>. If you do not agree to these Terms of Service or Privacy Policy, you should not install or use the App.</p>

      <h2>Section 1 - Access and Account</h2>
      <p>By agreeing to these Terms of Service, you represent that you are at least the age of majority in your state or province of residence and are authorized to act on behalf of the Shopify store on which you install the App.</p>
      <p>To use the App, you must have an active Shopify store. The App requires certain permissions to function, including access to your checkout settings. You are solely responsible for maintaining the security of your Shopify account credentials.</p>

      <h2>Section 2 - Description of Service</h2>
      <p>Code Blocker Pro is a Shopify checkout UI extension that provides the following functionality:</p>
      <ul>
        <li>Ability to enable/disable "Sale Mode" which blocks discount codes at checkout</li>
        <li>Automatic removal of discount codes when Sale Mode is active</li>
        <li>Preservation of gift card functionality (gift cards are never blocked)</li>
        <li>Customizable banner messaging to inform customers</li>
      </ul>
      <p>The App operates entirely within Shopify's checkout extension framework and does not collect or store customer data.</p>

      <h2>Section 3 - Subscription and Billing</h2>
      <p>The App offers paid subscription plans billed through Shopify's Billing API. All charges will appear on your Shopify invoice. Key billing terms:</p>
      <ul>
        <li>Subscriptions include a 14-day free trial period</li>
        <li>After the trial, you will be charged the applicable subscription fee</li>
        <li>Subscriptions renew automatically each billing period</li>
        <li>You may cancel at any time through the Shopify admin</li>
        <li>No refunds are provided for partial billing periods</li>
      </ul>
      <p>Prices are subject to change with notice. We reserve the right to modify, suspend, or discontinue the App at any time.</p>

      <h2>Section 4 - Platform Limitations</h2>
      <p>The App operates within Shopify's checkout extension framework and is subject to certain platform limitations:</p>
      <ul>
        <li>The discount code input field cannot be hidden (only codes can be removed after entry)</li>
        <li>Functionality may be limited in accelerated checkout scenarios (Shop Pay, Apple Pay, Google Pay)</li>
        <li>The App operates on a best-effort basis for discount code removal</li>
        <li>Some checkout customizations may affect App behavior</li>
      </ul>
      <p>We do not guarantee that all discount codes will be blocked in all scenarios.</p>

      <h2>Section 5 - Intellectual Property</h2>
      <p>The App, including all trademarks, code, designs, and content, is owned by MKP and is protected by intellectual property laws. You are granted a limited, non-exclusive, non-transferable license to use the App solely for your Shopify store's business purposes. You may not reproduce, distribute, modify, or create derivative works of the App.</p>

      <h2>Section 6 - Relationship with Shopify</h2>
      <p>Code Blocker Pro is powered by Shopify, which enables us to provide the Services to you. However, any subscription purchases and use of the App are made directly with MKP. By using the App, you acknowledge and agree that Shopify is not responsible for any aspect of the App's functionality or any damages arising from its use. You hereby expressly release Shopify and its affiliates from all claims, damages, and liabilities arising from or related to your use of the App.</p>

      <h2>Section 7 - Privacy</h2>
      <p>Your use of the App is subject to our <a href="/privacy">Privacy Policy</a>, which describes how we collect, use, and protect your information. By using the App, you consent to our collection and use of information as described in the Privacy Policy.</p>

      <h2>Section 8 - Disclaimer of Warranties</h2>
      <p>THE APP IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE APP WILL BE UNINTERRUPTED, TIMELY, SECURE, OR ERROR-FREE. SOME JURISDICTIONS DO NOT ALLOW THE DISCLAIMER OF IMPLIED WARRANTIES, SO THE ABOVE DISCLAIMER MAY NOT APPLY TO YOU.</p>

      <h2>Section 9 - Limitation of Liability</h2>
      <p>TO THE FULLEST EXTENT PROVIDED BY LAW, IN NO CASE SHALL MKP, OUR PARTNERS, DIRECTORS, OFFICERS, EMPLOYEES, AFFILIATES, AGENTS, OR LICENSORS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, PUNITIVE, SPECIAL, OR CONSEQUENTIAL DAMAGES OF ANY KIND, INCLUDING WITHOUT LIMITATION LOST PROFITS, LOST REVENUE, LOST SALES, OR LOSS OF DATA, ARISING FROM YOUR USE OF THE APP, EVEN IF ADVISED OF THEIR POSSIBILITY.</p>

      <h2>Section 10 - Indemnification</h2>
      <p>You agree to indemnify, defend, and hold harmless MKP, Shopify, and our affiliates from any losses, damages, liabilities, or claims arising out of your breach of these Terms, your violation of any law or third-party rights, or your use of the App.</p>

      <h2>Section 11 - Termination</h2>
      <p>We may terminate this agreement or your access to the App at our sole discretion at any time without notice. Upon termination, your right to use the App will immediately cease. Sections relating to intellectual property, disclaimers, limitations of liability, and indemnification shall survive termination.</p>

      <h2>Section 12 - Modifications</h2>
      <p>We reserve the right to modify these Terms at any time. We will notify you of material changes via email or in-app notification. Your continued use of the App after changes constitutes acceptance of the modified Terms.</p>

      <h2>Section 13 - Governing Law</h2>
      <p>These Terms of Service shall be governed by and construed in accordance with the laws of the State of Utah, United States, without regard to conflict of law principles.</p>

      <h2>Section 14 - Severability</h2>
      <p>If any provision of these Terms is found to be unlawful, void, or unenforceable, that provision shall be deemed severable and shall not affect the validity and enforceability of the remaining provisions.</p>

      <h2>Section 15 - Contact Information</h2>
      <p>Questions about these Terms of Service should be sent to us at:</p>
      <p>
        MKP<br>
        Email: makellipse@gmail.com<br>
        Address: 1769 Prevedel Drive, West Haven, UT, 84401, US
      </p>
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
      <title>Code Blocker Pro</title>
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
          <h1>🛡️ Code Blocker Pro</h1>
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
                <p>Find "Code Blocker Pro" in the Apps section and add it</p>
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
          <p>Contact us at <a href="mailto:makellipse@gmail.com">makellipse@gmail.com</a></p>
          <p style="margin-top: 8px;"><a href="/privacy" target="_blank">Privacy Policy</a> | <a href="/terms" target="_blank">Terms of Service</a></p>
        </div>
      </div>
    </body>
    </html>
  `;
}

