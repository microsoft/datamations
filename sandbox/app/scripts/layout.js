function getGridSpec(input, rows = 10) {
  const obj = { ...input };
  const values = input.data.values;
  const newValues = [];

  return new Promise((res) => {
    for (let x = 0; x < values.length; x++) {
      const d = values[x];
      const n = d.n;
  
      for (let i = 0; i < n; i++) {
        const row = i % rows;
        const col = Math.floor(i / rows);
  
        newValues.push({
          ...d,
          gemini_id: i + 1,
          x: col,
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
  
    const encoding = obj.spec ? obj.spec.encoding : obj.encoding;
  
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

function getJitterSpec(spec) {
  const width = spec.width;
  // const height = spec.height;
  const xField = spec.facet.column.field;

  const nodes = spec.data.values;

  const xScale = d3.scaleBand()
    .domain([...new Set(nodes.map(d => d[xField]))])
    .range([0, width]);

  // const yScale = d3.scaleLinear()
  //   .domain(d3.extent(nodes, d => d.Salary))
  //   .range([height, 0]);

  const circleRadius = 3;

  const arr = nodes.slice().map((d, i) => {
    return {
      ...d,
      r: circleRadius,
      x: xScale(d[xField]) + xScale.bandwidth() / 2,
      fy: d.y,
    }
  });

  const simulation = d3.forceSimulation(arr)
    .force("collide", d3.forceCollide()
      .iterations(5)
      .radius(circleRadius + 5)
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
      }
    })
  })
}
