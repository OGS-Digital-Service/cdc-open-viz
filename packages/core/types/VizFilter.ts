export type FilterBase = {
  columnName: string
  values: string[]
  showDropdown: boolean
  id: number
  parents: number[]
}

export type GeneralFilter = FilterBase & {
  active: string
  queuedActive: string
  filterStyle: 'tab' | 'pill' | 'tab bar' | 'dropdown' | 'dropdown bar' | 'multi-select'
  label: string
  order: 'asc' | 'desc' | 'cust'
  orderedValues?: string[]
  queryParameter: string
  setByQueryParameter: string
  type: 'url'
}

export type MultiSelectFilter = {
  active: string[]
  selectLimit: number
} & Omit<GeneralFilter, 'active'>

export type VizFilter = GeneralFilter | MultiSelectFilter
