/* eslint-disable no-undef */
/* eslint-disable camelcase */
/**
 * Custom animations generation script.
 * Supports:
 * - count
 * - median
 * - mean
 * - quantile
 * - min
 * - max
 * Inspiration from: https://giorgi-ghviniashvili.github.io/aggregate-animation-data/designs/
 */

import { CONF } from './config.js'
import { getGridSpec } from './layout.js'

/**
 * Generates a spec for count animation
 * @param {Object} source source spec
 * @param {Object} target target spec
 * @param {Object} shrink if truthy, circles will be pulled up
 * @returns a vega lite spec
 */
export const getCountStep = (source, target, shrink = false) => {
  const { width, height } = target.spec || target
  let values = source.data.values.slice()
  const sourceMeta = source.meta

  // generate rules layer
  const rules = sourceMeta.rules.map((d, i) => {
    const n = sourceMeta.rules.length
    return {
      transform: [{ filter: d.filter }],
      name: `rule-${i + 1}`,
      mark: {
        type: 'rule',
        x: { expr: `${i + 1} * (width / ${n + 1}) - 5` },
        x2: { expr: `${i + 1} * (width / ${n + 1}) + 5` }
      },
      encoding: {
        y: {
          field: CONF.Y_FIELD,
          type: 'quantitative',
          aggregate: 'count'
          // axis: null,
        }
      }
    }
  })

  if (shrink) {
    values = values.map((d, i) => {
      const y = target.data.values[i][CONF.Y_FIELD]
      return {
        ...d,
        [CONF.Y_FIELD]: y
      }
    })
  }

  return {
    $schema: CONF.SCHEME,
    width,
    height,
    data: {
      name: 'source',
      values
    },
    layer: [
      {
        name: 'main',
        mark: source.mark,
        encoding: source.encoding
      },
      ...rules
    ]
  }
}

/**
 * Generates a spec for median and quantile animations
 * @param {Object} source source spec
 * @param {Object} target target spec
 * @param {Number} step step counter. null is the last step
 * @param {Number} p a percentile
 * @returns a vega lite spec
 */
