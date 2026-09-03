# StudyBuddy — Design System

Duolingo-inspired design language adapted for BECE prep.

---

## Color Palette

### Brand
```
--brand-primary: #58CC02       (Feather Green — primary CTA)
--brand-primary-dark: #46A302  (pressed/shadow)
--brand-primary-hover: #61E002
--brand-primary-light: #D7FFB8 (tinted backgrounds)
```

### Gamification
```
--streak-orange: #FF9600       (streaks, fire, warmth)
--streak-orange-dark: #CC7700
--heart-red: #FF4B4B           (hearts, wrong answers, danger)
--heart-red-dark: #E02E2E
--xp-gold: #FFC800             (XP, rewards, badges)
--xp-gold-dark: #CC9F00
--super-purple: #CE82FF        (premium, special events)
--super-purple-dark: #A560D4
--info-blue: #1CB0F6           (links, hints, info)
--info-blue-dark: #0A8ACF
```

### Neutrals
```
--bg: #FFFFFF                  (white canvas)
--bg-soft: #F7F7F7
--surface: #FFFFFF
--text: #4B4B4B                (body — warm gray, never black)
--text-strong: #3C3C3C         (headlines)
--text-muted: #777777          (captions, metadata)
--text-soft: #AFAFAF           (disabled)
--border: #E5E5E5              (card borders)
--border-strong: #D4D4D4       (inputs, selected cards)
```

---

## Typography

**Display font:** Nunito (open-source, Duolingo's Feather Bold substitute)
**Body font:** Nunito (same family, lighter weights)

| Role | Size | Weight | Line Height | Notes |
|------|------|--------|-------------|-------|
| Display | 40px | 800 | 1.15 | Hero, celebrations |
| H1 | 32px | 800 | 1.15 | Page titles |
| H2 | 24px | 800 | 1.2 | Section headings |
| H3 | 18px | 700 | 1.25 | Card titles |
| Body Large | 17px | 400 | 1.5 | Instructions |
| Body | 15px | 400 | 1.5 | Standard text |
| Caption | 13px | 600 | 1.4 | Metadata |
| Button | 15px | 700 | 1.0 | Uppercase CTAs |

**Rules:**
- Big, bold, rounded — confidence over restraint
- Body text is warm gray (#4B4B4B), never pure black
- Buttons often UPPERCASE with 0.8px letter-spacing
- Rounded letterforms throughout — no sharp serifs

---

## Buttons

### Primary
```css
.btn-primary {
  background: #58CC02;
  color: #FFFFFF;
  font-weight: 700;
  font-size: 15px;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  border: none;
  border-bottom: 4px solid #46A302;  /* the "lip" */
  border-radius: 16px;
  padding: 14px 24px;
  cursor: pointer;
}
.btn-primary:active {
  border-bottom-width: 0;
  margin-top: 4px;
}
```

### Secondary
```css
.btn-secondary {
  background: #FFFFFF;
  color: #58CC02;
  border: 2px solid #58CC02;
  border-radius: 16px;
}
```

### Danger
```css
.btn-danger {
  background: #FF4B4B;
  border-bottom: 4px solid #E02E2E;
}
```

---

## Cards

```css
.card {
  background: #FFFFFF;
  border: 2px solid #E5E5E5;
  border-bottom: 4px solid #E5E5E5;  /* subtle depth */
  border-radius: 16px;
  padding: 16px;
}
.card:hover {
  transform: translateY(-2px);
  border-bottom-width: 6px;
}
```

---

## Progress Bar

```css
.progress-bar {
  height: 16px;
  background: #E5E5E5;
  border-radius: 9999px;
  overflow: hidden;
}
.progress-fill {
  background: #58CC02;
  border-radius: 9999px;
  transition: width 320ms ease-out;
}
```

---

## Badges / Pills

```css
.badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #FFFFFF;
  border: 2px solid #E5E5E5;
  border-radius: 9999px;
  padding: 4px 10px;
  font-size: 13px;
  font-weight: 700;
}
.badge-streak { color: #FF9600; border-color: #FF9600; }
.badge-xp { color: #FFC800; border-color: #FFC800; }
.badge-hearts { color: #FF4B4B; border-color: #FF4B4B; }
```

---

## Shadows

```
Button (solid lip):  0 4px 0 [darker shade of same color]
Card (hover):        0 2px 8px rgba(0,0,0,0.06)
Modal:               0 16px 48px rgba(0,0,0,0.20)
```

---

## Border Radius

```
sm:   8px    (small elements)
md:   12px   (inputs, list items)
lg:   16px   (cards, buttons)
xl:   20px   (modals)
pill: 9999px (badges, progress bars)
```

---

## Spacing

```
xs:  4px
sm:  8px
md:  16px
lg:  24px
xl:  32px
2xl: 48px
```

---

## Key Principles

1. **White canvas** — no tinted backgrounds
2. **Green is king** — one primary CTA color only
3. **Chunky buttons** — solid 3D lip shadow, not blurred
4. **Bold outlines** — 2px borders on cards, not soft elevation
5. **Rounded everything** — 12-16px radii, pill badges
6. **Warm grays** — #4B4B4B for text, never #000
7. **One action per screen** — spacious, focused
8. **Gamification palette** — orange/red/gold/purple for signals only

---

## Subject Colors (StudyBuddy-specific)

Each subject gets its own accent for identity:

| Subject | Color | Hex |
|---------|-------|-----|
| Mathematics | Blue | #1CB0F6 |
| Integrated Science | Green | #58CC02 |
| English Language | Orange | #FF9600 |
| Social Studies | Purple | #CE82FF |

Used for: subject cards, glossary headers, quiz progress bars per subject.
