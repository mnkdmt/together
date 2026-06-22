# Together — Design System (v1, Dark Liquid Glass)

> Handoff spec for implementation. Personal couple's PWA: she forwards date-idea links to a Telegram bot → he triages the backlog, plans, and logs "done" memories. **Dark theme only. Mobile-first, 390pt width, 9:16.**
> The companion file `Together — Liquid Glass.dc.html` is the visual source of truth (8 screens + component library). This document is the rulebook for turning it into code.

---

## 0. The 5 inviolable rules

These are what keep dark glass from looking generic. **Do not break them.**

1. **Glass = control layer only.** `backdrop-filter` is allowed ONLY on: top bar, bottom tab bar, segmented control, filter chips, floating round buttons (back/share), search field, sheets/modals, the settings list. **Never tint content cards with glass.**
2. **Content cards are dense, with real photos.** They carry the color. Glass refracts/lenses them — it never covers them with a flat tint.
3. **One warm accent: ember-orange `#FF7A45`.** No purple, no neon, no rainbows. Teal is background ambient glow + one category tint only.
4. **Honest specular edges.** Every glass surface gets a brighter top/left hairline (`border-top-color`) + inner highlight (`inset 0 1px 0`). This is what reads as Liquid Glass vs. a plain blur div.
5. **Legibility > effect.** Any text over photo/glass sits on a scrim. Text contrast ≥ 4.5:1 always. Tap targets ≥ 44×44pt.

---

## 1. Design tokens

Paste-ready. Use CSS custom properties (or mirror into Tailwind theme / RN constants).

```css
:root {
  /* ---- Surfaces ---- */
  --bg-base:        #0A0810;   /* screen background (deep aubergine-black) */
  --bg-elevated:    #14111C;   /* opaque content cards, stat tiles, list bg */

  /* ---- Text ---- */
  --text-primary:   #F4F1FA;   /* cream / near-white */
  --text-secondary: #B6AFC6;
  --text-tertiary:  #8E879F;
  --text-on-ember:  #2A0F04;   /* dark brown, used on ember fills */

  /* ---- Accent (the ONLY brand accent) ---- */
  --accent-ember:        #FF7A45;
  --accent-ember-light:  #FF8A56;  /* gradient top */
  --accent-ember-deep:   #E8633A;  /* gradient bottom */
  --accent-ember-darker: #B8431F;
  --accent-glow:         rgba(255,106,61,0.45);

  /* ---- Ambient (background bokeh ONLY) ---- */
  --ambient-teal:  #2FD6C3;

  /* ---- Category tints (card glow / kicker label / dot, by idea type) ---- */
  --cat-concert: #FF7A45;  /* концерт / событие — shares ember */
  --cat-food:    #7BE0A3;  /* еда (deep: #2E8B57) */
  --cat-trip:    #6FA8FF;  /* поездка (deep: #2E5BCF) */
  --cat-home:    #F0B65A;  /* дом */
  --cat-bar:     #ED93B1;  /* бар / коктейли */
  --cat-walk:    #2FD6C3;  /* прогулка */

  /* ---- Radii (continuous corners) ---- */
  --r-card:   24px;
  --r-photo:  18px;
  --r-tile:   18px;
  --r-field:  16px;
  --r-sheet:  28px;
  --r-tabbar: 30px;
  --r-pill:   999px;
  --r-screen: 46px;   /* device frame in mockups only */

  /* ---- Spacing ---- */
  --pad-screen:  16px;
  --gap-cards:   12px;   /* 12–14 */
  --pad-inner:   16px;
  --gap-tight:   8px;

  /* ---- Type ---- */
  --font-serif: 'Instrument Serif', Georgia, serif;   /* display/headings, cream */
  --font-sans:  'Hanken Grotesk', -apple-system, 'SF Pro Text', sans-serif; /* UI/body */

  /* ---- Shadows ---- */
  --shadow-card:  0 14px 36px rgba(0,0,0,0.5);
  --shadow-tile:  0 10px 26px rgba(0,0,0,0.45);
  --shadow-float: 0 12px 30px rgba(0,0,0,0.5);
  --shadow-ember: 0 8px 22px rgba(255,106,61,0.4);
}
```

### Type scale

