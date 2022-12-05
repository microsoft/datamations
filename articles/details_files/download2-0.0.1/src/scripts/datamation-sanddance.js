import _ from 'lodash'

const X_FIELD_CHR = 'datamations_x'
const Y_FIELD_CHR = 'datamations_y'
const Y_RAW_FIELD_CHR = 'datamations_y_raw'

const long_months = [...Array(12).keys()].map(key => new Date(0, key).toLocaleString('en', { month: 'long' }).toLowerCase())
const short_months = [...Array(12).keys()].map(key => new Date(0, key).toLocaleString('en', { month: 'short' }).toLowerCase())

function month_index (m) {
  var index = short_months.indexOf(m)
  if (index < 0) {
    index = long_months.indexOf(m)
  }
  return index
}

function compare_ignore_case (a, b) {
  const index_a = month_index(a.toLowerCase())
  if (index_a > -1) {
    const index_b = month_index(b.toLowerCase())
    if (index_b > -1) {
      return index_a - index_b
    }
  }
  return a.toLowerCase().localeCompare(b.toLowerCase())
}

function standardDeviation (arr) {
  arr = arr.filter((item) => {
    return !isNaN(item)
  })
  const mean =
    arr.reduce((acc, curr) => {
      return acc + curr
    }, 0) / arr.length

  arr = arr.map((el) => {
    return (el - mean) ** 2
  })

  const total = arr.reduce((acc, curr) => acc + curr, 0)

  return Math.sqrt(total / (arr.length > 1 ? arr.length - 1 : arr.length))
}

function generate_vega_specs (
  data,
  meta,
  spec_encoding,
  facet_encoding = null,
  facet_dims = null,
  errorbar = false,
  height = 300,
  width = 300
) {
  const mark = {
    type: 'point',
    filled: true,
    strokeWidth: 1
  }

  if (!errorbar) {
    if (facet_encoding && Object.keys(facet_encoding).length > 0) {
      var spec = {
        $schema: 'https://vega.github.io/schema/vega-lite/v4.json',
        meta,
        data: {
          values: data
        },
        facet: facet_encoding,
        spec: {
          height: facet_dims ? height / facet_dims.nrow : 1,
          width: facet_dims ? width / facet_dims.ncol : 1,
          mark,
          encoding: spec_encoding
        }
      }
    } else {
      spec = {
        height,
        width,
        $schema: 'https://vega.github.io/schema/vega-lite/v4.json',
        meta,
        data: {
          values: data
        },
        mark,
        encoding: spec_encoding
      }
    }
  } else {
    const errorbar_spec_encoding = JSON.parse(JSON.stringify(spec_encoding))
    errorbar_spec_encoding.y.field = Y_RAW_FIELD_CHR

    if (facet_encoding && Object.keys(facet_encoding).length > 0) {
      spec = {
        $schema: 'https://vega.github.io/schema/vega-lite/v4.json',
        meta,
        data: {
          values: data
        },
        facet: facet_encoding,
        spec: {
          height: facet_dims ? height / facet_dims.nrow : 1,
          width: facet_dims ? width / facet_dims.ncol : 1,
          layer: [
            {
              mark: 'errorbar',
              encoding: errorbar_spec_encoding
            },
            {
              mark,
              encoding: spec_encoding
            }
          ]
        }
      }
    } else {
      spec = {
        height,
        width,
        $schema: 'https://vega.github.io/schema/vega-lite/v4.json',
        data: {
          values: data
        },
        meta,
        layer: [
          {
            mark: 'errorbar',
            encoding: errorbar_spec_encoding
          },
          {
            mark,
            encoding: spec_encoding
          }
        ]
      }
    }
  }
  return spec
}

function prep_specs_data (states) {
  const x_encoding = { field: X_FIELD_CHR, type: 'quantitative', axis: null }
  const y_encoding = { field: Y_FIELD_CHR, type: 'quantitative', axis: null }

  const spec_encoding = { x: x_encoding, y: y_encoding }

  const value = {
    n: states[0].length
  }
  value.gemini_ids = Array.from('x'.repeat(states[0].length), (_, i) => 1 + i)

  const data = [value]

  const meta = {
    parse: 'grid',
    description: 'Initial data'
  }

  const specs_list = []
  const spec = generate_vega_specs(data, meta, spec_encoding)

  specs_list.push(spec)
  return specs_list
}

