# Notice

A one-line status band for a message flow: a conversation, a side panel, the
top of a list. The whole strip takes the tone, a glyph leads, and an optional
`label` names the state in words ("Loading", "3 of 5", "Interrupted").

```tsx
<Notice tone="info" label="Loading">References are still loading</Notice>
<Notice tone="error" label="Interrupted" action={{ label: 'Retry', onClick: retry }}>
  The answer stopped before it finished
</Notice>
```

**Notice or Alert?** A Notice reports a state in one line and offers at most
one inline action. An `Alert` explains a problem: a title and copy, a list of
fields to fix, a `<details>` payload, and a button in the tone's colour. If you
need more than one line or more than one action, use an Alert.

`role` defaults to `alert` for `error` and `status` otherwise; pass `role="note"`
for tips. The message is bold by default; wrap tip copy in a normal-weight span.
`InlineTip` is a Notice with a glyph and a dismiss button.