| Token            | Font   | Size  | Weight | Case          | Use                         |
|------------------|--------|-------|--------|---------------|-----------------------------|
| Display / H1     | serif  | 32–38 | 400    | sentence      | screen titles               |
| Section heading  | serif  | 21–22 | 400    | sentence      | "Категории", "Популярное"   |
| Card title       | serif  | 17–23 | 400    | sentence      | idea titles                 |
| Quote (от неё)   | serif *italic* | 15–18 | 400 | sentence | her note, rendered as a quote |
| Body             | sans   | 15–16 | 400/500| sentence      | paragraphs, list rows       |
| Caption / meta   | sans   | 12–13 | 400/600| sentence      | price·location, dates       |
| Kicker           | sans   | 10–11 | 600    | UPPERCASE, tracking 0.10–0.12em | category label above title |

Rule: **only sentence case.** UPPERCASE is reserved for kickers. Numbers/stats are serif (display feel).

### Motion (quiet, iOS-like)

- Screen enter: cards stagger in, 60–80ms apart, `opacity 0→1` + `translateY(8px→0)`, ~450ms `cubic-bezier(0.22,1,0.36,1)`.
- Ember button press: `scale(0.98)` + glow pulse.
- Detail / sheets: slide-up.
- Glass subtly refracts content as it scrolls behind (no parallax gimmicks).

---

## 2. Material recipes

### Glass (control surfaces) — the canonical recipe

```css
.glass {
  backdrop-filter: blur(24px) saturate(160%);
  -webkit-backdrop-filter: blur(24px) saturate(160%);
  background: rgba(20,18,28,0.55);                 /* dark tint, never white */
  border: 1px solid rgba(255,255,255,0.12);
  border-top-color: rgba(255,255,255,0.28);        /* specular edge */
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.14),/* inner highlight */
              0 8px 24px rgba(0,0,0,0.35);
  border-radius: var(--r-card);
}
```

Variants:
- **Floating bar (tab bar / detail CTA bar):** opacity `0.60`, blur `24px saturate(170%)`, shadow `--shadow-float`.
- **Round button (44px):** same recipe, `border-radius:50%`, blur `20px`.
- **Quiet/disabled glass (e.g. "Когда-нибудь"):** drop bg to `0.45`, border to `0.10`, top-border to `0.20`.

### Content card (NOT glass)

```css
.card {
  background: var(--bg-elevated);          /* opaque #14111C */
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: var(--r-card);
  box-shadow: var(--shadow-card);
  overflow: hidden;
}
```

### Photo block + scrim

Every photo (real og:image) sits on a category-tinted gradient fallback, with a scrim under any overlaid text.

```css
.photo            { position:relative; background: <category-gradient>; }
.photo img        { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }
.photo .scrim     { position:absolute; inset:0;
                    background:linear-gradient(180deg, transparent 38%, rgba(0,0,0,0.55)); }
/* list rows use a left-to-right scrim: linear-gradient(90deg, rgba(0,0,0,.7) 5%, rgba(0,0,0,.15) 60%) */
```

> **Fallback gradients** (in the mockup) stand in for real og:images so screens read even offline. In production, render the real `og_image`; keep a per-category gradient as the loading/empty background behind the `<img>`.

### Ember primary button

```css
.btn-ember {
  background: linear-gradient(180deg, #FF8A56, #FF7A45 55%, #E8633A);
  color: var(--text-on-ember);
  font: 700 16px/1 var(--font-sans);
  border: 1px solid rgba(255,205,175,0.6);
  border-top-color: rgba(255,238,225,0.9);   /* specular */
  border-radius: var(--r-pill);
  padding: 17px 24px;
  box-shadow: 0 0 30px rgba(255,106,61,0.45), inset 0 1px 0 rgba(255,255,255,0.5);
}
/* Place a blurred radial glow div behind it: */
.btn-ember-glow { position:absolute; inset:-8px 30px; border-radius:999px;
  background:radial-gradient(closest-side, rgba(255,106,61,0.5), transparent); filter:blur(12px); }
```

### Ambient bokeh (background only)

Two large blurred radial circles per screen — one ember (warm side), one teal (cool side). `filter: blur(~11px)`, sit behind content (`z-index` below content), and respect an `--ambient` on/off toggle.

