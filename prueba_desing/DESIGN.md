---
name: Confimax Precision System
colors:
  surface: '#141313'
  surface-dim: '#0A0A0A'
  surface-bright: '#141414'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353434'
  on-surface: '#e5e2e1'
  on-surface-variant: '#c4c7c8'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#8e9192'
  outline-variant: '#444748'
  surface-tint: '#c6c6c7'
  primary: '#ffffff'
  on-primary: '#2f3131'
  primary-container: '#e2e2e2'
  on-primary-container: '#636565'
  inverse-primary: '#5d5f5f'
  secondary: '#c6c6c6'
  on-secondary: '#303030'
  secondary-container: '#474747'
  on-secondary-container: '#b5b5b5'
  tertiary: '#ffffff'
  on-tertiary: '#2f3131'
  tertiary-container: '#e2e2e2'
  on-tertiary-container: '#636565'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e2e2e2'
  primary-fixed-dim: '#c6c6c7'
  on-primary-fixed: '#1a1c1c'
  on-primary-fixed-variant: '#454747'
  secondary-fixed: '#e2e2e2'
  secondary-fixed-dim: '#c6c6c6'
  on-secondary-fixed: '#1b1b1b'
  on-secondary-fixed-variant: '#474747'
  tertiary-fixed: '#e2e2e2'
  tertiary-fixed-dim: '#c6c6c7'
  on-tertiary-fixed: '#1a1c1c'
  on-tertiary-fixed-variant: '#454747'
  background: '#141313'
  on-background: '#e5e2e1'
  surface-variant: '#353434'
  accent-pink: '#CC0597'
  border-muted: '#262626'
  data-blue: '#0066FF'
typography:
  display-xl:
    fontFamily: Montserrat
    fontSize: 84px
    fontWeight: '900'
    lineHeight: '1.0'
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: Montserrat
    fontSize: 48px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Montserrat
    fontSize: 32px
    fontWeight: '800'
    lineHeight: '1.2'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  data-label:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.0'
    letterSpacing: 0.1em
  data-value:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '700'
    lineHeight: '1.2'
spacing:
  unit: 4px
  gutter: 1px
  margin-page: 40px
  margin-mobile: 20px
  grid-cols: '12'
---

## Brand & Style

This design system is built upon the concept of **Visual Engineering**—a high-precision, clinical-tech aesthetic that treats digital interfaces with the meticulousness of laboratory instrumentation. The brand persona is authoritative, technical, and premium, catering to an audience that values data density, structural integrity, and architectural minimalism.

The design style is a sophisticated blend of **Brutalism** and **Modern Minimalism**. It utilizes raw, unyielding structural elements—such as visible grid lines and high-contrast borders—balanced by expansive whitespace and a "clinical-tech" atmosphere. Every element serves a functional purpose, mirroring the efficiency of a high-end medical monitor or a precision aerospace interface.

**Animation Strategy (GSAP Focus):**
- **Staggered Entries:** UI elements must enter the viewport using 0.05s staggered delays, moving upwards from a 20px offset with an `expo.out` easing.
- **Scroll-Triggered Reveals:** Grid lines should "draw" themselves (stroke-dashoffset) as they enter the viewport.
- **Micro-interactions:** Interactive elements should utilize a 0.2s duration for state changes to maintain a snappy, mechanical feel.

## Colors

The palette is strictly monochromatic to enforce the "clinical-tech" narrative, using absolute black and pure white to create maximum contrast and legibility.

- **Core Contrast:** Backgrounds are primarily `#000000`. Content blocks use `#0A0A0A` (Surface-Dim) and `#141414` (Surface-Bright) to establish depth without relying on shadows.
- **Accents:** The legacy `#CC0597` (Accent Pink) is used sparingly as a high-visibility marker for active states or critical notifications, ensuring it cuts through the monochromatic environment.
- **Functional Grays:** Borders are defined by high-contrast whites for active elements and deep muted grays for structural containment.

## Typography

The typography strategy emphasizes the hierarchy between "Impact" and "Precision." 

1.  **Impact (Headlines):** Montserrat is utilized in heavy weights (800-900) for headlines. Tight letter-spacing and aggressive line-heights create a sense of structural density.
2.  **Narrative (Body):** Inter provides a neutral, highly readable canvas for descriptions and technical documentation.
3.  **Precision (Data):** JetBrains Mono is the "clinical" anchor of the system. It is used for all metadata, labels, timestamps, and product specifications. All labels should be in uppercase with tracking (letter-spacing) set to `0.1em` to simulate industrial tagging.

## Layout & Spacing

The layout is a **Visible Fluid Grid**. Unlike traditional designs that hide the underlying structure, this design system exposes the grid through 1px solid borders.

- **The Grid:** A 12-column grid system where columns are separated by 1px white or `#262626` lines. 
- **The Box Model:** Every section is encased in a 1px border. There is no "margin" between adjacent components; they share borders to create a monolithic, gapless interface.
- **Rhythm:** Spacing follows a strict 4px base unit. Padding within components should be generous (typically 24px or 32px) to provide respiratory space within the rigid structural lines.
- **Responsive:** On mobile, the 12-column grid collapses to 4 columns. Grid lines remain visible but may transition to a horizontal-stack orientation.

## Elevation & Depth

This design system rejects the concept of "physical" depth (shadows and blurs) in favor of **Tonal Layering** and **Architectural Outlining**.

- **Surface Tiers:** Depth is achieved by shifting background hex codes. Level 0 is `#000000`. Level 1 (hover or active cards) is `#141414`.
- **The "Scanner" Effect:** Use GSAP to animate a high-contrast horizontal line (1px white) that moves vertically across components on hover, simulating a technical scan.
- **Outlines:** Instead of shadows, use "Double Borders"—a primary 1px border with a secondary 4px offset "ghost" border—to highlight interactive focus.

## Shapes

The shape language is strictly **Sharp (0px)**. 

Curves are perceived as soft and "consumer-grade," which contradicts the engineering-first narrative. All buttons, input fields, and containers must have 90-degree angles. To add visual interest, use "clipped corners" (45-degree chamfers) on specific data-points or status badges to reinforce the laboratory aesthetic.

## Components

- **Precision Buttons:** Rectangular, 1px white border, no background. On hover, the background fills with white, and the text (Montserrat Bold) inverts to black. Include a small monospace "serial number" in the top-right corner of the button.
- **Data Cards:** 1px bordered boxes with a fixed-height header containing a JetBrains Mono label. The body should contain technical data points separated by horizontal 1px lines.
- **Status Chips:** Small, sharp-edged rectangles. Use `#CC0597` for "Active" and `#262626` for "Standby." Text must be monospace.
- **Technical Inputs:** Input fields should appear as a single horizontal line that expands into a full box upon focus. The caret should be a solid block rather than a line.
- **Grid Lists:** Lists should be rendered as a series of rows with 1px bottom borders. Each row should have a "staggered reveal" animation when the list is populated.
- **Crosshairs:** Use SVG crosshair elements in the corners of major containers or image placeholders to emphasize the "precision targeting" concept.