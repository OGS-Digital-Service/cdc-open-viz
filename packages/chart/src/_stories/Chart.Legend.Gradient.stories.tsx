import type { Meta, StoryObj } from '@storybook/react'
import chartGradientConfig from './_mock/legend.gradient_mock.json'
import SimplifiedLineConfig from './_mock/simplified_line.json'

import Chart from '../CdcChart'
import { editConfigKeys } from '../helpers/configHelpers'

const meta: Meta<typeof Chart> = {
  title: 'Components/Templates/Chart/Legend',
  component: Chart
}

type Story = StoryObj<typeof Chart>

export const Legend_Gradient: Story = {
  args: {
    config: chartGradientConfig
  }
}

export const Labels_On_Line_Legend_On_Top: Story = {
  args: {
    config: editConfigKeys(chartGradientConfig, [{ path: ['yAxis', 'labelsAboveGridlines'], value: true }])
  }
}

export const Legend_On_Right: Story = {
  args: {
    config: SimplifiedLineConfig
  }
}

export default meta
