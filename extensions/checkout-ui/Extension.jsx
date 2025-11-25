import { extension, Banner, Text } from '@shopify/ui-extensions/checkout';

/**
 * Sale Discount Lock Extension
 *
 * When Sale Mode is enabled:
 * - Automatically removes any applied discount codes
 * - Shows a banner message to customers
 * - Does NOT touch gift cards
 */

export default extension('purchase.checkout.block.render', (root, api) => {
  const { settings, discountCodes, applyDiscountCodeChange, instructions } = api;

  // Get initial settings
  let saleEnabled = settings.current?.sale_mode_enabled || false;
  let message = settings.current?.sale_message || 
    "Sitewide sale is active — discount codes are disabled. Gift cards still apply.";

  // Helper function to remove discount codes
  const removeAllCodes = async (codes) => {
    try {
      // Check if we're allowed to update discount codes
      const currentInstructions = instructions?.current;
      if (!currentInstructions?.discounts?.canUpdateDiscountCodes) {
        console.log('[Sale Discount Lock] Cannot update discount codes - instructions do not allow it');
        return;
      }

      // Remove each discount code (not gift cards)
      for (const discountCode of codes || []) {
        try {
          await applyDiscountCodeChange({
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

  // Create the banner component
  const banner = root.createComponent(Banner, { status: 'info' });
  const textComponent = root.createComponent(Text, {}, message);
  banner.appendChild(textComponent);

  // Function to update UI based on settings
  const updateUI = () => {
    if (saleEnabled) {
      if (!banner.parent) {
        root.appendChild(banner);
      }
      textComponent.replaceChildren(message);
    } else {
      if (banner.parent) {
        root.removeChild(banner);
      }
    }
  };

  // Initial render
  updateUI();

  // Subscribe to settings changes
  settings.subscribe((newSettings) => {
    saleEnabled = newSettings?.sale_mode_enabled || false;
    message = newSettings?.sale_message || 
      "Sitewide sale is active — discount codes are disabled. Gift cards still apply.";
    
    updateUI();

    // If sale mode just got enabled, remove existing codes
    if (saleEnabled) {
      const currentCodes = discountCodes.current || [];
      if (currentCodes.length > 0) {
        removeAllCodes(currentCodes);
      }
    }
  });

  // Subscribe to discount code changes and remove them when sale mode is on
  discountCodes.subscribe((codes) => {
    if (saleEnabled && codes && codes.length > 0) {
      removeAllCodes(codes);
    }
  });

  // Initial check for existing codes
  if (saleEnabled) {
    const currentCodes = discountCodes.current || [];
    if (currentCodes.length > 0) {
      removeAllCodes(currentCodes);
    }
  }

  console.log('[Sale Discount Lock] Extension initialized, saleEnabled:', saleEnabled);
});
