import _ from 'lodash'

const X_FIELD_CHR = 'datamations_x'
const Y_FIELD_CHR = 'datamations_y'
const Y_RAW_FIELD_CHR = 'datamations_y_raw'

function compare_ignore_case (a, b) {
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
    for (key of Object.keys(states[1].groups)) {
      var parts = key.split(',')
      col = parts[0]
      row = parts[1]
      if (!cols.includes(col)) cols.push(col)
      if (!Object.keys(count).includes(col)) count[col] = 0
      count[col] = count[col] + states[1].groups[key].length
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

    data = []
    cols = []
    let rows = []
    count = {}
    start = {}
    for (var key of Object.keys(states[1].groups).sort()) {
      parts = key.split(',')
      col = parts[0]
      var row = parts[1]
      if (!cols.includes(col)) {
        cols.push(col)
      }
      if (!rows.includes(row)) rows.push(row)
      const k = parts[0] + ',' + parts[1]
      if (!Object.keys(count).includes(k)) count[k] = 0
      count[k] = count[k] + states[1].groups[key].length
      data.push(k)
    }
    facet_dims = {
      ncol: groups.length,
      nrow: 1
    }

    id = 1
    data = _.uniq(data)
    for (key of data) {
      if (!start[key]) start[key] = id
      id = id + count[key]
    }

    data = data.map((key) => {
      parts = key.split(',')
      return {
        [groupby[0]]: parts[0],
        [groupby[1]]: parts[1],
        n: count[key],
        gemini_ids: Array.from('x'.repeat(count[key]), (_, i) => start[key] + i)
      }
    })

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

      rows = []
      data = []
      count = {}
      start = {}

      for (key of Object.keys(states[1].groups).sort(compare_ignore_case)) {
        parts = key.split(',')
        col = parts[0]
        row = parts[2]
        if (!cols.includes(col)) {
          cols.push(col)
        }
        if (!rows.includes(row)) rows.push(row)
        if (!Object.keys(count).includes(key)) count[key] = 0
        count[key] = count[key] + states[1].groups[key].length
        data.push(key)
      }

      id = 1
      for (key of data) {
        if (!start[key]) start[key] = id
        id = id + count[key]
      }

      data = data.map((key) => {
        parts = key.split(',')
        return {
          [groupby[0]]: parts[0],
          [groupby[1]]: parts[1],
          [groupby[2]]: parts[2],
          n: count[key],
          gemini_ids: count[key] < 2 ? start[key] : Array.from('x'.repeat(count[key]), (_, i) => start[key] + i)
        }
      })

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
    for (key of Object.keys(states[1].groups)) {
      col = key
      if (cols.includes(col)) cols.push(col)
      if (Object.keys(count).includes(col)) count[col] = 0
      count[col] = count[col] + states[1].groups[key].length
    }

    id = 1
    for (var col in cols) {
      start[col] = id
      id = id + count[col]
    }

    spec = generate_vega_specs(data, meta, spec_encoding, facet_encoding, facet_dims)
    specs_list.push(spec)
  }
  return specs_list
}

