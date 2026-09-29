# Responsive layout guidance

Design for the space a task needs, then decide what can change when that space shrinks. Hiding information is a useful fix when it removes redundancy or secondary detail; it is not a substitute for keeping the task usable.

## Support contract

- Non-chat components and recipes support tablet widths of **768, 820 and 1024 CSS pixels**, with a **1440px** desktop baseline.
- Chat components and chat recipes additionally support **320, 360 and 390px** phone widths.
- A viewport is not a component's available width. A tablet sidebar can be narrower than a phone viewport. Use container queries for local content decisions; let the parent change the composition when a component cannot perform its task in the allotted space.
- Alert and Card are temporarily excluded from the audit while they are being reworked. This is an audit exclusion, not a permanent exemption from responsive behavior.

## Choose the smallest logical fix

Use this order as a decision guide, not a requirement to apply every step:

| Decision                               | Use when                                                                           | Example                                                                        | Guardrail                                                                                                                                                |
| -------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Hide secondary information**         | The detail repeats something nearby or is not needed to complete the current task. | Hide keyboard shortcuts, repeated breadcrumbs, auxiliary counts or timestamps. | Do not hide status that changes the user's decision, validation errors, or the only label explaining a control.                                          |
| **Truncate a label**                   | Identity still remains recognizable in context.                                    | Shorten a document title or tenant name.                                       | Preserve its accessible name and provide a touch/keyboard-accessible way to inspect the full value. A hover-only tooltip is insufficient for tablet use. |
| **Use a compact control**              | An established icon communicates the same action.                                  | Replace a labeled Format button with its labeled icon button.                  | Keep a usable hit target, accessible name and keyboard focus treatment. Do not shrink the target just to fit.                                            |
| **Move secondary actions into a menu** | Several infrequent actions compete with the primary action.                        | Put export/settings actions behind an ellipsis.                                | Keep the trigger visible and all actions keyboard/touch reachable. Preserve the primary action directly.                                                 |
| **Reflow related content**             | Information is still necessary but no longer fits side by side.                    | Wrap filter chips, stack fields, or move metadata below a heading.             | Keep reading and tab order logical; reserve usable input space.                                                                                          |
| **Relocate a whole panel**             | Persistent columns consume the main task's working space.                          | Open workflow outline/details in a modal on tablets.                           | Preserve access to every panel, its selection and its actions. Provide dismissal and focus restoration.                                                  |
| **Use contained scrolling**            | The content is inherently spatial or tabular.                                      | Scroll a wide table or pan a workflow graph.                                   | Scroll/pan the content region, not the entire page or a toolbar containing essential actions.                                                            |

Do not use `overflow-hidden` as the fix for an overflowing toolbar. It can make the page-width check pass while hiding the controls. It is appropriate for bounded visual surfaces only when clipped content has an intentional retrieval mechanism, such as graph panning.

### Decide what may disappear

Before adding a breakpoint, name the primary task and classify the content:

1. **Essential:** primary input, commit/approval actions, navigation, validation, and decision-critical status. Keep visible or behind an explicit, reachable control.
2. **Useful context:** full names, descriptions, counts and metadata. Reflow, truncate with access to the complete value, or disclose on demand.
3. **Redundant decoration:** repeated labels, decorative icons and shortcut hints. Hide these first.

A useful PR explanation is: “At tablet width, keep the workflow canvas usable by opening its outline and details on demand; approval actions remain visible inside the details dialog.” A weak explanation is: “Hide the overflowing section.”

Prefer an existing component or brand token over a new responsive prop. The parent should own layout policy, such as switching columns to overlays; a generic card, button or date picker should not acquire workflow-specific behavior.

## Verify the behavior, not only the screenshot

- Check the agreed viewport widths and any narrow container the component actually occupies.
- Exercise long labels, selected filters, open overlays and error/disabled states.
- Check both page overflow **and** clipped interactive controls. A zero-overflow page can still be unusable.
- Confirm keyboard/touch access to information moved behind a control. A closed offscreen panel should not remain a hidden keyboard destination.
- For modal relocation, check open/close, Escape, focus return, and the primary actions. Keep state ownership stable across layout changes.
- Compare before and after using the same viewport, story, data, theme and asset conditions. Verify the desktop baseline still works.
- Treat deliberate graph clipping and table scrolling separately from accidental loss of controls.

## Storybook and audit conventions

Keep stories beside their component, with `Playground` first for args-driven components, real component metadata, documented props and Actions logging, following [Module anatomy](../../apps/storybook/src/docs/ModuleAnatomy.mdx). Use the existing sidebar organization. Constrain story wrappers to the host width unless the story explicitly demonstrates a fixed-size contract. Generate Tailwind classes for every registered app-story source directory.

```sh
npm run build-storybook
npx playwright install chromium
npm run audit:responsive
npm run test:tablet-workflow
```

The audit discovers registered stories. Non-chat stories run at tablet/desktop widths; `Recipes/Chat/*` also runs at phone widths. The script serves the built Storybook locally and closes its isolated browsers and server when finished.

Options:

- `STORYBOOK_URL`: use an existing Storybook server.
- `AUDIT_WIDTHS`: override the width list; the non-chat 768px floor still applies.
- `AUDIT_MATCH`: filter by a substring of the story ID.
- `AUDIT_OUTPUT`: choose a results directory; default `reports/responsive`.
- `AUDIT_CAPTURE=1`: capture passing cases as well as flagged ones.
- `AUDIT_FAIL=1`: fail on raw geometry flags or render errors. Triage deliberate scrolling and story-wrapper issues before using this as a release gate.

Generated JSON, HTML galleries and screenshots live under ignored `reports/responsive/`. Keep reviewed evidence in docs rather than committing every run. The regression script specifically tests workflow canvas space, toolbar access, tablet panel actions and focus restoration.

The audit uses Chromium, light mode, reduced motion and a 900px viewport height. External assets are blocked, so fonts/images may fall back. It runs existing story play functions but does not systematically explore every interaction; it is not a full accessibility certification.

See [Tablet and chat responsive review](tablet-and-chat-responsive-review.md) for the latest assessment, fixes and before/after evidence.