function prep_specs_groupby (states, groupby, summarize) {
  const x_encoding = { field: X_FIELD_CHR, type: 'quantitative', axis: null }
  const y_encoding = { field: Y_FIELD_CHR, type: 'quantitative', axis: null }

  let operation = summarize.split(' ')[0].toLowerCase()
  switch (operation) {
    case 'average':
      operation = 'mean'
      break
  }

  let tooltip = [
    {
      field: groupby[0],
      type: 'nominal'
    }
  ]

  let spec_encoding = {
    x: x_encoding,
    y: y_encoding,
    tooltip
  }

  if (operation === 'mean') {
    spec_encoding.color = {
      field: null,
      type: 'nominal'
    }
  }

  let facet_encoding = {}

  if (groupby.length > 1) facet_encoding.column = { field: groupby[0], type: 'ordinal', title: groupby[0] }

  let facet_dims = {
    ncol: 1,
    nrow: 1
  }

  let data = []

  const group = groupby[0]
  const groups = []
  for (let i = 0; i < states[0].length; i++) {
    if (!groups.includes(states[0][i][group])) {
      groups.push(states[0][i][group])
    }
  }
  let gemini_id = 1
  for (var g of groups) {
    count = states[0].filter((item) => item[group] === g).length
    data.push({
      [group]: g,
      n: count,
      gemini_ids: Array.from('x'.repeat(count), (_, i) => gemini_id + i)
    })
    gemini_id += count
  }

  let meta = {
    parse: 'grid',
    description: 'Group by ' + groupby.join(', '),
    splitField: groupby[0],
    axes: false
  }

  const specs_list = []

  // The case of groupby multiple
  if (groupby.length > 1) {
    var cols = []
    var count = {}
    var start = {}
    for (var col of Object.keys(states[1].groups)) {
      for (var row of Object.keys(states[1].groups[col])) {
        if (!cols.includes(col)) cols.push(col)
        if (!Object.keys(count).includes(col)) count[col] = 0
        if (groupby.length > 2) {
          for (var l3group of Object.keys(states[1].groups[col][row])) {
            count[col] = count[col] + states[1].groups[col][row][l3group].length
          }
        }
        else {
          count[col] = count[col] + states[1].groups[col][row].length
        }
      }
    }

    var id = 1
    for (col of cols) {
      start[col] = id
      id = id + count[col]
    }

    facet_dims = {
      ncol: cols.length,
      nrow: 1
    }
    data = cols.map((col) => {
      return {
        [groupby[0]]: col,
        n: count[col],
        gemini_ids: Array.from('x'.repeat(count[col]), (_, i) => start[col] + i)
      }
    })
    meta = {
      parse: 'grid',
      description: 'Group by ' + groupby[0]
    }

    spec_encoding = {
      x: x_encoding,
      y: y_encoding,
      tooltip
    }

    var spec = generate_vega_specs(data, meta, spec_encoding, facet_encoding, facet_dims)
    specs_list.push(spec)

    id = 1
    data = []
    cols = []
    let rows = []
    count = {}
    start = {}
    for (col of Object.keys(states[1].groups).sort(compare_ignore_case)) {
      for (row of Object.keys(states[1].groups[col]).sort(compare_ignore_case)) {
        if (!cols.includes(col)) {
          cols.push(col)
        }
        if (!rows.includes(row)) rows.push(row)
        if (!Object.keys(count).includes(col)) count[col] = {}
        if (!Object.keys(count[col]).includes(row)) count[col][row] = 0
        if (!Object.keys(start).includes(col)) start[col] = {}
        if (!Object.keys(start[col]).includes(row)) start[col][row] = 0
        start[col][row] = id
        if (groupby.length > 2) {
          for (l3group of Object.keys(states[1].groups[col][row]).sort(compare_ignore_case)) {
            count[col][row] = count[col][row] + states[1].groups[col][row][l3group].length
          }
        }
        else {
          count[col][row] = count[col][row] + states[1].groups[col][row].length
        }
        id = id + count[col][row]
        data.push({
          [groupby[0]]: col,
          [groupby[1]]: row,
          n: count[col][row],
          gemini_ids: count[col][row] < 2 ? start[col][row] : Array.from('x'.repeat(count[col][row]), (_, i) => start[col][row] + i)
        })
      }
    }
    facet_dims = {
      ncol: groups.length,
      nrow: 1
    }

    meta = {
      parse: 'grid',
      description: 'Group by ' + groupby.slice(0, 2).join(', '),
      splitField: groupby[1],
      axes: true
    }

    tooltip = []
    for (var field of groupby.slice(0, 2)) {
      tooltip.push({
        field,
        type: 'nominal'
      })
    }

    spec_encoding = {
      x: x_encoding,
      y: y_encoding,
      color: {
        field: groupby[1],
        type: 'nominal',
        legend: {
          values: rows
        }
      },
      tooltip
    }

    if (groupby.length > 2) {
      meta = {
        parse: 'grid',
        description: 'Group by ' + groupby[0] + ', ' + groupby[1]
      }

      facet_dims = {
        ncol: groups.length,
        nrow: groups.length
      }

      facet_encoding = {}
      facet_encoding.column = { field: groupby[0], type: 'ordinal', title: groupby[0] }
      facet_encoding.row = { field: groupby[1], type: 'ordinal', title: groupby[1] }

      spec_encoding = {
        x: x_encoding,
        y: y_encoding,
        tooltip
      }
    }

    spec = generate_vega_specs(data, meta, spec_encoding, facet_encoding, facet_dims)
    specs_list.push(spec)

    if (groupby.length > 2) {
      meta = {
        axes: true,
        parse: 'grid',
        description: 'Group by ' + groupby.slice(0, 3).join(', '),
        splitField: groupby[2]
      }

      facet_encoding = {}
      facet_encoding.column = { field: groupby[0], type: 'ordinal', title: groupby[0] }
      facet_encoding.row = { field: groupby[1], type: 'ordinal', title: groupby[1] }

      id = 1
      rows = []
      data = []
      count = {}
      start = {}

      for (col of Object.keys(states[1].groups).sort(compare_ignore_case)) {
        for (row of Object.keys(states[1].groups[col]).sort(compare_ignore_case)) {
          for (l3group of Object.keys(states[1].groups[col][row]).sort(compare_ignore_case)) {
            if (!cols.includes(col)) {
              cols.push(col)
            }
            if (!rows.includes(l3group)) rows.push(l3group)
            if (!Object.keys(count).includes(col)) count[col] = {}
            if (!Object.keys(start).includes(col)) start[col] = {}
            if (!Object.keys(count[col]).includes(row)) count[col][row] = {}
            if (!Object.keys(start[col]).includes(row)) start[col][row] = {}
            if (!Object.keys(count[col][row]).includes(l3group)) count[col][row][l3group] = 0
            if (!Object.keys(start[col][row]).includes(l3group)) start[col][row][l3group] = 0
            count[col][row][l3group] = count[col][row][l3group] + states[1].groups[col][row][l3group].length
            if (!start[col][row][l3group]) start[col][row][l3group] = id
            data.push({
              [groupby[0]]: col,
              [groupby[1]]: row,
              [groupby[2]]: l3group,
              n: count[col][row][l3group],
              gemini_ids: count[col][row][l3group] < 2 ? start[col][row][l3group] : Array.from('x'.repeat(count[col][row][l3group]), (_, i) => start[col][row][l3group] + i)
            })
            id = id + count[col][row][l3group]
          }
        }
      }

      tooltip = []
      for (field of groupby.slice(0, 3)) {
        tooltip.push({
          field,
          type: 'nominal'
        })
      }

      spec_encoding = {
        x: x_encoding,
        y: y_encoding,
        color: {
          field: groupby[2],
          type: 'nominal',
          legend: {
            values: rows
          }
        },
        tooltip
      }

      spec = generate_vega_specs(data, meta, spec_encoding, facet_encoding, facet_dims)
      specs_list.push(spec)
    }
  } else {
    cols = []
    count = {}
    start = {}
    for (var key of Object.keys(states[1].groups)) {
      col = key
      if (cols.includes(col)) cols.push(col)
      if (Object.keys(count).includes(col)) count[col] = 0
      count[col] = count[col] + states[1].groups[key].length
    }

    id = 1
    for (col in cols) {
      start[col] = id
      id = id + count[col]
    }

    spec = generate_vega_specs(data, meta, spec_encoding, facet_encoding, facet_dims)
    specs_list.push(spec)

    if ((operation === 'count') && groupby.length === 1) {
      specs_list.push(spec)
    }
  }
  return specs_list
}

