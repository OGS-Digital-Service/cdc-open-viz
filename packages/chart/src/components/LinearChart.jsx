import React, { forwardRef, useContext, useEffect, useRef, useState } from 'react'
import { Tooltip as ReactTooltip } from 'react-tooltip'

import { Group } from '@visx/group'
import { Line } from '@visx/shape'
import { Text } from '@visx/text'
import { AxisLeft, AxisBottom, AxisRight, AxisTop } from '@visx/axis'
import { localPoint } from '@visx/event'
import { useTooltip } from '@visx/tooltip'

import BarChart from './BarChart'
import ConfigContext from '../ConfigContext'
import CoveAreaChart from './AreaChart'
import CoveBoxPlot from './BoxPlot'
import CoveScatterPlot from './ScatterPlot'
import DeviationBar from './DeviationBar'
import LineChart from './LineChart'
import PairedBarChart from './PairedBarChart'
import useIntersectionObserver from './useIntersectionObserver'

import ErrorBoundary from '@cdc/core/components/ErrorBoundary'
import '../scss/LinearChart.scss'
import useReduceData from '../hooks/useReduceData'
import useScales from '../hooks/useScales'
import useMinMax from '../hooks/useMinMax'
import useRightAxis from '../hooks/useRightAxis'
import useTopAxis from '../hooks/useTopAxis'
import Forecasting from './Forecasting'

