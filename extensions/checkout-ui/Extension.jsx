import '@shopify/ui-extensions/preact';
import { render } from 'preact';

/**
 * Sale Discount Lock Extension
 *
 * When Sale Mode is enabled:
 * - Automatically removes any applied discount codes
 * - Shows a banner message to customers
 * - Does NOT touch gift cards
 */

// Export the extension entry point
export default function extension() {
  render(<Extension />, document.body);
}

function Extension() {
  // Get settings from Shopify
  const settings = shopify.settings.current || {};
  const saleEnabled = !!settings.sale_mode_enabled;
  const message = settings.sale_message || 
    "Sitewide sale is active — discount codes are disabled. Gift cards still apply.";

  // Helper function to remove discount codes
  const removeAllCodes = async (codes) => {
    try {
      // Check if we're allowed to update discount codes
      const instructions = shopify.instructions.current;
      if (!instructions?.discounts?.canUpdateDiscountCodes) {
        console.log('[Sale Discount Lock] Cannot update discount codes - instructions do not allow it');
        return;
      }

      // Remove each discount code (not gift cards)
      for (const discountCode of codes || []) {
        try {
          await shopify.applyDiscountCodeChange({
            type: "removeDiscountCode",
            code: discountCode.code,
          });
          console.log('[Sale Discount Lock] Removed discount code:', discountCode.code);
        } catch (err) {
          console.log('[Sale Discount Lock] Failed to remove discount code:', discountCode.code, err);
        }
      }
    } catch (e) {
      console.log('[Sale Discount Lock] Discount removal skipped:', e);
    }
  };

  // Subscribe to settings changes
  shopify.settings.subscribe((newSettings) => {
    // Re-render will happen automatically via Preact
    console.log('[Sale Discount Lock] Settings updated:', newSettings);
  });

  // Subscribe to discount code changes and remove them when sale mode is on
  if (saleEnabled) {
    // Check for existing codes on load
    const currentCodes = shopify.discountCodes.current || [];
    if (currentCodes.length > 0) {
      removeAllCodes(currentCodes);
    }

    // Subscribe to new codes being added
    shopify.discountCodes.subscribe((codes) => {
      if (codes && codes.length > 0) {
        removeAllCodes(codes);
      }
    });
  }

  console.log('[Sale Discount Lock] Extension rendered, saleEnabled:', saleEnabled);

  // Don't render anything if sale mode is off
  if (!saleEnabled) {
    return null;
  }

  // Render the banner using Shopify's web components
  return (
    <s-banner status="info">
      <s-text>{message}</s-text>
    </s-banner>
  );
}
