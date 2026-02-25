# Luma Brand Identity

> Light reveals what's already there.

---

## 1. Brand Essence

### The Name

**Luma** — from the Latin *lumen* (light). Light doesn't create — it reveals. An operator's work already exists; Luma makes it visible. The name is short, warm, and memorable. It sounds like a person's name, not a product. It feels premium without being pretentious.

### Tagline

**Primary:** Make invisible work undeniable.
**Supporting:** Your delivery, made visible. / The Client Delivery OS.

### The Core Tension Luma Resolves

Operators do excellent work that is structurally invisible. Clients pay for outcomes they can't see. This creates a trust gap — not because trust is broken, but because evidence is missing. Luma fills the gap with clarity, not complexity.

### Brand Promise

**To operators:** Your work will speak for itself. No more proving your value — Luma does it for you.
**To clients:** One link. Full clarity. Zero effort.

---

## 2. Brand Personality

### The Character

Luma is the **confident, organized colleague** who makes everyone around them look better. Not a flashy salesperson. Not a cold enterprise tool. Think: the person in the room who doesn't need to talk loudest because the work is obviously excellent.

### Personality Attributes

| Attribute | What it means | What it doesn't mean |
|-----------|--------------|---------------------|
| **Assured** | Confident in what it does, clear about its purpose | Arrogant, competitive, or defensive |
| **Warm** | Approachable, human, not corporate | Cutesy, informal, or unprofessional |
| **Precise** | Every detail is intentional, data is exact | Cold, robotic, or sterile |
| **Supportive** | Exists to make the operator look competent | Patronizing or hand-holding |
| **Understated** | Premium expressed through restraint, not flash | Boring, plain, or generic |

### Brand Archetype

**The Sage-Creator hybrid.** Luma brings order and visibility (Sage) while helping operators craft the narrative of their value (Creator). It's not about telling operators what to do — it's about giving them the tools to show what they've already done.

### Personality Spectrum

```
Cold ─────────────────────────●──── Warm
                              ↑ Luma sits here: warm but not fuzzy

Playful ──────────────●──────────── Serious
                      ↑ Luma sits here: purposeful with personality

Minimal ──────────●──────────────── Maximal
                  ↑ Luma sits here: clean but not empty

Edgy ────────────────────●───────── Safe
                         ↑ Luma sits here: refined, not risky
```

---

## 3. Visual Identity

### Design Philosophy

Luma's visual language is **warm precision** — the intersection of approachable warmth and data-driven clarity. Inspired by:

- **Chrissy Elle's brand**: Understated confidence, "whispers rather than shouts," anti-hype authenticity
- **Grow Advantage's tone**: Practical expertise, conversational professionalism, operational focus
- **Premium SaaS benchmarks**: Linear's density-with-clarity, Notion's warmth-with-structure, Stripe's polish-without-pretension

The goal: a tool that Sarah (the operator) trusts enough to share with Marcus (the client), and that Marcus judges as "my operator has their act together" in the first 50 milliseconds.

### Visual Pillars

1. **Warmth through tone** — Off-white backgrounds with warmth (not cold gray-blue). Rounded corners. Soft shadows tinted with the primary color. No hard edges or stark contrasts.

2. **Precision through typography** — Monospace numbers for data. Clear hierarchy. Tight letter-spacing on headings. The type system alone should signal "this tool knows what it's doing."

3. **Restraint as premium** — Whitespace is the luxury material. No gradients. No illustrations. No mascots. The interface IS the brand. Every saved pixel of noise is a pixel of clarity earned.

4. **Color with purpose** — Color is used semantically, not decoratively. Indigo means action. Green means progress. Amber means attention. Red means exceeded. No color exists without a reason.

---

## 4. Color System

### Philosophy

The palette is built on a **warm indigo** foundation — distinctive from the cold blues of enterprise SaaS and the bright teals of startup tools. Indigo is historically associated with value, depth, and craftsmanship (indigo dye was once more valuable than gold). Paired with **warm amber** as the attention accent, it creates a palette that is unmistakably Luma.

### Primary Palette

| Role | Name | HSL | Hex | Usage |
|------|------|-----|-----|-------|
| **Primary** | Warm Indigo | `245 58% 51%` | `#5B4DC7` | Actions, active states, links, brand moments |
| **Primary Glow** | Indigo Tint | `245 58% 93%` | `#EDEAFC` | Primary hover backgrounds, selected states |
| **Accent** | Warm Amber | `28 92% 58%` | `#E8853A` | Attention signals, scope warnings, CTAs |
| **Success** | Sage Green | `158 64% 40%` | `#25A576` | Completed states, on-track scope |
| **Destructive** | Warm Red | `0 84% 60%` | `#EF4343` | Errors, exceeded scope, destructive actions |

### Neutral Palette

