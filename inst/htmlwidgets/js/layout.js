function generateGrid(spec, rows = 10) {
  const splitField = spec.meta.splitField;
  const encoding = spec.spec ? spec.spec.encoding : spec.encoding;
  const groupKeys = [];

  const gap = 2;
  const distance = 4 + gap;
  let {width: specWidth, height: specHeight} = spec.spec || spec;

  if (spec.facet) {
    if (spec.facet.column) {
      groupKeys.push(spec.facet.column.field);
      spec.facet.column.sort = { "field": CONF.ORDER_FIELD };
    }
    if (spec.facet.row) {
      groupKeys.push(spec.facet.row.field);
      spec.facet.row.sort = { "field": CONF.ORDER_FIELD };
    }
  }

  let specValues = spec.data.values;

  const metas = [];

  specValues.forEach((d, i) => {
    d[CONF.ORDER_FIELD] = i;
    if (d.meta) {
      metas.push(...Object.keys(d.meta));
    }
  });

  const ingoreFields = ['tooltip', 'x', 'y', 'datamations_x', 'datamations_y'];

  let secondarySplit = Object.keys(encoding).filter(d => {
    const field = encoding[d].field;
    return field !== splitField &&
           ingoreFields.indexOf(d) === -1 &&
           groupKeys.indexOf(field) === -1 &&
           metas.indexOf(field) === -1;
  })[0];

  let secondaryField = null;

  // combine groups
  // for example, if splitField = player, but color = hit:

  // { "n": 5,  "player": "a", "hit": "yes" },
  // { "n": 10, "player": "a", "hit": "no" },
  // { "n": 15, "player": "b", "hit": "yes" },
  // { "n": 35, "player": "b", "hit": "no" }

  // after this code block we will get:
  // { "n": 15,  "player": "a", "hit": { "yes": 5, "no": 10 } },
  // { "n": 50, "player": "b", "hit": { "yes": 15, "no": 35 } },

  if (splitField && secondarySplit) {
    secondaryField = encoding[secondarySplit].field;
    const keys = [...groupKeys, splitField];

    const grouped = d3.rollups(
      specValues,
      arr => {
        const obj = {};
        let sum = 0;

        arr.forEach(x => {
          sum += x.n;
          obj[x[secondaryField]] = sum;
        });

        const o = {
          [splitField]: arr[0][splitField],
          [secondaryField]: obj,
          n: sum,
        };

        groupKeys.forEach(x => {
          o[x] = arr[0][x];
        });

        return o;
      },
      ...keys.map((key) => {
        return (d) => d[key];
      })
    );

    specValues = grouped.flatMap((d) => {
      if (keys.length === 1) {
        return d[1];
      } else {
        return d[1].flatMap((d) => d[1]);
      }
    });

    specWidth = specWidth / grouped.length;
  }

  let maxCols = Math.ceil(d3.max(specValues, d => d.n) / rows);

  // if width divided by maxCols is less than 5, 
  // then take up all vertical space to increase rows and reduce columns 
  if (specWidth / maxCols < 5) {
    rows = Math.floor(specHeight / distance);
    maxCols = Math.ceil(d3.max(specValues, d => d.n) / rows);
  }

  let splitOptions = [];

  if (splitField) {
    splitOptions = Array.from(
      new Set(specValues.map((d) => d[splitField]))
    )
  }

  let counter = 1;

  const reduce = (v) => {
    const arr = [];

    v.forEach((d, j) => {
      const n = d.n;
      const xCenter = splitField ? splitOptions.indexOf(d[splitField]) + 1 : 1;

      let startCol = (xCenter - 1) * maxCols + j; // inner grid start
      startCol += Math.floor((maxCols - Math.ceil(n / rows)) / 2); // center alignment

      const metaFields = Object.keys(d.meta || {});

      for (let i = 0; i < n; i++) {
        const x = startCol + Math.floor(i / rows);
        const y = rows - 1 - i % rows;
        const colorFieldObj = {};
        const additionals = {};

        metaFields.forEach(f => {
          const m = lookupByBucket(
            Object.keys(d.meta[f]),
            d3.cumsum(Object.values(d.meta[f])),
            i + 1,
          );

          if (m) {
            additionals[f] = m;
          }
        });

        if (secondaryField && typeof[d[secondaryField]] === "object") {
          const keys = Object.keys(d[secondaryField]).sort((a, b) => {
            return d[secondaryField][a] - d[secondaryField][b];
          });

          colorFieldObj[secondaryField] = lookupByBucket(
            keys,
            keys.map(k => d[secondaryField][k]),
            i + 1,
          );
        }

        arr.push({
          ...d,
          ...colorFieldObj,
          ...additionals,
          gemini_id: d.gemini_ids ? d.gemini_ids[i] : counter,
          [CONF.X_FIELD]: x,
          [CONF.Y_FIELD]: y,
        });

        counter++;
      }
    });

    return arr;
  };

  if (groupKeys.length === 0) {
    return reduce(specValues);
  }

  return d3.rollups(
    specValues,
    reduce,
    ...groupKeys.map((key) => {
      return (d) => d[key];
    })
  )
  .flatMap((d) => {
    if (groupKeys.length === 1) {
      return d[1];
    } else {
      return d[1].flatMap((d) => d[1]);
    }
  });
}

