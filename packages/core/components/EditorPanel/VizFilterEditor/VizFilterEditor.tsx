import { Select, TextField } from '../Inputs'
import Tooltip from '../../ui/Tooltip'
import Icon from '../../ui/Icon'
import { Visualization } from '../../../types/Visualization'
import { UpdateFieldFunc } from '../../../types/UpdateFieldFunc'
import _ from 'lodash'
import { MultiSelectFilter, VizFilter } from '../../../types/VizFilter'
import { filterStyleOptions, handleSorting } from '../../Filters'
import FieldSetWrapper from '../FieldSetWrapper'

import FilterOrder from './components/FilterOrder'
import { useMemo, useState } from 'react'

type VizFilterProps = {
  config: Visualization
  updateField: UpdateFieldFunc<string | VizFilter[] | VizFilter>
  rawData: Object[]
}

const VizFilterEditor: React.FC<VizFilterProps> = ({ config, updateField, rawData }) => {
  const openControls = useState({})
  const dataColumns = useMemo(() => {
    return _.uniq(_.flatten(rawData?.map(row => Object.keys(row))))
  }, [rawData])

  const removeFilter = index => {
    let filters = _.cloneDeep(config.filters)

    filters.splice(index, 1)

    updateField(null, null, 'filters', filters)
  }

  const updateFilterProp = (prop, index, value) => {
    updateField('filters', index, prop, value)
  }

  const updateFilterStyle = (index, value) => {
    const filters = _.cloneDeep(config.filters)
    const currentFilter = filters[index]
    currentFilter.filterStyle = value
    if (value === 'multi-select') {
      currentFilter.active = Array.isArray(currentFilter.active) ? currentFilter.active : [currentFilter.active]
    } else if (Array.isArray(currentFilter.active)) {
      currentFilter.active = currentFilter.active[0]
    }
    filters[index] = currentFilter
    updateField(null, null, 'filters', filters)
  }

  const handleNameChange = (filterIndex, columnName) => {
    const values = _.uniq(rawData.map(row => row[columnName]))
    const copiedFilter = { ..._.cloneDeep(config.filters[filterIndex]), columnName, values }
    handleSorting(copiedFilter) // sorts dropdown values in place
    copiedFilter.active = copiedFilter.values[0]
    const newFilters = config.filters.map((filter, index) => {
      if (index === filterIndex) return copiedFilter
      return filter
    })
    updateField(null, null, 'filters', newFilters)
  }

  const addNewFilter = () => {
    const filters = config.filters ? [...config.filters] : []
    const newVizFilter: VizFilter = { values: [], filterStyle: 'dropdown' } as VizFilter
    filters.push(newVizFilter)
    updateField(null, null, 'filters', filters)
  }

  const handleFilterOrder = (idx1, idx2, filterIndex, filter) => {
    // Create a shallow copy of the filter values array & update position of the values
    const updatedValues = [...filter.values]
    const [movedItem] = updatedValues.splice(idx1, 1)
    updatedValues.splice(idx2, 0, movedItem)

    const filtersCopy = _.cloneDeep(config.filters)
    const filterItem = { ...filtersCopy[filterIndex] }

    // Overwrite filterItem.values since thats what we map through in the editor panel
    filterItem.values = updatedValues
    filterItem.orderedValues = updatedValues
    filterItem.active = updatedValues[0]
    filterItem.order = 'cust'

    // Update the filters
    filtersCopy[filterIndex] = filterItem

    updateField(null, null, 'filters', filtersCopy)
  }

  return (
    <>
      {config.filters && (
        <>
          <Select
            value={config.filterBehavior}
            fieldName='filterBehavior'
            label='Filter Behavior'
            updateField={updateField}
            options={['Apply Button', 'Filter Change']}
            tooltip={
              <Tooltip style={{ textTransform: 'none' }}>
                <Tooltip.Target>
                  <Icon display='question' style={{ marginLeft: '0.5rem' }} />
                </Tooltip.Target>
                <Tooltip.Content>
                  <p>The Apply Button option changes the visualization when the user clicks "apply". The Filter Change option immediately changes the visualization when the selection is changed.</p>
                </Tooltip.Content>
              </Tooltip>
            }
          />
          <br />
          <ul className='filters-list'>
            {/* Whether filters should apply onChange or Apply Button */}

            {config.filters.map((filter, index) => {
              if (filter.type === 'url') return <></>

              return (
                <FieldSetWrapper fieldName={filter.columnName} fieldKey={index} fieldType='Filter' controls={openControls} deleteField={() => removeFilter(index)}>
                  <label>
                    <span className='edit-label column-heading'>Filter</span>
                    <select
                      value={filter.columnName}
                      onChange={e => {
                        handleNameChange(index, e.target.value)
                      }}
                    >
                      <option value=''>- Select Option -</option>
                      {dataColumns.map((dataKey, index) => (
                        <option value={dataKey} key={index}>
                          {dataKey}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <span className='edit-showDropdown column-heading'>Show Filter Input</span>
                    <input
                      type='checkbox'
                      checked={filter.showDropdown === undefined ? true : filter.showDropdown}
                      onChange={e => {
                        updateFilterProp('showDropdown', index, e.target.checked)
                      }}
                    />
                  </label>

                  <label>
                    <span className='edit-label column-heading'>Filter Style</span>

                    <select
                      value={filter.filterStyle}
                      onChange={e => {
                        updateFilterStyle(index, e.target.value)
                      }}
                    >
                      {filterStyleOptions.map((item, index) => {
                        return (
                          <option key={`filter-style-${index}`} value={item}>
                            {item}
                          </option>
                        )
                      })}
                    </select>
                  </label>

                  <label>
                    <span className='edit-label column-heading'>Label</span>
                    <input
                      type='text'
                      value={filter.label}
                      onChange={e => {
                        updateFilterProp('label', index, e.target.value)
                      }}
                    />
                  </label>

                  {filter.filterStyle === 'multi-select' && (
                    <TextField
                      label='Select Limit'
                      value={(filter as MultiSelectFilter).selectLimit}
                      updateField={updateField}
                      section='filters'
                      subsection={index}
                      fieldName='selectLimit'
                      type='number'
                      tooltip={
                        <Tooltip style={{ textTransform: 'none' }}>
                          <Tooltip.Target>
                            <Icon display='question' style={{ marginLeft: '0.5rem' }} />
                          </Tooltip.Target>
                          <Tooltip.Content>
                            <p>The maximum number of items that can be selected.</p>
                          </Tooltip.Content>
                        </Tooltip>
                      }
                    />
                  )}

                  <label>
                    <span className='edit-label column-heading'>Default Value Set By Query String Parameter</span>
                    <input
                      type='text'
                      value={filter.setByQueryParameter}
                      onChange={e => {
                        updateFilterProp('setByQueryParameter', index, e.target.value)
                      }}
                    />
                  </label>

                  <FilterOrder filterIndex={index} filter={filter} updateFilterProp={updateFilterProp} handleFilterOrder={handleFilterOrder} />
                </FieldSetWrapper>
              )
            })}
          </ul>
        </>
      )}
      {!config.filters && <p style={{ textAlign: 'center' }}>There are currently no filters.</p>}
      <button type='button' onClick={addNewFilter} className='btn btn-primary full-width'>
        Add Filter
      </button>
    </>
  )
}

export default VizFilterEditor