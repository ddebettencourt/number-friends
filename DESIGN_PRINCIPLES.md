# Number Friends Design Principles

## Visual Identity

### Color Palette
- **Primary**: Amber/Orange gradient (#f59e0b to #ea580c) - used for CTAs, highlights, branding
- **Secondary**: Slate/Gray (#1e293b to #f1f5f9) - used for backgrounds, text
- **Accent Colors by Feature**:
  - Red (#ef4444): D4 die, danger states
  - Blue (#3b82f6): D6 die, Prime numbers
  - Green (#22c55e): D8 die, success states
  - Yellow (#eab308): D10 die, multiples of 10
  - Purple (#a855f7): Prime die, perfect squares
  - Pink (#ec4899): Gaussian die
  - Teal (#14b8a6): Twin primes, abundant numbers
  - Orange (#f97316): Perfect cubes
  - Emerald (#10b981): Fibonacci

### Typography
- **Headings**: Bold/Black weight, gradient text for emphasis
- **Body**: Medium weight, gray-700 for readability
- **Numbers/Scores**: Black weight, large size for visibility
- **Labels**: Small, uppercase, tracking-wide for UI elements

### Iconography
- **NO EMOJIS** in game UI - use custom SVG icons only
- Icons should be simple, single-color, 24x24 base size
- Use stroke-based icons for actions, filled for status
- Mathematical symbols (√, ∛, +, ×) as decorative elements

### Spacing & Layout
- Consistent 4px base unit (p-1, p-2, p-4, p-6, p-8)
- Rounded corners:
  - Small elements: rounded-lg (8px)
  - Cards/modals: rounded-2xl (16px)
  - Large containers: rounded-3xl (24px)
- Shadows:
  - Interactive elements: shadow-lg
  - Floating elements: shadow-2xl
  - Subtle depth: shadow-md

## Component Patterns

### Buttons
- Primary: Gradient background, white text, rounded-xl, shadow-lg
- Secondary: Gray background, dark text
- Hover: scale(1.02-1.05), slight y-lift
- Active: scale(0.95-0.98)
- Disabled: opacity-50, no hover effects

### Cards
- White/light background
- Subtle border (border-gray-100)
- Inner content with consistent padding (p-4 to p-6)
- Top accent gradient for headers when needed

### Modals/Overlays
- Dark backdrop (bg-black/50 to bg-black/70)
- Centered white card
- Entry animation: scale from 0.9, fade in
- Exit animation: scale to 0.9, fade out

### Dice Visuals
- 3D appearance with CSS transforms
- Proper geometric shapes (not all cubes!)
  - D4: Tetrahedron
  - D6: Cube with pips
  - D8: Octahedron
  - D10: Pentagonal trapezohedron
  - Prime/Gaussian: Stylized cube with numbers
- Realistic rolling animation
- Show actual die values (not random cycling)

### Progress/Status Indicators
- Circular progress: stroke-based SVG
- Linear progress: gradient fill bars
- Status dots: colored circles with subtle pulse
- Timers: Large, bold numbers with warning color at low time

## Animation Guidelines

### Timing
- Quick interactions: 150-200ms
- Standard transitions: 300ms
- Emphasis animations: 500ms
- Complex sequences: 800-1500ms

### Easing
- Enter: ease-out
- Exit: ease-in
- Continuous: ease-in-out
- Bouncy/playful: spring with bounce

### Motion Patterns
- Scale up slightly on hover (1.02-1.08)
- Lift up on hover (y: -2 to -4)
- Pulse for attention (scale or opacity loop)
- Rotate for loading/processing
- Slide for page transitions

## Game-Specific Guidelines

### Board
- Clear grid with visible square numbers
- Special squares have distinct colors/icons
- Player tokens clearly visible with shadows
- Subtle highlight on current/target squares

### Dice Rolling
- Spinner wheel: Clean segments, readable labels
- Dice: Realistic 3D with proper face count
- Results: Large, centered, with celebration animation

### Minigames
- Full-screen modal overlay
- Clear instructions at top
- Timer/progress visible
- Large touch targets for mobile
- Immediate feedback on actions
- Results screen with rankings

### Multiplayer
- Player colors consistent throughout
- Current player always highlighted
- AI players marked but not distracting
- Turn indicator always visible

## Accessibility

- Minimum tap target: 44x44px
- Color contrast: WCAG AA minimum
- Don't rely on color alone for meaning
- Readable font sizes (min 14px body, 12px labels)
- Focus states for keyboard navigation

## Anti-Patterns (What NOT to do)

- NO random emojis scattered around
- NO inconsistent border radius mixing
- NO tiny click targets
- NO animation that blocks interaction
- NO pure black (#000) - use slate-900
- NO pure white (#fff) backgrounds - use slight gray tint
- NO generic dice cubes for non-cube dice
- NO walls of text without hierarchy
