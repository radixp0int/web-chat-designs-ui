/** ISO `YYYY-MM-DD`, or null for "not set". What `<input type="date">` speaks. */
export type IsoDate = string | null

export type DateRange = { from: IsoDate; to: IsoDate }

export type DateFieldProps = {
  label: string
  showLabel?: boolean
  value: IsoDate
  onChange: (value: IsoDate) => void
  min?: string
  max?: string
  disabled?: boolean
  className?: string
  id?: string
}

export type DateRangeFieldProps = {
  /** Names the pair. Each input gets its own derived label ("… from"/"… to"). */
  label: string
  showLabel?: boolean
  value: DateRange
  onChange: (value: DateRange) => void
  min?: string
  max?: string
  disabled?: boolean
  className?: string
}
