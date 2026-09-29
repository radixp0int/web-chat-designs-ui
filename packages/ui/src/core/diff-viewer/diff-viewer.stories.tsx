import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { codeSamples, diffSample } from '../../__fixtures__/code'
import { Button } from '../button'
import { Select } from '../select'
import { DiffViewer } from './diff-viewer'
import type { DiffEditable } from './types'

const LONG_ORIGINAL = Array.from({ length: 60 }, (_, i) => `line ${i + 1}: unchanged context`).join(
  '\n',
)
const LONG_MODIFIED = LONG_ORIGINAL.replace(
  'line 12: unchanged context',
  'line 12: edited here',
).replace('line 47: unchanged context', 'line 47: and here')

const meta = {
  title: 'Primitives/Core/DiffViewer',
  component: DiffViewer,
  tags: ['autodocs'],
  args: {
    title: diffSample.file,
    language: 'csv',
    original: diffSample.original,
    modified: diffSample.modified,
    className: 'h-[26rem]',
    onViewChange: fn(),
  },
  argTypes: {
    title: { control: 'text' },
    original: { control: 'text' },
    modified: { control: 'text' },
    view: { control: 'inline-radio', options: ['split', 'unified'] },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Myers’ diff by line, then by word inside each changed pair, so the edit gets the stronger wash. For JSON, CSV and HTML, Format view normalises the read-only comparison; Format editable rewrites the controlled sources. The CSV specimen mixes equivalent quoting styles so formatting leaves only the real changes.',
      },
    },
  },
} satisfies Meta<typeof DiffViewer>

export default meta
type Story = StoryObj<typeof meta>

export const Split: Story = {}

export const Unified: Story = { args: { defaultView: 'unified' } }

export const Json: Story = {
  args: {
    title: codeSamples.json.file,
    language: 'json',
    original: codeSamples.json.text,
    modified: codeSamples.json.text
      .replace('"temperature": 0.2', '"temperature": 0.4')
      .replace('"maxPerAnswer": 6', '"maxPerAnswer": 8'),
  },
}

/** Long unchanged runs fold to a "Show N unchanged lines" row. */
export const HideUnchanged: Story = {
  args: {
    title: 'notes.txt',
    language: 'text',
    original: LONG_ORIGINAL,
    modified: LONG_MODIFIED,
    defaultHideUnchanged: true,
    context: 2,
  },
}

export const Identical: Story = {
  args: { original: diffSample.original, modified: diffSample.original },
}

export const NoControls: Story = { args: { hideControls: true } }

export const Disabled: Story = { args: { disabled: true } }

/** Each `editable` combination, both sides live, with copy callbacks. */
export const Editable: Story = {
  render: function EditableStory(args) {
    const [editable, setEditable] = useState<DiffEditable>('modified')
    const [original, setOriginal] = useState(diffSample.original)
    const [modified, setModified] = useState(diffSample.modified)
    const [copied, setCopied] = useState<string | null>(null)
    const edited = original !== diffSample.original || modified !== diffSample.modified
    return (
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <Select
            aria-label="Editable sides"
            size="sm"
            value={editable}
            onChange={(e) => setEditable(e.target.value as DiffEditable)}
            options={[
              { value: 'none', label: 'None — read only' },
              { value: 'original', label: 'Original only' },
              { value: 'modified', label: 'Modified only' },
              { value: 'both', label: 'Both sides' },
            ]}
          />
          <Button
            variant="ghost"
            size="sm"
            disabled={!edited}
            onClick={() => {
              setOriginal(diffSample.original)
              setModified(diffSample.modified)
            }}
          >
            Reset text
          </Button>
          {copied && (
            <span className="text-[12.5px] text-ink-soft" aria-live="polite">
              {copied}
            </span>
          )}
        </div>
        <DiffViewer
          {...args}
          original={original}
          modified={modified}
          editable={editable}
          onOriginalChange={setOriginal}
          onModifiedChange={setModified}
          onCopyOriginal={(v) => setCopied(`Copied original — ${v.split('\n').length} lines`)}
          onCopyModified={(v) => setCopied(`Copied modified — ${v.split('\n').length} lines`)}
        />
      </div>
    )
  },
}
