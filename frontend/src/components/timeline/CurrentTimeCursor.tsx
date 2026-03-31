import React from 'react'
import { polarToCartesian, minutesToAngle } from './ringUtils'

interface Props {
  cx: number
  cy: number
  radius: number
  currentMinutes: number
}

const CurrentTimeCursor: React.FC<Props> = ({ cx, cy, radius, currentMinutes }) => {
  const angle = minutesToAngle(currentMinutes)
  const [x1, y1] = polarToCartesian(cx, cy, radius * 0.55, angle)
  const [x2, y2] = polarToCartesian(cx, cy, radius + 8, angle)

  return (
    <g>
      <line
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke="#4A4550"
        strokeWidth={2}
        strokeLinecap="round"
        opacity={0.7}
      />
      <circle
        cx={x2} cy={y2} r={4}
        fill="#4A4550"
        opacity={0.9}
      />
    </g>
  )
}

export default React.memo(CurrentTimeCursor)
