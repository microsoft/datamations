/*
* Layout generation functions for datamations.
* Supports:
* - grid view: meta.parse = "grid"
* - jittered  view: meta.parse = "jitter"
*/
import { CONF, IGNORE_FIELDS } from "./config.js";
import { lookupByBucket } from "./utils.js";

/**
 * Generates data for grid specs
 * @param {Object} spec vega-lite spec
 * @param {Number} rows number of rows
 * @param {Boolean} stacked if true, circles are stacked and vertically aliged
 * @returns an array of objects
 */
export function generateGrid(spec, rows = 10, stacked = false) {
  const splitField = spec.meta.splitField;
  const encoding = spec.spec ? spec.spec.encoding : spec.encoding;
  const groupKeys = [];

  let {width: specWidth} = spec.spec || spec;

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

  let secondarySplit = Object.keys(encoding).filter(d => {
    const field = encoding[d].field;
    return field !== splitField &&
           IGNORE_FIELDS.indexOf(d) === -1 &&
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
      const columns = Math.ceil(n / rows);
      const xCenter = splitField ? splitOptions.indexOf(d[splitField]) + 1 : 1;

      let startCol = (xCenter - 1) * maxCols + j; // inner grid start
      startCol += Math.floor((maxCols - columns) / 2); // center alignment

      const datum = {};

      // remove n and gemini_ids, we won't need them any more
      Object.keys(d).forEach(k => {
        if (k !== 'n' && k !== 'gemini_ids') {
          datum[k] = d[k];
        }
      });

      for (let i = 0; i < n; i++) {
        const x = startCol + Math.floor(i / rows);
        const y = rows - 1 - i % rows;
        const colorFieldObj = {};

        // for secondary split, e.g. is_hit, find correct key and value
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
          ...datum,
          ...colorFieldObj,
          gemini_id: d.gemini_ids ? d.gemini_ids[i] : counter,
          [CONF.X_FIELD]: stacked ? xCenter : x,
          [CONF.Y_FIELD]: stacked ? i + 1 : y,
        });

        counter++;
      }
    });

    return arr;
  };

  let gridValues = [];

  if (groupKeys.length === 0) {
    gridValues = reduce(specValues);
  } else {
    gridValues = d3.rollups(
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

  const num_groups = splitOptions.length;

  return {
    gridValues,
    domain: [
      -maxCols / 2,
      (num_groups * maxCols) + (num_groups - 1) + maxCols / 2 - 1
    ],
    num_groups
  };
}

/**
 * Generates infogrid specification
 * @param {Object} spec vega-lite specification
 * @param {Number} rows number of rows in a grid
 * @returns grid specification
 */
export function getGridSpec(spec, rows = 10, stacked = false) {
  return new Promise((res) => {
    const { gridValues: grid, domain, num_groups } = generateGrid(spec, rows, stacked);
    const obj = {...spec};
    const encoding = obj.spec ? obj.spec.encoding : obj.encoding;

    const dx = stacked ? 1 : 1;

    const xDomain = stacked || num_groups === 0 ? [
      d3.min(grid, d => d[CONF.X_FIELD]) - dx,
      d3.max(grid, d => d[CONF.X_FIELD]) + dx
    ] : domain;

    const yPadding = (spec.facet && spec.facet.row) ? 0.8 : 0.4;

    const yDomain = [
      stacked ? 0 : d3.min(grid, (d) => d[CONF.Y_FIELD]) - yPadding,
      d3.max(grid, (d) => d[CONF.Y_FIELD]) + yPadding + (stacked ? 10 : 0),
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

    // set axis labels when splitField
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

        const middle = Math.ceil(extent[0] + (extent[1] - extent[0]) / 2);
        expr[middle] = d;
      });

      spec.meta.rules = obj.meta.rules = labels.map(m => {
        return {
          filter: `datum['${spec.meta.splitField}'] === '${m}'`,
          groupKey: spec.meta.splitField,
          groupValue: m,
        }
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
 * Generates jittered specification using d3-force
 * @param {Object} spec vega-lite specification
 * @returns jittered spec
 */
export function getJitterSpec(spec) {
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
    .range([0, facetSize])
    .paddingOuter(0.5);

  const arr = nodes.slice().filter(d => d[CONF.Y_FIELD] !== undefined).map((d, i) => {
    d.oldX = d[CONF.X_FIELD];
    d.oldY = d[CONF.Y_FIELD];

    let x = xScale(d[CONF.X_FIELD]) + xScale.bandwidth() / 2;
    let y = d[CONF.Y_FIELD];

    d.scaledX = Math.round(x);

    return {
      ...d,
      x: x,
      y: y,
    };
  });

  const simulation = d3
    .forceSimulation(arr)
    .force("x", d3.forceX().x(d => d.x))
    .force("y", d3.forceY().strength(0.002).y(d => d[CONF.Y_FIELD]))
    .force("collide", d3
      .forceCollide()
      .strength(0.01)
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
        
        // restrict to the bounds: [5%, 95%] of width
        d.x = Math.max(
          x + xScale.bandwidth() * 0.05,
          Math.min(x + bandwidth, d.x),
        );
      })
    }

    if (encoding.y.scale) {
      encoding.y.scale.domain = yExtent
    } else {
      encoding.y.scale = {
        domain: yExtent
      }
    }

    encoding.x.scale = {
      domain: [0, facetSize]
    }

    // jitter still needs encoding fields to be x and y,
    // because d3-force uses x and y internally.
    encoding.x.field = "x";
    encoding.y.field = "y";

    // if meta.axes is falsy, and we have custom x-axis
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