type SpinnerProps = {
  widthPx?: number
  thicknessPx?: number
  widthRem?: number
  thicknessRem?: number
  backgroundClassName?: string
  foregroundClassName?: string
  expandDuration?: number
  rotateDuration?: number
} & Omit<React.ComponentPropsWithoutRef<'div'>, 'children'>

export default function Spinner({
  widthPx,
  thicknessPx,
  widthRem = 1.75,
  thicknessRem = 0.25,
  backgroundClassName = 'text-gray-200',
  foregroundClassName = 'text-blue-500',
  expandDuration = 1500,
  rotateDuration = 1000,
  ...restProps
}: SpinnerProps): JSX.Element {
  const remToPx = parseFloat(getComputedStyle(document.documentElement).fontSize)
  const width = widthPx || remToPx * widthRem
  const thickness = thicknessPx || remToPx * thicknessRem
  const outerRadius = width / 2
  const circumference = (outerRadius - thickness / 2) * 2 * Math.PI
  const circleProps = {
    stroke: 'currentColor',
    fill: 'transparent',
    strokeWidth: thickness,
    r: outerRadius - thickness / 2,
    cx: outerRadius,
    cy: outerRadius
  }

  return (
    <div role="progressbar" aria-live="polite" aria-busy="true" {...restProps}>
      <svg width={outerRadius * 2} height={outerRadius * 2}>
        <circle className={backgroundClassName} {...circleProps} />
        <g>
          <circle
            className={foregroundClassName}
            style={{
              strokeDasharray: `${circumference} ${circumference}`
            }}
            strokeLinecap="round"
            {...circleProps}
          >
            <animate
              attributeName="stroke-dashoffset"
              values={[0.999, 0.999, 0.25, 0.25, 0.999].map(frac => frac * circumference).join(';')}
              dur={`${expandDuration}ms`}
              repeatCount="indefinite"
            />
            <animateTransform
              attributeName="transform"
              attributeType="XML"
              type="rotate"
              values={[0, 0, 0.125, 0.125, 1]
                .map(frac => `${frac * 360} ${outerRadius} ${outerRadius}`)
                .join(';')}
              dur={`${expandDuration}ms`}
              repeatCount="indefinite"
            />
          </circle>
          <animateTransform
            attributeName="transform"
            attributeType="XML"
            type="rotate"
            values={`0 ${outerRadius} ${outerRadius};360 ${outerRadius} ${outerRadius}`}
            dur={`${rotateDuration}ms`}
            repeatCount="indefinite"
          />
        </g>
      </svg>
    </div>
  )
}
