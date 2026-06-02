# New Item Page Overrides

> **PROJECT:** SA Clothing Poster
> **Generated:** 2026-05-29 19:07:46
> **Page Type:** Product Detail

> ⚠️ **IMPORTANT:** Rules in this file **override** the Master file (`design-system/MASTER.md`).
> Only deviations from the Master are documented here. For all other rules, refer to the Master.

---

## Page-Specific Rules

### Layout Overrides

- **Max Width:** 800px (narrow, focused)
- **Layout:** Single column, centered
- **Sections:** 1. Dynamic hero (personalized), 2. Relevant features, 3. Tailored testimonials, 4. Smart CTA

### Spacing Overrides

- **Content Density:** Low — focus on clarity

### Typography Overrides

- No overrides — use Master typography

### Color Overrides

- **Strategy:** Adaptive based on user data. A/B test color variations per segment.

### Component Overrides

- Avoid: Expect z-index to work across contexts
- Avoid: No feedback after submit
- Avoid: Placeholder-only inputs

---

## Page-Specific Components

- No unique components for this page

---

## Recommendations

- Effects: Hover states on CTA (color shift, slight scale), form field focus animations, loading spinner, success feedback
- Layout: Understand what creates new stacking context
- Forms: Show loading then success/error state
- Accessibility: Use label with for attribute or wrap input
- CTA Placement: Context-aware placement based on user segment
