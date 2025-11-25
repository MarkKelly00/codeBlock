import '@shopify/ui-extensions/preact';
import { render } from 'preact';
import { useState, useEffect } from 'preact/hooks';

/**
 * Sale Discount Lock Extension
 *
 * When Sale Mode is enabled:
 * - Automatically removes any applied discount codes
 * - Shows a banner message to customers
 * - Does NOT touch gift cards
 */

export default function extension() {
  render(<Extension />, document.body);
}

function Extension() {
  // Get initial settings
  const initialSettings = shopify.settings.value || {};
  const [saleEnabled, setSaleEnabled] = useState(!!initialSettings.sale_mode_enabled);
  const [message, setMessage] = useState(
    initialSettings.sale_message || "Sitewide sale is active — discount codes are disabled. Gift cards still apply."
  );

  // Helper function to remove discount codes
  const removeAllCodes = async (codes) => {
    try {
      // Check if we're allowed to update discount codes
      const instructions = shopify.instructions.value;
      if (!instructions?.discounts?.canUpdateDiscountCodes) {
        console.log('[Sale Discount Lock] Cannot update discount codes - instructions do not allow it');
        return;
      }

      // Remove each code
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
  useEffect(() => {
    const unsubscribe = shopify.settings.subscribe((newSettings) => {
      const settings = newSettings || {};
      setSaleEnabled(!!settings.sale_mode_enabled);
      setMessage(settings.sale_message || "Sitewide sale is active — discount codes are disabled. Gift cards still apply.");
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  // Subscribe to discount code changes and remove them when sale mode is on
  useEffect(() => {
    if (!saleEnabled) return;

    // Remove existing codes on mount
    const currentCodes = shopify.discountCodes.value || [];
    if (currentCodes.length > 0) {
      removeAllCodes(currentCodes);
    }

    // Subscribe to future discount code changes
    const unsubscribe = shopify.discountCodes.subscribe((codes) => {
      if (codes && codes.length > 0) {
        removeAllCodes(codes);
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [saleEnabled]);

  // Log current state for debugging
  console.log('[Sale Discount Lock] Extension rendered, saleEnabled:', saleEnabled);

  // Don't render anything when sale mode is off
  if (!saleEnabled) {
    return null;
  }

  // Render banner when sale mode is on
  return (
    <s-banner tone="info">
      <s-text>{message}</s-text>
    </s-banner>
  );
}
