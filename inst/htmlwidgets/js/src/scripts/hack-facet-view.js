/* eslint-disable no-undef */
/* eslint-disable camelcase */
/**
 * Hack faceted view since gemini.js does not support multi view animations
 * Finding coordinates of each circle and treat them as real values in the one axis view
 * Adding axis layer underneath to look exactly same as faceted view
 */

import { CONF, META_PARSE_VALUES } from './config.js'

/**
 * Get empty spec, if no data is present
 * @param {Object} spec
 * @returns vega-lite spec
 */
export function getEmptySpec (spec) {
  const description = spec.meta.description
  const splitField = spec.meta.splitField

  return {
    $scheme: CONF.SCHEME,
    width: 300,
    height: 300,
    meta: {
      description,
      axes: false
    },
    data: {
      values: [
        {
          [CONF.X_FIELD]: 0,
          [CONF.Y_FIELD]: 0
        }
      ]
    },
    mark: {
      type: 'point',
      filled: true,
      strokeWidth: 1,
      color: 'transparent'
    },
    encoding: {
      x: {
        field: CONF.X_FIELD,
        type: 'quantitative',
        scale: {
          domain: [-5, 5]
        },
        axis: {
          grid: false,
          ticks: false,
          title: splitField,
          domain: false,
          values: []
        }
      },
      y: {
        field: CONF.Y_FIELD,
        type: 'quantitative',
        scale: {
          domain: [-5, 5]
        },
        axis: {
          grid: false,
          ticks: false,
          title: null,
          domain: false,
          values: []
        }
      }
    }
  }
}

/**
 * Creates and returns a template for vega spec
 * @param {Number} width spec width
 * @param {Number} height spec height
 * @param {Object} axes which axes to add
 * @param {Object} spec original spec
 * @returns vega-lite spec
 */
export function getSpecTemplate (width, height, axes = { x: true, y: true }, spec) {
  const encoding = spec.spec.encoding
  const mark = spec.spec.mark
  const facet = spec.facet

  if (encoding.x) {
    const title = facet && facet.column ? facet.column.title : null

    encoding.x = {
      field: CONF.X_FIELD,
      type: 'quantitative',
      scale: {},
      axis: axes.x
        ? {
            labelExpr: '',
            values: [],
            title,
            grid: false,
            orient: 'top',
            ticks: false,
            domain: false,
            labelPadding: 10
          }
        : null
    }
  }

  if (encoding.y) {
    const title = facet && facet.row ? facet.row.title : null

    encoding.y = {
      field: spec.spec.mark === 'errorbar' ? encoding.y.field : CONF.Y_FIELD,
      type: 'quantitative',
      scale: {},
      axis: axes.y
        ? {
            labelExpr: '',
            values: [],
            title,
            grid: false,
            labelAngle: 90,
            domain: false,
            ticks: false,
            labelPadding: 10,
            orient: 'right'
          }
        : null
    }
  }

  const additionals = {}

  if (spec.transform) {
    additionals.transform = spec.transform
  }

  return {
    $schema: CONF.SCHEME,
    data: {
      values: []
    },
    width,
    height,
    mark,
    encoding,
    ...additionals
  }
}

/**
 * Get hacked spec
 * Finding coordinates of each circle and treat them as real values in the one axis view
 * Adding axis layer underneath to look exactly same as faceted view
 * @param {Object} param0 parameters
 * @param {Object} param0.view a vega view instance
 * @param {Object} param0.spec a vega spec
 * @param {Object} param0.width spec width
 * @param {Object} param0.height spec height
 * @returns vega-lite spec
 */
