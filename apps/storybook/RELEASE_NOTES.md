# Release notes

Changes to the component library as seen from Storybook. Newest first. Each
entry names the modules it touches so the sidebar entry is easy to find.

## Unreleased

### Changed — Alert · Added — Notice

- **Alert** (`packages/ui/src/core/alert`): redrawn as the combined A + B
  direction from the "Alert & Card" canvas — a quiet panel with the tone in a
  tile around the glyph, and the action as a button in the tone's own colour
  (Retry in red, Review in amber). New `secondaryAction` (a tone-coloured text
  link) and `layout="inline"` for one-line page banners. `bordered` is
  deprecated and no longer drawn. New stories: _Actions_, _InlineBanner_,
  _Retry_ (with a `play` test); _Bordered_ is gone.
- **Notice** (`packages/ui/src/core/notice`, new): the one-line tinted band for
  message flows — the chat especially. A glyph, one line of copy, an optional
  `label` tag that names the state in words, one inline `action`, dismissible.
  **InlineTip** now renders a Notice. Stories: _Primitives / Core / Notice_,
  including _InConversation_.

### Changed — Card

- **Card** (`packages/ui/src/core/card`): redrawn as the _Open_ direction from
  the "Alert & Card" design canvas — no rules between parts, a brand-coloured
  `eyebrow` above a 17px title, and spacing doing the separating. New props:
  `eyebrow`, `description`, `icon` (in a tinted tile), `headerAction`,
  `footer` (pinned to the bottom edge), `headingLevel`, and `href`, which makes
  the whole card one native link that lifts on hover. The actions disclosure
  now opens under its own button. Existing `title` / `actions` / `draggable`
  usage is unchanged. New stories: _Anatomy_, _AsLink_ (with a `play` test),
  _EmptyState_, _WithFooterActions_, _Grid_.

### Changed — Tabs

- **Tabs** (`packages/ui/src/core/tabs`): `line`, still the default, is
  redrawn — a rounded 3px brand bar grows from the centre under the selected
  tab, and its label steps up to extra-bold without shifting its neighbours.
  Vertical lists put the bar on the leading edge. New `segmented` variant: a
  tinted track with the selected tab raised, for switching views of one thing.
  `contained` still works as a deprecated alias of `segmented`. Triggers take
  `icon` and `count`. Stories: _WithIconsAndCounts_ (with a `play` test),
  _Segmented_, _Vertical_, _VerticalSegmented_.

### Changed — DateField

- **DateField** (`packages/ui/src/core/date-field`): typed or picked. The field
  shows "Sep 30, 2026", accepts `Sep 30, 2026`, `9/30/2026` and `2026-09-30`,
  and names an impossible day ("February has 28 days in 2027"). The calendar
  button or Alt+↓ opens the branded `DatePicker` in a popover that escapes
  clipping containers and stays inside open dialogs; the calendar is loaded on
  first open. `DateRangeField` picks both ends in one calendar, then Apply, and
  reads "Sep 6 – Sep 15, 2026 · 10 days". `presets` (`true` or your own list)
  swaps typing for quick picks and shows the matching pick as a chip — for
  narrow spaces like the FilterPanel rail, whose date fields now pass it
  through. On phones the picks wrap above the calendar.
- **DatePicker**: the range header reads "Aug 31, 2026 → Sep 29, 2026" instead
  of ISO.

### Fixed — Pagination

- **Pagination** (`packages/ui/src/core/pagination`): a narrow footer no longer
  strands "Next" on a line of its own. The controls (Previous, the numbered
  rail, Next) now wrap as one group, and the footer is its own size container:
  below 28rem the numbered rail steps aside, leaving the readout and
  Previous/Next. New story: _Data Table / Pagination / NarrowContainer_.

### Added — Accordion

- **Accordion** (`packages/ui/src/core/accordion`): stacked show/hide sections
  drawn as a _parting list_ — closed items form one joined list, each row
  showing its current value (`summary`); opening one lifts it out as a raised
  card and the list parts around it. `rail` adds the chat's reasoning rail (a
  node per row, a line down the open item). `step` / `status` number items as
  a wizard's steps, and with `rail` the markers become the rail's nodes.
  Single or multiple, controlled or uncontrolled, disabled per item or whole.
  Same compound shape as `Tabs`; triggers sit in headings; ↑ ↓ Home End move
  between them; closed panels are `inert`. Styled by `accordion.css`, imported
  from `ui.css`. Chosen from three branded directions on the "Accordion
  directions" design canvas. Stories: _Primitives / Core / Accordion_,
  including a full setup _Wizard_ built from the other primitives.
- **MailIcon** added to the icon set.

### Added — Navigation

- **Primitives / Components / Navigation**: pinned destination rail, contextual
  section links, and a searchable All apps dialog with pin controls. Routing and
  persistence belong to the host; native links preserve modified-click behavior.
  Colocated stories cover the quick menu, empty pins, other sections, unpinned
  routes, narrow layouts, search and pin interactions, and no search results.

### Added — Card and DatePicker