---

## 3. Iconography

Outline icons, **Tabler / SF Symbols** style: `stroke="currentColor"`, `stroke-width:1.8–2`, round caps/joins, 24px box. Color via parent `color:` (`--accent-ember` when active, `--text-tertiary` `#8E879F` when inactive).

| Use                  | Icon          |
|----------------------|---------------|
| Tab — Сегодня        | `home`        |
| Tab — Поиск          | `search`      |
| Tab — Создать        | `plus-circle` |
| Tab — Было           | `heart` (filled when active) |
| Tab — Профиль        | `user`        |
| Intensity: очень хочет | `flame` (filled, ember) |
| Intensity: интересно | `bookmark` (filled, secondary) |
| Intensity: когда-нибудь | `moon` (filled, tertiary) |
| Detail nav           | `arrow-left`, `share` |
| Meta / actions       | `map-pin`, `calendar-plus`, `chevron-right`, `sun`, `bell`, `link`, `sliders` |

> Tab-bar spec note (§4) lists `sparkles`/`stack`; the shipped reference + this build use `home`/`search` for Сегодня/Поиск. Follow the build.

---

## 4. Components

Anatomy + key dimensions. All live in the `.dc.html` component library section.

### Idea card — featured
Big og:image (~168–172pt tall) → scrim → **glass intensity pill** top-left (icon + label). Below, on the opaque card body: kicker (category tint, UPPERCASE), serif title, her quote (serif italic), meta row (`price` bold cream · `map-pin` location), full-width ember button "Запланировать". Radius 24, `--shadow-card` + faint ember glow.

### Idea card — compact
Mini photo (~96–104pt) with a small round glass intensity badge top-right → tiny body: kicker + short serif title. Laid out 2-per-row.

### Idea card — list row (search/results)
Horizontal: 74px rounded photo, flex text column (kicker, serif title, meta), trailing intensity icon. Opaque card, radius 18.

### Feed card (Список)
Full-width photo (~128pt) with left→right scrim; glass intensity pill top-right; overlaid bottom: kicker + serif title + meta. **Sorted by intensity** (flame → bookmark → moon). Swipe left → "когда-нибудь"/archive; swipe right → plan; tap → detail.

### Intensity badge (3 levels)
Glass pill, icon + label.
- **Очень хочет** — `flame`, ember fill, full-strength glass.
- **Интересно** — `bookmark`, secondary `#B6AFC6` fill, full glass.
- **Когда-нибудь** — `moon`, tertiary `#8E879F`, quiet glass.

### Intensity selector (Создать)
Three equal segmented buttons (icon stacked over label). Selected = ember fill (dark text); others = glass. This is the 3-button choice the bot also asks.

### Glass tab bar
Floating, 16px inset, 64px tall, radius 30, 5 items, blur `24px saturate(170%)` @ 0.60. Active item: ember icon + 4px ember dot beneath. Inactive: `#8E879F`.

### Glass segmented (`На выезд / Дома`)
4px padding track (glass), selected thumb = ember-gradient pill with its own inset highlight + ember shadow.

### Glass filter chips (`Всё · Выезд · Дома · Её · Моё`)
Pills, 8px gap, horizontally scrollable. Active = ember fill; rest = glass.

### Link-import card (Создать)
Bot-fetched state: og:image thumb (88px) + serif title + url host + teal "Загружено ботом" check badge. User then assigns category / intensity / note.

### Search field
Glass, radius 16: leading `search` icon, placeholder `#8E879F`, trailing `sliders` icon.

### Settings list (Профиль)
One glass container, rows split by `rgba(255,255,255,0.07)` hairlines. Row = tinted leading icon + label + trailing value/`chevron`/toggle. Toggle ON = ember pill track + white knob.

### Avatars (Профиль)
58px circle, category-gradient fill, serif initial, 2px `--bg-elevated` border; partner avatars overlap by ~18px.

### Stat tile (Профиль)
Opaque tile, radius 18: big serif number (ember for the primary stat) + caption.

### Empty state
Warm atmospheric background (central ember bokeh), a 96px glass tile with a single ember glyph, serif heading, supporting sub, ember CTA.

