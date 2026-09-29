# DateField

A date, typed or picked. `DateRangeField` is its two-ended sibling.

```tsx
<DateField label="Renewal date" showLabel value={date} onChange={setDate} />
<DateRangeField label="Created" value={range} onChange={setRange} presets />
```

Values are ISO `YYYY-MM-DD` local calendar dates (`null` for unset); the field
shows them as people read them ("Sep 30, 2026"). Typing accepts `Sep 30, 2026`,
`9/30/2026` and `2026-09-30`, commits on Enter or blur, and explains a date it
cannot take ("February has 28 days in 2027", "Choose a date on or after …").
`error` shows the host's own validation the same way.

The calendar is the branded `DatePicker`, opened from the button or Alt+↓ in a
popover portalled through the overlay layer, so it escapes clipping containers
and stays inside an open `<dialog>`. It is lazy-loaded on first open. Escape,
an outside press or tabbing away closes it; the keyboard close returns focus to
the field.

`presets` swaps typing for quick picks — `true` for the built-in relative set
(`datePresets()`, `dateRangePresets()`), or your own `{ label, value }[]`. The
field then shows the matching pick as a chip ("Last 30 days"), which says what a
range means in far less width than two dates. Use it where space is tight.

`DateRangeField` picks both ends in one calendar and commits on Apply, so an
inverted range is never entered.
