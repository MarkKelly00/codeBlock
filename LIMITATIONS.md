# Known Limitations & Considerations

This document outlines the limitations of the Sale Discount Lock extension and provides context for expected behavior.

## Platform Limitations

### 1. Cannot Hide the Discount Code Field

**Limitation:** The extension cannot hide or remove the discount code input field from checkout.

**Why:** Checkout UI Extensions are designed to add functionality, not remove core Shopify UI elements. The discount/gift card field is a core checkout component.

**Impact:** Customers will still see the discount code field even when Sale Mode is ON. They can attempt to enter codes, but the extension will remove them.

**Workaround:** The banner message should clearly communicate that discount codes are temporarily disabled.

---

### 2. Accelerated Checkout Limitations

**Limitation:** The `applyDiscountCodeChange` API may not work in accelerated checkout flows.

**Affected Checkouts:**
- Apple Pay
- Google Pay
- Shop Pay (when express checkout is used)
- PayPal Express
- Amazon Pay

**Why:** These payment methods use their own checkout flows with limited extensibility.

**Impact:** Discount codes may not be removed in these flows.

**Workaround:** 
1. The extension handles this gracefully with try-catch blocks
2. Merchants should also configure discount combinability rules
3. Consider using Shopify Functions for server-side enforcement

**Recommended Approach:**
```javascript
// The extension already handles this
try {
  await shopify.applyDiscountCodeChange({ ... });
} catch (e) {
  // Gracefully skip removal
  console.log('Could not remove code in accelerated checkout');
}
```

---

### 3. Cart Instructions May Prevent Updates

**Limitation:** The `canUpdateDiscountCodes` instruction may be `false` in certain scenarios.

**When This Happens:**
- Checkout is locked for editing
- Cart is in a special state
- Merchant has restricted discount modifications
- B2B checkouts with specific rules

**Impact:** Discount codes cannot be removed when this instruction is false.

**How Extension Handles It:**
```javascript
if (!shopify.instructions.value?.discounts?.canUpdateDiscountCodes) {
  return; // Gracefully skip
}
```

**Merchant Action:** None needed - this is expected behavior in certain checkout states.

---

### 4. No Server-Side Enforcement

**Limitation:** This extension runs client-side only.

**Why:** Checkout UI Extensions execute in the buyer's browser, not on Shopify's servers.

**Impact:** Technically savvy users could potentially bypass the extension.

**Severity:** Low - requires technical knowledge and effort

**Mitigation Strategies:**

1. **Use Shopify Functions** (recommended for critical enforcement):
   ```javascript
   // Create a Discount Function that checks for active sales
   // and rejects discount codes accordingly
   ```

2. **Configure discount combinability rules** in Shopify Admin:
   - Settings → Discounts → Discount combinations
   - Set rules for how discounts can combine

3. **Set discount dates** to automatically disable codes:
   - Edit each discount code
   - Set end date to when sale ends

4. **Use automatic discounts** instead of codes during sales:
   - Automatic discounts apply without codes
   - Can be configured to exclude code discounts

---

## Expected Behaviors

### Timing of Code Removal

**Behavior:** There may be a brief moment where a discount code appears before being removed.

**Why:** The extension must wait for:
1. Extension to load
2. Settings to be read
3. Discount code to be applied
4. API call to remove code

**Impact:** Visual flicker lasting < 1 second

**This is normal** and cannot be eliminated with client-side extensions.

---

### Gift Cards Always Work

**Behavior:** Gift cards are never affected by Sale Mode.

**Why:** By design - gift cards are payment methods, not promotional discounts.

**Code Implementation:**
```javascript
// Extension NEVER calls this:
// shopify.applyGiftCardChange({ ... });

// Only this:
shopify.applyDiscountCodeChange({
  type: "removeDiscountCode",
  code: discountCode.code
});
```

---

### Banner Visibility

**Behavior:** The banner only shows when Sale Mode is ON.

**Code:**
```javascript
if (!saleEnabled) return null;
```

**Placement:** 
- Appears where merchant places it (block target)
- AND after discount form (reductions target)

**Merchant can disable either target** in Checkout Editor if desired.

---

## Best Practices for Complete Coverage

For the most robust discount management during sales:

### 1. Layer Multiple Controls

