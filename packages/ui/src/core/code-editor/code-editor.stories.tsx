import { useRef, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { codeSamples } from '../../__fixtures__/code'
import { CopyButton } from '../../components/copy-button'
import { Button } from '../button'
import { FieldError } from '../field'
import { Select } from '../select'
import { CodeEditor } from './code-editor'
import { formatCode, lintCode } from './languages'
import type { CodeEditorHandle, CodeLanguage } from './types'

const LANGUAGES: { value: CodeLanguage; label: string }[] = [
  { value: 'json', label: 'JSON' },
  { value: 'yaml', label: 'YAML' },
  { value: 'csv', label: 'CSV' },
  { value: 'html', label: 'HTML' },
  { value: 'text', label: 'Plain text' },
]

const meta = {
  title: 'Primitives/Core/CodeEditor',
  component: CodeEditor,
  tags: ['autodocs'],
  args: {
    label: 'persona.json',
    title: 'persona.json',
    defaultLanguage: 'json',
    defaultValue: codeSamples.json.text,
    className: 'h-[24rem]',
    onChange: fn(),
    onDiagnosticChange: fn(),
  },
  argTypes: {
    title: { control: 'text' },
    actions: { control: false },
    ref: { control: false },
    value: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          'A transparent `<textarea>` over a highlighted copy of the same text — typing, selection, undo and screen readers stay the browser’s. JSON, YAML, CSV and HTML get colour and lightweight validation. ⌘F finds, ⌘H replaces, the ⋯ menu toggles wrap / line numbers / status bar. Escape then Tab leaves the field.',
      },
    },
  },
} satisfies Meta<typeof CodeEditor>

export default meta
type Story = StoryObj<typeof meta>

/** Uncontrolled — `defaultValue` / `defaultLanguage`. */
export const Playground: Story = {}

export const Languages: Story = {
  render: function LanguagesStory() {
    const [lang, setLang] = useState<CodeLanguage>('json')
    const [docs, setDocs] = useState(() =>
      Object.fromEntries(LANGUAGES.map((l) => [l.value, codeSamples[l.value].text])),
    )
    const doc = docs[lang]
    const setDoc = (next: string) => setDocs((d) => ({ ...d, [lang]: next }))
    return (
      <CodeEditor
        label="Code"
        language={lang}
        value={doc}
        onChange={setDoc}
        className="h-[26rem]"
        title={
          <>
            <span className="truncate">{codeSamples[lang].file}</span>
            {doc !== codeSamples[lang].text && (
              <span className="shrink-0 text-[12px] font-normal text-ink-soft">· Edited</span>
            )}
          </>
        }
        actions={
          <>
            <Select
              aria-label="Language"
              size="sm"
              value={lang}
              onChange={(e) => setLang(e.target.value as CodeLanguage)}
              options={LANGUAGES}
            />
            {(lang === 'json' || lang === 'csv' || lang === 'html') && (
              <Button
                variant="ghost"
                size="sm"
                disabled={lintCode(lang, doc) !== null}
                onClick={() => setDoc(formatCode(lang, doc))}
              >
                Format
              </Button>
            )}
            <CopyButton text={doc} size="sm" />
          </>
        }
      />
    )
  },
}

export const Html: Story = {
  args: {
    label: 'chat-widget.html',
    title: codeSamples.html.file,
    defaultLanguage: 'html',
    defaultValue: codeSamples.html.text,
  },
}

/** The diagnostic lands in the status bar and in `onDiagnosticChange`. */
export const Invalid: Story = {
  args: {
    label: 'broken.json',
    title: 'broken.json',
    defaultValue: '{\n  "enabled": true,\n  "retries": 3,\n}',
    className: 'h-48',
  },
}

export const ReadOnly: Story = {
  args: {
    label: 'persona.json, read only',
    title: undefined,
    readOnly: true,
    validate: false,
    options: { statusBar: false },
    defaultValue: codeSamples.json.text.split('\n').slice(0, 7).join('\n'),
    className: undefined,
  },
}

/** Keeps the rendered code but takes it out of focus order and editing. */
export const Disabled: Story = { args: { disabled: true, className: 'h-64' } }

export const DisplayOptions: Story = {
  args: {
    label: 'system-prompt.txt',
    title: codeSamples.text.file,
    defaultLanguage: 'text',
    defaultValue: codeSamples.text.text,
    options: { wordWrap: 'on', lineNumbers: 'off', statusBar: 'on' },
    className: 'h-56 max-w-md',
  },
}

/**
 * `ref.checkValid()` gates a wizard step: it validates the latest controlled
 * value, focuses the problem and fires `onInvalid`. Fix the trailing comma to
 * move on.
 */
export const WizardGate: Story = {
  render: function WizardStory() {
    const editor = useRef<CodeEditorHandle>(null)
    const [code, setCode] = useState('{\n  "enabled": true,\n}')
    const [step, setStep] = useState(1)
    const [error, setError] = useState<string | null>(null)
    return (
      <div className="rounded-surface border border-line bg-canvas p-4">
        {step === 1 ? (
          <div className="flex flex-col gap-3">
            <div>
              <div className="text-[13px] font-extrabold text-ink-strong">
                Step 1 of 2 · Configuration
              </div>
              <div className="text-[12px] text-ink-soft">
                Correct the trailing comma, then try Next again.
              </div>
            </div>
            <CodeEditor
              ref={editor}
              label="Wizard configuration"
              language="json"
              value={code}
              onChange={(next) => {
                setCode(next)
                setError(null)
              }}
              onInvalid={(problem) => setError(`Next blocked: ${problem.message}`)}
              className="h-64"
              title="workflow.json"
            />
            {error && <FieldError className="self-start">{error}</FieldError>}
            <div className="flex justify-end gap-2">
              <Button disabled>Back</Button>
              <Button
                variant="primary"
                onClick={() => {
                  if (editor.current?.checkValid()) {
                    setError(null)
                    setStep(2)
                  }
                }}
              >
                Next
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="text-[13px] font-extrabold text-ink-strong">Step 2 of 2 · Review</div>
            <pre className="overflow-auto rounded-control bg-code-block p-3 text-[12px] text-ink">
              {code}
            </pre>
            <Button className="self-start" onClick={() => setStep(1)}>
              Back
            </Button>
          </div>
        )}
      </div>
    )
  },
}
