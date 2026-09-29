# DatePicker

An inline branded calendar backed by react-datepicker. Import `@chat/ui/ui.css` after the tokens stylesheet as usual; the vendor CSS is deliberately not imported. Existing DateField and DateRangeField remain native input alternatives.

```tsx
<DatePicker label="Renewal" value={date} onChange={setDate} />
<DatePicker label="Report dates" mode="range" value={range} onChange={setRange} commitMode="apply" />
```

Values use the existing local date-only contract: `YYYY-MM-DD | null`, or `{ from, to }` for a range. Never convert these through UTC. Supply valid ISO dates for min/max. Immediate mode emits partial ranges as the user chooses; apply mode emits only a complete valid selection. Cancel discards edits and invokes optional onCancel. External value, bounds, mode or disabled changes discard pending edits. The parent owns opening/closing any surrounding overlay. Initial locale is English with Sunday first; locale/time selection and vendor props are intentionally outside this API.