export function getHackedSpec ({ view, spec, width = 600, height = 600 }) {
  const rowId = spec.facet.row ? spec.facet.row.field : null
  const colId = spec.facet.column ? spec.facet.column.field : null

  const newSpec = getSpecTemplate(
    width,
    height,
    {
      x: colId,
      y: rowId
    },
    spec
  )

  const yDomain = [height, 0]
  const xDomain = [0, width]

  const values = []

  const colMap = new Map()
  const rowMap = new Map()

  const scaleX = view.scale('x')
  const scaleY = view.scale('y')
  const source = view.data('source')

  let row_header, column_header

  // y axis
  if (rowId && (row_header = view.data('row_header'))) {
    const yAxisValues = []
    const yAxisExpr = {}

    row_header.forEach((d, i) => {
      const bounds = d.bounds
      const name = d.datum[rowId]
      const y1 = bounds.y1
      const y2 = bounds.y2

      rowMap.set(name, y1)

      const yCoord = Math.round(y1 + (y2 - y1) / 2)

      yAxisValues.push(yCoord)
      yAxisExpr[yCoord] = name
    })

    yDomain[1] = d3.min(row_header, (d) => d.bounds.y1)
    yDomain[0] = d3.max(row_header, (d) => d.bounds.y2)

    newSpec.encoding.y.axis.values = yAxisValues
    newSpec.encoding.y.axis.labelExpr = `${JSON.stringify(
      yAxisExpr
    )}[datum.label]`
  }

  // x axis
  if (colId && (column_header = view.data('column_header'))) {
    const xAxisValues = []
    const xAxisExpr = {}

    column_header.forEach((d, i) => {
      const bounds = d.bounds

      const name = d.datum[colId]
      colMap.set(name, bounds.x1)

      const xCoord = Math.round(bounds.x1 + (bounds.x2 - bounds.x1) / 2)

      xAxisValues.push(xCoord)
      xAxisExpr[xCoord] = name
    })

    xDomain[0] = d3.min(column_header, (d) => d.bounds.x1)
    xDomain[1] = d3.max(column_header, (d) => d.bounds.x2)

    newSpec.encoding.x.axis.values = xAxisValues
    newSpec.encoding.x.axis.labelExpr = `${JSON.stringify(
      xAxisExpr
    )}[datum.label]`
  }

  // generating data.values
  source.forEach((d) => {
    const col = d[colId]
    const row = d[rowId]

    const xStart = colMap.get(col) || 0
    const yStart = rowMap.get(row) || 0

    const xField = spec.meta.parse === META_PARSE_VALUES.jitter ? 'x' : CONF.X_FIELD
    const yField = spec.meta.parse === META_PARSE_VALUES.jitter ? 'y' : CONF.Y_FIELD

    const xCoord = xStart + scaleX(d[xField])

    values.push({
      ...d,
      [CONF.X_FIELD]: xCoord,
      [CONF.Y_FIELD]: yStart + scaleY(d[yField]),
      [CONF.X_FIELD + '_num']: d.scaledX ? xStart + scaleX(d.scaledX) : xCoord,
      scaleX: (val) => yStart + scaleX(val),
      scaleY: (val) => yStart + scaleY(val)
    })
  })

  newSpec.encoding.x.scale.domain = xDomain
  newSpec.encoding.y.scale.domain = yDomain
  newSpec.data.values = values
  newSpec.width = xDomain[1] - xDomain[0]
  newSpec.height = yDomain[0] - yDomain[1]

  return newSpec
}

/**
 * turns faceted spec to regular spec, using hacking technique
 * @param {Object} spec vega lite spec with facets
 * @returns vega-lite spec
 */
export function hackFacet (spec) {
  const div = document.createElement('div')

  spec.data.name = 'source'

  return vegaEmbed(div, spec, { renderer: 'svg' }).then((resp) => {
    const newSpec = getHackedSpec({
      ...resp,
      width: spec.spec.width,
      height: spec.spec.height
    })

    if (spec.config) {
      newSpec.config = spec.config
    }

    if (spec.meta) {
      newSpec.meta = spec.meta
    }

    let [transformX, transformY] = resp.view._origin

    if (!(spec.facet && spec.facet.row && !spec.facet.column)) {
      transformY = 0
    }

    if (newSpec.meta) {
      newSpec.meta.transformX = transformX
      newSpec.meta.transformY = transformY
    } else {
      newSpec.meta = { transformX, transformY }
    }

    return newSpec
  })
}
