/**
 * Applies shiftX to inner grid elements
 * @param {Object} spec vega-lite specification
 * @param {Number} rows number of rows in a grid
 * @returns grid data
 */
function applyShifts(spec, rows) {
  const encoding = spec.spec ? spec.spec.encoding : spec.encoding;
  const colorField = encoding.color.field;
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

  const colorOptions = [...new Set(specValues.map((d) => d[colorField]))];
  const shifters = new Map(
    colorOptions.map((d, i) => {
      return [d, i > 0 ? colorOptions[i - 1] : null];
    })
  );

  const reduce = (v) => {
    const map = new Map(v.map((d) => [d[colorField], d.n]));
    let shiftSum = 0; // will accumulate shiftX
    let shiftCounter = 0;

    return v.map((d) => {
      const shifter = shifters.get(d[colorField]);
      let m = map.get(shifter);

      if (m) {
        shiftCounter++;
        shiftSum += m + rows;
      }

      return {
        ...d,
        shiftX: shiftSum,
        shiftCounter,
      };
    });
  };

  if (groupKeys.length === 0) {
    return reduce(specValues);
  }

  return d3
    .rollups(
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
  const values = encoding.color ? applyShifts(obj, rows) : obj.data.values;
  const newValues = [];

  return new Promise((res) => {
    for (let x = 0; x < values.length; x++) {
      const d = values[x];
      const n = d.n;
      const shiftX = d.shiftX || 0;
      const shiftCounter = d.shiftCounter || 0;
      const shiftCol = Math.floor(shiftX / rows);

      for (let i = 0; i < n; i++) {
        const row = i % rows;
        const col = Math.floor(i / rows);

        newValues.push({
          ...d,
          gemini_id: i + 1,
          x: col + (shiftCol > 0 ? shiftCol + shiftCounter : 0),
          y: rows - 1 - row,
        });
      }
    }

    const xDomain = [
      d3.min(newValues, (d) => d.x) - 2,
      d3.max(newValues, (d) => d.x) + 2,
    ];

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
 * @param {String} xField xField
 * @returns jittered spec
 */
function getJitterSpec(spec, xField) {
  const width = spec.width;
  const encoding = spec.spec ? spec.spec.encoding : spec.encoding;
  const colorField = encoding.color ? encoding.color.field : null;
  const nodes = spec.data.values;

  let colorOptions = [];

  if (colorField) {
    colorOptions = [...new Set(nodes.map((d) => {
      return d[colorField];
    }))];
  }

  const xScale = d3
    .scaleBand()
    .domain([...new Set(nodes.map((d) => d[xField]))].sort())
    .range([0, width]);

  let xScaleInner;
  if (colorField) {
    xScaleInner = d3
      .scaleBand()
      .domain(colorOptions)
      .range([10, xScale.bandwidth() - 10])
  }

  const circleRadius = 3;

  const arr = nodes.slice().map((d, i) => {
    let x;

    if (colorField) {
      x = xScale(d[xField]) + xScaleInner(d[colorField]) + xScaleInner.bandwidth() / 2 + xScale.bandwidth() * 0.18;
    } else {
      x = xScale(d[xField]) + xScale.bandwidth() / 2;
    }

    return {
      ...d,
      r: circleRadius,
      x: x,
      fy: d.y,
    };
  });

  const simulation = d3
    .forceSimulation(arr)
    .force(
      "collide",
      d3
        .forceCollide()
        .iterations(2)
        .radius(circleRadius)
    )
    .stop();

  return new Promise((res) => {
    for (let i = 0; i < 120; i++) {
      simulation.tick();
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