function prep_specs_summarize (states, groupby, summarize, output) {
  const x_axis = groupby.length === 1 ? groupby[0] : groupby[0]
  const y_axis = summarize.split(' ').slice(2).join(' ')

  let operation = summarize.split(' ')[0].toLowerCase()
  switch (operation) {
    case 'average':
      operation = 'mean'
      break
  }

  if (groupby.length === 1) {
    var groups = Object.keys(states[1].groups).map((x) => { return isNaN(x) ? x : Number(x) })
  } else {
    groups = Object.keys(states[1].groups)
    groups = _.uniq(groups.sort(compare_ignore_case))
    var subgroups = Object.keys(output[Object.keys(output)[0]])
    if (groupby.length === 3) {
      var l3groups = []
      for (var group of groups) {
        for (var subgroup of subgroups) {
          if (output[group][subgroup]) l3groups = l3groups.concat(Object.keys(output[group][subgroup]))
        }
      }
      l3groups = _.uniq(l3groups).sort(compare_ignore_case)
    }
  }

  const specs_list = []

  const labels = groupby.length > 2 ? [...l3groups] : groupby.length > 1 ? [...subgroups] : [...groups]
  const labelExpr = labels.reverse().reduce((prev, curr, index) => { return 'round(datum.label) == ' + (labels.length - index) + ' ? \'' + curr + '\' : ' + (prev === labels[0] ? '\'' + prev + '\'' : prev) })

  const x_encoding = {
    field: 'datamations_x',
    type: 'quantitative',
    axis: {
      values: Array.from('x'.repeat(labels.length), (_, i) => 1 + i),
      labelExpr,
      labelAngle: -90
    },
    title: groupby.length > 1 ? groupby[groupby.length - 1] : x_axis,
    scale: {
      domain: [0, groupby.length > 2 ? labels.length : 1 + labels.length]
    }
  }

  let min = states[0]
    .map((item) => {
      return item[y_axis]
    })
    .filter((item) => {
      return item !== 'NA'
    })
    .reduce((prev, current) => {
      return Math.min(prev, current)
    })

  let max = states[0]
    .map((item) => {
      return item[y_axis]
    })
    .filter((item) => {
      return item !== 'NA'
    })
    .reduce((prev, current) => {
      return Math.max(prev, current)
    })

  let y_encoding = {
    field: 'datamations_y',
    type: 'quantitative',
    title: y_axis,
    scale: {
      domain: [_.round(min, 13), _.round(max, 13)]
    }
  }

  if (groupby.length > 1) {
    var color = {
      field: groupby[groupby.length - 1],
      type: 'nominal',
      legend: {
        values: groupby.length > 2 ? l3groups : subgroups
      }
    }
  }

  let tooltip = [
    {
      field: 'datamations_y_tooltip',
      type: 'quantitative',
      title: y_axis
    }
  ]

  for (var field of groupby) {
    tooltip.push({
      field,
      type: 'nominal'
    })
  }

  const facet_encoding = {}

  if (groupby.length > 1) {
    var sort = groups
    if (operation === 'mean') {
      facet_encoding.column = { field: groupby[0], sort, type: 'ordinal', title: groupby[0] }
    } else {
      facet_encoding.column = { field: groupby[0], type: 'ordinal', title: groupby[0] }
    }
  }
  if (groupby.length > 2) {
    sort = subgroups
    if (operation === 'mean') {
      facet_encoding.row = { field: groupby[1], sort, type: 'ordinal', title: groupby[1] }
    } else {
      facet_encoding.row = { field: groupby[1], type: 'ordinal', title: groupby[1] }
    }
  }

  let facet_dims = {
    ncol: 1,
    nrow: 1
  }

  if (groupby.length > 1) {
    const cols = []
    const count = {}
    for (const key of Object.keys(states[1].groups)) {
      var col = key
      if (!cols.includes(col)) cols.push(col)
      if (!Object.keys(count).includes(col)) count[col] = 0
    }

    facet_dims = {
      ncol: cols.length,
      nrow: 1
    }
  }

  let data = []

  // Prepare the data by assigning different x-axis values to the groups
  // and showing the original values on the y-axis for each point.
  if (groupby.length > 2) {
    var i = 1
    data = []
    for (group of Object.keys(states[1].groups).sort(compare_ignore_case)) {
      for (subgroup of Object.keys(states[1].groups[group]).sort(compare_ignore_case)) {
        for (l3group of Object.keys(states[1].groups[group][subgroup]).sort(compare_ignore_case)) {
          for (var item of states[1].groups[group][subgroup][l3group]) {
            var value = {
              gemini_id: i,
              [groupby[0]]: item[groupby[0]],
              [groupby[1]]: item[groupby[1]],
              datamations_x:
            groupby.length > 2 ? 1 + l3groups.indexOf(item[groupby[2]]) : 1 + subgroups.indexOf(item[groupby[1]])
            }
            if (!isNaN(item[y_axis])) {
              value.datamations_y = _.round(item[y_axis], 13)
              value.datamations_y_tooltip = _.round(item[y_axis], 13)
            }
            if (groupby.length > 2) {
              value[groupby[2]] = item[groupby[2]]
            }
            data.push(value)
            i = i + 1
          }
        }
      }
    }

    facet_dims = {
      ncol: groups.length,
      nrow: subgroups.length
    }
  }
  else if (groupby.length > 1) {
    i = 1
    data = []
    for (group of Object.keys(states[1].groups).sort(compare_ignore_case)) {
      for (subgroup of Object.keys(states[1].groups[group]).sort(compare_ignore_case)) {
        for (item of states[1].groups[group][subgroup]) {
          value = {
            gemini_id: i,
            [groupby[0]]: item[groupby[0]],
            [groupby[1]]: item[groupby[1]],
            datamations_x:
            groupby.length > 2 ? 1 + l3groups.indexOf(item[groupby[2]]) : 1 + subgroups.indexOf(item[groupby[1]])
          }
          if (!isNaN(item[y_axis])) {
            value.datamations_y = _.round(item[y_axis], 13)
            value.datamations_y_tooltip = _.round(item[y_axis], 13)
          }
          if (groupby.length > 2) {
            value[groupby[2]] = item[groupby[2]]
          }
          data.push(value)
          i = i + 1
        }
      }
    }

    facet_dims = {
      ncol: groups.length,
      nrow: 1
    }
  } else {
    var id = 1
    for (item of _.sortBy(states[0], x_axis)) {
      value = {
        gemini_id: id,
        [x_axis]: item[x_axis],
        datamations_x: 1 + groups.indexOf(item[x_axis]),
        datamations_y: _.round(item[y_axis], 13),
        datamations_y_tooltip: _.round(item[y_axis], 13)
      }
      data.push(value)
      id = id + 1
    }
  }

  // Jitter plot
  let meta = {
    parse: 'jitter',
    axes: groupby.length > 1,
    description: 'Plot ' + y_axis + ' within each group',
    splitField: groupby[groupby.length - 1]
  }
  if (groupby.length === 1) {
    meta.xAxisLabels = groups
  }

  // Spec encoding for Vega along with the data and metadata.
  // Generate vega specs for the summarizing steps of the animaiton
  let spec_encoding = { x: x_encoding, y: y_encoding, tooltip }
  if (groupby.length > 1) {
    spec_encoding = { x: x_encoding, y: y_encoding, color, tooltip }
  }
  let spec = generate_vega_specs(data, meta, spec_encoding, facet_encoding, facet_dims)
  if (!((operation === 'count') && groupby.length === 1)) {
    specs_list.push(spec)
  }

  min = states[0]
    .map((item) => {
      return item[y_axis]
    })
    .filter((item) => {
      return !isNaN(item)
    })
    .reduce((prev, current) => {
      return Math.min(prev, current)
    })

  max = states[0]
    .map((item) => {
      return isNaN(item[y_axis]) ? 0 : item[y_axis]
    })
    .filter((item) => {
      return !isNaN(item)
    })
    .reduce((prev, current) => {
      return Math.max(prev, current)
    })

  meta = {
    axes: groupby.length > 1,
    description: 'Plot ' + operation + ((operation === 'count' || operation === 'sum') && groupby.length === 1 ? '' : ' ' + y_axis) + ' of each group'
  }

  y_encoding = {
    field: 'datamations_y',
    type: 'quantitative',
    title: ['median', 'sum', 'product'].includes(operation) ? [operation + ' of', y_axis] : (['min', 'max'].includes(operation) && groupby.length > 1) ? [operation + ' of', y_axis] : operation + '(' + y_axis + ')',
    scale: {
      domain: [_.round(min, 13), _.round(max, 13)]
    }
  }

  tooltip = [
    {
      field: 'datamations_y_tooltip',
      type: 'quantitative',
      title: operation + '(' + y_axis + ')'
    }
  ]

  for (field of groupby) {
    tooltip.push({
      field,
      type: 'nominal'
    })
  }

  data = []

  // Plot the final summarized value
  // The y-axis value is the same for all
  if (groupby.length > 2) {
    i = 1
    data = []
    for (group of Object.keys(states[1].groups).sort(compare_ignore_case)) {
      if (groupby.length > 2) {
        col = group[0]
      } else {
        col = group
      }
      for (subgroup of Object.keys(states[1].groups[group]).sort(compare_ignore_case)) {
        for (var l3group of Object.keys(states[1].groups[group][subgroup]).sort(compare_ignore_case)) {
          for (item of states[1].groups[group][subgroup][l3group]) {
            value = {
              gemini_id: i,
              [x_axis]: item[x_axis],
              [groupby[1]]: item[groupby[1]],
              [groupby[2]]: item[groupby[2]],
              datamations_x:
            groupby.length > 2 ? 1 + l3groups.indexOf(item[groupby[2]]) : 1 + subgroups.indexOf(item[groupby[1]]),
              datamations_y:
            groupby.length > 2
              ? output[item[groupby[0]]][item[groupby[1]]][item[groupby[2]]]
              : output[item[groupby[0]]][item[groupby[1]]],
              datamations_y_tooltip:
              groupby.length > 2
                ? output[item[groupby[0]]][item[groupby[1]]][item[groupby[2]]]
                : output[item[groupby[0]]][item[groupby[1]]]
            }
            data.push(value)
            i = i + 1
          }
        }
      }
    }

    facet_dims = {
      ncol: groups.length,
      nrow: groupby.length > 2 ? groups.length : 1
    }
  } else if (groupby.length > 1) {
    i = 1
    data = []
    for (group of Object.keys(states[1].groups).sort(compare_ignore_case)) {
      for (subgroup of Object.keys(states[1].groups[group]).sort(compare_ignore_case)) {
        for (item of states[1].groups[group][subgroup]) {
          value = {
            gemini_id: i,
            [x_axis]: item[x_axis],
            [groupby[0]]: item[groupby[0]],
            [groupby[1]]: item[groupby[1]],
            datamations_x:
            groupby.length > 2 ? 1 + l3groups.indexOf(item[groupby[2]]) : 1 + subgroups.indexOf(item[groupby[1]]),
            datamations_y:
            groupby.length > 2
              ? output[item[groupby[0]]][item[groupby[1]]][item[groupby[2]]]
              : output[item[groupby[0]]][item[groupby[1]]],
            datamations_y_tooltip:
            groupby.length > 2
              ? output[item[groupby[0]]][item[groupby[1]]][item[groupby[2]]]
              : output[item[groupby[0]]][item[groupby[1]]]
          }
          data.push(value)
          i = i + 1
        }
      }
    }

    facet_dims = {
      ncol: groups.length,
      nrow: groupby.length > 2 ? groups.length : 1
    }
  } else {
    id = 1
    for (item of _.sortBy(states[0], x_axis)) {
      value = {
        gemini_id: id,
        [x_axis]: item[x_axis],
        datamations_x: 1 + groups.indexOf(item[x_axis]),
        datamations_y: output[item[x_axis]],
        datamations_y_tooltip: output[item[x_axis]]
      }
      data.push(value)
      id = id + 1
    }
  }

  if (['mean', 'median', 'min', 'max'].includes(operation)) {
    meta.custom_animation = operation
  }
  else if (operation === 'count' || operation === 'sum') {
    if (groupby.length === 1) {
      min = data.map((item) => { return item.datamations_y }).reduce((prev, current) => {
        return Math.min(prev, current)
      })
      max = data.map((item) => { return item.datamations_y }).reduce((prev, current) => {
        return Math.max(prev, current)
      })
      meta.custom_animation = operation
      y_encoding.scale.domain = [_.round(min, 13), _.round(max, 13)]
      delete tooltip[0].title
      delete y_encoding.title
    }
    else {
      y_encoding.title = [operation + ' of', y_axis]
    }
  }

  spec_encoding = { x: x_encoding, y: y_encoding, tooltip }
  if (groupby.length > 1) spec_encoding = { x: x_encoding, y: y_encoding, color, tooltip }
  spec = generate_vega_specs(data, meta, spec_encoding, facet_encoding, facet_dims)
  specs_list.push(spec)

  tooltip = [
    {
      field: 'datamations_y_tooltip',
      type: 'quantitative',
      title: operation + '(' + y_axis + ')'
    }
  ]

  if (operation === 'mean') {
    tooltip.push({
      field: 'Upper',
      type: 'nominal',
      title: operation + '(' + y_axis + ') + standard error'
    })
    tooltip.push({
      field: 'Lower',
      type: 'nominal',
      title: operation + '(' + y_axis + ') - standard error'
    })
  }

  for (field of groupby) {
    tooltip.push({
      field,
      type: 'nominal'
    })
  }

  data = []

  const _error = {}
  for (group in states[1].groups) {
    if (!_error[group]) _error[group] = {}
    if (groupby.length > 1) {
      for (subgroup in states[1].groups[group]) {
        if (!_error[group][subgroup]) _error[group][subgroup] = {}
        if (groupby.length > 2) {
          for (l3group in states[1].groups[group][subgroup]) {
            _error[group][subgroup][l3group] =
              standardDeviation(states[1].groups[group][subgroup][l3group].map((x) => parseFloat(x[y_axis]))) /
              Math.sqrt(Object.keys(states[1].groups[group][subgroup][l3group]).length)
          }
        }
        else {
          _error[group][subgroup] =
            standardDeviation(states[1].groups[group][subgroup].map((x) => parseFloat(x[y_axis]))) /
            Math.sqrt(Object.keys(states[1].groups[group][subgroup]).length)
        }
      }
    }
    else {
      _error[group] =
        standardDeviation(states[1].groups[group].map((x) => parseFloat(x[y_axis]))) /
        Math.sqrt(Object.keys(states[1].groups[group]).length)
    }
  }

  // Show errror bars along with sumarized values
  if (groupby.length > 2) {
    i = 1
    data = []
    for (group of Object.keys(states[1].groups).sort(compare_ignore_case)) {
      if (groupby.length > 2) {
        col = group[0]
      } else {
        col = group
      }
      for (subgroup of Object.keys(states[1].groups[group]).sort(compare_ignore_case)) {
        for (l3group of Object.keys(states[1].groups[group][subgroup]).sort(compare_ignore_case)) {
          for (item of states[1].groups[group][subgroup][l3group]) {
            value = {
              gemini_id: i,
              [x_axis]: item[x_axis],
              [groupby[1]]: item[groupby[1]],
              datamations_x:
              groupby.length > 2 ? 1 + l3groups.indexOf(item[groupby[2]]) : 1 + subgroups.indexOf(item[groupby[1]]),
              datamations_y:
              groupby.length > 2
                ? output[item[groupby[0]]][item[groupby[1]]][item[groupby[2]]]
                : output[item[groupby[0]]][item[groupby[1]]],
              datamations_y_tooltip:
              groupby.length > 2
                ? output[item[groupby[0]]][item[groupby[1]]][item[groupby[2]]]
                : output[item[groupby[0]]][item[groupby[1]]]
            }
            if (operation === 'mean') {
              value.Lower = groupby.length > 2
                ? output[item[groupby[0]]][item[groupby[1]]][item[groupby[2]]] -
              _error[item[groupby[0]]][item[groupby[1]]][item[groupby[2]]]
                : output[item[groupby[0]]][item[groupby[1]]] - _error[item[groupby[0]]][item[groupby[1]]]
              value.Upper = groupby.length > 2
                ? output[item[groupby[0]]][item[groupby[1]]][item[groupby[2]]] +
              _error[item[groupby[0]]][item[groupby[1]]][item[groupby[2]]]
                : output[item[groupby[0]]][item[groupby[1]]] + _error[item[groupby[0]]][item[groupby[1]]]
            }
            if (operation === 'mean' && !isNaN(item[y_axis])) {
              value.datamations_y_raw = _.round(item[y_axis], 13)
            }
            data.push(value)
            i = i + 1
          }
        }
      }
    }

    facet_dims = {
      ncol: groups.length,
      nrow: groupby.length > 2 ? groups.length : 1
    }
  }
  else if (groupby.length > 1) {
    i = 1
    data = []
    for (group of Object.keys(states[1].groups).sort(compare_ignore_case)) {
      for (subgroup of Object.keys(states[1].groups[group]).sort(compare_ignore_case)) {
        for (item of states[1].groups[group][subgroup]) {
          value = {
            gemini_id: i,
            [x_axis]: item[x_axis],
            [groupby[1]]: item[groupby[1]],
            datamations_x:
            groupby.length > 2 ? 1 + l3groups.indexOf(item[groupby[2]]) : 1 + subgroups.indexOf(item[groupby[1]]),
            datamations_y:
            groupby.length > 2
              ? output[item[groupby[0]]][item[groupby[1]]][item[groupby[2]]]
              : output[item[groupby[0]]][item[groupby[1]]],
            datamations_y_tooltip:
            groupby.length > 2
              ? output[item[groupby[0]]][item[groupby[1]]][item[groupby[2]]]
              : output[item[groupby[0]]][item[groupby[1]]]
          }
          if (operation === 'mean') {
            value.Lower = groupby.length > 2
              ? output[item[groupby[0]]][item[groupby[1]]][item[groupby[2]]] -
            _error[item[groupby[0]][item[groupby[1]]][item[groupby[2]]]]
              : output[item[groupby[0]]][item[groupby[1]]] - _error[item[groupby[0]]][item[groupby[1]]]
            value.Upper = groupby.length > 2
              ? output[item[groupby[0]]][item[groupby[1]]][item[groupby[2]]] +
            _error[item[groupby[0]]][item[groupby[1]]][item[groupby[2]]]
              : output[item[groupby[0]]][item[groupby[1]]] + _error[item[groupby[0]]][item[groupby[1]]]
          }
          if (operation === 'mean' && !isNaN(item[y_axis])) {
            value.datamations_y_raw = _.round(item[y_axis], 13)
          }
          data.push(value)
          i = i + 1
        }
      }
    }

    facet_dims = {
      ncol: groups.length,
      nrow: groupby.length > 2 ? groups.length : 1
    }
  } else {
    id = 1
    for (item of _.sortBy(states[0], x_axis)) {
      value = {
        gemini_id: id,
        [x_axis]: item[x_axis],
        datamations_x: 1 + groups.indexOf(item[x_axis]),
        datamations_y: output[item[x_axis]],
        datamations_y_tooltip: output[item[x_axis]]
      }
      if (operation === 'mean' || operation === 'median') {
        value.datamations_y_raw = _.round(item[y_axis], 13)
      }
      if (operation === 'mean') {
        value.Lower = output[item[x_axis]] - _error[item[x_axis]]
        value.Upper = output[item[x_axis]] + _error[item[x_axis]]
      }
      data.push(value)
      id = id + 1
    }
  }

  meta = {
    axes: groupby.length > 1,
    description: 'Plot ' + operation + ' ' + y_axis + ' of each group, with errorbar'
  }

  if (operation === 'mean') {
    spec_encoding = { x: x_encoding, y: y_encoding, tooltip }
    if (groupby.length > 1) spec_encoding = { x: x_encoding, y: y_encoding, color, tooltip }
    spec = generate_vega_specs(data, meta, spec_encoding, facet_encoding, facet_dims, true)
    specs_list.push(spec)
  }

  // Show the summarized values along with error bars, zoomed in
  let min_array = []
  let max_array = []
  if (groupby.length > 2) {
    for (group of groups) {
      for (subgroup of subgroups) {
        for (const l3group of l3groups) {
          if (output[group][subgroup] && !isNaN(output[group][subgroup][l3group])) {
            if (operation === 'mean') {
              min_array.push(output[group][subgroup][l3group] - _error[group][subgroup][l3group])
            } else {
              min_array.push(output[group][subgroup][l3group])
            }
          }
          if (output[group][subgroup] && !isNaN(output[group][subgroup][l3group])) {
            if (operation === 'mean') {
              max_array.push(output[group][subgroup][l3group] + _error[group][subgroup][l3group])
            } else {
              max_array.push(output[group][subgroup][l3group])
            }
          }
        }
      }
    }
    min_array = min_array.filter((item) => {
      return !isNaN(item)
    })
    max_array = max_array.filter((item) => {
      return !isNaN(item)
    })
    var domain = [_.round(Math.min(...min_array), 13), _.round(Math.max(...max_array), 13)]
  } else if (groupby.length > 1) {
    for (group of groups) {
      for (subgroup of subgroups) {
        if (output[group][subgroup] && !isNaN(output[group][subgroup])) {
          if (operation === 'mean') {
            min_array.push(output[group][subgroup] - _error[group][subgroup])
          } else {
            min_array.push(output[group][subgroup])
          }
        }
        if (output[group][subgroup] && !isNaN(output[group][subgroup])) {
          if (operation === 'mean') {
            max_array.push(output[group][subgroup] + _error[group][subgroup])
          } else {
            max_array.push(output[group][subgroup])
          }
        }
      }
    }
    min_array = min_array.filter((item) => {
      return !isNaN(item)
    })
    max_array = max_array.filter((item) => {
      return !isNaN(item)
    })
    domain = [_.round(Math.min(...min_array), 13), _.round(Math.max(...max_array), 13)]
  } else {
    for (group of groups) {
      if (output[group] && !isNaN(output[group])) {
        if (operation === 'mean') {
          min_array.push(output[group] - _error[group])
        } else {
          min_array.push(output[group])
        }
      }
      if (output[group] && !isNaN(output[group])) {
        if (operation === 'mean') {
          max_array.push(output[group] + _error[group])
        } else {
          max_array.push(output[group])
        }
      }
    }
    min_array = min_array.filter((item) => {
      return !isNaN(item)
    })
    max_array = max_array.filter((item) => {
      return !isNaN(item)
    })
    domain = [_.round(Math.min(...min_array), 13), _.round(Math.max(...max_array), 13)]
  }

  y_encoding = {
    field: 'datamations_y',
    type: 'quantitative',
    title: ['median', 'sum', 'product', 'count'].includes(operation) ? [operation + ' of', y_axis] : (['min', 'max'].includes(operation) && groupby.length > 1) ? [operation + ' of', y_axis] : operation + '(' + y_axis + ')',
    scale: {
      domain
    }
  }

  meta = {
    axes: groupby.length > 1,
    description: 'Plot ' + operation + ' ' + y_axis + ' of each group, ' + (operation === 'mean' ? 'with errorbar, ' : '') + 'zoomed in'
  }

  spec_encoding = { x: x_encoding, y: y_encoding, tooltip }
  if (groupby.length > 1) spec_encoding = { x: x_encoding, y: y_encoding, color, tooltip }
  spec = generate_vega_specs(data, meta, spec_encoding, facet_encoding, facet_dims, operation === 'mean')
  if (!((operation === 'count' || operation === 'sum') && groupby.length === 1)) {
    specs_list.push(spec)
  }

  return specs_list
}

