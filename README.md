# Script Kiddy

A single-page showcase of unconventional web effects.

Open `index.html` in a browser, or serve the
folder with anything (`python3 -m http.server`).

## What's in it

**Browser chrome**

| Effect | How |
| --- | --- |
| Marquee tab title (`\| WORD \|` → `WORD \|` → `ORD \|`…), plus typewriter, scroll-percent and wave modes | rotate a string into `document.title` on a timer |
| Favicon clock hand that turns as you scroll, progress ring, eyes that follow the mouse, unread badge, emoji | draw on a 64×64 canvas, set `link.href = canvas.toDataURL()` |
| Scroll progress bar in the address bar (`#[=====-----]-50`) | `history.replaceState`, throttled |
| Title + favicon change when you leave the tab, greeting when you return | `visibilitychange` |
| Live count of open tabs of the page | `BroadcastChannel` roll-call |

**CSS only**

| Effect | How |
| --- | --- |
| Words light up as they cross the middle of the screen; top progress bar; card fade-ins | `animation-timeline: view()` / `scroll()` |
| Five radio buttons recolour the entire site | `html:has(#pink:checked) { --hue: 350 }` |
| Spinning conic-gradient border | `@property --angle` |
| Popover toast that animates in from `display: none`, exclusive accordion | `popover`, `@starting-style`, `<details name>` |
| Circular theme wipe from the click point | View Transitions API + `clip-path` |

**Pointer**: inverting spotlight (`mix-blend-mode: difference`), 3D tilt card with glare, magnetic buttons.

**Text**: scramble/decode, CSS glitch.

**Easter eggs**: Konami code (barrel roll + disco), styled console banner with a `kiddy` API on `window`, `document.designMode` toggle, a print stylesheet that prints a coupon instead of the page.

Every card has a "Show the trick" disclosure with the minimal code for that effect.

## Structure

```
index.html            all the markup, demos and code snippets
assets/style.css      design tokens, layout, and every CSS-only effect
assets/app.js         shared plumbing: scroll dispatcher, theme flip, toast, copy buttons
assets/fx/chrome.js   title, favicon, address bar, visibility, tab census
assets/fx/pointer.js  spotlight, tilt, magnetic buttons
assets/fx/text.js     scramble, glitch toggle, word splitting for the reader
assets/fx/eggs.js     konami, console, designMode, print
```

## Notes

- `prefers-reduced-motion` is respected: the tab title starts in "Off" mode, decorative animations pause, and the barrel roll is skipped.
- Features detect themselves. Where scroll-driven animations, View Transitions or `popover` are missing, the page falls back to a static version and says so on the card.
- Dynamic favicons work in Chrome, Edge and Firefox. Safari ignores favicon changes after load.
- `BroadcastChannel` needs an http(s) origin; it does nothing across `file://` tabs.
- The address-bar effect is off by default because it replaces the `#section` anchors while it runs.

## Deploying

It's a static site. On GitHub: Settings → Pages → "Deploy from a branch", pick the branch and `/ (root)`.
