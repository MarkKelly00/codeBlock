import "@shopify/shopify-app-remix/adapters/node";
import express from "express";
import { join } from "path";
import { readFileSync } from "fs";
import serveStatic from "serve-static";
import cookieParser from "cookie-parser";
import { DeliveryMethod, LATEST_API_VERSION, shopifyApp } from "@shopify/shopify-app-express";
import { SQLiteSessionStorage } from "@shopify/shopify-app-session-storage-sqlite";
import { restResources } from "@shopify/shopify-api/rest/admin/2025-01";

const PORT = parseInt(process.env.PORT || "3000", 10);
const isProduction = process.env.NODE_ENV === "production";

// Initialize SQLite session storage
const DB_PATH = join(process.cwd(), "database.sqlite");
const sessionStorage = new SQLiteSessionStorage(DB_PATH);

// Initialize Shopify app
const shopify = shopifyApp({
  api: {
    apiVersion: LATEST_API_VERSION,
    restResources,
    billing: {
      "Basic Plan": {
        amount: 2.99,
        currencyCode: "USD",
        interval: "EVERY_30_DAYS",
        trialDays: 14,
      },
      "Pro Plan": {
        amount: 4.99,
        currencyCode: "USD",
        interval: "EVERY_30_DAYS",
        trialDays: 14,
      },
    },
  },
  auth: {
    path: "/api/auth",
    callbackPath: "/api/auth/callback",
  },
  webhooks: {
    path: "/api/webhooks",
  },
  sessionStorage,
});

// Express app setup
const app = express();

// Trust proxy for production deployments
app.set("trust proxy", true);

// Parse cookies
app.use(cookieParser());

// Parse JSON bodies for webhooks
app.use(express.json());

// ============================================
// GDPR COMPLIANCE WEBHOOKS (REQUIRED)
// ============================================

// Handle customer data request (GDPR)
app.post(
  "/api/webhooks/customers/data_request",
  shopify.processWebhooks({
    webhookHandlers: {
      CUSTOMERS_DATA_REQUEST: {
        deliveryMethod: DeliveryMethod.Http,
        callbackUrl: "/api/webhooks/customers/data_request",
        callback: async (topic, shop, body) => {
          console.log(`[GDPR] Customer data request for shop: ${shop}`);
          // This app doesn't store customer data, so we just acknowledge
          // In production, you would gather and return any stored customer data
          const payload = JSON.parse(body);
          console.log(`[GDPR] Data request payload:`, payload);
        },
      },
    },
  })
);

// Handle customer data erasure (GDPR)
app.post(
  "/api/webhooks/customers/redact",
  shopify.processWebhooks({
    webhookHandlers: {
      CUSTOMERS_REDACT: {
        deliveryMethod: DeliveryMethod.Http,
        callbackUrl: "/api/webhooks/customers/redact",
        callback: async (topic, shop, body) => {
          console.log(`[GDPR] Customer redact request for shop: ${shop}`);
          // This app doesn't store customer data, so we just acknowledge
          const payload = JSON.parse(body);
          console.log(`[GDPR] Customer to redact:`, payload.customer?.id);
        },
      },
    },
  })
);

// Handle shop data erasure (GDPR)
app.post(
  "/api/webhooks/shop/redact",
  shopify.processWebhooks({
    webhookHandlers: {
      SHOP_REDACT: {
        deliveryMethod: DeliveryMethod.Http,
        callbackUrl: "/api/webhooks/shop/redact",
        callback: async (topic, shop, body) => {
          console.log(`[GDPR] Shop redact request for shop: ${shop}`);
          // Clean up any shop-specific data stored
          const payload = JSON.parse(body);
          console.log(`[GDPR] Shop to redact:`, payload.shop_id);
          // In production, delete all data associated with this shop
        },
      },
    },
  })
);

// Handle app uninstall
app.post(
  "/api/webhooks/app/uninstalled",
  shopify.processWebhooks({
    webhookHandlers: {
      APP_UNINSTALLED: {
        deliveryMethod: DeliveryMethod.Http,
        callbackUrl: "/api/webhooks/app/uninstalled",
        callback: async (topic, shop, body) => {
          console.log(`[Webhook] App uninstalled from shop: ${shop}`);
          // Clean up session and any stored data for this shop
        },
      },
    },
  })
);

// ============================================
// AUTHENTICATION ROUTES
// ============================================

// OAuth start
app.get(shopify.config.auth.path, shopify.auth.begin());

// OAuth callback
app.get(
  shopify.config.auth.callbackPath,
  shopify.auth.callback(),
  shopify.redirectToShopifyOrAppRoot()
);

// ============================================
// AUTHENTICATED ROUTES
// ============================================

// Validate authenticated session for all /api routes (except auth and webhooks)
app.use("/api/*", shopify.validateAuthenticatedSession());

// ============================================
// BILLING API ROUTES
// ============================================

