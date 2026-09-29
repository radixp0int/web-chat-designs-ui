# Card

A content surface drawn _open_: no rules between its parts. A brand-coloured `eyebrow` names the kind of card, the title leads at 17px (15px in compact UI size), `description` and `icon` sit with it, and spacing does the separating. `footer` pins to the bottom edge, so cards in a grid row line their footers up. Static by default. Empty actions omit the ellipsis.

```tsx
<Card
  eyebrow="Security"
  title="Single sign-on"
  description="How members sign in"
  footer={<><span>Last saved Sep 28</span><Button className="ml-auto">Save changes</Button></>}
>
  <SsoForm />
</Card>
<Card eyebrow="Guide" title="Data retention policy" href="/guides/retention">
  How long questions and files are kept.
</Card>
<Card title="Recently visited" actions={[{ id: 'refresh', label: 'Refresh', onSelect: refresh }]}>
  <RecentLinks />
</Card>
<Card title="Recently visited" draggable onMove={({ x, y }) => moveCardBy(x, y)}>
  <RecentLinks />
</Card>
```

`href` makes the whole card one link: the title renders as a native `<a>` stretched over the card (modified clicks open a new tab), the card lifts on hover and shows the focus ring when the link has focus. `headerAction` and the actions disclosure stay clickable above it; keep other controls out of a link card. `headingLevel` (default 3) fits the card into the page outline.

`draggable: true` requires `onMove`. The handle emits incremental viewport CSS pixels for pointer movement and ten-pixel steps for arrow keys. The parent owns position, bounds, ordering and persistence. A scaled canvas should convert these deltas to its coordinate system. The card never positions itself or implements a sortable grid. The content and action buttons remain independent of the drag handle. Actions are a simple disclosure of native buttons (Tab to navigate, Escape to close), not an ARIA menu requiring custom arrow navigation.

Storybook follows `Primitives/Core/Card`: Playground, WithActions, Draggable, SortableColumn, SortableVariableHeight, Anatomy, AsLink, EmptyState, WithFooterActions and Grid. The column examples keep stable IDs and parent-owned order, measure card centers for drop targets, and commit on release. Optional `onMoveStart` / `onMoveEnd(cancelled)` bracket pointer gestures; Escape or lost capture cancels. Keyboard moves call `onMove` directly. `dragDescription` lets the parent describe its sorting behavior accurately.