export const getMedianStep = (source, target, step = 0, p = 0.5) => {
  const all_groups = []
  const { width, height } = target.spec || target
  const isLast = step === null
  const hasFacet = source.meta.hasFacet
  const meta = source.meta
  const values = []

  const reduce = (data) => {
    const groupValue = data[0][CONF.X_FIELD]

    let sorted = data
      .slice()
      .sort((a, b) => {
        const sortFn = hasFacet ? 'descending' : 'ascending'
        return d3[sortFn](a[CONF.Y_FIELD], b[CONF.Y_FIELD])
      })
      .map((d, i) => {
        return {
          ...d,
          rank: i + 1
        }
      })

    // inspired by median animation https://uwdata.github.io/gemini2-editor/
    const y_median = d3.quantile(sorted, p, (d) => {
      return hasFacet ? d.oldY : d[CONF.Y_FIELD]
    })
    const y_median_pos = hasFacet ? data[0].scaleY(y_median) : y_median
    const median_rank = d3.quantile(sorted, 0.5, (d) => d.rank)
    const max_rank = d3.max(sorted, (d) => d.rank)
    const diff = isLast ? null : max_rank - median_rank - step
    const dx = hasFacet ? 5 : 0.1

    sorted = sorted.map((d) => {
      const rank_delta_abs = Math.abs(d.rank - median_rank)
      const y_delta = (hasFacet ? d.oldY : d[CONF.Y_FIELD]) - y_median
      const bisection =
        diff !== null && rank_delta_abs <= diff ? 0 : y_delta > 0 ? 1 : -1

      let newField = null

      if (bisection === -1) {
        newField = d[CONF.X_FIELD] - dx
      } else if (bisection === 1) {
        newField = d[CONF.X_FIELD] + dx
      } else {
        newField = d[CONF.X_FIELD]
      }

      return {
        ...d,
        bisection,
        [CONF.X_FIELD + '_pos']: newField,
        y_median,
        y_median_pos
      }
    })

    let filter = `datum['${CONF.X_FIELD}'] === ${groupValue} && datum.bisection === 0`
    let groupFilter = `datum['${CONF.X_FIELD}'] === ${groupValue}`

    let groupId = groupValue

    if (hasFacet) {
      filter += ' && '
      groupFilter += ' && '
      groupId += '_'

      if (meta.columnFacet) {
        filter += `datum['${meta.columnFacet.field}'] === '${
          data[0][meta.columnFacet.field]
        }'`
        groupFilter += `datum['${meta.columnFacet.field}'] === '${
          data[0][meta.columnFacet.field]
        }'`
        groupId += data[0][meta.columnFacet.field]
      }

      if (meta.columnFacet && meta.rowFacet) {
        filter += ' && '
        groupFilter += ' && '
        groupId += '_'
      }

      if (meta.rowFacet) {
        filter += `datum['${meta.rowFacet.field}'] === '${
          data[0][meta.rowFacet.field]
        }'`
        groupFilter += `datum['${meta.rowFacet.field}'] === '${
          data[0][meta.rowFacet.field]
        }'`
        groupId += data[0][meta.rowFacet.field]
      }
    }

    all_groups.push({
      filter,
      groupFilter,
      groupValue,
      groupKey: CONF.X_FIELD,
      median: y_median,
      groupId,
      median_pos: y_median_pos,
      rankDiff: Math.abs(max_rank - median_rank),
      rule_start: d3.min(sorted, (d) => d[CONF.X_FIELD + '_pos']) + 1,
      rule_end: d3.max(sorted, (d) => d[CONF.X_FIELD + '_pos']) - 1
    })

    values.push(...sorted)
  }

  const groupKeys = [CONF.X_FIELD]

  if (hasFacet) {
    if (meta.columnFacet) {
      groupKeys.push(meta.columnFacet.field)
    }

    if (meta.rowFacet) {
      groupKeys.push(meta.rowFacet.field)
    }
  }

  d3.rollup(
    source.data.values.slice(),
    reduce,
    ...groupKeys.map((key) => {
      return (d) => d[key]
    })
  )

  const rules = []

  let ruleField = isLast ? 'y_median' : CONF.Y_FIELD

  if (hasFacet) {
    ruleField = isLast ? 'y_median_pos' : CONF.Y_FIELD
  }

  all_groups.forEach((d, i) => {
    const n = all_groups.length

    const top_rule = {
      transform: isLast ? [{ filter: d.groupFilter }] : [{ filter: d.filter }],
      name: `top_rule_${d.groupId}`,
      mark: {
        type: 'rule',
        x: hasFacet
          ? d.rule_start
          : { expr: `${i + 1} * (width / ${n + 1}) - 5` },
        x2: hasFacet
          ? d.rule_end
          : { expr: `${i + 1} * (width / ${n + 1}) + 5` }
      },
      encoding: {
        y: {
          field: ruleField,
          type: 'quantitative',
          aggregate: 'max',
          axis: null
        }
      }
    }

    const bottom_rule = {
      transform: isLast ? [{ filter: d.groupFilter }] : [{ filter: d.filter }],
      name: `bottom_rule_${d.groupId}`,
      mark: {
        type: 'rule',
        x: hasFacet
          ? d.rule_start
          : { expr: `${i + 1} * (width / ${n + 1}) - 5` },
        x2: hasFacet
          ? d.rule_end
          : { expr: `${i + 1} * (width / ${n + 1}) + 5` }
      },
      encoding: {
        y: {
          field: ruleField,
          type: 'quantitative',
          aggregate: 'min',
          axis: null
        }
      }
    }

    rules.push(top_rule, bottom_rule)
  })

  return {
    $schema: CONF.SCHEME,
    width,
    height,
    meta: {
      all_groups
    },
    data: {
      name: 'source',
      values
    },
    layer: [
      {
        name: 'main',
        mark: source.mark,
        encoding: {
          ...source.encoding,
          x: {
            ...source.encoding.x,
            field: CONF.X_FIELD + '_pos'
          },
          color: source.encoding.color
        }
      },
      ...rules
    ],
    resolve: { axis: { y: 'independent' } }
  }
}

/**
 * Generates a spec for mean animation
 * @param {Object} source source spec
 * @param {Object} target target spec
 * @returns a vega lite spec
 */
