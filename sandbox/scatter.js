/**
 * Renders a scatter plot of salary-data.csv
 * Animation loop between all datapoints and aggregated result
 */

const margin = {
  top: 10,
  left: 50,
  right: 10,
  bottom: 20,
};

const circleRadius = 4;
const xDomain = new Set(data.map(d => d.Degree));
const [yMin, yMax] = d3.extent(data, d => d.Salary);

const averages = d3.rollup(
  data,
  v => d3.mean(v, d => d.Salary),
  d => d.Degree
);

Scatter();

function Scatter() {
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;
  
  const xScale = d3.scaleBand()
    .domain(xDomain)
    .range([0, chartWidth]);
    
  const yScale = d3.scaleLinear()
    .domain([0, yMax * 1.2])
    .range([chartHeight, 0]);
    
  const avgCoords = [];

  for (let [k, v] of averages) {
    avgCoords.push({
      id: 'avg_' + k,
      x: xScale(k) + xScale.bandwidth() / 2,
      y: yScale(v),
      avg_x: xScale(k) + xScale.bandwidth() / 2,
      avg_y: yScale(v),
      r: 18,
      color: k === "Masters" ? "red" : "green",
    });
  }
  
  data.forEach((d, i) => {
    d.id = 'd-' +  i; 
    d.x = xScale(d.Degree) + xScale.bandwidth() / 2;
    d.y = yScale(d.Salary);
    
    const avg = averages.get(d.Degree);
    d.avg_x = xScale(d.Degree) + xScale.bandwidth() / 2;
    d.avg_y = yScale(avg);
    d.color = d.Degree === "Masters" ? "red" : "green";
    d.r = circleRadius;
  });
  
  const simulation = d3.forceSimulation(data)
    .force("collide", d3.forceCollide()
      .strength(0.08)
      .iterations(2)
      .radius(circleRadius + 0.1)
    )
    .stop();
    
  const steps = data.length > 1000 ? 200 : 120;
    
  for (let i = 0; i < steps; i++) {
    simulation.tick();
  }
    
  const chart = svg.append("g")
    .attr(
      "transform", 
      `translate(${margin.left}, ${margin.top})`
    );
    
  const xAxis = d3.axisBottom(xScale);
  const yAxis = d3.axisLeft(yScale);
  
  chart.append("g")
    .attr(
      "transform", 
      `translate(0, ${chartHeight})`
    )
    .call(xAxis);
    
  chart.append("g").call(yAxis);
  
  const circles = chart.selectAll("circle")
    .data(data)
    .enter()
      .append("circle")
      .attr("cx", d => d.x)
      .attr("cy", d => d.y)
      .attr("r", d => d.r)
      .attr("fill", d => d.color);
      
  let showAvg = true;
      
  setInterval(() => {
    const arr = showAvg ? avgCoords : data;  
    
    chart.selectAll("circle")
      .data(arr, d => d.id)
      .join(
        enter => {
          const ent = enter
            .append("circle")
            .attr("cx", d => d.avg_x)
            .attr("cy", d => d.avg_y)
            .attr("r", 0)
            .attr("fill", d => d.color);
            
          ent
            .transition()
            .duration(500)
            .ease(d3.easeCubic)
            .attr("cx", d => d.x)
            .attr("cy", d => d.y)
            .attr("r", d => d.r)
          
          return ent;
        },
        update => update,
        exit => exit
          .transition()
          .duration(500)
          .ease(d3.easeCubic)
          .attr("cx", d => d.avg_x)
          .attr("cy", d => d.avg_y)
          .attr("r", 0)
          .remove(),
      )
      .call(sel => 
        sel.transition()
          .duration(500)
          .ease(d3.easeCubic)
          .attr("cx", d => d.x)
          .attr("cy", d => d.y)
          .attr("r",  d => d.r)
      );
      
    showAvg = !showAvg;
  }, 2000);
}

