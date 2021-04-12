/**
 * Replication of plot_degree.gif
 */

// let's break down the code into parts

// 1. coordinate calculation

// 2. drawing and animation

// need an id to track exact same row
data.forEach((d, i) => d.id = `obs-${i}`)

const margin = {
  top: 10,
  left: 10,
  right: 10,
  bottom: 10,
};

const colors = {
  grey: "#BFBFBF",
  red: "#D91E18",
  green: "#26C281",
}

const chartWidth = width - margin.left - margin.right;
const chartHeight = height - margin.top - margin.bottom;
const circleRadius = 4;
const gap = 8;
const rows = 8;
const fullHeight = rows * circleRadius * 2 + (rows - 1) * gap;

const xDomain = new Set(data.map(d => d.Degree));
const yMax = d3.max(data, d => d.Salary);
const xScale = d3.scaleBand()
  .domain(xDomain)
  .range([0, chartWidth]);

const yScale = d3.scaleLinear()
  .domain([0, yMax * 1.2])
  .range([chartHeight, 0]);

main();

/**
 * Generates grid layout, starting point
 */
function grid() {
  const cols = Math.floor((data.length - 1) / rows);
  const fullWidth = cols * circleRadius * 2 + (cols - 1) * gap;

  const arr = data
    .slice()
    .map((d, i) => {
      const row = i % rows;
      const col = Math.floor(i / rows);

      const x = col * (gap + circleRadius * 2);
      const y = row * (gap + circleRadius * 2);

      return {
        ...d,
        r: circleRadius,
        x: x + chartWidth / 2 - fullWidth / 2,
        y: y + chartHeight / 2 - fullHeight / 2,
        color: colors.grey,
      }
    });
  
  return arr;
}

/**
 * Generates colored grid layout, grouped by Degree
 */
function colored_grid() {
  const sorted = data.slice().sort((a, b) => d3.ascending(a.Degree, b.Degree));

  const masters = sorted
    .filter(d => d.Degree === "Masters")
    .map((d, i) => {
      const row = i % rows;
      const col = Math.floor(i / rows);

      const x = col * (gap + circleRadius * 2);
      const y = row * (gap + circleRadius * 2);

      return {
        ...d,
        r: circleRadius,
        x: x + chartWidth * 0.3,
        y: y + chartHeight / 2 - fullHeight / 2,
        color: colors.green,
      }
    });

  const phd = sorted
    .filter(d => d.Degree === "PhD")
    .map((d, i) => {
      const row = i % rows;
      const col = Math.floor(i / rows);

      const x = col * (gap + circleRadius * 2);
      const y = row * (gap + circleRadius * 2);

      return {
        ...d,
        r: circleRadius,
        x: x + chartWidth * 0.7,
        y: y + chartHeight / 2 - fullHeight / 2,
        color: colors.red,
      }
    });

  return [
    ...masters,
    ...phd,
  ];
}

/**
 * Generates scatterplot layout. Collision detection by d3.forceCollide.
 */
function scatter_plot() {
  const arr = data.slice().map((d, i) => {
    return {
      ...d,
      r: circleRadius,
      x: xScale(d.Degree) + xScale.bandwidth() / 2,
      fy: yScale(d.Salary),
      y: yScale(d.Salary),
      color: d.Degree === "Masters" ? colors.green : colors.red,
    }
  });

  const simulation = d3.forceSimulation(arr)
    .force("collide", d3.forceCollide()
      // .strength(0.08)
      .iterations(5)
      .radius(circleRadius + 0.5)
    )
    .stop();
    
  for (let i = 0; i < 120; i++) {
    simulation.tick();
  }

  return arr;
}

/**
 * Generates average layout. Each single point is has now a radius equal to average.
 */
function averages() {
  const averages = d3.rollup(
    data,
    v => d3.mean(v, d => d.Salary),
    d => d.Degree
  );

  return data.slice().map((d, i) => {
    return {
      ...d,
      r: 18,
      x: xScale(d.Degree) + xScale.bandwidth() / 2,
      y: yScale(averages.get(d.Degree)),
      color: d.Degree === "Masters" ? colors.green : colors.red,
    }
  });
}

/**
 * Drawing
 * @param {Object} params 
 */
function Chart(params) {
  let data = params.data;
    
  const chart = svg.append("g").attr(
    "transform", 
    `translate(${margin.left}, ${margin.top})`
  );
  
  const circles = chart.selectAll("circle")
    .data(data, d => d.id)
    .enter()
      .append("circle")
      .attr("cx", d => d.x)
      .attr("cy", d => d.y)
      .attr("r", d => d.r)
      .attr("fill", d => d.color);

  return {
    update(new_data) {
      data = new_data;

      circles
        .data(data, d => d.id)
        .join(
          enter => {
            const ent = enter
              .append("circle")
              .attr("cx", d => d.x)
              .attr("cy", d => d.y)
              .attr("r", 0)
              .attr("fill", d => d.color);
              
            ent
              .transition()
              .duration(500)
              .ease(d3.easeCubic)
              .attr("r", d => d.r)
            
            return ent;
          },
          update => update,
          exit => exit
            .transition()
            .duration(500)
            .ease(d3.easeCubic)
            .attr("r", 0)
            .remove(),
        )
        .call(sel => 
          sel            
            .attr("fill", d => d.color)
            .transition()
            .duration(500)
            .ease(d3.easeCubic)
            .attr("cx", d => d.x)
            .attr("cy", d => d.y)
            .attr("r",  d => d.r)
        );
    }
  }
}

/**
 * App entry point
 */
function main() {
  const frames = [];

  frames.push(grid());
  frames.push(colored_grid());
  frames.push(scatter_plot());
  frames.push(averages());

  let counter = 0;

  const chart = Chart({
    data: frames[counter],
  });

  setInterval(() => {
    counter = ++counter % frames.length;
    chart.update(frames[counter]);
  }, 1500);
}