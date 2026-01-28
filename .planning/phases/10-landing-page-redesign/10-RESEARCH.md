# Phase 10 Research: Landing Page Visual Redesign

## Reference Image Analysis

### Color Scheme
| Element | Observation | Implementation |
|---------|-------------|----------------|
| **Background** | Pure white (#FFFFFF) or very light gray | Change from current gray bg to white |
| **Text** | Dark charcoal/black for headlines | Use near-black (#1a1a1a) for headlines |
| **Body text** | Medium gray for descriptions | Use muted-foreground |
| **Brand accent** | Subtle lime/yellow-green (#c4f441 or similar) | Add as `--accent-lime` CSS variable |
| **Secondary accent** | Occasional coral/pink (#ff6b6b) | Use for alternative highlights |
| **Cards** | White with very subtle shadow | Light border + minimal shadow |

### Typography
| Element | Style |
|---------|-------|
| **Headlines** | Large, bold, black sans-serif |
| **Subheadlines** | Medium weight, slightly smaller |
| **Body** | Regular weight, gray color |
| **Stats numbers** | Extra large, bold, sometimes colored |

### Visual Elements

#### 1. Floating UI Cards
- Product mockups with real screenshots
- Slight rotation (2-5 degrees)
- Soft shadows
- Layered/overlapping arrangement
- Real human photos integrated into mockups

#### 2. Stats Presentation
- Large numbers (6 million, 137 million)
- Small colored markers/icons (triangles, circles)
- Minimal labels below numbers
- Clean, unboxed presentation

#### 3. Brand Logos Section
- **Text-only logos** (not boxed/carded)
- Single horizontal row
- "Loved by brands" label above
- Grayscale or muted colors

#### 4. Geometric Accents
- Small colored triangles (play buttons for stats)
- Thin lines connecting sections
- Pill-shaped badges for labels
- Rounded rectangles for UI elements

#### 5. Human Imagery
- Real photos of people (smiling, professional)
- Photos integrated into UI mockups
- Photos as standalone feature images
- Warm, approachable expressions

### Layout Patterns

#### Hero Section
- **Left side:** Text content (headline, subheadline, CTAs)
- **Right side:** Product mockup with floating elements
- Asymmetric layout
- Multiple floating cards around main mockup

#### Feature Sections
- Alternating left/right image placement
- Stats inline with content
- Real screenshots showing product features

#### Social Proof
- Logos in a horizontal row (not cards)
- Percentage stats in clean boxes
- Testimonial quotes minimal/integrated

### Key Differences from Current Design

| Current | Reference Target |
|---------|------------------|
| Blue primary color | Dark text + lime/green accent |
| Gray background | White background |
| Boxed brand logos | Text-only logos |
| Solid color icons | Geometric colored markers |
| Mock UI without photos | UI mockups with human photos |
| 4-column feature grid | Asymmetric feature sections |
| Animated count-up stats | Large static stats with markers |

## Implementation Plan

### Phase 1: Design System Update
1. Update CSS variables (white bg, lime accent)
2. Add new accent colors (lime, coral)
3. Update typography scale
4. Create geometric accent components

### Phase 2: Hero Redesign
1. New asymmetric layout
2. Floating UI cards with photo slots
3. Stat badges with colored markers
4. Simplified CTA buttons

### Phase 3: Social Proof Overhaul
1. Remove card styling from logos
2. Text-only brand names
3. Clean horizontal layout

### Phase 4: Stats Section Redesign
1. Large numbers with triangle markers
2. Remove boxing/cards
3. Clean, minimal labels

### Phase 5: Feature Sections
1. Alternating layout (image left/right)
2. Real screenshot placeholders
3. Inline stats with features

### Phase 6: Testimonials Simplification
1. Minimal quote styling
2. Integrate with feature sections
3. Photo + quote format

## Image Requirements

User needs to provide:
1. **Hero mockup photo** - Smiling person for main product mockup
2. **Feature photos** - 2-3 photos for feature section mockups
3. **Testimonial photos** - Real customer photos (or placeholders)

For MVP, can use:
- Placeholder avatar icons
- Illustrated/geometric placeholders
- Stock photo URLs (with proper licensing)

## Technical Considerations

### CSS Variables to Add
```css
--accent-lime: 75 100% 60%; /* #c4f441 equivalent */
--accent-coral: 0 100% 70%; /* #ff6b6b equivalent */
--background: 0 0% 100%; /* Pure white */
```

### Component Changes
- `SocialProof` - Remove cards, text-only logos
- `StatsSection` - Remove cards, add triangle markers
- `Hero` - New floating card layout with image slots
- `Features` - Alternating asymmetric sections
- New `GeometricMarker` component for stat accents

### Performance
- Use Next.js Image component for all photos
- Lazy load below-fold images
- Placeholder blurs for image loading