export const getMeanStep = (source, target) => {
  const all_groups = []
  const { width, height } = target.spec || target
  const domain = source.encoding.y.scale.domain

  const hasFacet = source.meta.hasFacet
  const meta = source.meta

  const values = []

  const reduce = (data) => {
    const groupValue = data[0][CONF.X_FIELD]

    let sorted = data
      .slice()
      .sort((a, b) => {
        const sortFn = hasFacet ? 'descending' : 'ascending'
        return d3[sortFn](a[CONF.Y_FIELD], b[CONF.Y_FIELD])
      })
      .map((d, i) => {
        return {
          ...d,
          rank: i + 1
        }
      })

    const y_mean = d3.mean(sorted, (d) => {
      return hasFacet ? d.oldY : d[CONF.Y_FIELD]
    })
    const y_mean_pos = hasFacet ? data[0].scaleY(y_mean) : y_mean
    const mean_rank = d3.mean(sorted, (d) => d.rank)
    const max_rank = d3.max(sorted, (d) => d.rank)
    const dividor = max_rank * 1.4
    const multiplier = hasFacet ? 25 : 1

    sorted = sorted.map((d) => {
      const rankRatio_from_mean = (d.rank - mean_rank) / dividor

      const rankRatio_from_mean_start = (d.rank - 0.5 - mean_rank) / dividor
      const rankRatio_from_mean_end = (d.rank + 0.5 - mean_rank) / dividor

      return {
        ...d,
        [CONF.X_FIELD + '_pos']:
          d[CONF.X_FIELD] + rankRatio_from_mean * multiplier,
        [CONF.X_FIELD + '_pos_start']:
          d[CONF.X_FIELD] + rankRatio_from_mean_start * multiplier,
        [CONF.X_FIELD + '_pos_end']:
          d[CONF.X_FIELD] + rankRatio_from_mean_end * multiplier,
        y_mean,
        y_mean_pos
      }
    })

    let filter = `datum['${CONF.X_FIELD}'] === ${groupValue}`
    let groupId = groupValue

    if (hasFacet) {
      filter += ' && '
      groupId += '_'

      if (meta.columnFacet) {
        filter += `datum['${meta.columnFacet.field}'] === '${
          data[0][meta.columnFacet.field]
        }'`
        groupId += data[0][meta.columnFacet.field]
      }

      if (meta.columnFacet && meta.rowFacet) {
        filter += ' && '
        groupId += '_'
      }

      if (meta.rowFacet) {
        filter += `datum['${meta.rowFacet.field}'] === '${
          data[0][meta.rowFacet.field]
        }'`
        groupId += data[0][meta.rowFacet.field]
      }
    }

    all_groups.push({
      filter,
      groupValue,
      groupKey: CONF.X_FIELD,
      groupId,
      mean: y_mean,
      mean_pos: y_mean_pos,
      rule_start: d3.min(sorted, (d) => d[CONF.X_FIELD + '_pos_start']),
      rule_end: d3.max(sorted, (d) => d[CONF.X_FIELD + '_pos_end'])
    })

    values.push(...sorted)

    return sorted
  }

  const groupKeys = [CONF.X_FIELD]

  if (hasFacet) {
    if (meta.columnFacet) {
      groupKeys.push(meta.columnFacet.field)
    }

    if (meta.rowFacet) {
      groupKeys.push(meta.rowFacet.field)
    }
  }

  d3.rollups(
    source.data.values.slice(),
    reduce,
    ...groupKeys.map((key) => {
      return (d) => d[key]
    })
  )

  const rules = []

  all_groups.forEach((d, i) => {
    const n = all_groups.length

    const rule = {
      transform: [{ filter: d.filter }],
      name: `rule_${d.groupId}`,
      mark: {
        type: 'rule',
        x: hasFacet
          ? d.rule_start
          : {
              expr: `${i + 1} * (width / ${n + 1}) - (width / ${n + 1}) * 0.35`
            },
        x2: hasFacet
          ? d.rule_end
          : {
              expr: `${i + 1} * (width / ${n + 1}) + (width / ${n + 1}) * 0.35`
            }
      },
      encoding: {
        y: {
          field: hasFacet ? 'y_mean_pos' : CONF.Y_FIELD,
          type: 'quantitative',
          aggregate: 'mean',
          axis: null,
          scale: { domain }
        }
      }
    }

    rules.push(rule)
  })

  return {
    $schema: CONF.SCHEME,
    width,
    height,
    meta: {
      all_groups
    },
    data: {
      name: 'source',
      values
    },
    layer: [
      {
        name: 'main',
        mark: source.mark,
        encoding: {
          ...source.encoding,
          x: {
            ...source.encoding.x,
            field: CONF.X_FIELD + '_pos'
          }
        }
      },
      ...rules
    ],
    resolve: { axis: { y: 'independent' } }
  }
}

/**
 * Generates a spec for min and max animations
 * @param {Object} source source spec
 * @param {Object} target target spec
 * @param {String} minOrMax "min" or "max"
 * @returns a vega lite spec
 */