function group_by (data, by) {
  const groups = _.groupBy(data, by[0])
  if (by.length > 2) {
    let l2groups = {}
    var results = {}
    for (var group of Object.keys(groups).sort(compare_ignore_case)) {
      l2groups = _.groupBy(groups[group], by[1])
      for (const l2group of Object.keys(l2groups)) {
        const l3groups = _.groupBy(l2groups[l2group], by[2])
        for (const l3group of Object.keys(l3groups)) {
          if (!results[group]) {
            results[group] = {}
          }
          if (!results[group][l2group]) {
            results[group][l2group] = {}
          }
          results[group][l2group][l3group] = l3groups[l3group]
        }
      }
    }
    return results
  } else if (by.length > 1) {
    let subgroups = {}
    results = {}
    for (group of Object.keys(groups)) {
      subgroups = _.groupBy(groups[group], by[1])
      for (const subgroup of Object.keys(subgroups)) {
        if (!results[group]) {
          results[group] = {}
        }
        results[group][subgroup] = subgroups[subgroup]
      }
    }
    return results
  }
  return groups
}

export function specs (data, groupby, summarize, output) {
  const values = []
  for (let i = 1; i < data.values.length; i++) {
    const value = {}
    for (let j = 0; j < data.values[0].length; j++) {
      value[data.values[0][j].trim()] = data.values[i][j]
    }
    values.push(value)
  }

  const states = [values, { groups: group_by(values, groupby) }, summarize]

  return prep_specs_data(states).concat(
    prep_specs_groupby(states, groupby, summarize).concat(prep_specs_summarize(states, groupby, summarize, output))
  )
}
