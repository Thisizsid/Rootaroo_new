import React from 'react';
import { Text } from 'react-native';
import { textStyles } from '../theme/typography';

/**
 * The one sanctioned way to render styled, readable text going forward —
 * see the typography audits for why this exists and what it's for.
 *
 * <AppText variant="body">Hello world</AppText>
 *
 * A thin wrapper, deliberately: it resolves a semantic `variant` to a
 * pre-composed style from typography.js's `textStyles` and renders a plain
 * RN `Text` with it. It does not wrap or intercept `children` — nested
 * `<AppText>`/`<Text>` and RN's native inline-style-cascade behavior for
 * nested Text both keep working exactly as they do today, since `children`
 * is passed straight through. Every other prop (`numberOfLines`,
 * `ellipsizeMode`, `onPress`, `onLayout`, accessibility props, `testID`,
 * `allowFontScaling`, …) passes straight through to Text unchanged.
 *
 * Icon/glyph-only Text (chevrons, checkmarks-as-state, emoji-as-icon) is
 * NOT meant to use this — see the Text Migration Classification report.
 * That's a symbol standing in for an icon, not language being read; it
 * stays plain <Text>.
 *
 * Variants are exactly the keys of `textStyles`: brand, display, titleLarge,
 * title, heading, subheading, body (default), bodySmall, caption, label,
 * tagline, button, stat, quote, mono.
 *
 * `style` is applied after the variant, so normal visual overrides (color,
 * opacity, textAlign, textDecorationLine, textTransform, margin/padding)
 * work exactly as they would on a plain Text. Typography-system properties
 * (fontFamily/fontSize/fontWeight/lineHeight/letterSpacing) CAN technically
 * still be overridden this way too — no runtime enforcement exists yet by
 * design (see the override-policy note in the typography audit); that's a
 * deliberate follow-up, not an oversight.
 */
export default function AppText({ variant = 'body', style, children, ...rest }) {
  const variantStyle = textStyles[variant] || textStyles.body;
  return (
    <Text style={[variantStyle, style]} {...rest}>
      {children}
    </Text>
  );
}