/**
 * Generates infogrid specification
 * @param {Object} spec vega-lite specification
 * @param {Number} rows number of rows in a grid
 * @returns grid specification
 */
function getGridSpec(spec, rows = 10) {
  return new Promise((res) => {
    const grid = generateGrid(spec, rows);
    const obj = {...spec};
    const encoding = obj.spec ? obj.spec.encoding : obj.encoding;

    const xDomain = [
      d3.min(grid, d => d[CONF.X_FIELD]) - 2,
      d3.max(grid, d => d[CONF.X_FIELD]) + 2
    ];

    const yPadding = (spec.facet && spec.facet.row) ? 0.8 : 0.4;

    const yDomain = [
      d3.min(grid, (d) => d[CONF.Y_FIELD]) - yPadding,
      d3.max(grid, (d) => d[CONF.Y_FIELD]) + yPadding,
    ];

    const middle = yDomain[0] + (yDomain[1] - yDomain[0]) / 2;

    obj.data.values = grid;

    encoding.x.scale = {
      type: "linear",
      domain: xDomain,
    };

    encoding.y.scale = {
      type: "linear",
      domain: [
        Math.min(yDomain[0], middle - rows / 2),
        Math.max(yDomain[1], middle + rows / 2)
      ],
    };

    encoding.x.field = CONF.X_FIELD;
    encoding.y.field = CONF.Y_FIELD;

    if (spec.meta.splitField) {
      const labels = Array.from(
        new Set(grid.map(d => d[spec.meta.splitField]))
      );

      const expr = {};

      labels.forEach((d) => {
        // find min and max x values for each label
        const extent = d3.extent(
          spec.data.values.filter(x => x[spec.meta.splitField] === d),
          d => d[CONF.X_FIELD],
        );

        const middle = Math.floor(extent[0] + (extent[1] - extent[0]) / 2);
        expr[middle] = d;
      });

      encoding.x.axis = {
        labelExpr: `${JSON.stringify(expr)}[datum.label]`,
        values: Object.keys(expr).map(d => +d),
        labelAngle: -90,
        grid: false,
        title: spec.meta.splitField,
      };
    }

    return res(obj);
  });
}

/**
 * Generates jittered specification
 * @param {Object} spec vega-lite specification
 * @returns jittered spec
 */
function getJitterSpec(spec) {
  const encoding = spec.spec ? spec.spec.encoding : spec.encoding;
  const width = spec.spec ? spec.spec.width : spec.width;
  const nodes = spec.data.values;

  const circleRadius = 4;

  let innerGroupCount = 1;

  if (spec.meta.splitField) {
    innerGroupCount = new Set(
      nodes.map(d => d[spec.meta.splitField])
    ).size;
  }

  const facetSize = width ? width : 150;
  const yExtent = d3.extent(nodes, d => d[CONF.Y_FIELD]);
  const xScale = d3.scaleBand()
    .domain(d3.range(1, innerGroupCount + 1))
    .range([0, facetSize]);

  const arr = nodes.slice().filter(d => d[CONF.Y_FIELD] !== undefined).map((d, i) => {
    d.oldX = d[CONF.X_FIELD];
    d.oldY = d[CONF.Y_FIELD];

    let x = xScale(d[CONF.X_FIELD]) + xScale.bandwidth() / 2;
    let y = d[CONF.Y_FIELD];

    return {
      ...d,
      x: x,
      y: y,
    };
  });

  const simulation = d3
    .forceSimulation(arr)
    .force("x", d3.forceX().strength(0.0001))
    .force("y", d3.forceY().strength(0.002).y(d => d[CONF.Y_FIELD]))
    .force("collide", d3
      .forceCollide()
      .strength(0.001)
      .radius(circleRadius)
    )
    .stop();

  return new Promise((res) => {
    const bandwidth = xScale.bandwidth() * 0.9;

    for (let i = 0; i < 120; i++) {
      simulation.tick();

      arr.forEach(d => {
        const x = xScale(d.oldX);
        d.y = d.oldY;

        d.x = Math.max(
          x + xScale.bandwidth() * 0.05,
          Math.min(x + bandwidth, d.x),
        );
      })
    }

    encoding.y.scale = {
      domain: yExtent
    }

    encoding.x.scale = {
      domain: [0, facetSize]
    }

    // jitter still needs encoding fields to be x and y,
    // because d3-force uses x and y internally.
    encoding.x.field = "x";
    encoding.y.field = "y";

    // if no axes is drawn, and we have custom x-axis
    if (!spec.meta.axes && encoding.x.axis && spec.meta.xAxisLabels) {
      const labels = spec.meta.xAxisLabels;

      const axisExpr = {};
      const mapped = labels.map((d, i) => {
        const x = Math.round(xScale(i + 1) + xScale.bandwidth() / 2);
        axisExpr[x] = d;
        return { x, label: d };
      });

      encoding.x.axis.labelExpr = `${JSON.stringify(axisExpr)}[datum.label]`;
      encoding.x.axis.values = mapped.map(d => d.x);
    }

    return res({
      ...spec,
      data: {
        name: "source",
        values: arr,
      },
    });
  });
}
