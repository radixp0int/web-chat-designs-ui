import { useState } from 'react'
import type { ComponentType } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { TextInput } from '../../core/text-input'
import * as Icons from './icons'
import type { IconProps } from './types'

const ALL = Object.entries(Icons)
  .filter(([name, value]) => name.endsWith('Icon') && typeof value === 'function')
  .sort(([a], [b]) => a.localeCompare(b)) as [string, ComponentType<IconProps>][]

const meta = {
  title: 'Primitives/Components/Icons',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `${ALL.length} stroke icons as React components. Each takes \`width\`/\`height\`/\`className\` and every other SVG prop; colour is \`currentColor\`, so text utilities tint them.`,
      },
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Gallery: Story = {
  render: function GalleryStory() {
    const [query, setQuery] = useState('')
    const [size, setSize] = useState(20)
    const shown = ALL.filter(([name]) => name.toLowerCase().includes(query.toLowerCase()))
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <TextInput
            aria-label="Filter icons"
            placeholder="Filter by name…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-64"
          />
          <label className="flex items-center gap-2 text-[12px] text-ink-soft">
            Size
            <input
              type="range"
              min={12}
              max={40}
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
            />
            <span className="w-8 tabular-nums">{size}px</span>
          </label>
        </div>
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(8.5rem,1fr))] gap-2">
          {shown.map(([name, Icon]) => (
            <li
              key={name}
              className="flex flex-col items-center gap-2 rounded-control border border-line bg-panel-solid px-2 py-3 text-ink"
            >
              <Icon width={size} height={size} aria-hidden />
              <code className="truncate text-[11px] text-ink-soft">{name}</code>
            </li>
          ))}
        </ul>
      </div>
    )
  },
}