function prep_specs_summarize (states, groupby, summarize, output) {
  const x_axis = groupby.length === 1 ? groupby[0] : groupby[0]
  const y_axis = groupby.length === 1 ? summarize.split(' ')[2] : summarize.split(' ')[2]

  let operation = summarize.split(' ')[0].toLowerCase()
  switch (operation) {
    case 'average':
      operation = 'mean'
      break
  }

  if (groupby.length === 1) {
    var groups = Object.keys(states[1].groups)
  } else {
    groups = Object.keys(states[1].groups).map((item) => {
      return item.split(',')[0]
    })
    groups = _.uniq(groups.sort())
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

  const labels = [groupby.length > 1 ? subgroups[0] : groups[0], groupby.length > 1 ? subgroups[1] : groups[1]]

  const x_encoding = {
    field: 'datamations_x',
    type: 'quantitative',
    axis: {
      values: Array.from('x'.repeat(groups.length), (_, i) => 1 + i),
      labelExpr:
        groupby.length > 2
          ? "round(datum.label) == 1 ? '" +
          l3groups[0] +
          "' : " +
          "round(datum.label) == 2 ? '" +
          l3groups[1] +
          "' : '" +
          l3groups[2] +
          "'"
          : "round(datum.label) == 1 ? '" + labels[0] + "' : '" + labels[1] + "'",
      labelAngle: -90
    },
    title: groupby.length > 1 ? groupby[groupby.length - 1] : x_axis,
    scale: {
      domain: [0, groupby.length > 2 ? 3 : 3]
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
  if (groupby.length > 1) {
    var i = 1
    data = []
    for (group of Object.keys(states[1].groups).sort(compare_ignore_case)) {
      for (var item of states[1].groups[group]) {
        var value = {
          gemini_id: i,
          [groupby[0]]: item[groupby[0]],
          [groupby[1]]: item[groupby[1]],
          datamations_x:
            groupby.length > 2 ? 1 + l3groups.indexOf(item[groupby[2]]) : item[groupby[1]] === subgroups[0] ? 1 : 2
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

    facet_dims = {
      ncol: groups.length,
      nrow: 1
    }

    if (groupby.length > 2) {
      facet_dims = {
        ncol: groups.length,
        nrow: subgroups.length
      }
    }
  } else {
    var id = 1
    for (i = 0; i < states[0].length; i++) {
      if (states[0][i][x_axis] === groups[1]) {
        continue
      }
      value = {
        gemini_id: id,
        [x_axis]: states[0][i][x_axis],
        datamations_x: states[0][i][x_axis] === groups[0] ? 1 : 2,
        datamations_y: _.round(states[0][i][y_axis], 13),
        datamations_y_tooltip: _.round(states[0][i][y_axis], 13)
      }
      data.push(value)
      id = id + 1
    }

    for (i = 0; i < states[0].length; i++) {
      if (states[0][i][x_axis] === groups[0]) {
        continue
      }
      value = {
        gemini_id: id,
        [x_axis]: states[0][i][x_axis],
        datamations_x: states[0][i][x_axis] === groups[0] ? 1 : 2,
        datamations_y: _.round(states[0][i][y_axis], 13),
        datamations_y_tooltip: _.round(states[0][i][y_axis], 13)
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
  specs_list.push(spec)

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
    description: 'Plot ' + operation + ' ' + y_axis + ' of each group'
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
  if (groupby.length > 1) {
    i = 1
    data = []
    for (group of Object.keys(states[1].groups).sort(compare_ignore_case)) {
      if (groupby.length > 2) {
        col = group[0]
      } else {
        col = group
      }
      for (item of states[1].groups[group]) {
        value = {
          gemini_id: i,
          [x_axis]: item[x_axis],
          [groupby[1]]: item[groupby[1]],
          [groupby[2]]: item[groupby[2]],
          datamations_x:
            groupby.length > 2 ? 1 + l3groups.indexOf(item[groupby[2]]) : item[groupby[1]] === subgroups[0] ? 1 : 2,
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

    facet_dims = {
      ncol: groups.length,
      nrow: groupby.length > 2 ? groups.length : 1
    }
  } else {
    id = 1
    for (i = 0; i < states[0].length; i++) {
      if (states[0][i][x_axis] === groups[1]) continue
      value = {
        gemini_id: id,
        [x_axis]: states[0][i][x_axis],
        datamations_x: states[0][i][x_axis] === groups[0] ? 1 : 2,
        datamations_y: output[groups[0]],
        datamations_y_tooltip: output[groups[0]]
      }
      data.push(value)
      id = id + 1
    }

    for (i = 0; i < states[0].length; i++) {
      if (states[0][i][x_axis] === groups[0]) {
        continue
      }
      value = {
        gemini_id: id,
        [x_axis]: states[0][i][x_axis],
        datamations_x: states[0][i][x_axis] === groups[0] ? 1 : 2,
        datamations_y: output[groups[1]],
        datamations_y_tooltip: output[groups[1]]
      }
      data.push(value)
      id = id + 1
    }
  }

  if (['mean', 'median', 'min', 'max'].includes(operation)) {
    meta.custom_animation = operation
  }
  else if (operation === 'count') {
    y_encoding.title = [operation + ' of', y_axis]
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
    _error[group] =
      standardDeviation(states[1].groups[group].map((x) => parseFloat(x[y_axis]))) /
      Math.sqrt(states[1].groups[group].length)
  }

  // Show errror bars along with sumarized values
  if (groupby.length > 1) {
    i = 1
    data = []
    for (group of Object.keys(states[1].groups).sort(compare_ignore_case)) {
      if (groupby.length > 2) {
        col = group[0]
      } else {
        col = group
      }
      for (item of states[1].groups[group]) {
        value = {
          gemini_id: i,
          [x_axis]: item[x_axis],
          [groupby[1]]: item[groupby[1]],
          datamations_x:
            groupby.length > 2 ? 1 + l3groups.indexOf(item[groupby[2]]) : item[groupby[1]] === subgroups[0] ? 1 : 2,
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
            _error[[item[groupby[0]], item[groupby[1]], item[groupby[2]]].join(',')]
            : output[item[groupby[0]]][item[groupby[1]]] - _error[[item[groupby[0]], item[groupby[1]]].join(',')]
          value.Upper = groupby.length > 2
            ? output[item[groupby[0]]][item[groupby[1]]][item[groupby[2]]] +
            _error[[item[groupby[0]], item[groupby[1]], item[groupby[2]]].join(',')]
            : output[item[groupby[0]]][item[groupby[1]]] + _error[[item[groupby[0]], item[groupby[1]]].join(',')]
        }
        if (operation === 'mean' && !isNaN(item[y_axis])) {
          value.datamations_y_raw = _.round(item[y_axis], 13)
        }
        data.push(value)
        i = i + 1
      }
    }

    facet_dims = {
      ncol: groups.length,
      nrow: groupby.length > 2 ? groups.length : 1
    }
  } else {
    id = 1
    for (i = 0; i < states[0].length; i++) {
      if (states[0][i][x_axis] === groups[1]) continue
      value = {
        gemini_id: id,
        [x_axis]: states[0][i][x_axis],
        datamations_x: states[0][i][x_axis] === groups[0] ? 1 : 2,
        datamations_y: output[groups[0]],
        datamations_y_tooltip: output[groups[0]]
      }
      if (operation === 'mean' || operation === 'median') {
        value.datamations_y_raw = _.round(states[0][i][y_axis], 13)
      }
      if (operation === 'mean') {
        value.Lower = output[groups[0]] - _error[groups[0]]
        value.Upper = output[groups[0]] + _error[groups[0]]
      }
      data.push(value)
      id = id + 1
    }

    for (i = 0; i < states[0].length; i++) {
      if (states[0][i][x_axis] === groups[0]) {
        continue
      }
      value = {
        gemini_id: id,
        [x_axis]: states[0][i][x_axis],
        datamations_x: states[0][i][x_axis] === groups[0] ? 1 : 2,
        datamations_y: output[groups[1]],
        datamations_y_tooltip: output[groups[1]]
      }
      if (operation === 'mean' || operation === 'median') {
        value.datamations_y_raw = _.round(states[0][i][y_axis], 13)
      }
      if (operation === 'mean') {
        value.Lower = output[groups[1]] - _error[groups[1]]
        value.Upper = output[groups[1]] + _error[groups[1]]
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
              min_array.push(output[group][subgroup][l3group] - _error[[group, subgroup, l3group].join(',')])
            } else {
              min_array.push(output[group][subgroup][l3group])
            }
          }
          if (output[group][subgroup] && !isNaN(output[group][subgroup][l3group])) {
            if (operation === 'mean') {
              max_array.push(output[group][subgroup][l3group] + _error[[group, subgroup, l3group].join(',')])
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
            min_array.push(output[group][subgroup] - _error[[group, subgroup].join(',')])
          } else {
            min_array.push(output[group][subgroup])
          }
        }
        if (output[group][subgroup] && !isNaN(output[group][subgroup])) {
          if (operation === 'mean') {
            max_array.push(output[group][subgroup] + _error[[group, subgroup].join(',')])
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
  specs_list.push(spec)

  return specs_list
}

function group_by (data, by) {
  const groups = _.groupBy(data, by[0])
  if (by.length > 2) {
    let l2groups = {}
    var results = {}
    for (var group of Object.keys(groups).sort()) {
      l2groups = _.groupBy(groups[group], by[1])
      for (const l2group of Object.keys(l2groups)) {
        const l3groups = _.groupBy(l2groups[l2group], by[2])
        for (const l3group of Object.keys(l3groups)) {
          var key = [group, l2group, l3group].join(',')
          results[key] = l3groups[l3group]
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
        key = [group, subgroup].join(',')
        results[key] = subgroups[subgroup]
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
