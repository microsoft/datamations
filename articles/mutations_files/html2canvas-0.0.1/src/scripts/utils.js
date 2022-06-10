import { IGNORE_FIELDS } from './config.js'

/**
 * Gets selectors for each componenent, such as slider and animation divs
 * @param {String} id root container id where all the animation components are rendered
 * @returns object of selectors
 */
export function getSelectors (id) {
  const base = '#' + id

  return {
    axisSelector: base + ' .vega-for-axis',
    visSelector: base + ' .vega-vis',
    descr: base + ' .description',
    slider: base + ' .slider',
    otherLayers: base + ' .vega-other-layers',
    controls: base + ' .controls-wrapper',
    exportWrap: base + ' .export-wrapper',
    exportBtn: base + ' .export-btn',
    replayBtn: base + ' .replay-btn'
  }
}

/**
 * Splits layers into separate vega-lite specifications, removes layer field
 * @param {Object} input vega-lite specification with layers
 * @returns a list of specs
 */
export function splitLayers (input) {
  const specArray = []
  const spec = input.spec

  if (spec && spec.layer) {
    spec.layer.forEach((d, i) => {
      const obj = JSON.parse(JSON.stringify(input))
      const animated = i === spec.layer.length - 1

      if (obj.meta) {
        obj.meta.animated = animated
      } else {
        obj.meta = { animated }
      }

      obj.spec.encoding = d.encoding
      obj.spec.mark = d.mark
      delete obj.spec.layer
      specArray.push(obj)
    })
  } else if (input.layer) {
    input.layer.forEach((d, i) => {
      const obj = JSON.parse(JSON.stringify(input))
      const animated = i === input.layer.length - 1

      if (obj.meta) {
        obj.meta.animated = animated
      } else {
        obj.meta = { animated }
      }

      obj.encoding = d.encoding
      obj.mark = d.mark
      delete obj.layer
      specArray.push(obj)
    })
  }

  return specArray
}

/**
 * Looks up a word based of buckets and value.
 * Example:
 *   - words: ['a', 'b', 'c']
 *   - buckets: [10, 20, 30]
 *   - value: 25
 *   will return 'c'
 * @param {Array} words list of words
 * @param {Array} buckets list of numbers
 * @param {Number} value score to lookup
 */
export function lookupByBucket (words, buckets, value) {
  return words[buckets.findIndex((d) => value <= d)]
}

/**
 * Finds correct number of rows for grid based on biggest group
 * @param {Array} vegaLiteSpecs an array of vega lite specs
 * @returns a number of rows
 */
export function getRows (vegaLiteSpecs) {
  let maxRows = 0

  vegaLiteSpecs
    .filter((d) => d.meta.parse === 'grid')
    .forEach((spec) => {
      let { width: specWidth, height: specHeight } = spec.spec || spec
      const encoding = spec.spec ? spec.spec.encoding : spec.encoding
      const splitField = spec.meta.splitField
      const groupKeys = []

      if (spec.facet) {
        if (spec.facet.column) {
          groupKeys.push(spec.facet.column.field)
        }
        if (spec.facet.row) {
          groupKeys.push(spec.facet.row.field)
        }
      }

      let specValues = spec.data.values

      const gap = 2
      const distance = 4 + gap

      const secondarySplit = Object.keys(encoding).filter((d) => {
        const field = encoding[d].field
        return (
          field !== splitField &&
          IGNORE_FIELDS.indexOf(d) === -1 &&
          groupKeys.indexOf(field) === -1
        )
      })[0]

      // combine groups if secondarySplit
      if (splitField && secondarySplit) {
        const secondaryField = encoding[secondarySplit].field
        const keys = [...groupKeys, splitField]

        const grouped = d3.rollups(
          specValues,
          (arr) => {
            const obj = {}
            let sum = 0

            arr.forEach((x) => {
              sum += x.n
              obj[x[secondaryField]] = sum
            })

            const o = {
              [splitField]: arr[0][splitField],
              [secondaryField]: obj,
              n: sum
            }

            groupKeys.forEach((x) => {
              o[x] = arr[0][x]
            })

            return o
          },
          ...keys.map((key) => {
            return (d) => d[key]
          })
        )

        specValues = grouped.flatMap((d) => {
          if (keys.length === 1) {
            return d[1]
          } else {
            return d[1].flatMap((d) => d[1])
          }
        })

        specWidth = specWidth / grouped.length
      }

      const maxN = d3.max(specValues, (d) => d.n)

      let rows = Math.ceil(Math.sqrt(maxN))
      const maxCols = Math.ceil(maxN / rows)

      // if horizontal gap is less than 5,
      // then take up all vertical space to increase rows and reduce columns
      if (specWidth / maxCols < 5) {
        rows = Math.floor(specHeight / distance)
      }

      if (rows > maxRows) {
        maxRows = rows
      }
    })

  return maxRows
}