### Calendar (План)
Opaque card. Month nav row (serif month + glass round chevrons). Weekday header **Monday-first**, tertiary. Day grid `repeat(7,1fr)`, ~38px rows. States: default (secondary), current-month emphasis (primary), **today** = 32px ember-gradient filled circle with dark text, **planned** = primary number + 5px ember dot beneath. Followed by an "Ближайшие" list of date-chip rows.

### Date chip
48×54 rounded square, serif day number over a small month caption. Soonest/active = ember-tinted bg `rgba(255,122,69,0.16)` + ember number; others = neutral `rgba(255,255,255,0.05)`.

### Toggle
Pill track 44×26; ON = ember gradient + white 20px knob; OFF = neutral track.

### Status pill (planned)
Glass pill but ember-tinted: bg `rgba(255,122,69,0.16)`, border `rgba(255,122,69,0.4)`, calendar glyph + ember label. Use for `status:'planned'` on the detail screen (replaces the intensity badge).

### Photo upload slot
Square, radius 16. Filled = `done_photo` image with a top-right glass remove ×. Empty = 1.5px dashed `rgba(255,255,255,0.22)` border on faint fill, centered ember camera (primary slot) or tertiary plus glyph + caption. Laid out 3-per-row.

### Mood selector
Three equal buttons (Огонь / Хорошо / Так себе), same selected/glass treatment as the intensity selector; selected = ember fill.

### Swipe actions
Action layer sits behind the feed card. Right-swipe action = ember gradient panel, left-aligned, calendar + "В план". Left-swipe action = neutral dark panel, right-aligned, moon + "Когда-нибудь". Card casts a directional shadow over the revealed action.

---

## 5. Screens (v1)

Bottom tab order: **Сегодня · Поиск · Создать(+) · Было · Профиль**. (Создать opens as a slide-up sheet. План and the empty state are states/sub-screens, not tabs.)

1. **Онбординг** — centered serif H1 (cream), short sub, large ember glass button "Начать"; blurred floating idea cards behind; ember+teal bokeh.
2. **Сегодня** *(home)* — glass date/weather panel → serif H1 "Чем займёмся сегодня?" + "N идей в списке" → glass segmented `На выезд / Дома` → **featured card** (top wish) → 2 compact cards → tab bar.
3. **Список** *(triage inbox)* — glass filter chips → serif heading "Входящие от неё" → vertical feed **sorted by intensity** → swipe to archive/plan, tap → detail → tab bar.
4. **Деталь** — top half glowing photo with floating glass `back`/`share` round buttons → serif title → category + intensity badge → her quote → price / location rows → mini-map → ember "Запланировать" → tab bar.
5. **Было** *(heart)* — serif "Было" → 2-col grid of completed dates using **our** photos (not og:image), soft glow, date labels → tab bar.
6. **Поиск** *(search)* — glass search field → serif "Категории" with tinted category pills → serif "Популярное сейчас" → list-row results → tab bar.
7. **Создать** *(+ sheet)* — grabber + glass header ("Отмена / Новая идея / Готово") → link field → link-import preview card → Категория chips → "Насколько хочется?" 3-button intensity selector → her-note field → ember "Добавить в список". No tab bar (modal sheet).
8. **Профиль** *(user)* — serif "Мы" → couple header (overlapping avatars, names, days-together) → 3 stat tiles (в списке / в плане / было) → glass settings list (Telegram-бот · Уведомления · Категории и тинты · Тема · О приложении) → tab bar.
9. **План** *(reached from Сегодня; Сегодня tab stays active)* — serif "План" + "N свидания запланировано" → calendar card (month nav with chevrons, Mon-first weekday row, day grid; **today = ember-filled circle, planned days = ember dot under the number**) → serif "Ближайшие" → upcoming rows (date-chip + idea, soonest chip tinted ember) → tab bar.
10. **Empty state (Список пуст)** — centered: 96px glass tile holding an ember `flame`, serif "Список пока пуст", sub pointing to the Telegram bot, ember CTA "Открыть бота". Strong central ember bokeh. The reusable empty-state pattern: warm atmospheric glow + serif heading + ember CTA.

### Lifecycle states (idea → planned → done)

