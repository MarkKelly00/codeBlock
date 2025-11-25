# Merchant Quick Start Guide

> **Goal:** Block discount codes during sales while keeping gift cards working

## 🚀 Quick Setup (5 minutes)

### 1. Install the App
Your developer will install this app on your store from the Shopify Partner Dashboard.

### 2. Open Checkout Editor
1. Go to **Settings** → **Checkout** in your Shopify Admin
2. Click **Customize** button

### 3. Add the Extension
1. In the left sidebar, find **App blocks**
2. Drag **"Sale Discount Lock"** to where you want it
   - Recommended: Near the order summary
3. Click **Save**

### 4. Configure Settings
Click on the extension block and set:
- ✅ **Enable Sale Mode** → Turn ON to block codes
- 📝 **Sale banner message** → Customize what customers see

**Example message:**
> "Our Black Friday sale is live! Discount codes are temporarily disabled, but gift cards still work."

## 🎯 How It Works

### When Sale Mode is ON:
- ❌ Discount codes are automatically removed
- ✅ Gift cards work normally
- 💬 Banner shows your custom message
- 🔄 Happens instantly when code is entered

### When Sale Mode is OFF:
- ✅ Everything works normally
- 🙈 Extension does nothing
- 📝 No banner appears

## 📋 Daily Operations

### Starting a Sale

**Morning of sale:**
1. Open Checkout Editor (Settings → Checkout → Customize)
2. Click on "Sale Discount Lock" extension
3. Toggle **Enable Sale Mode** → **ON**
4. Update message if needed
5. Click **Save**
6. Test: Try applying a discount code in checkout

**✓ Done!** Discount codes are now blocked.

### Ending a Sale

**After sale ends:**
1. Open Checkout Editor
2. Click on "Sale Discount Lock" extension
3. Toggle **Enable Sale Mode** → **OFF**
4. Click **Save**

**✓ Done!** Discount codes work normally again.

## ⚡ Pro Tips

### Tip 1: Pre-Schedule Your Message
Set your message before the sale:
- "Flash sale active until midnight!"
- "Weekend sale - discount codes disabled until Monday"

### Tip 2: Test Before Going Live
1. Enable Sale Mode
2. Open your store in incognito/private browsing
3. Add items to cart → Go to checkout
4. Try applying a discount code
5. Verify it's removed and banner appears
6. Try applying a gift card
7. Verify gift card works

### Tip 3: Inform Your Customers
Add a banner to your store homepage:
- "Our sale is active! Discount codes temporarily unavailable."
- Links to your sale collection
- Reminds them gift cards still work

### Tip 4: Plan Your Sale Schedule
Create a checklist:
- [ ] Week before: Update banner message
- [ ] Day before: Test in checkout
- [ ] Sale start: Enable Sale Mode
- [ ] During sale: Monitor for issues
- [ ] Sale end: Disable Sale Mode
- [ ] After: Thank customers, announce next sale

## 🎨 Customization Options

### Banner Messages (Examples)

**Short & Simple:**
> "Sale active - codes disabled."

**Friendly & Clear:**
> "Our sitewide sale is live! Discount codes are disabled, but gift cards still apply."

**Urgent & Timely:**
> "⏰ Flash sale ends at midnight! No discount codes needed - prices already reduced."

**Reassuring:**
> "Enjoy sale prices! Discount codes temporarily disabled. Gift cards and store credit still work."

### Message Guidelines
- ✅ Keep under 200 characters
- ✅ Be clear and friendly
- ✅ Mention gift cards still work
- ✅ Include sale end time if urgent
- ❌ Don't use ALL CAPS
- ❌ Don't be apologetic (it's a benefit!)

## 🔍 Troubleshooting

### "Discount codes are still working"

**Check:**
- Is Sale Mode enabled in Checkout Editor?
- Did you click Save after enabling?
- Try hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
- Test in private browsing mode

**Still not working?** Contact your developer.

### "Banner isn't showing"

**Check:**
- Is Sale Mode enabled?
- Is the extension block visible in Checkout Editor?
- Is it placed in a visible location?
- Try moving it to "Order summary" area

### "Gift cards aren't working"

**This shouldn't happen!** The extension never touches gift cards. If gift cards aren't working:
1. Disable Sale Mode temporarily
2. Test gift cards again
3. If still broken, it's a different issue (contact Shopify support)

### "Getting customer complaints"

**Common reasons:**
1. **Customers don't see the banner** → Move extension to more visible location
2. **Message is confusing** → Update to be clearer
3. **They think it's broken** → Add message to homepage too
4. **They want their code to work** → Explain the sale is better

**Good response template:**
> "Hi! Our current sale offers better savings than most discount codes. That's why codes are temporarily disabled. Your gift cards and store credit still work perfectly. The sale ends [DATE] and codes will work again after that."

## 📊 Best Practices

### Before Major Sales

- [ ] Test the extension 1 week before
- [ ] Update banner message
- [ ] Brief your support team
- [ ] Add notice to your website
- [ ] Prepare customer service responses
- [ ] Consider email to existing customers

### During Sales

- [ ] Enable Sale Mode at sale start time
- [ ] Monitor for customer questions
- [ ] Watch for any technical issues
- [ ] Track sales performance

### After Sales

- [ ] Disable Sale Mode promptly
- [ ] Thank customers
- [ ] Review what worked well
- [ ] Note improvements for next sale

## 📱 Mobile Testing

Always test on mobile:
1. Enable Sale Mode
2. Use your phone (not simulator)
3. Add items to cart
4. Go through checkout
5. Verify banner is readable
6. Try discount code and gift card

## 🎯 Common Sale Scenarios

### Black Friday / Cyber Monday
```
Message: "🎉 Black Friday Sale! Save up to 50% - discount codes disabled. Gift cards welcome!"
Enable: Thursday evening
Disable: Monday night
```

### Flash Sale
```
Message: "⚡ 4-Hour Flash Sale! Ends at 8 PM. Codes disabled - prices already reduced!"
Enable: 4 PM
Disable: 8 PM
```

### Clearance Sale
```
Message: "Clearance Sale - Final prices! Discount codes cannot be combined."
Enable: First day of clearance
Disable: When clearance ends
```

### VIP Early Access
```
Message: "VIP Early Access! Additional discounts not available during preview period."
Enable: VIP period start
Disable: When public sale starts
```

## 🆘 Need Help?

### Quick Questions
- Check this guide first
- Review LIMITATIONS.md for technical details
- Test in a private browsing window

### Technical Issues
- Contact your developer
- Provide screenshots of the issue
- Note what you were trying to do
- Mention which checkout step

### Shopify Platform Issues
- Check [Shopify Status](https://status.shopify.com)
- Contact Shopify Support for checkout issues

## ✅ Success Checklist

Before your first sale:
- [ ] Extension installed and visible in Checkout Editor
- [ ] Sale Mode toggle works
- [ ] Custom message displays correctly
- [ ] Discount codes are blocked when ON
- [ ] Gift cards still work
- [ ] Banner message is clear and friendly
- [ ] Tested on desktop and mobile
- [ ] Support team briefed
- [ ] Website notice prepared

**You're ready for your sale!** 🎉

---

**Remember:** 
- Enable = Block codes ❌
- Disable = Codes work ✅
- Gift cards always work 💳✅