| Role | Name | HSL | Hex | Usage |
|------|------|-----|-----|-------|
| **Background** | Warm Linen | `40 20% 98%` | `#FDFBF8` | Operator page background |
| **Surface** | Pure White | `0 0% 100%` | `#FFFFFF` | Cards, elevated surfaces |
| **Foreground** | Near Black | `240 10% 8%` | `#131318` | Primary text |
| **Muted Text** | Warm Gray | `240 5% 42%` | `#666770` | Secondary text, metadata |
| **Border** | Warm Edge | `40 8% 90%` | `#E6E4E0` | Dividers, card outlines |
| **Muted BG** | Warm Fog | `40 10% 96%` | `#F6F5F3` | Subtle section backgrounds |

### Dual-Theme: Operator vs. Client Portal

The operator dashboard and client portal share the same palette but use it differently to create distinct experiences that still feel like one product.

**Operator Dashboard (Workspace Feel)**
- Background: Warm Linen (`#FDFBF8`) with subtle noise texture
- Higher information density, more color signals
- Cards have subtle warm-tinted shadows
- Active use of the full semantic color range
- Sidebar with slightly different surface tone

**Client Portal (Document Feel)**
- Background: Near-White (`#FCFCFC`) — cleaner, less texture
- No noise texture — feels like a polished report
- Narrower content column (max 640px) for reading comfort
- Fewer colors — mostly neutrals with green/amber/red for scope status
- No chrome (no sidebar, no nav) — content is the interface
- Slightly lighter font weights — body at 400, headings at 700

```css
/* Portal-specific overrides */
.portal {
  --background: 0 0% 99%;     /* Cleaner, less warm */
  --card: 0 0% 100%;          /* Pure white */
  --border: 0 0% 92%;         /* Cooler border */
}
```

### Dark Mode (Operator Only)

Dark mode is for the operator dashboard only. The client portal remains light — it's a document, not a workspace.

| Role | HSL | Hex |
|------|-----|-----|
| Background | `0 0% 6%` | `#0F0F0F` |
| Surface | `0 0% 10%` | `#1A1A1A` |
| Foreground | `0 0% 98%` | `#FAFAFA` |
| Primary | `245 70% 65%` | `#7B6FDB` |
| Border | `0 0% 18%` | `#2E2E2E` |
| Muted Text | `0 0% 64%` | `#A3A3A3` |

Dark mode uses a slightly lighter, more saturated indigo (`#7B6FDB`) to maintain vibrancy on dark surfaces. The dark background is true near-black, not the muddy dark-gray common in SaaS tools.

### Semantic Color Mapping

```
Scope Status:
  0-60%   → success (green)   → "On Track"
  61-85%  → primary (indigo)  → "Active"
  86-100% → accent-warm (amber) → "Nearing Limit"
  100%    → accent-warm (amber) → "Fully Used"
  101%+   → destructive (red) → "Exceeded"

Client Status:
  Active   → success (green dot)
  Paused   → muted (gray dot)
  Archived → muted (gray dot, dimmed text)

Delivery Status:
  Completed         → success (green)
  In Progress       → primary (indigo)
  Pending Approval  → accent-warm (amber)
  Approved          → success (green + check)
  Revision Requested → destructive (red)
```

---

## 5. Typography System

### Font Selection Rationale

| Role | Font | Why |
|------|------|-----|
| **Display & Body** | Plus Jakarta Sans | Geometric but warm — rounded terminals give personality without sacrificing readability. More distinctive than Inter/Roboto. Signals "modern and intentional." Google Fonts, well-hinted, excellent weight range. |
| **Data & Numbers** | JetBrains Mono | Purpose-built for data legibility. Tabular figures align naturally. The monospace treatment tells users "this is precise data." Creates instant visual contrast with the body font. |

### Type Scale

| Level | Size | Weight | Tracking | Font | Usage |
|-------|------|--------|----------|------|-------|
| **Display** | 30px (`text-3xl`) | 800 | -0.02em | Jakarta | Page titles: "Dashboard," client names |
| **H1** | 24px (`text-2xl`) | 700 | -0.015em | Jakarta | Section titles |
| **H2** | 20px (`text-xl`) | 600 | -0.01em | Jakarta | Card titles, subsections |
| **H3** | 16px (`text-base`) | 600 | -0.005em | Jakarta | List headers, labels |
| **Body** | 14px (`text-sm`) | 400 | 0 | Jakarta | Default content |
| **Body Small** | 13px | 400-500 | 0 | Jakarta | Secondary info, metadata |
| **Caption** | 12px (`text-xs`) | 500 | 0.01em | Jakarta | Badges, timestamps |
| **Data** | 14px (`text-sm`) | 500 | 0 | JetBrains Mono | Scope numbers, hours, percentages |
| **Data Large** | 24px (`text-2xl`) | 600 | 0 | JetBrains Mono | Scope tracker headline numbers |

