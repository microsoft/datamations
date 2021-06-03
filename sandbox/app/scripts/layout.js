/**
 * Applies shiftX to inner grid elements
 * @param {Object} spec vega-lite specification
 * @param {Number} rows number of rows in a grid
 * @returns grid data
 */
function applyShifts(spec, rows) {
  const splitField = spec.meta.splitField;
  const specValues = spec.data.values;
  const groupKeys = [];

  if (spec.facet) {
    if (spec.facet.column) {
      groupKeys.push(spec.facet.column.field);
    }
    if (spec.facet.row) {
      groupKeys.push(spec.facet.row.field);
    }
  }

  const splitOptions = [...new Set(specValues.map((d) => d[splitField]))];
  const shifters = new Map(
    splitOptions.map((d, i) => {
      return [d, i > 0 ? splitOptions[i - 1] : null];
    })
  );

  const reduce = (v) => {
    const map = new Map(v.map((d) => [d[splitField], d.n]));
    let shiftSum = 0; // will accumulate shiftX
    let shiftCounter = 0;
    let sum = d3.sum(v, d => d.n);

    return v.map((d) => {
      const shifter = shifters.get(d[splitField]);
      let m = map.get(shifter);

      if (m) {
        shiftCounter++;
        shiftSum += m + rows;
      }

      return {
        ...d,
        shiftX: shiftSum,
        shiftCounter,
        sum: sum,
      };
    });
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
 * Generates grid-like specification 
 * @param {Object} spec vega-lite specification
 * @param {Number} rows number of rows in a grid
 * @returns grid specification
 */
function getGridSpec(spec, rows = 10) {
  const obj = { ...spec };
  const encoding = obj.spec ? obj.spec.encoding : obj.encoding;
  const values = spec.meta.splitField ? applyShifts(obj, rows) : obj.data.values;
  const newValues = [];

  let maxN = 0;
  
  if (spec.meta.splitField) {
    maxN = d3.max(values, d => d.sum);
  } else {
    maxN = d3.max(values, d => d.n);
  } 

  return new Promise((res) => {
    let counter = 1;

    for (let x = 0; x < values.length; x++) {
      const d = values[x];
      const n = d.n;
      const sum = spec.meta.splitField ? d.sum : d.n;
      const shiftX = d.shiftX || 0;
      const shiftCounter = d.shiftCounter || 0;
      const shiftCol = Math.floor(shiftX / rows);

      let startCol = 0;

      if (sum !== maxN) {
        startCol = Math.ceil((Math.floor(maxN / rows) - Math.floor(sum / rows)) / 2);
      }

      for (let i = 0; i < n; i++) {
        const row = i % rows;
        const col = Math.floor(i / rows);

        newValues.push({
          ...d,
          gemini_id: counter,
          x: col + (shiftCol > 0 ? shiftCol + shiftCounter : 0) + startCol,
          y: rows - 1 - row,
        });

        counter++;
      }
    }

    let xDomain = [
      d3.min(newValues, (d) => d.x) - 2,
      d3.max(newValues, (d) => d.x) + 2,
    ];

    // if (spec.meta.shiftGrids) {
    //   const max = Math.ceil(d3.max(values, (d) => d.n) / 10) * 2;
    //   xDomain = [-2, max + 1];
    // }

    const yDomain = [
      d3.min(newValues, (d) => d.y) - 0.7,
      d3.max(newValues, (d) => d.y) + 0.7,
    ];

    obj.data.values = newValues;

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

    let x = xScale(d.x) + xScale.bandwidth() / 2 + Math.random() * 4 - 2;
    let y = d.y;

    return {
      ...d,
      x: x,
      y: y,
    };
  });

  const simulation = d3
    .forceSimulation(arr)
    .force("x", d3.forceX().strength(0.0002))
    .force("y", d3.forceY().strength(0.002).y(d => d.y))
    .force("collide", d3
      .forceCollide()
      .strength(0.002)
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
