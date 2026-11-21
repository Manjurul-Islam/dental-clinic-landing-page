# Dentix. — Dental Clinic Landing Page

A responsive, animated landing page for a dental clinic, built from a Figma design with plain HTML, CSS and JavaScript (no build step).

**Live:** https://dentix-landing.vercel.app

## Features

- 10 sections from the design: Hero, About, Services, Why Choose Us, Doctors, Results, Process, Testimonials, Articles, Footer
- Smooth scrolling ([Lenis](https://github.com/darkroomengineering/lenis)) with eased anchor jumps; falls back to native smooth scroll
- Header turns into frosted glass on scroll, hides on scroll-down and returns on scroll-up; full-screen mobile menu
- Hero intro: background zoom, line-by-line headline reveal, count-up stats
- Scroll reveals with staggered cards, growing section-tag lines and an image wipe
- Infinite carousels (Services, Doctors, Testimonials) with arrows, keyboard, drag/swipe; Doctors and Testimonials autoplay and pause on hover, focus, drag or when off-screen
- Results card stack: swipe to send the top card to the back; click (or Enter) to open the image full screen with a morph transition
- Hover effects: rolling button labels, rotating arrows, card lifts, image zooms, yellow link and article highlights, step backgrounds in Process
- Progressive blur over the "98% Patient Satisfaction" panel
- Honors `prefers-reduced-motion`

## Breakpoints

| Width | Layout |
|---|---|
| ≥ 1440px | 1360px content, centred; backgrounds full width |
| 1024–1439px | Desktop layout, fluid columns |
| 768–1023px | Burger menu, 2-column cards, carousels show 2 |
| < 768px | Single column, carousels show 1, stacked steps and articles |

## Structure

```
.
├── index.html        # markup for all sections
├── styles.css        # design tokens (:root), layout, responsive rules, animations
├── app.js            # scrolling, header, reveals, carousels, card stack, image viewer
└── assets/
    ├── img/          # photos (JPEG)
    └── icons/        # SVG icons, social PNGs, section-tag line masks
```

## Run locally

```bash
python3 -m http.server 8833
# open http://localhost:8833
```

Any static file server works.

## Deploy

```bash
npx vercel deploy --prod
```

## Editing

- **Colours, spacing, type scale:** CSS variables at the top of `styles.css` (`--ink`, `--yellow`, `--rust`, `--pad`, `--sec`, …).
- **Content:** edit text directly in `index.html`; each section is commented with its Figma node id.
- **Images:** replace files in `assets/img/` keeping the same names, or update the `src` attributes.
- **Carousel autoplay:** remove the `data-autoplay` attribute from a carousel to turn it off; the interval (3200 ms) is in `app.js`.

## Placeholders

Social links, Privacy Policy / Terms, and article cards point to `#` or the page itself and need real URLs.

## Credits

- Fonts: [Urbanist](https://fonts.google.com/specimen/Urbanist) and [Playfair Display](https://fonts.google.com/specimen/Playfair+Display) via Google Fonts (SIL Open Font License)
- Smooth scroll: Lenis (MIT), loaded from unpkg
- Design and imagery: Dentix Figma design file
