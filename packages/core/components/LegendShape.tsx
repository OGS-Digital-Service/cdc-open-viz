import React from 'react'

interface LegendShapeProps {
  fill: string
  borderColor?: string
  display?: 'inline-block' | 'block' | 'inline'
  shape?: 'circle' | 'square'
}

const LegendShape: React.FC<LegendShapeProps> = props => {
  const { fill, borderColor, display = 'inline-block', shape = 'circle' } = props
  const dimensions = { width: '1em', height: '1em' }
  const marginRight = ['circle', 'square'].includes(shape) ? '5px' : '0'
  const styles = {
    marginRight: marginRight,
    borderRadius: shape === 'circle' ? '50%' : '0px',
    verticalAlign: 'middle',
    display: display,
    height: dimensions.height,
    width: dimensions.width,
    border: borderColor ? `${borderColor} 1px solid` : 'rgba(0,0,0,.3) 1px solid',
    backgroundColor: fill
  }

  return <span className='legend-item' style={styles} />
}

export default LegendShape