const useMinMax = ({ config, minValue, maxValue, existPositiveValue, data, isAllLine }) => {
  let min = 0
  let max = 0

  if (!data) {
    return { min, max }
  }

  const { max: enteredMaxValue, min: enteredMinValue } = config.runtime.yAxis

  // do validation bafore applying t0 charts
  const isMaxValid = existPositiveValue ? enteredMaxValue >= maxValue : enteredMaxValue >= 0
  const isMinValid = config.useLogScale ? enteredMinValue >= 0 : (enteredMinValue <= 0 && minValue >= 0) || (enteredMinValue <= minValue && minValue < 0)

  min = enteredMinValue && isMinValid ? enteredMinValue : minValue
  max = enteredMaxValue && isMaxValid ? enteredMaxValue : Number.MIN_VALUE

  if (config.visualizationType === 'Bar' || config.visualizationType === 'Combo' || config.visualizationType === 'Deviation Bar') {
    let ciYMax = 0
    if (config.hasOwnProperty('confidenceKeys')) {
      let upperCIValues = data.map(function (d) {
        return d[config.confidenceKeys.upper]
      })
      ciYMax = Math.max.apply(Math, upperCIValues)
      if (ciYMax > max) max = ciYMax // bump up the max
    }
  }

  if (config.visualizationType === 'Forecasting') {
    const {
      runtime: { forecastingSeriesKeys }
    } = config
    if (forecastingSeriesKeys.length > 0) {
      // push all keys into an array
      let columnNames = []

      forecastingSeriesKeys.forEach(f => {
        f.confidenceIntervals?.map(ciGroup => {
          columnNames.push(ciGroup.high)
          columnNames.push(ciGroup.low)
        })
      })

      // Using the columnNames or "keys" get the returned result
      const result = data.map(obj => columnNames.map(key => obj[key]))

      const highCIGroup = Math.max.apply(
        null,
        result.map(item => item[0])
      ) // Extract ages from result
      const lowCIGroup = Math.min.apply(
        null,
        result.map(item => item[1])
      ) // Extract ages from result

      if (highCIGroup > max) {
        max = highCIGroup
      }
      if (lowCIGroup < min) {
        min = lowCIGroup
      }
    }
  }

  if ((config.visualizationType === 'Bar' || (config.visualizationType === 'Combo' && !isAllLine)) && min > 0) {
    min = 0
  }
  if (config.visualizationType === 'Combo' && isAllLine) {
    if ((enteredMinValue === undefined || enteredMinValue === null || enteredMinValue === '') && min > 0) {
      min = 0
    }
    if (enteredMinValue) {
      const isMinValid = config.useLogScale ? enteredMinValue >= 0 && enteredMinValue < minValue : enteredMinValue < minValue
      min = enteredMinValue && isMinValid ? enteredMinValue : minValue
    }
  }

  if (config.visualizationType === 'Deviation Bar' && min > 0) {
    const isMinValid = Number(enteredMinValue) < Math.min(minValue, Number(config.xAxis.target))
    min = enteredMinValue && isMinValid ? enteredMinValue : 0
  }

  if (config.visualizationType === 'Line') {
    const isMinValid = config.useLogScale ? enteredMinValue >= 0 && enteredMinValue < minValue : enteredMinValue < minValue
    min = enteredMinValue && isMinValid ? enteredMinValue : minValue
  }
  //If data value max wasn't provided, calculate it
  if (max === Number.MIN_VALUE) {
    // if all values in data are negative set max = 0
    max = existPositiveValue ? maxValue : 0
  }

  //Adds Y Axis data padding if applicable
  if (config.runtime.yAxis.paddingPercent) {
    let paddingValue = (max - min) * config.runtime.yAxis.paddingPercent
    min -= paddingValue
    max += paddingValue
  }

  if (config.isLollipopChart && config.yAxis.displayNumbersOnBar) {
    const dataKey = data.map(item => item[config.series[0].dataKey])
    const maxDataVal = Math.max(...dataKey).toString().length

    switch (true) {
      case maxDataVal > 8 && maxDataVal <= 12:
        max = max * 1.3
        break
      case maxDataVal > 4 && maxDataVal <= 7:
        max = max * 1.1
        break
      default:
        break
    }
  }

  if (config.yAxis.enablePadding) {
    if (min < 0) {
      // sets with negative data need more padding on the max
      max *= 1.2
      min *= 1.2
    } else {
      max *= 1.1
    }
  }

  return { min, max }
}
export default useMinMax