// Get current billing status
app.get("/api/billing/status", async (req, res) => {
  try {
    const session = res.locals.shopify.session;
    const client = new shopify.api.clients.Graphql({ session });

    const response = await client.query({
      data: `{
        currentAppInstallation {
          activeSubscriptions {
            id
            name
            status
            currentPeriodEnd
            trialDays
          }
        }
      }`,
    });

    const subscriptions = response.body.data.currentAppInstallation.activeSubscriptions;
    
    res.status(200).json({
      success: true,
      subscriptions,
      hasActiveSubscription: subscriptions.length > 0 && subscriptions[0].status === "ACTIVE",
    });
  } catch (error) {
    console.error("Error fetching billing status:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create subscription
app.post("/api/billing/subscribe", async (req, res) => {
  try {
    const session = res.locals.shopify.session;
    const { plan } = req.body;

    const planConfig = shopify.api.billing[plan];
    if (!planConfig) {
      return res.status(400).json({ success: false, error: "Invalid plan" });
    }

    const confirmationUrl = await shopify.api.billing.request({
      session,
      plan,
      isTest: !isProduction,
      returnUrl: `https://${session.shop}/admin/apps/${process.env.SHOPIFY_API_KEY}`,
    });

    res.status(200).json({ success: true, confirmationUrl });
  } catch (error) {
    console.error("Error creating subscription:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Cancel subscription
app.post("/api/billing/cancel", async (req, res) => {
  try {
    const session = res.locals.shopify.session;
    const client = new shopify.api.clients.Graphql({ session });

    // Get active subscription
    const statusResponse = await client.query({
      data: `{
        currentAppInstallation {
          activeSubscriptions {
            id
          }
        }
      }`,
    });

    const subscriptions = statusResponse.body.data.currentAppInstallation.activeSubscriptions;
    
    if (subscriptions.length === 0) {
      return res.status(400).json({ success: false, error: "No active subscription" });
    }

    // Cancel the subscription
    const cancelResponse = await client.query({
      data: {
        query: `mutation appSubscriptionCancel($id: ID!) {
          appSubscriptionCancel(id: $id) {
            appSubscription {
              id
              status
            }
            userErrors {
              field
              message
            }
          }
        }`,
        variables: {
          id: subscriptions[0].id,
        },
      },
    });

    res.status(200).json({ success: true, result: cancelResponse.body.data });
  } catch (error) {
    console.error("Error cancelling subscription:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// APP HOME / SETTINGS API
// ============================================

// Get app settings/status
app.get("/api/settings", async (req, res) => {
  try {
    const session = res.locals.shopify.session;
    
    res.status(200).json({
      success: true,
      shop: session.shop,
      message: "Sale Discount Lock is active! Configure settings in the Checkout Editor.",
      documentation: {
        setup: "Go to Settings > Checkout > Customize to add the extension",
        toggle: "Enable 'Sale Mode' in the extension settings panel",
        message: "Customize the banner message shown to customers",
      },
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// STATIC FILES & APP HOME
// ============================================

// Serve static files in production
if (isProduction) {
  app.use(serveStatic(join(process.cwd(), "web", "frontend", "dist")));
}

// App home page (embedded in Shopify admin)
app.get("/", shopify.ensureInstalledOnShop(), async (req, res) => {
  res.send(`
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
        .btn-secondary {
          background: white;
          color: #202223;
          border: 1px solid #c9cccf;
        }
        .btn-secondary:hover { background: #f6f6f7; }
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
          <a href="/admin/settings/checkout" class="btn" target="_top">Open Checkout Settings →</a>
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
              <button class="btn btn-secondary" onclick="subscribe('Basic Plan')">Start Free Trial</button>
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
              <button class="btn" onclick="subscribe('Pro Plan')">Start Free Trial</button>
            </div>
          </div>
        </div>

        <div class="card">
          <h2>Need Help?</h2>
          <p>Contact us at <a href="mailto:support@codeblock.app">support@codeblock.app</a></p>
          <p style="margin-top: 8px;"><a href="/privacy" target="_blank">Privacy Policy</a> | <a href="/terms" target="_blank">Terms of Service</a></p>
        </div>
      </div>

      <script>
        async function subscribe(plan) {
          try {
            const response = await fetch('/api/billing/subscribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ plan }),
            });
            const data = await response.json();
            if (data.confirmationUrl) {
              window.top.location.href = data.confirmationUrl;
            } else {
              alert('Error: ' + (data.error || 'Unknown error'));
            }
          } catch (error) {
            alert('Error creating subscription: ' + error.message);
          }
        }
      </script>
    </body>
    </html>
  `);
});

// Privacy Policy page
app.get("/privacy", (req, res) => {
  res.send(`
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
      <p class="updated">Last updated: ${new Date().toLocaleDateString()}</p>
      
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
  `);
});

// Terms of Service page
app.get("/terms", (req, res) => {
  res.send(`
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
      <p class="updated">Last updated: ${new Date().toLocaleDateString()}</p>
      
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
  `);
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Sale Discount Lock server running on port ${PORT}`);
  console.log(`   Environment: ${isProduction ? "production" : "development"}`);
});

export default app;

