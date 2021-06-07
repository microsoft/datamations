function generateGrid(spec, rows = 10) {
  const splitField = spec.meta.splitField;
  const specValues = spec.data.values;
  const groupKeys = [];
  const maxCols = Math.ceil(d3.max(specValues, d => d.n) / rows)

  if (spec.facet) {
    if (spec.facet.column) {
      groupKeys.push(spec.facet.column.field);
    }
    if (spec.facet.row) {
      groupKeys.push(spec.facet.row.field);
    }
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
      
      for (let i = 0; i < n; i++) {
        const x = startCol + Math.floor(i / rows);
        const y = rows - 1 - i % rows;

        arr.push({
          ...d,
          gemini_id: counter,
          x,
          y,
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

    const yGap = (spec.facet && spec.facet.row) ? 0.8 : 0.4;

    const xDomain = [
      d3.min(grid, d => d.x) - 2, 
      d3.max(grid, d => d.x) + 2
    ];

    const yDomain = [
      d3.min(grid, (d) => d.y) - yGap,
      d3.max(grid, (d) => d.y) + yGap,
    ];

    obj.data.values = grid;

    encoding.x.scale = {
      type: "linear",
      domain: xDomain,
    };

    encoding.y.scale = {
      type: "linear",
      domain: yDomain,
    };

    encoding.x.field = "x";
    encoding.y.field = "y";

    if (spec.meta.splitField) {
      const labels = Array.from(
        new Set(grid.map(d => d[spec.meta.splitField]))
      );

      const expr = {};
      const maxCols = d3.max(spec.data.values, d => Math.ceil(d.n / rows));

      labels.forEach((d, i) => {
        const x = maxCols * i + Math.floor(maxCols / 2);
        expr[x] = d;
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
  const yExtent = d3.extent(nodes, d => d.y);
  const xScale = d3.scaleBand()
    .domain(d3.range(1, innerGroupCount + 1))
    .range([0, facetSize]);

  const arr = nodes.slice().filter(d => d.y !== undefined).map((d, i) => {
    d.oldX = d.x;
    d.oldY = d.y;

    let x = xScale(d.x) + xScale.bandwidth() / 2;
    let y = d.y;

    return {
      ...d,
      x: x,
      y: y,
    };
  });

  const simulation = d3
    .forceSimulation(arr)
    .force("x", d3.forceX().strength(0.0001))
    .force("y", d3.forceY().strength(0.002).y(d => d.y))
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
