import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { Pagination } from './pagination'

const TOTAL = 1284

const meta = {
  title: 'Data Table/Pagination',
  component: Pagination,
  tags: ['autodocs'],
  args: {
    page: 5,
    size: 10,
    totalElements: TOTAL,
    totalPages: Math.ceil(TOTAL / 10),
    onPageChange: fn(),
    onSizeChange: fn(),
  },
  decorators: [
    (Story) => <div className="overflow-hidden rounded-control border border-line">{Story()}</div>,
  ],
  parameters: {
    docs: {
      description: {
        component:
          '1-based, like every part of the paging model. The rail’s length is stable so Next does not move under the pointer, and a gap is only drawn in place of more than one hidden page. Omit `onSizeChange` to hide rows-per-page.',
      },
    },
  },
  // Live: the story owns page and size so every control actually moves.
  render: function PaginationStory(args) {
    const [page, setPage] = useState(args.page)
    const [size, setSize] = useState(args.size)
    const totalPages = Math.max(1, Math.ceil(args.totalElements / size))
    return (
      <Pagination
        {...args}
        page={Math.min(page, totalPages)}
        size={size}
        totalPages={totalPages}
        onPageChange={(p) => {
          setPage(p)
          args.onPageChange(p)
        }}
        onSizeChange={
          args.onSizeChange &&
          ((n) => {
            setSize(n)
            setPage(1)
            args.onSizeChange?.(n)
          })
        }
      />
    )
  },
} satisfies Meta<typeof Pagination>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const FirstPage: Story = { args: { page: 1 } }

export const LastPage: Story = { args: { page: 129 } }

export const FewPages: Story = { args: { page: 2, totalElements: 34, totalPages: 4 } }

/** Drops the numbered rail — the readout and Prev/Next remain. */
export const Compact: Story = { args: { compact: true, onSizeChange: undefined } }

/** Dims the controls while a page is in flight, without unmounting them. */
export const Busy: Story = { args: { busy: true } }

export const WithoutRowsPerPage: Story = { args: { onSizeChange: undefined } }

/**
 * Narrow footers — a side panel's table, a phone. The controls wrap as one
 * group, and below 28rem the numbered rail steps aside; drag the handle to
 * watch it happen.
 */
export const NarrowContainer: Story = {
  decorators: [
    (Story) => (
      <div className="w-[26rem] max-w-full resize-x overflow-auto rounded-control border border-line">
        {Story()}
      </div>
    ),
  ],
}

export const CustomLabels: Story = {
  args: {
    labels: {
      rows: 'Filas',
      previous: 'Anterior',
      next: 'Siguiente',
      range: (from, to, total) => `${from}–${to} de ${total.toLocaleString('es')}`,
      page: (n) => `Página ${n}`,
    },
  },
}
