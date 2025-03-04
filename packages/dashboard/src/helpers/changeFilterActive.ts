import _ from 'lodash'
import { FilterBehavior } from '../helpers/FilterBehavior'
import { getQueryParams, updateQueryString } from '@cdc/core/helpers/queryStringUtils'
import { SharedFilter } from '../types/SharedFilter'
import { DashboardFilters } from '../types/DashboardFilters'
import { FILTER_STYLE } from '../types/FilterStyles'

const handleChildren = (sharedFilters: SharedFilter[], parentIndex: number) => {
  const parentKey = sharedFilters[parentIndex].key
  const childFilterIndexes = sharedFilters
    .map((filter, index) => (filter.parents?.includes(parentKey) ? index : null))
    .filter(i => i !== null)
  if (childFilterIndexes.length) {
    childFilterIndexes.forEach(filterIndex => {
      sharedFilters[filterIndex].active = ''
      if (sharedFilters[filterIndex].subGrouping) {
        sharedFilters[filterIndex].subGrouping.active = ''
      }
    })
  }
  return childFilterIndexes
}

export const changeFilterActive = (
  filterIndex: number,
  value: string | string[],
  sharedFilters: SharedFilter[],
  vizConfig: DashboardFilters
): [SharedFilter[], number[]] => {
  const sharedFiltersCopy = _.cloneDeep(sharedFilters)
  const currentFilter = sharedFiltersCopy[filterIndex]
  if (vizConfig.filterBehavior !== FilterBehavior.Apply || vizConfig.autoLoad) {
    if (currentFilter?.filterStyle === FILTER_STYLE.nestedDropdown) {
      sharedFiltersCopy[filterIndex].active = value[0]
      sharedFiltersCopy[filterIndex].subGrouping.active = value[1]
    } else {
      sharedFiltersCopy[filterIndex].active = value
      handleChildren(sharedFiltersCopy, filterIndex)
      const queryParams = getQueryParams()
      if (
        currentFilter.setByQueryParameter &&
        queryParams[currentFilter.setByQueryParameter] !== currentFilter.active
      ) {
        queryParams[currentFilter.setByQueryParameter] = currentFilter.active
        updateQueryString(queryParams)
      }
    }
  } else {
    sharedFiltersCopy[filterIndex].queuedActive = value
  }
  return [sharedFiltersCopy, handleChildren(sharedFiltersCopy, filterIndex)]
}
