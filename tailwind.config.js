const [colors, gradientColorStops] = [
  'primary',
  'secondary',
  'background',
  'border',
  'attachment-background',
  'accent',
  'accent-hover',
  'link-hover',
  'input',
  'heart',
  'highlight-background',
  'highlight-foreground',
  'success',
  'warning',
  'error'
].reduce(
  (acc, cur) => {
    acc[0][`clr-${cur}`] = ({ opacityValue }) => `rgba(var(--clr-${cur}), ${opacityValue || '1'})`
    acc[1][`clr-${cur}`] = `rgb(var(--clr-${cur}))`

    return acc
  },
  [{}, {}]
)

module.exports = {
  purge: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      colors,
      gradientColorStops,
      borderColor: {
        DEFAULT: 'rgb(var(--clr-border))'
      },
      padding: {
        '1/1': '100%'
      },
      minHeight: theme => ({ ...theme('spacing') })
    }
  },
  variants: {
    extend: {
      opacity: ['disabled'],
      cursor: ['disabled'],
      backgroundColor: ['disabled']
    }
  },
  plugins: []
}