- **Card** (`packages/ui/src/core/card`): a branded content surface with an
  optional action disclosure and an opt-in drag handle. The parent owns
  position and order; `onMoveStart` / `onMoveEnd(cancelled)` bracket a pointer
  gesture so a sortable list can commit on drop and cancel on Escape. Stories:
  _Primitives / Core / Card_ — Playground, WithActions, Draggable,
  SortableColumn, SortableVariableHeight.
- **DatePicker** (`packages/ui/src/core/date-picker`): an inline calendar on
  `react-datepicker`, skinned entirely by `date-picker.css` (the vendor sheet
  is not imported). Single or range, `commitMode="immediate" | "apply"`, same
  `YYYY-MM-DD` contract as `DateField`. New dependency: `react-datepicker@^9.1.0`
  in `@chat/ui`. Stories: _Primitives / Core / DatePicker_.

Both ship `play` interaction tests, as Navigation does; they run whenever the
story renders.

### Added — Storybook (`apps/storybook`)

- **One Storybook for the whole repo.** `npm run storybook` from the root, or
  `npm run start` inside `apps/storybook`. Storybook 10.6 on the Vite builder,
  with `@storybook/addon-docs` and `@storybook/addon-a11y`.
- **Stories live beside their modules.** Each module folder is now
  `index.ts` · `types.ts` · `<name>.tsx` · `<name>.stories.tsx`, with an optional
  `<name>.css`, `README.md` and story-only `<name>.example.tsx`. See
  _Docs / Module anatomy_.
- **Theme toolbar.** Mode, palette (`chat-theme-*`), highlight
  (`chat-highlight-*`) and density (`UiSizeProvider`), applied to `<html>` so
  portalled cards and dialogs follow.
- **Lazy per story.** Each story file is its own chunk, and the preview imports
  deep paths rather than package barrels, so `beautiful-mermaid` and
  `@xyflow/react` load only for the stories that use them.
- **Props tables from `types.ts`.** `react-docgen-typescript` reads each
  module's contract, limited to the props a module declares itself.
- **Handbook pages:** Introduction, Module anatomy, Theming, Contracts, and
  these notes.

### Stories

- **Primitives / Core** (21): Alert, Avatar, Breadcrumbs, Button +
  AdaptiveButton, Card, Checkbox, ChoiceCard, CodeEditor, DateField +
  DateRangeField, DatePicker, DiffViewer, Field (form composition), Modal, Pill,
  RadioGroup, Select, Slider, Switch, Tabs, TextInput, Textarea.
- **Primitives / Components** (15): CopyButton, CountBadge, FacetFilters,
  FilterChip, HoverCard, IconButton, Icons (searchable gallery), InlineTip,
  Navigation, ResizableColumn, ResizeHandle, ScrollToBottomButton, Settings
  (FeatureToggles, PalettePicker, HighlightPicker), SideTabs, Tooltip.
- **Data Table**: DataTable (sorting, selection + bulk bar, expansion, row
  actions, loading, empty, narrow), Pagination, FilterPanel (every field type,
  pinned and floating), Omnibox, the Paging model (MDX contract + adapter
  explorer), and the full Tenants page recipe.
- **Recipes / Chat**: every `@chat/chat-ui` component in each state its
  `Message` can take — thinking, streaming, recovered, stopped, failed, scoped —
  plus a live **Conversation** on `useChat` + a canned responder, the
  **ChatWidget** rendered in-page, the **Widget on a host page** (shadow root),
  and the **Full chat app**.
- **Recipes / Workflows**: the loan review run on React Flow, its skeleton,
  and the top bar and run log in each phase.

### Added — fixtures

- `packages/ui/src/__fixtures__/` — `code.ts`, `tenants.ts`, `facets.ts`.
- `packages/chat-ui/src/__fixtures__/chat.ts` — sources, highlights, tool
  calls, traces, messages, personas, suggestions and canned turns.

### Changed

- `InlineTip`'s `icon` JSDoc wraps `<BulbIcon />` in backticks — autodocs
  renders JSDoc as Markdown, and the bare tag rendered as an unknown element.
- `packages/ui` and `packages/chat-ui` tsconfigs exclude `*.stories.tsx`, as
  does `apps/chat`'s app tsconfig; `apps/storybook` typechecks all stories, so
  `npm run typecheck` still covers them.

### Known gaps

- `EditorOptionsMenu` and `FindReplaceBar` (new in `core/`) have no stories of
  their own; they are exercised through CodeEditor and DiffViewer (⋯ menu,
  ⌘F / ⌘H).
- Stories are not yet run in CI. `play` functions run in the browser when a
  story renders; `@storybook/addon-vitest` would run every story and `play`
  function headlessly on each push.
- No deployment is configured. `npm run build-storybook` writes a static site
  to `apps/storybook/storybook-static`.

---

## Template for the next entry

```md
## YYYY-MM-DD — short title

### Added | Changed | Fixed | Removed

- **Module** (`path/to/module`): what changed, from a consumer's point of view.
  Link the story: _Primitives / Core / Button → Adaptive_.
```