```
┌─────────────────────────────────────┐
│  Checkout UI Extension (this app)   │  ← Client-side removal
├─────────────────────────────────────┤
│  Shopify Function                   │  ← Server-side validation
├─────────────────────────────────────┤
│  Discount Combinability Rules       │  ← Admin configuration
├─────────────────────────────────────┤
│  Discount Code End Dates            │  ← Automatic expiration
└─────────────────────────────────────┘
```

### 2. Set Discount End Dates

During sale periods:
1. Go to **Discounts** in Admin
2. Edit each discount code
3. Set **End date** to when sale ends
4. Codes automatically stop working

### 3. Use Combinability Rules

Go to **Settings** → **Discounts**:
- ✅ "Automatic discounts can combine with code discounts" = OFF
- ✅ Set specific rules for sale periods

### 4. Create Automatic Sale Discount

Instead of relying on codes:
1. Create an automatic discount for the sale
2. Set conditions (e.g., minimum purchase)
3. Applies to all qualifying orders automatically
4. Customers see discount without codes

### 5. Communicate Clearly

Update your site to inform customers:
- "Sale prices active - discount codes temporarily disabled"
- "Gift cards and store credit still apply"
- "Sale ends [DATE] - codes resume after"

---

## Edge Cases

### Multiple Extensions

**Scenario:** Another extension also modifies discount codes

**Impact:** Potential conflicts or race conditions

**Solution:** Test with all extensions active; coordinate with other extension developers

---

### Custom Checkout Scripts (Shopify Plus)

**Scenario:** Store has custom checkout scripts that manage discounts

**Impact:** May conflict with this extension

**Solution:** Review script behavior; may need to disable scripts during sales

---

### Draft Orders

**Scenario:** Merchant creates draft orders with discount codes

**Impact:** Extension may not affect draft orders

**Why:** Draft orders use different checkout flow

**Solution:** Handle manually or use Order API to validate

---

### POS Orders

**Scenario:** Orders created in Shopify POS

**Impact:** This extension does not affect POS

**Why:** POS has its own checkout system

**Solution:** Configure POS discount settings separately

---

## Monitoring & Debugging

### Browser Console Logs

The extension logs helpful messages:

```javascript
'[Sale Discount Lock] Cannot update discount codes - instructions do not allow it'
'[Sale Discount Lock] Failed to remove discount code: SAVE10'
'[Sale Discount Lock] Discount removal skipped: [error details]'
```

**Enable in Chrome DevTools:**
1. Right-click → Inspect
2. Console tab
3. Filter for "Sale Discount Lock"

### Checkout Editor Preview

Test different scenarios:
1. Sale Mode ON/OFF
2. Different discount codes
3. Gift card applications
4. Multiple discounts at once

### Production Monitoring

Consider:
1. Setting up Web Pixel events to track discount application attempts
2. Monitoring customer support tickets about discounts
3. Reviewing order data for unexpected discount usage

---

## When to Use vs. Not Use This Extension

### ✅ Good Use Cases

- **Temporary sales** where you want to disable all code discounts
- **Black Friday/Cyber Monday** events with automatic discounts
- **Clearance sales** where additional discounts aren't allowed
- **Gift with purchase** promotions that shouldn't stack with codes

### ⚠️ Consider Alternatives

- **Permanent discount policy changes** → Use Shopify Functions
- **Preventing specific discount combinations** → Use combinability rules
- **Complex discount logic** → Use Shopify Functions
- **Backend validation required** → Use Shopify Functions

---

## Future Improvements

Potential enhancements (not currently implemented):

1. **Whitelist specific codes** that should still work during sales
2. **Time-based activation** without merchant intervention
3. **Integration with Shopify Functions** for dual enforcement
4. **Customer segmentation** (VIP customers keep discount access)
5. **A/B testing support** for different messages

These would require additional development and potentially backend services.

---

## Support & Questions

If you encounter unexpected behavior:

1. Check this document for known limitations
2. Review browser console for error messages
3. Test in different checkout scenarios
4. Check Shopify status page for platform issues
5. Review [Shopify's checkout documentation](https://shopify.dev/docs/api/checkout-ui-extensions)

**Remember:** Some limitations are inherent to the platform and cannot be worked around with checkout UI extensions alone.