### Typography Rules

1. **Weight contrast, not size contrast.** Headings differ from body primarily through weight (700 vs 400), not just size. This creates hierarchy without scale bloat.
2. **Mono for data, sans for prose.** Scope hours, percentages, and counts use JetBrains Mono. Descriptions, titles, and labels use Plus Jakarta Sans. The font switch is a visual cue: "this is a number that matters."
3. **Tight headings, comfortable body.** Headings use negative letter-spacing (-0.02em to -0.005em) for a crafted feel. Body text uses default spacing for readability.
4. **Never below 13px.** No readable text smaller than 13px. Badges and timestamps can use 12px at `font-weight: 500` for compensation.
5. **Truncation over wrapping.** In lists and cards, long text truncates with ellipsis. Full text appears on hover/detail view. This preserves layout rhythm.

### Portal Typography Adjustments

The client portal uses slightly different weight distribution:
- Headings: 700 (not 800) — less commanding, more informational
- Body: 400 — lighter, more "report-like"
- Data numbers: 600 — still prominent, but integrated

---

## 6. Voice & Tone

### Voice (Consistent)

Luma speaks like a **knowledgeable colleague** — someone who has been in the trenches of client work and understands the operator's reality. Not a corporation. Not a chatbot. A peer who happens to be really good at organizing information.

| Principle | Do | Don't |
|-----------|----|----|
| **Be direct** | "3 clients need attention" | "It looks like you might want to take a look at some of your clients" |
| **Be specific** | "Scope exceeded by 2 hours" | "Scope is getting close to the limit" |
| **Be human** | "No deliveries logged yet" | "Error: delivery_items array is empty" |
| **Be useful** | "Log your first delivery to start building a record" | "Click the button below to get started on your journey" |
| **Respect time** | "12 of 20 hours used" | "You have used twelve out of your twenty allocated hours this billing period" |

### Tone (Contextual)

The tone shifts based on context, but always stays within the brand voice:

| Context | Tone | Example |
|---------|------|---------|
| **Empty states** | Encouraging, helpful | "Add your first client to get started" |
| **Success** | Brief, satisfying | "Delivery logged" / "Link copied" |
| **Warnings** | Clear, not alarming | "Scope nearing limit — 18 of 20 hours used" |
| **Errors** | Honest, actionable | "Couldn't save. Please try again." |
| **Portal** | Warm, professional | "Your delivery summary for February" |
| **Scope exceeded** | Factual, not judgmental | "2 hours over allocated scope" (not "WARNING: Over scope!") |
| **Onboarding** | Concise, momentum-building | "You're 3 steps from showing clients your value" |

### Writing Rules

1. **Sentence case everywhere.** "Add your first client" not "Add Your First Client." Title case feels corporate.
2. **No exclamation marks.** Confidence doesn't need exclamation. "Delivery logged." not "Delivery logged!"
3. **No jargon.** The operator knows what "scope" means, but the client might not. Portal copy says "hours used" not "scope consumed."
4. **Active voice.** "You've used 12 hours" not "12 hours have been used."
5. **Contractions are fine.** "Couldn't save" is warmer than "Could not save." We're not writing legal docs.
6. **Numbers, not words.** "3 clients" not "three clients." "12 of 20 hours" not "twelve of twenty hours." Operators and clients both scan numbers faster.

### Client Portal Voice

The portal speaks to Marcus (the client persona). Key differences from operator-facing copy:

- **Simpler vocabulary.** "What's been done" not "Deliverables completed."
- **No operator jargon.** "Hours used" not "Scope allocation consumed."
- **Shorter.** Maximum 1-2 sentences per description. Marcus scans, he doesn't read.
- **Confident framing.** "Here's what was delivered" (not "Here's what your operator has been working on"). The work is the subject, not the person.

---

## 7. What Makes Luma Distinctive

### Against Generic SaaS

Most SaaS tools look like they were generated from the same template: cold blue primary, Inter font, gray backgrounds, generic illustrations of happy people using laptops. Luma differentiates through:

