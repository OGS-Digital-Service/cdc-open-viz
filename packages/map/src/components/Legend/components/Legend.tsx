//TODO: Move legends to core
import { forwardRef, useContext, useId } from 'react'
import parse from 'html-react-parser'

//types
import { DimensionsType } from '@cdc/core/types/Dimensions'

import ErrorBoundary from '@cdc/core/components/ErrorBoundary'
import LegendShape from '@cdc/core/components/LegendShape'
import LegendGradient from '@cdc/core/components/Legend/Legend.Gradient'
import LegendItemHex from './LegendItem.Hex'
import Button from '@cdc/core/components/elements/Button'

import useDataVizClasses from '@cdc/core/helpers/useDataVizClasses'
import ConfigContext from '../../../context'
import { PatternLines, PatternCircles, PatternWaves } from '@visx/pattern'
import { GlyphStar, GlyphTriangle, GlyphDiamond, GlyphSquare, GlyphCircle } from '@visx/glyph'
import { type ViewportSize } from '../../../types/MapConfig'
import { Group } from '@visx/group'
import './index.scss'

type LegendProps = {
  skipId: string
  currentViewport: ViewportSize
  dimensions: DimensionsType
}

const Legend = forwardRef<HTMLDivElement, LegendProps>((props, ref) => {
  const { skipId, currentViewport, dimensions } = props

  const {
    // prettier-ignore
    displayDataAsText,
    resetLegendToggles,
    runtimeFilters,
    runtimeLegend,
    setAccessibleStatus,
    setRuntimeLegend,
    state,
    viewport,
    mapId
  } = useContext(ConfigContext)

  const { legend } = state

  // Toggles if a legend is active and being applied to the map and data table.
  const toggleLegendActive = (i, legendLabel) => {
    const newValue = !runtimeLegend[i].disabled

    runtimeLegend[i].disabled = newValue // Toggle!

    let newLegend = [...runtimeLegend]

    newLegend[i].disabled = newValue

    const disabledAmt = runtimeLegend.disabledAmt ?? 0

    newLegend['disabledAmt'] = newValue ? disabledAmt + 1 : disabledAmt - 1

    setRuntimeLegend(newLegend)

    setAccessibleStatus(
      `Disabled legend item ${legendLabel ?? ''}. Please reference the data table to see updated values.`
    )
  }
  const getFormattedLegendItems = () => {
    return runtimeLegend.map((entry, idx) => {
      const entryMax = displayDataAsText(entry.max, 'primary')

      const entryMin = displayDataAsText(entry.min, 'primary')
      let formattedText = `${entryMin}${entryMax !== entryMin ? ` - ${entryMax}` : ''}`

      // If interval, add some formatting
      if (legend.type === 'equalinterval' && idx !== runtimeLegend.length - 1) {
        formattedText = `${entryMin} - < ${entryMax}`
      }

      if (legend.type === 'category') {
        formattedText = displayDataAsText(entry.value, 'primary')
      }

      if (entry.max === 0 && entry.min === 0) {
        formattedText = '0'
      }

      let legendLabel = formattedText

      if (entry.hasOwnProperty('special')) {
        legendLabel = entry.label || entry.value
      }

      return {
        color: entry.color,
        label: legendLabel,
        disabled: entry.disabled,
        special: entry.hasOwnProperty('special'),
        value: [entry.min, entry.max]
      }
    })
  }

  const legendList = () => {
    const formattedItems = getFormattedLegendItems()
    let legendItems

    legendItems = formattedItems.map((item, idx) => {
      const handleListItemClass = () => {
        let classes = ['legend-container__li']
        if (item.disabled) classes.push('legend-container__li--disabled')
        if (item.special) classes.push('legend-container__li--special-class')
        return classes.join(' ')
      }

      return (
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events,jsx-a11y/no-noninteractive-element-interactions
        <li
          className={handleListItemClass()}
          key={idx}
          title={`Legend item ${item.label} - Click to disable`}
          onClick={() => toggleLegendActive(idx, item.label)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault()
              toggleLegendActive(idx, item.label)
            }
          }}
          tabIndex={0}
        >
          <LegendShape
            shape={state.legend.style === 'boxes' ? 'square' : 'circle'}
            viewport={viewport}
            fill={item.color}
          />
          <span>{item.label}</span>
        </li>
      )
    })

    if (state.map.patterns) {
      // loop over map patterns
      state.map.patterns.map((patternData, patternDataIndex) => {
        const { pattern, dataKey, size } = patternData
        let defaultPatternColor = 'black'
        const sizes = {
          small: '8',
          medium: '10',
          large: '12'
        }

        const legendSize = 16

        legendItems.push(
          <>
            <li
              className={`legend-container__li legend-container__li--geo-pattern`}
              aria-label='You are on a pattern button. We dont support toggling patterns on this legend at the moment, but provide the area as being focusable for congruity.'
              tabIndex={0}
            >
              <span className='legend-item' style={{ border: 'unset' }}>
                <svg width={legendSize} height={legendSize}>
                  {pattern === 'waves' && (
                    <PatternWaves
                      id={`${mapId}--${dataKey}--${patternDataIndex}`}
                      height={sizes[size] ?? 10}
                      width={sizes[size] ?? 10}
                      fill={defaultPatternColor}
                    />
                  )}
                  {pattern === 'circles' && (
                    <PatternCircles
                      id={`${mapId}--${dataKey}--${patternDataIndex}`}
                      height={sizes[size] ?? 10}
                      width={sizes[size] ?? 10}
                      fill={defaultPatternColor}
                    />
                  )}
                  {pattern === 'lines' && (
                    <PatternLines
                      id={`${mapId}--${dataKey}--${patternDataIndex}`}
                      height={sizes[size] ?? 6}
                      width={sizes[size] ?? 10}
                      stroke={defaultPatternColor}
                      strokeWidth={2}
                      orientation={['diagonalRightToLeft']}
                    />
                  )}
                  <circle
                    id={dataKey}
                    fill={`url(#${mapId}--${dataKey}--${patternDataIndex})`}
                    r={legendSize / 2}
                    cx={legendSize / 2}
                    cy={legendSize / 2}
                    stroke='#0000004d'
                    strokeWidth={1}
                  />
                </svg>
              </span>
              <p style={{ lineHeight: '22.4px' }}>{patternData.label || patternData.dataValue || ''}</p>
            </li>
          </>
        )
      })
    }

    return legendItems
  }
  const { legendClasses } = useDataVizClasses(state, viewport)

  const handleReset = e => {
    const legend = ref.current
    if (e) {
      e.preventDefault()
    }
    resetLegendToggles()
    setAccessibleStatus('Legend has been reset, please reference the data table to see updated values.')
    if (legend) {
      legend.focus()
    }
  }

  const pin = (
    <path
      className='marker'
      d='M0,0l-8.8-17.7C-12.1-24.3-7.4-32,0-32h0c7.4,0,12.1,7.7,8.8,14.3L0,0z'
      strokeWidth={2}
      stroke={'black'}
      transform={`scale(0.5)`}
    />
  )

  const cityStyleShapes = {
    pin: pin,
    circle: <GlyphCircle color='#000' size={150} />,
    square: <GlyphSquare color='#000' size={150} />,
    diamond: <GlyphDiamond color='#000' size={150} />,
    star: <GlyphStar color='#000' size={150} />,
    triangle: <GlyphTriangle color='#000' size={150} />
  }

  return (
    <ErrorBoundary component='Sidebar'>
      <div className='legends'>
        <aside
          id={skipId || 'legend'}
          className={legendClasses.aside.join(' ') || ''}
          role='region'
          aria-label='Legend'
          tabIndex={0}
          ref={ref}
        >
          <section className={legendClasses.section.join(' ') || ''} aria-label='Map Legend'>
            {legend.title && <h3 className={legendClasses.title.join(' ') || ''}>{parse(legend.title)}</h3>}
            {legend.dynamicDescription === false && legend.description && (
              <p className={legendClasses.description.join(' ') || ''}>{parse(legend.description)}</p>
            )}
            {legend.dynamicDescription === true &&
              runtimeFilters.map((filter, idx) => {
                const lookupStr = `${idx},${filter.values.indexOf(String(filter.active))}`

                // Do we have a custom description for this?
                const desc = legend.descriptions[lookupStr] || ''

                if (desc.length > 0) {
                  return (
                    <p key={`dynamic-description-${lookupStr}`} className={`dynamic-legend-description-${lookupStr}`}>
                      {desc}
                    </p>
                  )
                }
                return true
              })}

            <LegendGradient
              labels={getFormattedLegendItems().map(item => item?.label) ?? []}
              colors={getFormattedLegendItems().map(item => item?.color) ?? []}
              values={getFormattedLegendItems().map(item => item?.value) ?? []}
              dimensions={dimensions}
              currentViewport={currentViewport}
              config={state}
            />
            <ul className={legendClasses.ul.join(' ') || ''} aria-label='Legend items'>
              {state.legend.style === 'gradient' ? '' : legendList()}
            </ul>
            {(state.visual.additionalCityStyles.some(c => c.label) || state.visual.cityStyleLabel) && (
              <>
                <hr />
                <div className={legendClasses.div.join(' ') || ''}>
                  {state.visual.cityStyleLabel && (
                    <div>
                      <svg>
                        <Group
                          top={state.visual.cityStyle === 'pin' ? 19 : state.visual.cityStyle === 'triangle' ? 13 : 11}
                          left={10}
                        >
                          {cityStyleShapes[state.visual.cityStyle.toLowerCase()]}
                        </Group>
                      </svg>
                      <p>{state.visual.cityStyleLabel}</p>
                    </div>
                  )}

                  {state.visual.additionalCityStyles.map(
                    ({ shape, label }) =>
                      label && (
                        <div>
                          <svg>
                            <Group top={shape === 'Pin' ? 19 : shape === 'Triangle' ? 13 : 11} left={10}>
                              {cityStyleShapes[shape.toLowerCase()]}
                            </Group>
                          </svg>
                          <p>{label}</p>
                        </div>
                      )
                  )}
                </div>
              </>
            )}
            {runtimeLegend.disabledAmt > 0 && <Button onClick={handleReset}>Reset</Button>}
          </section>
        </aside>
        {state.hexMap.shapeGroups?.length > 0 && state.hexMap.type === 'shapes' && state.general.displayAsHex && (
          <LegendItemHex state={state} runtimeLegend={runtimeLegend} viewport={viewport} />
        )}
      </div>
    </ErrorBoundary>
  )
})

export default Legend
