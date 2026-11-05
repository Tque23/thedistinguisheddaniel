# Dashboard interface system

## Direction

Calm, considered member workspace rooted in the DDNI world: a contemporary institute with a professional network, learning records, and member stewardship. It should feel composed and trustworthy, not like a generic analytics console.

- **Domain language:** institute, cohort, member, learning, stewardship, professional presence, network, account record.
- **Color world:** deep ink navy, midnight blue, warm brass, parchment gold, slate, and soft paper white. Navy frames the member workspace; restrained gold marks the DDNI identity and primary action; slate and paper surfaces carry information without competing.
- **Signature:** the account’s activity timeline and reviewed professional profile share one Profile hub, with history first and profile editing deliberately opt-in.
- **Reject:** separate profile/history destinations → one context-preserving hub; editable forms shown by default → read-only summary until Edit Profile; multiple bright accents and heavy separators → semantic neutrals with one intentional brass accent and quiet borders.

## Color and surfaces

Use the dashboard semantic CSS variables in `src/app/dashboard/dashboard.css`; do not introduce new one-off hex colors for routine UI.

- Dark workspace: `--background: #091722`, `--card: #102331`, `--popover` / `--muted: #142a39`, `--foreground: #f8f9fa`, `--muted-foreground: #a9b4bd`, `--border: #263b4a`.
- Brand action: `--primary: #dcb567`, `--primary-foreground: #1a1200`; focus: `--focus-ring: #f3d27a`.
- Light reading surfaces (`.ddni-light`): `--background: #f6f7f9`, `--card: #ffffff`, `--foreground: #102338`, `--muted-foreground: #526174`, `--border: #dfe5eb`, `--primary: #795719`.
- Build hierarchy with `bg-background`, `bg-card`, and `bg-muted/30` or `/50`. Prefer `border-border/60` to frame and whitespace to divide. Use restrained `shadow-sm` only when a surface needs lift; keep decorative gradients out of routine content.
- Preserve the established dark/light view split and shared theme behavior for portalled UI.

## Typography and spacing

- Use the Tailwind type scale (`text-xs` through `text-3xl`); do not add arbitrary pixel font sizes.
- Headings: `tracking-tight`, `leading-snug`, display face only where it supports hierarchy. Body copy: `text-sm leading-relaxed`; labels and metadata: `text-xs text-muted-foreground`.
- Values use `font-medium`/`font-semibold` and foreground contrast; labels are muted. Apply `tabular-nums` to changing counts and percentages.
- Use a 4px base grid and multiples. Form and card content uses 16–24px padding; related fields use 16–20px gaps; distinct sections use 24px gaps. Collapse grids before content becomes cramped.
- Use `min-w-0`, readable wrapping, and responsive columns for long member data.

## Component patterns

- Prefer existing shadcn-style primitives in `components/ui`: `Button`, `Card`, `Tabs`, `Input`, `Textarea`, `Badge`, and Base UI `Dialog`. Keep controls native or primitive-backed; do not hand-roll keyboard behavior.
- Dashboard views share a centered `max-w-5xl` container with `min-w-0` and `gap-6`; use responsive grids that collapse before their contents become cramped.
- Major dashboard cards use `p-6`, `border-border/60`, `bg-card`, and restrained `shadow-sm`. Reset nested `CardHeader`/`CardContent` padding where the card owns the spacing.
- Shared page headings use the display face at `text-2xl`/`sm:text-3xl`, semibold weight, tight tracking, and `text-sm` supporting copy. Action buttons use at least `min-h-11 px-4`; reserve `btn-gold` for primary actions, with outline, ghost, and destructive variants for secondary and consequential actions.
- Profile hub: place the full-width `Profile details` / `Account history` tab bar immediately below the page heading; keep the identity banner in Profile details so the tabs stay at the top of the view. Map legacy `history` navigation and URLs to `profile`.
- Profile details are static, semantic `<dl>` values and muted badges by default. A single `Edit Profile` action unlocks fields. In edit mode, show `Save Changes` (primary) and `Cancel`; cancel restores the last saved values.
- Validate before opening confirmation; focus the first invalid field. Save only after the confirmation dialog asks, “Are you sure you want to update your profile details?” Keep server actions as the persistence boundary; surface failures and retain unsaved form values.
- Email is displayed read-only in the profile editor; account email changes belong in Settings. Communication preferences are summarized and edited in Settings.
- Keep account activity as a reverse-chronological, accessible ordered timeline with dates and a polished empty state. Always end the history section with the account-safety notice and links to security settings and support.
- Controls require labels, field-specific descriptions/errors, visible `focus-visible` rings, and disabled states. Dialogs/tabs should use their existing primitives for keyboard support and focus management.
- Motion is brief, limited to opacity/transform, and guarded by reduced-motion preferences.
- Every data surface has loading, empty, and error states; state is communicated by text as well as color.

## Profile hierarchy

1. Page title and short purpose statement.
2. Full-width, keyboard-accessible tabs directly below the heading: Profile details first, Account history second.
3. Keep the DDNI identity banner at the beginning of Profile details, before the editable/read-only account and professional information.
4. Account history uses one compact account-summary band, a dated event list, and a quiet account-safety notice at the bottom. Avoid separate mini-cards for every statistic.
5. Details groups values into Account details and Professional presence; profile strength is supporting context, not a competing hero.

## Verification checklist

- Check profile summary, edit, validation, cancel, confirmation, success, and failure states.
- Keyboard through tabs, all edit controls, and the confirmation dialog; confirm focus returns correctly.
- Check 320px width and 200% zoom for wrapping and horizontal overflow.
- Confirm both dark and light dashboard surfaces, focus contrast, and reduced-motion behavior.