11. **Деталь — запланировано** (`status:'planned'`) — same hero/title as the idea detail, but the intensity badge is replaced by an ember **"Запланировано"** status pill (calendar glyph) + a **planned banner** (date-chip + day/time + "добавлено в календарь"). Bottom actions: glass **"Изменить"** + ember **"Мы сходили"** (check) which opens screen 12.
12. **Отметить «сходили» → Было** (slide-up sheet; sets `status:'done'`) — grabber + glass header "Как прошло?" → idea title+date → **photo upload** 3-col grid (`done_photos[]`: filled tiles with remove ×, dashed "Добавить"/"Фото" slots) → **mood selector** 3 options (Огонь=ember selected / Хорошо / Так себе) → her-note field → ember CTA "Сохранить в Было". No tab bar.
13. **Список — свайпы** (interaction spec) — documents the swipe actions revealed under a feed card: **swipe right → ember "В план"** action (calendar) on the left; **swipe left → neutral "Когда-нибудь"** action (moon) on the right. The card translates over the action layer; full swipe commits the status change, short swipe springs back.
14. **Импорт — загрузка / ошибка** — states of the link-import card. *Loading*: shimmer thumb + spinner + "Бот тянет og:image…" + skeleton text lines. *Error* (no og:image): pink-tinted card with warning glyph + "Не удалось загрузить превью", actions "Повторить" (glass) / "Заполнить вручную" (ember).
15. **Онбординг — подключение бота** (step 2/2) — serif "Подключите Telegram-бот", sub, **QR code** on a cream tile (3 finder squares + dot matrix + ember send glyph center), ember CTA "Открыть @TogetherBot", "Пропустить пока".
16. **Деталь воспоминания** (`status:'done'`) — like the idea detail but content = a logged memory: our hero photo, kicker "category · date", serif title, mood pill, our note (serif italic), `done_photos[]` thumbnail strip (with "+N" overflow tile), glass "Повторить свидание" (re-adds as a new idea) + tab bar (Было active).

---

## 6. Data model

```ts
type Intensity = 'want' | 'interesting' | 'someday';   // flame | bookmark | moon
type Category  = 'concert' | 'food' | 'trip' | 'home' | 'bar' | 'walk' | 'film';
type Status    = 'idea' | 'planned' | 'done';
type Author    = 'she' | 'me';

interface Idea {
  id: string;
  title: string;
  url: string;
  og_image: string;        // pulled by the bot on forward
  category: Category;
  price?: string;          // "$150 / пара"
  location?: string; lat?: number; lng?: number;
  note?: string;           // her quote, shown as serif italic
  author: Author;
  intensity: Intensity;
  status: Status;
  planned_date?: string;   // ISO
  done_photos?: string[];  // OUR photos, for "Было"
  created_at: string;
}
```

## 7. Data flow

Link → Telegram bot pulls `og_image` + `title`, asks intensity (3 buttons) → creates `Idea { status:'idea', author:'she' }`. In-app he works **Список**, promotes to `planned`, then after the date marks `done` with `done_photos[]`. **Therefore cards must look like real link previews, never placeholders.**

## 8. Implementation notes

- **Stack:** any of vanilla + CSS vars, React, or RN-web works; the tokens above are framework-agnostic. PWA: installable to iOS home screen, `display:standalone`, `theme-color:#0A0810`, dark `apple-mobile-web-app-status-bar-style`.
- **Continuous corners:** prefer the largest radii the platform allows; on web, the values above approximate iOS squircles.
- **Performance:** `backdrop-filter` is expensive — keep it to the control-layer elements listed in Rule 1; don't nest blurred surfaces. Cap concurrent ambient blobs at 2/screen.
- **Images:** lazy-load og:images; show the category gradient as the background until loaded; cache for offline.
- **Accessibility:** verify ≥4.5:1 on every text-over-media case (scrims already tuned for it); honor `prefers-reduced-motion` (drop the stagger + glow pulse); all controls ≥44×44pt.
- **Theming hook:** the build exposes `--accent` (ember variants) and an `--ambient` on/off as the only sanctioned global tweaks — keep accent warm, never introduce a second hue.

**Do**: dense photo cards, warm single accent, honest specular edges, sentence case, serif for soul.
**Don't**: glass-tint content, second accent hue, neon, emoji, hand-drawn SVG illustrations, uppercase body, placeholder/lorem content.
