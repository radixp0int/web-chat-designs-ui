# Accordion

Stacked sections that show or hide their own content, drawn as a **parting list**: closed items are one joined list, each showing its current value; opening one lifts it out as a raised card and the list parts around it. Same compound shape as `Tabs`:

```tsx
<Accordion defaultValue="access">
  <AccordionItem value="access">
    <AccordionTrigger summary="Owners, analysts">Access and roles</AccordionTrigger>
    <AccordionContent>…</AccordionContent>
  </AccordionItem>
</Accordion>
```

A wizard turns the rail on and numbers its steps:

```tsx
<Accordion rail value={open} onValueChange={setOpen}>
  <AccordionItem value="members" disabled={!reached.members}>
    <AccordionTrigger step={2} status="current" summary="Analyst by default · 3 people">
      Members and roles
    </AccordionTrigger>
    <AccordionContent>…</AccordionContent>
  </AccordionItem>
</Accordion>
```

- **Open state.** `type="single"` (default) keeps one panel open; `collapsible` (default `true`) lets it close again. `type="multiple"` takes a `string[]`. Controlled with `value` + `onValueChange`, uncontrolled with `defaultValue`.
- **`summary`** is the section's current value, right-aligned while closed ("18 months", "Okta, required"). It fades when the panel opens, since the panel says it in full.
- **`rail`** draws the chat's reasoning rail: a node per row, filled when open, and a line from it down the open item's content. Off by default — settings lists read better without it; flows read better with it.
- **`step` / `status`** number an item and draw a marker: a check once `complete`, emphasised while `current`. With `rail`, markers become the rail's nodes. Status and open state are separate: a completed step can be reopened to edit. Which steps are reachable is the host's call — disable the ones ahead.
- **`icon`** is a decorative leading glyph; **`meta`** sits beside the title (a status `Pill`). Both render inside the trigger button, so keep them non-interactive.
- **`disabled`** on the root or on an item. Disabled triggers stay readable and are skipped by the arrow keys.

`AccordionItem`s must be direct children of `Accordion`: the parting is sibling styling.

Accessibility: each trigger is a native button inside a heading (`headingLevel`, default 3) with `aria-expanded` / `aria-controls`; each panel is a `region` labelled by its trigger. A step's number and status are announced ("Step 2, current: Members and roles"). ↑ ↓ Home End move between triggers. Closed panels stay mounted — they animate both ways and keep form state — and are `inert`, which removes them from the tab order and the accessibility tree.

Styling lives in `accordion.css` (imported by `ui.css`), inside `@layer components` so `className` utilities on any part still win. The motion is ThinkingBlock's (chat-ui): a grid-row transition to the content's natural height. Reduced motion is honoured by the global rule in `@chat/tokens`.

Storybook: _Primitives / Core / Accordion_ — Basic, Rail, Disabled, Controlled, Customized, AlwaysOneOpen, Multiple, StatefulContent, Wizard. The design exploration that led here (three directions, a wizard in each) is the "Accordion directions" canvas.
