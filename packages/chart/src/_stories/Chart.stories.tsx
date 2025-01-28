import type { Meta, StoryObj } from '@storybook/react'

import Chart from '../CdcChartWrapper'
import lineChartTwoPointsRegressionTest from './_mock/line_chart_two_points_regression_test.json'
import lineChartTwoPointsNewChart from './_mock/line_chart_two_points_new_chart.json'
import lollipop from './_mock/lollipop.json'
import forestPlot from '../../examples/feature/forest-plot/forest-plot.json'
import pairedBar from './_mock/paired-bar.json'
import horizontalBarConfig from './_mock/horizontal_bar.json'
import pieConfig from './_mock/pie_with_data.json'
import boxPlotConfig from './_mock/boxplot_multiseries.json'
import areaChartStacked from './_mock/area_chart_stacked.json'
import multipleLines from './_mock/short_dates.json'
import lineChartDynamicCI from './_mock/line_chart_dynamic_ci.json'
import lineChartNonDynamicCI from './_mock/line_chart_non_dynamic_ci.json'
import { editConfigKeys } from '../helpers/configHelpers'

const meta: Meta<typeof Chart> = {
  title: 'Components/Templates/Chart',
  component: Chart
}

type Story = StoryObj<typeof Chart>

export const line_Chart_Dynamic_Confidence_Intervals: Story = {
  args: {
    config: lineChartDynamicCI,
    isEditor: false
  }
}

export const line_Chart_Non_Dynamic_Confidence_Intervals: Story = {
  args: {
    config: lineChartNonDynamicCI,
    isEditor: false
  }
}

export const line_Chart_Two_Points_Regression_Test: Story = {
  args: {
    config: lineChartTwoPointsRegressionTest,
    isEditor: false
  }
}
export const line_Chart_Two_Points_New_Chart: Story = {
  args: {
    config: lineChartTwoPointsNewChart,
    isEditor: false
  }
}

export const multiple_lines: Story = {
  args: {
    config: editConfigKeys(multipleLines, [{ path: ['tooltips', 'dateDisplayFormat'], value: '%b. %d %Y' }])
  }
}

export const Lollipop: Story = {
  args: {
    config: lollipop,
    isEditor: false
  }
}

export const Forest_Plot: Story = {
  args: {
    config: forestPlot
  }
}

export const Horizontal_Bar: Story = {
  args: {
    config: horizontalBarConfig
  }
}

export const Pie: Story = {
  args: {
    config: pieConfig
  }
}

export const Paired_Bar: Story = {
  args: {
    config: pairedBar
  }
}
export const BoxPlot_Multiseries: Story = {
  args: {
    config: boxPlotConfig,
    isEditor: false
  }
}

export const Area_Chart_stacked: Story = {
  args: {
    config: areaChartStacked,
    isEditor: false
  }
}

export default meta