export const getMinMaxStep = (source, target, minOrMax = 'min') => {
  const { width, height } = target.spec || target
  const aggrFn = minOrMax === 'min' ? d3.min : d3.max
  const domain = source.encoding.y.scale.domain
  const groupKeys = [CONF.X_FIELD]
  const hasFacet = source.meta.hasFacet
  const meta = source.meta

  const values = []

  if (hasFacet) {
    if (meta.columnFacet) {
      groupKeys.push(meta.columnFacet.field)
    }

    if (meta.rowFacet) {
      groupKeys.push(meta.rowFacet.field)
    }
  }

  const all_groups = []

  d3.rollup(
    source.data.values.slice(),
    (data) => {
      const groupValue = data[0][CONF.X_FIELD]
      let filter = `datum['${CONF.X_FIELD}'] === ${groupValue}`
      let groupId = groupValue

      if (hasFacet) {
        filter += ' && '
        groupId += '_'

        if (meta.columnFacet) {
          filter += `datum['${meta.columnFacet.field}'] === '${
            data[0][meta.columnFacet.field]
          }'`
          groupId += data[0][meta.columnFacet.field]
        }

        if (meta.columnFacet && meta.rowFacet) {
          filter += ' && '
          groupId += '_'
        }

        if (meta.rowFacet) {
          filter += `datum['${meta.rowFacet.field}'] === '${
            data[0][meta.rowFacet.field]
          }'`
          groupId += data[0][meta.rowFacet.field]
        }
      }

      const aggr = aggrFn(data, (d) => {
        return hasFacet ? d.oldY : d[CONF.Y_FIELD]
      })
      const aggr_pos = hasFacet ? data[0].scaleY(aggr) : aggr

      all_groups.push({
        filter,
        groupValue,
        groupKey: CONF.X_FIELD,
        aggr,
        aggr_pos,
        groupId,
        rule_start: d3.min(data, (d) => d[CONF.X_FIELD] - 2),
        rule_end: d3.max(data, (d) => d[CONF.X_FIELD] + 2)
      })

      const g = data.find((d) => {
        const v = hasFacet ? d.oldY : d[CONF.Y_FIELD]
        return v === aggr
      })

      values.push(
        ...data.map((d) => {
          const isAggr = g && g.gemini_id === d.gemini_id

          return {
            ...d,
            isAggr,
            aggr_pos
          }
        })
      )
    },
    ...groupKeys.map((key) => {
      return (d) => d[key]
    })
  )

  const rules = all_groups.map((group, i) => {
    const n = all_groups.length
    return {
      transform: [{ filter: group.filter }],
      name: `rule_${group.groupId}`,
      mark: {
        type: 'rule',
        x: hasFacet
          ? group.rule_start
          : { expr: `${i + 1} * (width / ${n + 1}) - 5` },
        x2: hasFacet
          ? group.rule_end
          : { expr: `${i + 1} * (width / ${n + 1}) + 5` }
      },
      encoding: {
        y: {
          field: hasFacet ? 'aggr_pos' : CONF.Y_FIELD,
          type: 'quantitative',
          aggregate: minOrMax,
          axis: null,
          scale: { domain }
        }
      }
    }
  })

  return {
    $schema: CONF.SCHEME,
    width,
    height,
    meta: {
      all_groups
    },
    data: {
      name: 'source',
      values
    },
    layer: [
      {
        name: 'main',
        mark: source.mark,
        encoding: {
          ...source.encoding
        }
      },
      ...rules
    ],
    resolve: { axis: { y: 'independent' } }
  }
}

/**
 * Configuration for custom animations.
 * When meta.custom_animation is present,
 * it looks up a function here and generates custom animation specifications
 */
