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
    let counter = 1;
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
          gemini_id: counter,
          x: col + (shiftCol > 0 ? shiftCol + shiftCounter : 0),
          y: rows - 1 - row,
        });
        counter++;
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
 * @returns jittered spec
 */
function getJitterSpec(spec) {
  const width = spec.width;
  const encoding = spec.spec ? spec.spec.encoding : spec.encoding;
  const colorField = encoding.color ? encoding.color.field : null;
  const xField = spec.facet && spec.facet.column ? spec.facet.column.field : null;
  const nodes = spec.data.values;
  const circleRadius = 4;

  let rootGroupCount = 1;
  let innerGroupCount = 1;

  if (xField) {
    rootGroupCount = new Set(
      nodes.map(d => d[xField])
    ).size
  }

  if (colorField) {
    innerGroupCount = new Set(
      nodes.map(d => d[colorField])
    ).size;
  }

  const facetSize = width / rootGroupCount;
  const gapSize = facetSize / innerGroupCount * 0.9;

  const xScale = d3.scaleBand()
    .domain(d3.range(1, innerGroupCount + 1))
    .range([0, facetSize]);

  const arr = nodes.slice().map((d, i) => {
    d.oldX = d.x;
    d.oldY = d.y;
    let x = xScale(d.x) + xScale.bandwidth() / 2;
    let y = d.y || 0;

    return {
      ...d,
      x: x,
      y: y,
    };
  });

  const simulation = d3
    .forceSimulation(arr)
    .force("x", d3.forceX().x(d => d.x).strength(0.002))
    .force("y", d3.forceY().y(d => d.y).strength(1))
    .force(
      "collide",
      d3
        .forceCollide()
        .iterations(2)
        .strength(0.2)
        .radius(circleRadius)
    )
    .stop();

  return new Promise((res) => {
    const bandwidth = xScale.bandwidth() * 0.8;

    for (let i = 0; i < 120; i++) {
      simulation.tick();
      arr.forEach(d => {
        const x = xScale(d.oldX);
        d.y = d.oldY;
        d.x = Math.max(
          x + xScale.bandwidth() * 0.1,
          Math.min(x + bandwidth, d.x)
        );
      })
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
