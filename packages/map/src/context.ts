import { createContext } from 'react'
import { MapConfig } from './types/MapConfig'

type MapContext = {
  applyLegendToRow
  applyTooltipsToGeo
  currentViewport
  data
  displayGeoName
  filteredCountryCode
  generateColorsArray
  generateRuntimeData
  geoClickHandler
  handleCircleClick: Function
  hasZoom
  innerContainerRef
  isDashboard
  isDebug
  isEditor
  loadConfig
  position
  resetLegendToggles
  runtimeFilters
  runtimeLegend
  setAccessibleStatus
  setFilteredCountryCode
  setParentConfig
  setPosition
  setRuntimeData
  setRuntimeFilters
  setRuntimeLegend
  setSharedFilterValue
  setState
  state: MapConfig
  tooltipId: string
  viewport
}

const ConfigContext = createContext({} as MapContext)

export default ConfigContext