export const CustomAnimations = {
  /**
   * steps:
   * 1) stack sets
   * 2) put rules (lines) using aggregate count
   * 3) replace with count bubbles (aggregate count) (basically target spec)
   * @param {Object} rawSource source spec
   * @param {Object} target target spec
   * @returns an array of vega-lite specs
   */
  count: async (rawSource, target) => {
    const stacks = await getGridSpec(rawSource, 10, true)
    delete stacks.encoding.y.axis
    const rules = getCountStep(rawSource, target, false)
    const pullUp = getCountStep(rawSource, target, true)
    return [stacks, rules, pullUp, target]
  },
  /**
   * min animation steps:
   * 1) source spec
   * 2) stack sets, with a rule line at min circle
   * 3) pull circles down
   * 4) target spec
   * @param {Object} rawSource source spec
   * @param {Object} target target spec
   * @returns an array of vega-lite specs
   */
  min: (rawSource, target) => {
    const step_1 = getMinMaxStep(rawSource, target, 'min')

    const step_2 = {
      ...step_1,
      transform: [{ filter: 'datum.isAggr === true' }],
      layer: [
        {
          ...step_1.layer[0],
          encoding: {
            ...step_1.layer[0].encoding,
            y: {
              ...step_1.layer[0].encoding.y,
              aggregate: 'min'
            }
          }
        },
        ...step_1.layer.slice(1)
      ]
    }

    return [rawSource, step_1, step_2, target]
  },
  /**
   * max animation steps:
   * 1) source spec
   * 2) stack sets, with a rule line at max circle
   * 3) pull circles up
   * 4) target spec
   * @param {Object} rawSource source spec
   * @param {Object} target target spec
   * @returns an array of vega-lite specs
   */
  max: (rawSource, target, source) => {
    const step_1 = getMinMaxStep(rawSource, target, 'max')

    const step_2 = {
      ...step_1,
      transform: [{ filter: 'datum.isAggr === true' }],
      layer: [
        {
          ...step_1.layer[0],
          encoding: {
            ...step_1.layer[0].encoding,
            y: {
              ...step_1.layer[0].encoding.y,
              aggregate: 'max'
            }
          }
        },
        ...step_1.layer.slice(1)
      ]
    }

    return [rawSource, step_1, step_2, target]
  },
  /**
   * mean animation steps:
   * 1) source spec
   * 2) intermediate: circles will be placed diagonally "/"
   * 3) add lines (rules) at mean level
   * 4) convert circles to small ticks
   * 5) show vertical lines
   * 6) collapse the lines to mean level
   * 7) target spec
   * @param {Object} rawSource source spec
   * @param {Object} target target spec
   * @returns an array of vega-lite specs
   */
  mean: (rawSource, target) => {
    const step_1 = getMeanStep(rawSource, target)

    const barWidth = 2

    const step_2 = {
      ...step_1,
      layer: [
        {
          name: 'main',
          mark: { type: 'tick', orient: 'horizontal', width: barWidth },
          encoding: {
            y: {
              ...rawSource.encoding.y
            },
            x: {
              ...rawSource.encoding.x,
              field: CONF.X_FIELD + '_pos_start'
            },
            x2: {
              field: CONF.X_FIELD + '_pos_end'
            },
            color: rawSource.encoding.color
          }
        },
        ...step_1.layer.slice(1)
      ]
    }
    const step_3 = {
      ...step_2,
      layer: [
        {
          ...step_2.layer[0],
          mark: {
            type: 'bar',
            width: barWidth
          },
          encoding: {
            ...step_2.layer[0].encoding,
            y2: {
              field: 'y_mean_pos'
            }
          }
        },
        ...step_2.layer.slice(1)
      ]
    }
    const step_4 = {
      ...step_2,
      layer: [
        {
          ...step_2.layer[0],
          mark: {
            type: 'bar',
            width: barWidth
          },
          encoding: {
            ...step_2.layer[0].encoding,
            y: {
              ...step_2.layer[0].encoding.y,
              field: 'y_mean_pos'
            },
            y2: {
              field: 'y_mean_pos'
            }
          }
        },
        ...step_2.layer.slice(1)
      ]
    }

    const intermediate = {
      ...rawSource,
      data: {
        values: step_1.data.values
      },
      encoding: {
        ...rawSource.encoding,
        x: {
          ...rawSource.encoding.x,
          field: CONF.X_FIELD + '_pos'
        }
      }
    }

    return [rawSource, intermediate, step_1, step_2, step_3, step_4, target]
  },
  /**
   * median and quantile animation steps:
   * 1) source spec
   * 2) show rules at the top and bottom
   * 3) split circles by median and move to the right and left and move rules to median level
   * 4) target spec
   * @param {Object} rawSource source spec
   * @param {Object} target target spec
   * @returns an array of vega-lite specs
   */
  median: (rawSource, target, calculatedSource, p) => {
    const percent = (p === undefined || p === null) ? 0.5 : p
    const initial = getMedianStep(rawSource, target, 0, percent)
    const last_with_points = getMedianStep(rawSource, target, null, percent)

    return [
      rawSource,
      initial,
      last_with_points,
      target
    ]
  }
}