export default function LinearChart() {
  const { transformedData: data, dimensions, config, parseDate, formatDate, currentViewport, formatNumber, handleChartAriaLabels, updateConfig, handleLineType, rawData, getTextWidth } = useContext(ConfigContext)

  // getters & functions
  const getXAxisData = d => (config.runtime.xAxis.type === 'date' ? parseDate(d[config.runtime.originalXAxis.dataKey]).getTime() : d[config.runtime.originalXAxis.dataKey])
  const getYAxisData = (d, seriesKey) => d[seriesKey]
  const xAxisDataMapped = data.map(d => getXAxisData(d))

  // configure width
  let [width] = dimensions
  if (config && config.legend && !config.legend.hide && config.legend.position !== 'bottom' && ['lg', 'md'].includes(currentViewport)) {
    width = width * 0.73
  }
  //  configure height , yMax, xMAx
  const { horizontal: heightHorizontal } = config.heights
  const isHorizontal = config.orientation === 'horizontal'
  const shouldAbbreviate = true
  const height = config.aspectRatio ? width * config.aspectRatio : config.heights[config.orientation]
  const xMax = width - config.runtime.yAxis.size - (config.visualizationType === 'Combo' ? config.yAxis.rightAxisSize : 0)
  const yMax = height - (config.orientation === 'horizontal' ? 0 : config.runtime.xAxis.size)

  // hooks  % states
  const { minValue, maxValue, existPositiveValue, isAllLine } = useReduceData(config, data)
  const { yScaleRight, hasRightAxis } = useRightAxis({ config, yMax, data, updateConfig })
  const { hasTopAxis } = useTopAxis(config)
  const [animatedChart, setAnimatedChart] = useState(false)
  const properties = { data, config, minValue, maxValue, isAllLine, existPositiveValue, xAxisDataMapped, xMax, yMax }
  const { min, max } = useMinMax(properties)
  const { xScale, yScale, seriesScale, g1xScale, g2xScale, xScaleNoPadding } = useScales({ ...properties, min, max })

  // refs
  const triggerRef = useRef()
  const svgRef = useRef()
  const dataRef = useIntersectionObserver(triggerRef, {
    freezeOnceVisible: false
  })

  const handleLeftTickFormatting = tick => {
    if (config.useLogScale && tick === 0.1) {
      //when logarithmic scale applied change value of first tick
      tick = 0
    }
    if (config.runtime.yAxis.type === 'date') return formatDate(parseDate(tick))
    if (config.orientation === 'vertical') return formatNumber(tick, 'left', shouldAbbreviate)
    return tick
  }

  const handleBottomTickFormatting = tick => {
    if (config.useLogScale && tick === 0.1) {
      // when logaritmic scale applyed change value FIRST  of  tick
      tick = 0
    }
    if (config.runtime.xAxis.type === 'date') return formatDate(tick)
    if (config.orientation === 'horizontal') return formatNumber(tick, 'left', shouldAbbreviate)
    if (config.xAxis.type === 'continuous') return formatNumber(tick, 'bottom', shouldAbbreviate)
    return tick
  }

  const countNumOfTicks = axis => {
    const { numTicks } = config.runtime[axis]
    let tickCount = undefined

    if (axis === 'yAxis') {
      tickCount = isHorizontal && !numTicks ? data.length : isHorizontal && numTicks ? numTicks : !isHorizontal && !numTicks ? undefined : !isHorizontal && numTicks && numTicks
      // to fix edge case of small numbers with decimals
      if (tickCount === undefined && !config.dataFormat.roundTo) {
        // then it is set to Auto
        if (Number(max) <= 3) {
          tickCount = 2
        } else {
          tickCount = 4 // same default as standalone components
        }
      }
      if (Number(tickCount) > Number(max)) {
        // cap it and round it so its an integer
        tickCount = Number(min) < 0 ? Math.round(max) * 2 : Math.round(max)
      }
    }

    if (axis === 'xAxis') {
      tickCount = isHorizontal && !numTicks ? undefined : isHorizontal && numTicks ? numTicks : !isHorizontal && !numTicks ? undefined : !isHorizontal && numTicks && numTicks
      if (isHorizontal && tickCount === undefined && !config.dataFormat.roundTo) {
        // then it is set to Auto
        // - check for small numbers situation
        if (max <= 3) {
          tickCount = 2
        } else {
          tickCount = 4 // same default as standalone components
        }
      }
    }
    return tickCount
  }

  // Tooltip helper for getting data to the closest date/category hovered.
  const getXValueFromCoordinate = x => {
    if (xScale.type === 'point') {
      // Find the closest x value by calculating the minimum distance
      let closestX = null
      let minDistance = Number.MAX_VALUE
      let offset = x - yAxis.size

      data.forEach(d => {
        const xPosition = xAxis.type === 'date' ? xScale(parseDate(d[xAxis.dataKey])) : xScale(d[xAxis.dataKey])
        const distance = Math.abs(Number(xPosition - offset))

        if (distance < minDistance) {
          minDistance = distance
          closestX = xAxis.type === 'date' ? parseDate(d[xAxis.dataKey]) : d[xAxis.dataKey]
        }
      })
      return closestX
    }
  }

  // import tooltip helpers
  const { tooltipData, showTooltip, hideTooltip } = useTooltip()

  const handleTooltipMouseOver = (e, data) => {
    // get the svg coordinates of the mouse
    // and get the closest values
    const eventSvgCoords = localPoint(e)
    const { x, y } = eventSvgCoords

    const { runtime } = config

    let closestXScaleValue = getXValueFromCoordinate(x)
    let formattedDate = formatDate(closestXScaleValue)

    let yScaleValues
    if (xAxis.type === 'categorical') {
      yScaleValues = data.filter(d => d[xAxis.dataKey] === closestXScaleValue)
    } else {
      yScaleValues = rawData.filter(d => formatDate(parseDate(d[xAxis.dataKey])) === formattedDate)
    }

    let seriesToInclude = []
    let stageColumns = []
    let ciItems = []

    // loop through series for items to add to tooltip.
    // there is probably a better way of doing this.
    config.series?.forEach(s => {
      if (s.type === 'Forecasting') {
        stageColumns.push(s.stageColumn)

        // greedy fn 😭
        s?.confidenceIntervals.forEach(ci => {
          if (ci.showInTooltip === true) {
            ciItems.push(ci.low)
            ciItems.push(ci.high)
          }
        })
      }
    })

    let standardLoopItems = []

    if (config.visualizationType === 'Combo') {
      standardLoopItems = [runtime.xAxis.dataKey, ...runtime?.barSeriesKeys, ...stageColumns, ...ciItems]
    } else {
      standardLoopItems = [runtime.xAxis.dataKey, ...stageColumns, ...ciItems]
    }

    standardLoopItems.map(seriesKey => {
      if (!seriesKey) return false
      if (!yScaleValues[0]) return false
      for (const item of Object.entries(yScaleValues[0])) {
        if (item[0] === seriesKey) {
          seriesToInclude.push(item)
        }
      }
    })

    // filter out the series that aren't added to the map.
    if (!seriesToInclude) return
    let initialTooltipData = Object.fromEntries(seriesToInclude) ? Object.fromEntries(seriesToInclude) : {}

    let tooltipData = {}
    tooltipData.data = initialTooltipData
    tooltipData.dataXPosition = x + 10
    tooltipData.dataYPosition = y

    let tooltipInformation = {
      tooltipData: tooltipData,
      tooltipTop: 0,
      tooltipValues: yScaleValues,
      tooltipLeft: x
    }

    showTooltip(tooltipInformation)
  }

  const handleTooltipMouseOff = () => {
    hideTooltip()
  }

  // Make sure the chart is visible if in the editor
  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    const element = document.querySelector('.isEditor')
    if (element) {
      // parent element is visible
      setAnimatedChart(prevState => true)
    }
  }) /* eslint-disable-line */

  // If the chart is in view, set to animate if it has not already played
  useEffect(() => {
    if (dataRef?.isIntersecting === true && config.animate) {
      setTimeout(() => {
        setAnimatedChart(prevState => true)
      }, 500)
    }
  }, [dataRef?.isIntersecting, config.animate])

  const { orientation, xAxis, yAxis } = config

  return isNaN(width) ? (
    <></>
  ) : (
    <ErrorBoundary component='LinearChart'>
      <svg width={width} height={height} className={`linear ${config.animate ? 'animated' : ''} ${animatedChart && config.animate ? 'animate' : ''}`} role='img' aria-label={handleChartAriaLabels(config)} tabIndex={0} ref={svgRef}>
        {/* Highlighted regions */}
        {config.regions
          ? config.regions.map(region => {
              if (!Object.keys(region).includes('from') || !Object.keys(region).includes('to')) return null

              let from
              let to
              let width

              if (config.xAxis.type === 'date') {
                from = xScale(parseDate(region.from).getTime())
                to = xScale(parseDate(region.to).getTime())
                width = to - from
              }

              if (config.xAxis.type === 'categorical') {
                from = xScale(region.from)
                to = xScale(region.to)
                width = to - from
              }

              if (!from) return null
              if (!to) return null

              return (
                <Group className='regions' left={Number(config.runtime.yAxis.size)} key={region.label}>
                  <path
                    stroke='#333'
                    d={`M${from} -5
                          L${from} 5
                          M${from} 0
                          L${to} 0
                          M${to} -5
                          L${to} 5`}
                  />
                  <rect x={from} y={0} width={width} height={yMax} fill={region.background} opacity={0.3} />
                  <Text x={from + width / 2} y={5} fill={region.color} verticalAnchor='start' textAnchor='middle'>
                    {region.label}
                  </Text>
                </Group>
              )
            })
          : ''}

        {/* Y axis */}
        {config.visualizationType !== 'Spark Line' && (
          <AxisLeft scale={yScale} tickLength={config.useLogScale ? 6 : 8} left={Number(config.runtime.yAxis.size) - config.yAxis.axisPadding} label={config.runtime.yAxis.label} stroke='#333' tickFormat={tick => handleLeftTickFormatting(tick)} numTicks={countNumOfTicks('yAxis')}>
            {props => {
              const axisCenter = config.runtime.horizontal ? (props.axisToPoint.y - props.axisFromPoint.y) / 2 : (props.axisFromPoint.y - props.axisToPoint.y) / 2
              const horizontalTickOffset = yMax / props.ticks.length / 2 - (yMax / props.ticks.length) * (1 - config.barThickness) + 5
              return (
                <Group className='left-axis'>
                  {props.ticks.map((tick, i) => {
                    const minY = props.ticks[0].to.y
                    const barMinHeight = 15 // 15 is the min height for bars by default
                    const showTicks = String(tick.value).startsWith('1') || tick.value === 0.1 ? 'block' : 'none'
                    const tickLength = showTicks === 'block' ? 7 : 0
                    const to = { x: tick.to.x - tickLength, y: tick.to.y }
                    console.log(config.yAxis.tickRotation, 'RO')

                    return (
                      <Group key={`vx-tick-${tick.value}-${i}`} className={'vx-axis-tick'}>
                        {!config.runtime.yAxis.hideTicks && <Line from={tick.from} to={config.useLogScale ? to : tick.to} stroke={config.yAxis.tickColor} display={config.runtime.horizontal ? 'none' : 'block'} />}

                        {config.runtime.yAxis.gridLines ? <Line display={config.useLogScale && showTicks} from={{ x: tick.from.x + xMax, y: tick.from.y }} to={tick.from} stroke='rgba(0,0,0,0.3)' /> : ''}

                        {config.orientation === 'horizontal' && config.visualizationSubType !== 'stacked' && config.yAxis.labelPlacement === 'On Date/Category Axis' && !config.yAxis.hideLabel && (
                          <Text
                            transform={`translate(${tick.to.x - 5}, ${config.isLollipopChart ? tick.to.y - minY : tick.to.y - minY + (Number(config.barHeight * config.series.length) - barMinHeight) / 2}) rotate(-${config.runtime.horizontal ? config.runtime.yAxis.tickRotation : 0})`}
                            verticalAnchor={'start'}
                            textAnchor={'end'}
                          >
                            {tick.formattedValue}
                          </Text>
                        )}

                        {config.orientation === 'horizontal' && config.visualizationSubType === 'stacked' && config.yAxis.labelPlacement === 'On Date/Category Axis' && !config.yAxis.hideLabel && (
                          <Text transform={`translate(${tick.to.x - 5}, ${tick.to.y - minY + (Number(config.barHeight) - barMinHeight) / 2}) rotate(-${config.runtime.horizontal ? config.runtime.yAxis.tickRotation : 0})`} verticalAnchor={'start'} textAnchor={'end'}>
                            {tick.formattedValue}
                          </Text>
                        )}

                        {config.orientation === 'horizontal' && config.visualizationType === 'Paired Bar' && !config.yAxis.hideLabel && (
                          <Text transform={`translate(${tick.to.x - 5}, ${tick.to.y - minY + Number(config.barHeight) / 2}) rotate(-${config.runtime.horizontal ? config.runtime.yAxis.tickRotation : 0})`} textAnchor={'end'} verticalAnchor='middle'>
                            {tick.formattedValue}
                          </Text>
                        )}
                        {config.orientation === 'horizontal' && config.visualizationType === 'Deviation Bar' && !config.yAxis.hideLabel && (
                          <Text transform={`translate(${tick.to.x - 5}, ${config.isLollipopChart ? tick.to.y - minY + 2 : tick.to.y - minY + Number(config.barHeight) / 2}) rotate(-${config.runtime.horizontal ? config.runtime.yAxis.tickRotation : 0})`} textAnchor={'end'} verticalAnchor='middle'>
                            {tick.formattedValue}
                          </Text>
                        )}

                        {config.orientation === 'vertical' && config.visualizationType !== 'Paired Bar' && !config.yAxis.hideLabel && (
                          <Text
                            display={config.useLogScale ? showTicks : 'block'}
                            dx={config.useLogScale ? -6 : 0}
                            x={config.runtime.horizontal ? tick.from.x + 2 : tick.to.x}
                            y={tick.to.y + (config.runtime.horizontal ? horizontalTickOffset : 0)}
                            angle={-Number(config.yAxis.tickRotation) || 0}
                            verticalAnchor={config.runtime.horizontal ? 'start' : 'middle'}
                            textAnchor={config.runtime.horizontal ? 'start' : 'end'}
                            fill={config.yAxis.tickLabelColor}
                          >
                            {tick.formattedValue}
                          </Text>
                        )}
                      </Group>
                    )
                  })}
                  {!config.yAxis.hideAxis && <Line from={props.axisFromPoint} to={config.runtime.horizontal ? { x: 0, y: Number(heightHorizontal) } : props.axisToPoint} stroke='#000' />}
                  {yScale.domain()[0] < 0 && <Line from={{ x: props.axisFromPoint.x, y: yScale(0) }} to={{ x: xMax, y: yScale(0) }} stroke='#333' />}
                  {config.visualizationType === 'Bar' && config.orientation === 'horizontal' && xScale.domain()[0] < 0 && <Line from={{ x: xScale(0), y: 0 }} to={{ x: xScale(0), y: yMax }} stroke='#333' strokeWidth={2} />}
                  <Text className='y-label' textAnchor='middle' verticalAnchor='start' transform={`translate(${-1 * config.runtime.yAxis.size}, ${axisCenter}) rotate(-90)`} fontWeight='bold' fill={config.yAxis.labelColor}>
                    {props.label}
                  </Text>
                </Group>
              )
            }}
          </AxisLeft>
        )}

        {/* Right Axis */}
        {hasRightAxis && (
          <AxisRight scale={yScaleRight} left={Number(width - config.yAxis.rightAxisSize)} label={config.yAxis.rightLabel} tickFormat={tick => formatNumber(tick, 'right')} numTicks={config.runtime.yAxis.rightNumTicks || undefined} labelOffset={45}>
            {props => {
              const axisCenter = config.runtime.horizontal ? (props.axisToPoint.y - props.axisFromPoint.y) / 2 : (props.axisFromPoint.y - props.axisToPoint.y) / 2
              const horizontalTickOffset = yMax / props.ticks.length / 2 - (yMax / props.ticks.length) * (1 - config.barThickness) + 5
              return (
                <Group className='right-axis'>
                  {props.ticks.map((tick, i) => {
                    return (
                      <Group key={`vx-tick-${tick.value}-${i}`} className='vx-axis-tick'>
                        {!config.runtime.yAxis.rightHideTicks && <Line from={tick.from} to={tick.to} display={config.runtime.horizontal ? 'none' : 'block'} stroke={config.yAxis.rightAxisTickColor} />}

                        {config.runtime.yAxis.rightGridLines ? <Line from={{ x: tick.from.x + xMax, y: tick.from.y }} to={tick.from} stroke='rgba(0,0,0,0.3)' /> : ''}

                        {!config.yAxis.rightHideLabel && (
                          <Text x={tick.to.x} y={tick.to.y + (config.runtime.horizontal ? horizontalTickOffset : 0)} verticalAnchor={config.runtime.horizontal ? 'start' : 'middle'} textAnchor={'start'} fill={config.yAxis.rightAxisTickLabelColor}>
                            {tick.formattedValue}
                          </Text>
                        )}
                      </Group>
                    )
                  })}
                  {!config.yAxis.rightHideAxis && <Line from={props.axisFromPoint} to={props.axisToPoint} stroke='#333' />}
                  <Text className='y-label' textAnchor='middle' verticalAnchor='start' transform={`translate(${config.yAxis.rightLabelOffsetSize ? config.yAxis.rightLabelOffsetSize : 0}, ${axisCenter}) rotate(-90)`} fontWeight='bold' fill={config.yAxis.rightAxisLabelColor}>
                    {props.label}
                  </Text>
                </Group>
              )
            }}
          </AxisRight>
        )}

        {hasTopAxis && config.topAxis.hasLine && (
          <AxisTop
            stroke='#333'
            left={Number(config.runtime.yAxis.size)}
            scale={xScale}
            hideTicks
            hideZero
            tickLabelProps={() => ({
              fill: 'transparent'
            })}
          />
        )}

        {/* X axis */}
        {config.visualizationType !== 'Paired Bar' && config.visualizationType !== 'Spark Line' && (
          <AxisBottom
            top={config.runtime.horizontal ? Number(heightHorizontal) + Number(config.xAxis.axisPadding) : yMax + Number(config.xAxis.axisPadding)}
            left={Number(config.runtime.yAxis.size)}
            label={config.runtime.xAxis.label}
            tickFormat={handleBottomTickFormatting}
            scale={xScale}
            stroke='#333'
            numTicks={countNumOfTicks('xAxis')}
            tickStroke='#333'
          >
            {props => {
              const axisCenter = (props.axisToPoint.x - props.axisFromPoint.x) / 2
              // Calculate sumOfTickWidth here, before map function
              const fontSize = { small: 16, medium: 18, large: 20 }
              const defaultTickLength = 8
              const tickWidthMax = Math.max(...props.ticks.map(tick => getTextWidth(tick.formattedValue, `normal ${fontSize[config.fontSize]}px sans-serif`)))
              const marginTop = 20

              const textWidths = props.ticks.map(tick => getTextWidth(tick.formattedValue, `normal ${fontSize[config.fontSize]}px sans-serif`))
              const sumOfTickWidth = textWidths.reduce((a, b) => a + b, 100)
              const spaceBetweenEachTick = (xMax - sumOfTickWidth) / (props.ticks.length - 1)

              // Check if ticks are overlapping
              // Determine the position of each tick
              let positions = [0] // The first tick is at position 0
              for (let i = 1; i < textWidths.length; i++) {
                // The position of each subsequent tick is the position of the previous tick
                // plus the width of the previous tick and the space
                positions[i] = positions[i - 1] + textWidths[i - 1] + spaceBetweenEachTick
              }

              // Check if ticks are overlapping
              let areTicksTouching = false
              textWidths.forEach((_, i) => {
                if (positions[i] + textWidths[i] > positions[i + 1]) {
                  areTicksTouching = true
                  return
                }
              })

              const dynamicMarginTop = areTicksTouching ? tickWidthMax + defaultTickLength + marginTop : 0
              config.dynamicMarginTop = dynamicMarginTop
              // config.xAxis.size = dynamicMarginTop
              return (
                <Group className='bottom-axis'>
                  {props.ticks.map((tick, i) => {
                    // when using LogScale show major ticks values only
                    const showTick = String(tick.value).startsWith('1') || tick.value === 0.1 ? 'block' : 'none'
                    const tickLength = showTick === 'block' ? 16 : defaultTickLength
                    const to = { x: tick.to.x, y: tickLength }
                    let textWidth = getTextWidth(tick.formattedValue, `normal ${fontSize[config.fontSize]}px sans-serif`)
                    //reset rotation
                    config.yAxis.tickRotation = config.isResponsiveTicks && config.orientation === 'horizontal' ? 0 : config.yAxis.tickRotation
                    //configure rotation
                    const tickRotation = config.isResponsiveTicks && areTicksTouching ? -Number(config.xAxis.maxTickRotation) || -90 : -Number(config.runtime.xAxis.tickRotation)

                    return (
                      <Group key={`vx-tick-${tick.value}-${i}`} className={'vx-axis-tick'}>
                        {!config.xAxis.hideTicks && <Line from={tick.from} to={config.orientation === 'horizontal' && config.useLogScale ? to : tick.to} stroke={config.xAxis.tickColor} strokeWidth={showTick === 'block' ? 1.3 : 1} />}
                        {!config.xAxis.hideLabel && (
                          <Text
                            dy={config.orientation === 'horizontal' && config.useLogScale ? 8 : 0}
                            display={config.orientation === 'horizontal' && config.useLogScale ? showTick : 'block'}
                            x={tick.to.x}
                            y={tick.to.y}
                            angle={tickRotation}
                            verticalAnchor={tickRotation < -50 ? 'middle' : 'start'}
                            textAnchor={tickRotation ? 'end' : 'middle'}
                            width={textWidth}
                            fill={config.xAxis.tickLabelColor}
                          >
                            {tick.formattedValue}
                          </Text>
                        )}
                      </Group>
                    )
                  })}
                  {!config.xAxis.hideAxis && <Line from={props.axisFromPoint} to={props.axisToPoint} stroke='#333' />}
                  <Text x={axisCenter} y={config.orientation === 'horizontal' ? dynamicMarginTop || config.xAxis.labelOffset : dynamicMarginTop || config.xAxis.size} textAnchor='middle' fontWeight='bold' fill={config.xAxis.labelColor}>
                    {props.label}
                  </Text>
                </Group>
              )
            }}
          </AxisBottom>
        )}

        {config.visualizationType === 'Paired Bar' && (
          <>
            <AxisBottom top={yMax} left={Number(config.runtime.yAxis.size)} label={config.runtime.xAxis.label} tickFormat={config.runtime.xAxis.type === 'date' ? formatDate : formatNumber} scale={g1xScale} stroke='#333' tickStroke='#333' numTicks={config.runtime.xAxis.numTicks || undefined}>
              {props => {
                return (
                  <Group className='bottom-axis'>
                    {props.ticks.map((tick, i) => {
                      const angle = tick.index !== 0 ? config.yAxis.tickRotation : 0
                      const textAnchor = tick.index !== 0 && config.yAxis.tickRotation && config.yAxis.tickRotation > 0 ? 'end' : 'middle'
                      return (
                        <Group key={`vx-tick-${tick.value}-${i}`} className={'vx-axis-tick'}>
                          {!config.runtime.yAxis.hideTicks && <Line from={tick.from} to={tick.to} stroke='#333' />}
                          {!config.runtime.yAxis.hideLabel && (
                            <Text x={tick.to.x} y={tick.to.y} angle={-angle} verticalAnchor='start' textAnchor={textAnchor}>
                              {formatNumber(tick.value, 'left')}
                            </Text>
                          )}
                        </Group>
                      )
                    })}
                    {!config.runtime.yAxis.hideAxis && <Line from={props.axisFromPoint} to={props.axisToPoint} stroke='#333' />}
                  </Group>
                )
              }}
            </AxisBottom>
            <AxisBottom
              top={yMax}
              left={Number(config.runtime.yAxis.size)}
              label={config.runtime.xAxis.label}
              tickFormat={config.runtime.xAxis.type === 'date' ? formatDate : config.runtime.xAxis.dataKey !== 'Year' ? formatNumber : tick => tick}
              scale={g2xScale}
              stroke='#333'
              tickStroke='#333'
              numTicks={config.runtime.xAxis.numTicks || undefined}
            >
              {props => {
                return (
                  <>
                    <Group className='bottom-axis'>
                      {props.ticks.map((tick, i) => {
                        const angle = tick.index !== 0 ? config.yAxis.tickRotation : 0
                        const textAnchor = tick.index !== 0 && config.yAxis.tickRotation && config.yAxis.tickRotation > 0 ? 'end' : 'middle'
                        return (
                          <Group key={`vx-tick-${tick.value}-${i}`} className={'vx-axis-tick'}>
                            {!config.runtime.yAxis.hideTicks && <Line from={tick.from} to={tick.to} stroke='#333' />}
                            {!config.runtime.yAxis.hideLabel && (
                              <Text x={tick.to.x} y={tick.to.y} angle={-angle} verticalAnchor='start' textAnchor={textAnchor}>
                                {formatNumber(tick.value, 'left')}
                              </Text>
                            )}
                          </Group>
                        )
                      })}
                      {!config.runtime.yAxis.hideAxis && <Line from={props.axisFromPoint} to={props.axisToPoint} stroke='#333' />}
                    </Group>
                    <Group>
                      <Text x={xMax / 2} y={config.xAxis.labelOffset} stroke='#333' textAnchor={'middle'} verticalAnchor='start'>
                        {config.runtime.xAxis.label}
                      </Text>
                    </Group>
                  </>
                )
              }}
            </AxisBottom>
          </>
        )}
        {config.visualizationType === 'Deviation Bar' && <DeviationBar xScale={xScale} yScale={yScale} width={xMax} height={yMax} />}
        {config.visualizationType === 'Paired Bar' && <PairedBarChart originalWidth={width} width={xMax} height={yMax} />}
        {config.visualizationType === 'Scatter Plot' && <CoveScatterPlot xScale={xScale} yScale={yScale} getXAxisData={getXAxisData} getYAxisData={getYAxisData} />}
        {config.visualizationType === 'Box Plot' && <CoveBoxPlot xScale={xScale} yScale={yScale} />}
        {(config.visualizationType === 'Area Chart' || config.visualizationType === 'Combo') && <CoveAreaChart xScale={xScale} yScale={yScale} yMax={yMax} xMax={xMax} chartRef={svgRef} />}
        {(config.visualizationType === 'Bar' || config.visualizationType === 'Combo') && <BarChart xScale={xScale} yScale={yScale} seriesScale={seriesScale} xMax={xMax} yMax={yMax} getXAxisData={getXAxisData} getYAxisData={getYAxisData} animatedChart={animatedChart} visible={animatedChart} />}
        {(config.visualizationType === 'Line' || config.visualizationType === 'Combo') && <LineChart xScale={xScale} yScale={yScale} getXAxisData={getXAxisData} getYAxisData={getYAxisData} xMax={xMax} yMax={yMax} seriesStyle={config.series} />}
        {(config.visualizationType === 'Forecasting' || config.visualizationType === 'Combo') && (
          <Forecasting
            hideTooltip={hideTooltip}
            showTooltip={showTooltip}
            tooltipData={tooltipData}
            xScale={xScale}
            yScale={yScale}
            width={xMax}
            height={yMax}
            xScaleNoPadding={xScaleNoPadding}
            chartRef={svgRef}
            getXValueFromCoordinate={getXValueFromCoordinate}
            handleTooltipMouseOver={handleTooltipMouseOver}
            handleTooltipMouseOff={handleTooltipMouseOff}
          />
        )}

        {/* y anchors */}
        {config.yAxis.anchors &&
          config.yAxis.anchors.map(anchor => {
            return <Line strokeDasharray={handleLineType(anchor.lineStyle)} stroke='rgba(0,0,0,1)' className='customAnchor' from={{ x: 0 + config.yAxis.size, y: yScale(anchor.value) }} to={{ x: xMax, y: yScale(anchor.value) }} display={config.runtime.horizontal ? 'none' : 'block'} />
          })}

        {/* Line chart */}
        {/* TODO: Make this just line or combo? */}
        {config.visualizationType !== 'Bar' &&
          config.visualizationType !== 'Paired Bar' &&
          config.visualizationType !== 'Box Plot' &&
          config.visualizationType !== 'Area Chart' &&
          config.visualizationType !== 'Scatter Plot' &&
          config.visualizationType !== 'Deviation Bar' &&
          config.visualizationType !== 'Forecasting' && (
            <>
              <LineChart xScale={xScale} yScale={yScale} getXAxisData={getXAxisData} getYAxisData={getYAxisData} xMax={xMax} yMax={yMax} seriesStyle={config.series} />
            </>
          )}

        {/* y anchors */}
        {config.yAxis.anchors &&
          config.yAxis.anchors.map(anchor => {
            let anchorPosition = yScale(anchor.value)
            const padding = config.orientation === 'horizontal' ? Number(config.xAxis.size) : Number(config.yAxis.size)
            const middleOffset = config.orientation === 'horizontal' && config.visualizationType === 'Bar' ? config.barHeight / 4 : 0

            return (
              // prettier-ignore
              <Line
                key={anchor.value}
                strokeDasharray={handleLineType(anchor.lineStyle)}
                stroke={anchor.color ? anchor.color : 'rgba(0,0,0,1)'}
                className='anchor-y'
                from={{ x: 0 + padding, y: anchorPosition - middleOffset}}
                to={{ x: width, y: anchorPosition - middleOffset }}
              />
            )
          })}

        {/* x anchors */}
        {config.xAxis.anchors &&
          config.xAxis.anchors.map(anchor => {
            let newX = xAxis
            if (orientation === 'horizontal') {
              newX = yAxis
            }

            let anchorPosition = newX.type === 'date' ? xScale(parseDate(anchor.value, false)) : xScale(anchor.value)

            const padding = orientation === 'horizontal' ? Number(config.xAxis.size) : Number(config.yAxis.size)

            return (
              // prettier-ignore
              <Line
                key={anchor.value}
                strokeDasharray={handleLineType(anchor.lineStyle)}
                stroke={anchor.color ? anchor.color : 'rgba(0,0,0,1)'}
                fill={anchor.color ? anchor.color : 'rgba(0,0,0,1)'}
                className='anchor-x'
                from={{ x: Number(anchorPosition) + Number(padding), y: 0 }}
                to={{ x: Number(anchorPosition) + Number(padding), y: yMax }}
              />
            )
          })}
      </svg>
      <ReactTooltip id={`cdc-open-viz-tooltip-${config.runtime.uniqueId}`} variant='light' arrowColor='rgba(0,0,0,0)' className='tooltip' />
      <div className='animation-trigger' ref={triggerRef} />
    </ErrorBoundary>
  )
}