| Generic SaaS | Luma |
|--------------|------|
| Cold blue primary (#3B82F6) | Warm indigo (#5B4DC7) — richer, more distinctive |
| Inter/Roboto | Plus Jakarta Sans — geometric warmth with character |
| Stark white backgrounds | Warm Linen (#FDFBF8) — subtle warmth, noise texture |
| Generic illustration empty states | Text-first empty states with clear CTAs |
| Blue-gray shadows | Indigo-tinted shadows — everything feels cohesive |
| "Dashboard" with 47 widgets | Focused views with one primary action per screen |
| Dark mode as "invert all colors" | Dark mode with adjusted primary (lighter indigo for contrast) |

### Against Competitors

| Competitor | Their look | Luma's advantage |
|-----------|-----------|-----------------|
| **Motion.io** | Clean but generic — could be any client portal tool | Luma's scope tracker is visually unique; the warm palette is instantly recognizable |
| **SPP.co** | Dense, enterprise-y — intimidating for solo operators | Luma's warmth and simplicity says "built for you, not for enterprise" |
| **SuiteDash** | Everything-tool visual noise — too many features on screen | Luma's restraint is its premium signal. Less surface area = more confidence |
| **Notion template** | DIY feel — "I built this myself" energy | Luma's polish says "your operator uses professional tools" |

### The Distinctive Moments

1. **The scope tracker.** No other tool in this space has a scope visualization. The segmented progress bar with status colors is instantly ownable. This is Luma's visual signature.

2. **The portal.** The client view — a single-scroll, no-login, document-like experience — is unlike anything in project management. It looks like a beautifully formatted report, not a software interface. This is the "wow" moment.

3. **The warm indigo.** `#5B4DC7` is Luma's color. Not cold blue, not trendy purple, not generic teal. Warm indigo sits in a visual space that very few SaaS tools occupy. It's memorable.

4. **The noise texture.** The subtle SVG noise on the operator background adds physical warmth — like paper grain. It's a small detail that separates Luma from flat, sterile SaaS surfaces. (Not used on the portal — the portal is a clean document.)

5. **Monospace data.** Using JetBrains Mono for scope numbers and hours creates an immediate visual signal: "this is precise data." It's a typographic choice that communicates credibility without saying a word.

---

## 8. Brand Application Guidelines

### Logo Usage

The Luma wordmark uses Plus Jakarta Sans at weight 800 with -0.03em letter-spacing. The "L" is subtly customized — the horizontal stroke extends slightly further than standard, creating a small shelf that evokes a progress bar.

| Context | Treatment |
|---------|-----------|
| **App header** | Wordmark in foreground color, no icon |
| **Client portal footer** | "Powered by Luma" in muted-foreground, small |
| **Favicon** | "L" in indigo on white, 32x32 |
| **Social/marketing** | Wordmark + tagline on warm linen background |

### Do's and Don'ts

**Do:**
- Use warm indigo as the dominant brand color
- Let whitespace breathe — resist filling empty space
- Use the noise texture on operator backgrounds
- Keep the portal minimal and document-like
- Let data (numbers, progress bars) be the visual hero

**Don't:**
- Use cold blues or standard SaaS palettes
- Add illustrations, mascots, or decorative graphics
- Use gradient fills on backgrounds or buttons
- Make the portal feel like a software dashboard
- Add "powered by AI" messaging — Luma is about human work, not AI

### Imagery Style

Luma does not use stock photography or illustrations in the product. The product IS the visual experience. If imagery is needed for marketing:
- Abstract, warm-toned textures (paper, linen, fabric)
- Clean screenshots of the actual product
- Never: generic stock photos of people at laptops
- Never: isometric illustrations of floating UI elements

### Social Media & Marketing Tone

Marketing copy follows the same brand voice but can be slightly more assertive:

- "Your clients should never have to ask 'what have you been doing?'"
- "Scope creep dies when scope is visible."
- "Built for operators who are tired of proving their value."
- "One link. Full clarity. Zero logins."

Avoid:
- Hype language ("revolutionary," "game-changing," "10x")
- Fear-based messaging ("stop losing clients" — too negative)
- Technical jargon in marketing ("SaaS," "RLS," "edge functions")
- Competitor bashing (Luma's positioning is about what it IS, not what others aren't)

---

## 9. Accessibility as Brand Value

Accessibility is not an afterthought — it's a brand principle. Luma's clients include non-technical business owners accessing portals on various devices and in various contexts. The brand commitment:

1. **WCAG AA minimum** on all color pairs (4.5:1 text, 3:1 UI)
2. **Triple encoding** for all status states (color + icon + text label)
3. **prefers-reduced-motion** respected everywhere
4. **Keyboard-navigable** — every action reachable via keyboard
5. **Screen-reader-friendly** — ARIA labels on all interactive elements
6. **Mobile-first portal** — 80% of client views happen on phone

This is premium, not charity. Accessibility is how Luma earns trust across the widest possible audience. Sarah won't share a portal link if she's not confident it works for every client.

---

## 10. Summary: The Luma Brand in One Paragraph

Luma is a warm, precise, and understated brand built for service operators who need their work to be visible without having to self-promote. The visual identity is anchored in warm indigo (`#5B4DC7`), Plus Jakarta Sans, and a design philosophy of "restraint as premium." The operator experience is a warm, productive workspace; the client experience is a clean, effortless document. Every design choice — from the noise texture on the background to the monospace numbers in the scope tracker — exists to communicate one thing: *this operator has their act together, and here's the proof.* Luma doesn't shout. It reveals.
