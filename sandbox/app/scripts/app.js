const repoUrl = "https://raw.githubusercontent.com/jhofman/datamations";
// const dataUrl = "./data/";
const dataUrl = repoUrl + "/fixes/sandbox/specs-for-infogrid/";
const frameDuration = 1200;

let vegaLiteSpecs,
    vegaSpecs, 
    frames, 
    metas, 
    rawFiles;

let counter = 0, intervalId;

async function init(id, { 
  specUrls, 
  specs,
  autoPlay,
}) {
  vegaLiteSpecs = [];
  rawFiles = [];

  if (specs) {
    vegaLiteSpecs = specs;
  } else if (specUrls) {
    vegaLiteSpecs = await loadData(specUrls);
  }

  const { visSelector, slider } = getSelectors(id);

  // save raw vegaLiteSpecs to use for facet axes drawing
  vegaLiteSpecs.forEach((d) => {
    rawFiles.push(JSON.parse(JSON.stringify(d)));
  });

  metas = vegaLiteSpecs.map((d) => d.meta);

  for (let i = 0; i < vegaLiteSpecs.length; i++) {
    const vlSpec = vegaLiteSpecs[i];
    const parse = vlSpec.meta.parse;

    // parsing
    if (parse === "grid") {
      vegaLiteSpecs[i] = await getGridSpec(vlSpec);
    } else if (parse === "jitter") {
      vegaLiteSpecs[i] = await getJitterSpec(vlSpec);
    }
     else if (vlSpec.layer || vlSpec.spec.layer) {
      const arr = splitLayers(vlSpec);
      vegaLiteSpecs[i] = arr;

      // for (let j = 0; j < arr.length; j++) {
      //   const s = arr[j];
      //   const meta = s.meta;

      //   // fake facets
      //   if (s.facet && s.spec) {
      //     const withAxes = meta && meta.axes;
    
      //     s.data.name = "source";
      //     const { newSpec, view } = await hackFacet(s);

      //     if (withAxes) {
      //       const vis = document.querySelector(visSelector);
      //       const origin = view._origin;
      //       vis.style.left = origin[0] + "px";
      //     }

      //     vegaLiteSpecs[i].push({
      //       ...newSpec,
      //       meta
      //     });
      //   } else {
      //     vegaLiteSpecs[i].push(s);
      //   }
      // }
    }

    const facet = vegaLiteSpecs[i].facet;
    const spec = vegaLiteSpecs[i].spec;

    // fake facets
    if (facet && spec) {
      const meta = vegaLiteSpecs[i].meta;
      const withAxes = meta && meta.axes;

      vegaLiteSpecs[i].data.name = "source";

      const { newSpec, view } = await hackFacet(vegaLiteSpecs[i]);

      vegaLiteSpecs[i] = newSpec;

      if (withAxes) {
        const vis = document.querySelector(visSelector);
        const origin = view._origin;
        vis.style.left = (origin[0]) + "px";
      }
    }
  }

  // vegaSpecs = vegaLiteSpecs.filter(d => !Array.isArray(d)).map((d) => gemini.vl2vg4gemini(d));
  frames = [];

  // for (let i = 1; i < vegaSpecs.length; i++) {
  //   const prev = vegaSpecs[i - 1];
  //   const curr = vegaSpecs[i];

  //   const prevMeta = metas[i - 1];
  //   const currMeta = metas[i];

  //   const recommendations = gemini.recommend(prev, curr, {
  //     stageN: 1,
  //     scales: {
  //       domainDimension: "same",
  //     },
  //     marks: {
  //       marks: {
  //         change: {
  //           data: {
  //             keys: ['gemini_id'],
  //             update: true,
  //             enter: true,
  //             exit: true,
  //           },
  //           encode: {
  //             update: true,
  //             enter: true,
  //             exit: true,
  //           },
  //         },
  //       }
  //     },
  //     totalDuration: frameDuration,
  //   });

  //   recommendations
  //     .then((resp) => {
  //       frames.push({
  //         source: prev,
  //         target: curr,
  //         gemSpec: resp[0].spec,
  //         prevMeta,
  //         currMeta,
  //       });
  //     })
  //     .catch((e) => {});
  // }

  d3.select(slider).property('max', vegaLiteSpecs.length - 1);
  drawFrame(0, id);

  if (autoPlay) {
    setTimeout(() => {
      play(id);
    }, 100)
  }
}

function play(id) {
  counter = 0;
  const tick = () => {
    animateFrame(counter, id);
    counter++;
  };
  tick();

  if (intervalId) clearInterval(intervalId);
  intervalId = setInterval(() => {
    tick();
    if (counter >= frames.length) {
      clearInterval(intervalId);
      counter = 0;
    }
  }, frameDuration + 100);
}

function drawFrame(index, id) {
  const spec = vegaLiteSpecs[index];

  if (!spec) return;

  const meta = metas[index];
  const { axisSelector, visSelector, descr, slider } = getSelectors(id);
  
  d3.select(slider).property('value', index);
  d3.select(descr).html(meta.description || 'frame ' + index);

  d3.select(axisSelector)
    .style("opacity", meta.axes ? 1 : 0)
    .html("");

  d3.select(visSelector)
    .classed("with-axes", meta.axes);

  // draw axis
  if (meta.axes) {
    drawAxis(index, id);
  }

  // draw vis
  return drawChart(spec, visSelector);
}

function drawChart(spec, selector) {
  const vis = document.querySelector(selector);
  vis.innerHTML = "";

  if (Array.isArray(spec)) {
    const p = document.createElement("div");
    p.classList.add('layered-vega-vis');
    vis.appendChild(p);

    return new Promise((res) => {
      spec.forEach((s, i) => {
        const div = document.createElement("div");
  
        if (!s.meta.animated) {
          div.classList.add('hidden');
        }
        
        p.appendChild(div);
        vegaEmbed(div, s, { renderer: "svg" }).then(() => {
          if (i === spec.length - 1) {
            res();
          }
        });
      });
    });
  } else {
    return vegaEmbed(vis, spec, { renderer: "svg" });
  }
}

function drawAxis(index, id) {
  let spec = rawFiles[index];

  if (spec.spec && spec.spec.layer) {
    return;
    const split = splitLayers(spec);
    spec = split[1];
  }

  const columnFacet = spec.facet && spec.facet.column;
  const { axisSelector } = getSelectors(id);

  // update axis domain to matched hacked facet view
  const extentY = d3.extent(spec.data.values, (d) => d.y);
  const encoding = spec.spec ? spec.spec.encoding : spec.encoding;
  encoding.y.scale = { domain: extentY };

  if (encoding.color) {
    encoding.color.legend = null;
  }

  vegaEmbed(axisSelector, spec, { renderer: "svg" }).then(() => {
    if (columnFacet && columnFacet.title) {
      d3.select(axisSelector + " svg > g").attr("transform", function () {
        const transform = d3.select(this).attr("transform");
        const x = transform.split("(")[1].split(",")[0];
        return `translate(${x}, 40)`;
      });
    }
  });
}

async function animateFrame(index, id) {
  if (!frames[index]) return;

  const { axisSelector, visSelector, descr, slider } = getSelectors(id);
  const { source, target, gemSpec, prevMeta, currMeta } = frames[index];

  let anim = await gemini.animate(source, target, gemSpec);

  let prevHasAxes = prevMeta.axes;
  let currHasAxes = currMeta.axes;

  drawFrame(index, id).then(() => {
    d3.select(descr).html(currMeta.description);
    
    anim.play(visSelector).then(() => {
      d3.select(slider).property('value', index + 1);
    });

    // show/hide axis vega chart
    if (prevHasAxes && !currHasAxes) {
      d3.select(axisSelector)
        .transition()
        .duration(1000)
        .style("opacity", 0);

      d3.select(visSelector)
        .classed("with-axes", false);
    } else if (!prevHasAxes && currHasAxes) {
      drawAxis(index + 1, id);
      d3.select(axisSelector)
        .style("opacity", 0)
        .transition()
        .duration(1000)
        .style("opacity", 1);
      d3.select(visSelector).classed("with-axes", true);
    }
  });
}

function loadData(specUrls) {
  return Promise.all(
    specUrls.map((url) => {
      return d3.json(url);
    })
  ).catch((e) => {
    console.error(e.message);
  });
}

function onSlide(id) {
  const { slider } = getSelectors(id);
  const index = document.querySelector(slider).value;
  drawFrame(index, id);
  if (intervalId) clearInterval(intervalId);
}

function getSelectors(id) {
  return {
    axisSelector: "#" + id + " .vega-for-axis",
    visSelector: "#" + id + " .vega-vis",
    descr: "#" + id + " .description",
    slider: "#" + id + " .slider",
  }
}

function splitLayers(input) {
  const specArray = [];
  const spec = input.spec;
  
  if (spec && spec.layer) {
    spec.layer.forEach((d, i) => {
      const obj = JSON.parse(JSON.stringify(input));
      const animated = (i === spec.layer.length - 1);
      
      if (obj.meta) {
        obj.meta.animated = animated;
      } else {
        obj.meta = { animated };
      }
      
      obj.spec.encoding = d.encoding;
      obj.spec.mark = d.mark;
      delete obj.spec.layer;
      specArray.push(obj);
    });
  } 
  else if (input.layer) {
    input.layer.forEach((d, i) => {
      const obj = JSON.parse(JSON.stringify(input));
      const animated = (i === input.layer.length - 1);

      if (obj.meta) {
        obj.meta.animated = animated;
      } else {
        obj.meta = { animated };
      }

      obj.encoding = d.encoding;
      obj.mark = d.mark;
      delete obj.layer;
      specArray.push(obj);
    });
  }

  return specArray;
};

// init("app", {
//   specUrls: [
//     dataUrl + "01-ungrouped.json",
//     dataUrl + "02-column-facet.json",
//     dataUrl + "03-column-row-facet.json",
//     dataUrl + "04-column-row-facet-color.json",
//     dataUrl + "05-jitter.json",
//     dataUrl + "06-summary.json",
//   ],
//   autoPlay: false
// });

init("app", {
  specs: [
    {
      "height": 300,
      "width": 300,
      "$schema": "https://vega.github.io/schema/vega-lite/v4.json",
      "meta": {
        "parse": "grid",
        "description": "Initial data"
      },
      "data": {
        "values": [
          {
            "n": 100
          }
        ]
      },
      "mark": {
        "type": "point",
        "filled": true
      },
      "encoding": {
        "x": {
          "field": "x",
          "type": "quantitative",
          "axis": null
        },
        "y": {
          "field": "y",
          "type": "quantitative",
          "axis": null
        }
      }
    },
    {
      "$schema": "https://vega.github.io/schema/vega-lite/v4.json",
      "meta": {
        "parse": "grid",
        "description": "Group by Degree"
      },
      "data": {
        "values": [
          {
            "Degree": "Masters",
            "n": 72
          },
          {
            "Degree": "PhD",
            "n": 28
          }
        ]
      },
      "facet": {
        "column": {
          "field": "Degree",
          "type": "ordinal",
          "title": "Degree"
        }
      },
      "spec": {
        "height": 300,
        "width": 150,
        "mark": {
          "type": "point",
          "filled": true
        },
        "encoding": {
          "x": {
            "field": "x",
            "type": "quantitative",
            "axis": null
          },
          "y": {
            "field": "y",
            "type": "quantitative",
            "axis": null
          }
        }
      }
    },
    {
      "$schema": "https://vega.github.io/schema/vega-lite/v4.json",
      "meta": {
        "parse": "jitter",
        "axes": true,
        "description": "Plot Salary within each group"
      },
      "data": {
        "values": [
          {
            "gemini_id": 1,
            "Degree": "Masters",
            "x": 1,
            "y": 81.9445013836958
          },
          {
            "gemini_id": 2,
            "Degree": "Masters",
            "x": 1,
            "y": 82.8953005648218
          },
          {
            "gemini_id": 3,
            "Degree": "Masters",
            "x": 1,
            "y": 83.2656172472052
          },
          {
            "gemini_id": 4,
            "Degree": "Masters",
            "x": 1,
            "y": 82.899547266541
          },
          {
            "gemini_id": 5,
            "Degree": "Masters",
            "x": 1,
            "y": 90.1877911367919
          },
          {
            "gemini_id": 6,
            "Degree": "Masters",
            "x": 1,
            "y": 90.3138903337531
          },
          {
            "gemini_id": 7,
            "Degree": "Masters",
            "x": 1,
            "y": 90.3365755749401
          },
          {
            "gemini_id": 8,
            "Degree": "Masters",
            "x": 1,
            "y": 89.6885157823563
          },
          {
            "gemini_id": 9,
            "Degree": "Masters",
            "x": 1,
            "y": 89.657391943736
          },
          {
            "gemini_id": 10,
            "Degree": "Masters",
            "x": 1,
            "y": 89.8103184474166
          },
          {
            "gemini_id": 11,
            "Degree": "Masters",
            "x": 1,
            "y": 90.1445505130105
          },
          {
            "gemini_id": 12,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2597002927214
          },
          {
            "gemini_id": 13,
            "Degree": "Masters",
            "x": 1,
            "y": 89.5807276440319
          },
          {
            "gemini_id": 14,
            "Degree": "Masters",
            "x": 1,
            "y": 91.4775695463177
          },
          {
            "gemini_id": 15,
            "Degree": "Masters",
            "x": 1,
            "y": 90.5421400056221
          },
          {
            "gemini_id": 16,
            "Degree": "Masters",
            "x": 1,
            "y": 90.9508253019303
          },
          {
            "gemini_id": 17,
            "Degree": "Masters",
            "x": 1,
            "y": 84.3256172758993
          },
          {
            "gemini_id": 18,
            "Degree": "Masters",
            "x": 1,
            "y": 90.7608228451572
          },
          {
            "gemini_id": 19,
            "Degree": "Masters",
            "x": 1,
            "y": 91.2149588565808
          },
          {
            "gemini_id": 20,
            "Degree": "Masters",
            "x": 1,
            "y": 91.4811559985392
          },
          {
            "gemini_id": 21,
            "Degree": "Masters",
            "x": 1,
            "y": 91.203505871119
          },
          {
            "gemini_id": 22,
            "Degree": "Masters",
            "x": 1,
            "y": 84.1406831252389
          },
          {
            "gemini_id": 23,
            "Degree": "Masters",
            "x": 1,
            "y": 90.900099467719
          },
          {
            "gemini_id": 24,
            "Degree": "Masters",
            "x": 1,
            "y": 91.3447520111222
          },
          {
            "gemini_id": 25,
            "Degree": "Masters",
            "x": 1,
            "y": 90.6169246234931
          },
          {
            "gemini_id": 26,
            "Degree": "Masters",
            "x": 1,
            "y": 91.1798533124384
          },
          {
            "gemini_id": 27,
            "Degree": "Masters",
            "x": 1,
            "y": 91.2493746823166
          },
          {
            "gemini_id": 28,
            "Degree": "Masters",
            "x": 1,
            "y": 91.4049337708857
          },
          {
            "gemini_id": 29,
            "Degree": "Masters",
            "x": 1,
            "y": 91.1165353488177
          },
          {
            "gemini_id": 30,
            "Degree": "Masters",
            "x": 1,
            "y": 91.1068642993923
          },
          {
            "gemini_id": 31,
            "Degree": "Masters",
            "x": 1,
            "y": 90.6704280367121
          },
          {
            "gemini_id": 32,
            "Degree": "Masters",
            "x": 1,
            "y": 91.4698466714472
          },
          {
            "gemini_id": 33,
            "Degree": "Masters",
            "x": 1,
            "y": 91.0579056167044
          },
          {
            "gemini_id": 34,
            "Degree": "Masters",
            "x": 1,
            "y": 90.9434416298755
          },
          {
            "gemini_id": 35,
            "Degree": "Masters",
            "x": 1,
            "y": 91.1740557027515
          },
          {
            "gemini_id": 36,
            "Degree": "Masters",
            "x": 1,
            "y": 91.2401522365399
          },
          {
            "gemini_id": 37,
            "Degree": "Masters",
            "x": 1,
            "y": 90.5011388328858
          },
          {
            "gemini_id": 38,
            "Degree": "Masters",
            "x": 1,
            "y": 85.3303201349918
          },
          {
            "gemini_id": 39,
            "Degree": "Masters",
            "x": 1,
            "y": 90.6040293425322
          },
          {
            "gemini_id": 40,
            "Degree": "Masters",
            "x": 1,
            "y": 85.4951418309938
          },
          {
            "gemini_id": 41,
            "Degree": "Masters",
            "x": 1,
            "y": 91.4005046924576
          },
          {
            "gemini_id": 42,
            "Degree": "Masters",
            "x": 1,
            "y": 91.1476999609731
          },
          {
            "gemini_id": 43,
            "Degree": "Masters",
            "x": 1,
            "y": 90.7045878821518
          },
          {
            "gemini_id": 44,
            "Degree": "Masters",
            "x": 1,
            "y": 90.6188371984754
          },
          {
            "gemini_id": 45,
            "Degree": "Masters",
            "x": 1,
            "y": 90.5633510330226
          },
          {
            "gemini_id": 46,
            "Degree": "Masters",
            "x": 1,
            "y": 90.5981954357121
          },
          {
            "gemini_id": 47,
            "Degree": "Masters",
            "x": 1,
            "y": 91.1700340267271
          },
          {
            "gemini_id": 48,
            "Degree": "Masters",
            "x": 1,
            "y": 90.7472879537381
          },
          {
            "gemini_id": 49,
            "Degree": "Masters",
            "x": 1,
            "y": 92.0161147855688
          },
          {
            "gemini_id": 50,
            "Degree": "Masters",
            "x": 1,
            "y": 92.2819435379934
          },
          {
            "gemini_id": 51,
            "Degree": "Masters",
            "x": 1,
            "y": 91.5201518230606
          },
          {
            "gemini_id": 52,
            "Degree": "Masters",
            "x": 1,
            "y": 92.2406232669018
          },
          {
            "gemini_id": 53,
            "Degree": "Masters",
            "x": 1,
            "y": 84.5408536496107
          },
          {
            "gemini_id": 54,
            "Degree": "Masters",
            "x": 1,
            "y": 91.6161431246437
          },
          {
            "gemini_id": 55,
            "Degree": "Masters",
            "x": 1,
            "y": 92.0414693744387
          },
          {
            "gemini_id": 56,
            "Degree": "Masters",
            "x": 1,
            "y": 92.2921498068608
          },
          {
            "gemini_id": 57,
            "Degree": "Masters",
            "x": 1,
            "y": 91.6981512298808
          },
          {
            "gemini_id": 58,
            "Degree": "Masters",
            "x": 1,
            "y": 91.8960476492066
          },
          {
            "gemini_id": 59,
            "Degree": "Masters",
            "x": 1,
            "y": 92.4187721665949
          },
          {
            "gemini_id": 60,
            "Degree": "Masters",
            "x": 1,
            "y": 91.8766731780488
          },
          {
            "gemini_id": 61,
            "Degree": "Masters",
            "x": 1,
            "y": 92.3804325407837
          },
          {
            "gemini_id": 62,
            "Degree": "Masters",
            "x": 1,
            "y": 92.1729675922543
          },
          {
            "gemini_id": 63,
            "Degree": "Masters",
            "x": 1,
            "y": 92.1522822889965
          },
          {
            "gemini_id": 64,
            "Degree": "Masters",
            "x": 1,
            "y": 85.4612494898029
          },
          {
            "gemini_id": 65,
            "Degree": "Masters",
            "x": 1,
            "y": 92.1945560907479
          },
          {
            "gemini_id": 66,
            "Degree": "Masters",
            "x": 1,
            "y": 91.5597189620603
          },
          {
            "gemini_id": 67,
            "Degree": "Masters",
            "x": 1,
            "y": 91.992212592857
          },
          {
            "gemini_id": 68,
            "Degree": "Masters",
            "x": 1,
            "y": 92.4685412924737
          },
          {
            "gemini_id": 69,
            "Degree": "Masters",
            "x": 1,
            "y": 91.9892992568202
          },
          {
            "gemini_id": 70,
            "Degree": "Masters",
            "x": 1,
            "y": 91.9956347632688
          },
          {
            "gemini_id": 71,
            "Degree": "Masters",
            "x": 1,
            "y": 92.3084856946953
          },
          {
            "gemini_id": 72,
            "Degree": "Masters",
            "x": 1,
            "y": 91.7435715948232
          },
          {
            "gemini_id": 73,
            "Degree": "PhD",
            "x": 1,
            "y": 84.4868333523627
          },
          {
            "gemini_id": 74,
            "Degree": "PhD",
            "x": 1,
            "y": 83.8469139884692
          },
          {
            "gemini_id": 75,
            "Degree": "PhD",
            "x": 1,
            "y": 83.7531382157467
          },
          {
            "gemini_id": 76,
            "Degree": "PhD",
            "x": 1,
            "y": 85.2683244312648
          },
          {
            "gemini_id": 77,
            "Degree": "PhD",
            "x": 1,
            "y": 91.4052118111867
          },
          {
            "gemini_id": 78,
            "Degree": "PhD",
            "x": 1,
            "y": 85.3309176496696
          },
          {
            "gemini_id": 79,
            "Degree": "PhD",
            "x": 1,
            "y": 92.3489408034366
          },
          {
            "gemini_id": 80,
            "Degree": "PhD",
            "x": 1,
            "y": 84.7384647994768
          },
          {
            "gemini_id": 81,
            "Degree": "PhD",
            "x": 1,
            "y": 85.0068552203011
          },
          {
            "gemini_id": 82,
            "Degree": "PhD",
            "x": 1,
            "y": 85.1630066898651
          },
          {
            "gemini_id": 83,
            "Degree": "PhD",
            "x": 1,
            "y": 85.3773716066498
          },
          {
            "gemini_id": 84,
            "Degree": "PhD",
            "x": 1,
            "y": 85.0828845105134
          },
          {
            "gemini_id": 85,
            "Degree": "PhD",
            "x": 1,
            "y": 86.0538539250847
          },
          {
            "gemini_id": 86,
            "Degree": "PhD",
            "x": 1,
            "y": 93.1602621641941
          },
          {
            "gemini_id": 87,
            "Degree": "PhD",
            "x": 1,
            "y": 85.9106459924951
          },
          {
            "gemini_id": 88,
            "Degree": "PhD",
            "x": 1,
            "y": 93.4098555028904
          },
          {
            "gemini_id": 89,
            "Degree": "PhD",
            "x": 1,
            "y": 86.0406335154548
          },
          {
            "gemini_id": 90,
            "Degree": "PhD",
            "x": 1,
            "y": 93.0570627038833
          },
          {
            "gemini_id": 91,
            "Degree": "PhD",
            "x": 1,
            "y": 86.4447282091714
          },
          {
            "gemini_id": 92,
            "Degree": "PhD",
            "x": 1,
            "y": 92.7338204937987
          },
          {
            "gemini_id": 93,
            "Degree": "PhD",
            "x": 1,
            "y": 86.3678887020797
          },
          {
            "gemini_id": 94,
            "Degree": "PhD",
            "x": 1,
            "y": 87.049029128626
          },
          {
            "gemini_id": 95,
            "Degree": "PhD",
            "x": 1,
            "y": 93.1600916916505
          },
          {
            "gemini_id": 96,
            "Degree": "PhD",
            "x": 1,
            "y": 86.6827135430649
          },
          {
            "gemini_id": 97,
            "Degree": "PhD",
            "x": 1,
            "y": 93.7030599385034
          },
          {
            "gemini_id": 98,
            "Degree": "PhD",
            "x": 1,
            "y": 87.4391794742551
          },
          {
            "gemini_id": 99,
            "Degree": "PhD",
            "x": 1,
            "y": 93.833772216225
          },
          {
            "gemini_id": 100,
            "Degree": "PhD",
            "x": 1,
            "y": 94.0215112566948
          }
        ]
      },
      "facet": {
        "column": {
          "field": "Degree",
          "type": "ordinal",
          "title": "Degree"
        }
      },
      "spec": {
        "height": 300,
        "width": 150,
        "mark": {
          "type": "point",
          "filled": true
        },
        "encoding": {
          "x": {
            "field": "x",
            "type": "quantitative",
            "axis": {
              "values": [1, 1],
              "labelExpr": ""
            },
            "title": "",
            "scale": {
              "domain": [0.5, 1.5]
            }
          },
          "y": {
            "field": "y",
            "type": "quantitative",
            "title": "Salary",
            "scale": {
              "domain": [81.9445013836958, 94.0215112566948]
            }
          }
        }
      }
    },
    {
      "$schema": "https://vega.github.io/schema/vega-lite/v4.json",
      "meta": {
        "axes": true,
        "description": "Plot mean Salary of each group"
      },
      "data": {
        "values": [
          {
            "gemini_id": 1,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763
          },
          {
            "gemini_id": 2,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763
          },
          {
            "gemini_id": 3,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763
          },
          {
            "gemini_id": 4,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763
          },
          {
            "gemini_id": 5,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763
          },
          {
            "gemini_id": 6,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763
          },
          {
            "gemini_id": 7,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763
          },
          {
            "gemini_id": 8,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763
          },
          {
            "gemini_id": 9,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763
          },
          {
            "gemini_id": 10,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763
          },
          {
            "gemini_id": 11,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763
          },
          {
            "gemini_id": 12,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763
          },
          {
            "gemini_id": 13,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763
          },
          {
            "gemini_id": 14,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763
          },
          {
            "gemini_id": 15,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763
          },
          {
            "gemini_id": 16,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763
          },
          {
            "gemini_id": 17,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763
          },
          {
            "gemini_id": 18,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763
          },
          {
            "gemini_id": 19,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763
          },
          {
            "gemini_id": 20,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763
          },
          {
            "gemini_id": 21,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763
          },
          {
            "gemini_id": 22,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763
          },
          {
            "gemini_id": 23,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763
          },
          {
            "gemini_id": 24,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763
          },
          {
            "gemini_id": 25,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763
          },
          {
            "gemini_id": 26,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763
          },
          {
            "gemini_id": 27,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763
          },
          {
            "gemini_id": 28,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763
          },
          {
            "gemini_id": 29,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763
          },
          {
            "gemini_id": 30,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763
          },
          {
            "gemini_id": 31,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763
          },
          {
            "gemini_id": 32,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763
          },
          {
            "gemini_id": 33,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763
          },
          {
            "gemini_id": 34,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763
          },
          {
            "gemini_id": 35,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763
          },
          {
            "gemini_id": 36,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763
          },
          {
            "gemini_id": 37,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763
          },
          {
            "gemini_id": 38,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763
          },
          {
            "gemini_id": 39,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763
          },
          {
            "gemini_id": 40,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763
          },
          {
            "gemini_id": 41,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763
          },
          {
            "gemini_id": 42,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763
          },
          {
            "gemini_id": 43,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763
          },
          {
            "gemini_id": 44,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763
          },
          {
            "gemini_id": 45,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763
          },
          {
            "gemini_id": 46,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763
          },
          {
            "gemini_id": 47,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763
          },
          {
            "gemini_id": 48,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763
          },
          {
            "gemini_id": 49,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763
          },
          {
            "gemini_id": 50,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763
          },
          {
            "gemini_id": 51,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763
          },
          {
            "gemini_id": 52,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763
          },
          {
            "gemini_id": 53,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763
          },
          {
            "gemini_id": 54,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763
          },
          {
            "gemini_id": 55,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763
          },
          {
            "gemini_id": 56,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763
          },
          {
            "gemini_id": 57,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763
          },
          {
            "gemini_id": 58,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763
          },
          {
            "gemini_id": 59,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763
          },
          {
            "gemini_id": 60,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763
          },
          {
            "gemini_id": 61,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763
          },
          {
            "gemini_id": 62,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763
          },
          {
            "gemini_id": 63,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763
          },
          {
            "gemini_id": 64,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763
          },
          {
            "gemini_id": 65,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763
          },
          {
            "gemini_id": 66,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763
          },
          {
            "gemini_id": 67,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763
          },
          {
            "gemini_id": 68,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763
          },
          {
            "gemini_id": 69,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763
          },
          {
            "gemini_id": 70,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763
          },
          {
            "gemini_id": 71,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763
          },
          {
            "gemini_id": 72,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763
          },
          {
            "gemini_id": 73,
            "Degree": "PhD",
            "x": 1,
            "y": 88.2456061263219
          },
          {
            "gemini_id": 74,
            "Degree": "PhD",
            "x": 1,
            "y": 88.2456061263219
          },
          {
            "gemini_id": 75,
            "Degree": "PhD",
            "x": 1,
            "y": 88.2456061263219
          },
          {
            "gemini_id": 76,
            "Degree": "PhD",
            "x": 1,
            "y": 88.2456061263219
          },
          {
            "gemini_id": 77,
            "Degree": "PhD",
            "x": 1,
            "y": 88.2456061263219
          },
          {
            "gemini_id": 78,
            "Degree": "PhD",
            "x": 1,
            "y": 88.2456061263219
          },
          {
            "gemini_id": 79,
            "Degree": "PhD",
            "x": 1,
            "y": 88.2456061263219
          },
          {
            "gemini_id": 80,
            "Degree": "PhD",
            "x": 1,
            "y": 88.2456061263219
          },
          {
            "gemini_id": 81,
            "Degree": "PhD",
            "x": 1,
            "y": 88.2456061263219
          },
          {
            "gemini_id": 82,
            "Degree": "PhD",
            "x": 1,
            "y": 88.2456061263219
          },
          {
            "gemini_id": 83,
            "Degree": "PhD",
            "x": 1,
            "y": 88.2456061263219
          },
          {
            "gemini_id": 84,
            "Degree": "PhD",
            "x": 1,
            "y": 88.2456061263219
          },
          {
            "gemini_id": 85,
            "Degree": "PhD",
            "x": 1,
            "y": 88.2456061263219
          },
          {
            "gemini_id": 86,
            "Degree": "PhD",
            "x": 1,
            "y": 88.2456061263219
          },
          {
            "gemini_id": 87,
            "Degree": "PhD",
            "x": 1,
            "y": 88.2456061263219
          },
          {
            "gemini_id": 88,
            "Degree": "PhD",
            "x": 1,
            "y": 88.2456061263219
          },
          {
            "gemini_id": 89,
            "Degree": "PhD",
            "x": 1,
            "y": 88.2456061263219
          },
          {
            "gemini_id": 90,
            "Degree": "PhD",
            "x": 1,
            "y": 88.2456061263219
          },
          {
            "gemini_id": 91,
            "Degree": "PhD",
            "x": 1,
            "y": 88.2456061263219
          },
          {
            "gemini_id": 92,
            "Degree": "PhD",
            "x": 1,
            "y": 88.2456061263219
          },
          {
            "gemini_id": 93,
            "Degree": "PhD",
            "x": 1,
            "y": 88.2456061263219
          },
          {
            "gemini_id": 94,
            "Degree": "PhD",
            "x": 1,
            "y": 88.2456061263219
          },
          {
            "gemini_id": 95,
            "Degree": "PhD",
            "x": 1,
            "y": 88.2456061263219
          },
          {
            "gemini_id": 96,
            "Degree": "PhD",
            "x": 1,
            "y": 88.2456061263219
          },
          {
            "gemini_id": 97,
            "Degree": "PhD",
            "x": 1,
            "y": 88.2456061263219
          },
          {
            "gemini_id": 98,
            "Degree": "PhD",
            "x": 1,
            "y": 88.2456061263219
          },
          {
            "gemini_id": 99,
            "Degree": "PhD",
            "x": 1,
            "y": 88.2456061263219
          },
          {
            "gemini_id": 100,
            "Degree": "PhD",
            "x": 1,
            "y": 88.2456061263219
          }
        ]
      },
      "facet": {
        "column": {
          "field": "Degree",
          "type": "ordinal",
          "title": "Degree"
        }
      },
      "spec": {
        "height": 300,
        "width": 150,
        "mark": {
          "type": "point",
          "filled": true
        },
        "encoding": {
          "x": {
            "field": "x",
            "type": "quantitative",
            "axis": {
              "values": [1, 1],
              "labelExpr": ""
            },
            "title": "",
            "scale": {
              "domain": [0.5, 1.5]
            }
          },
          "y": {
            "field": "y",
            "type": "quantitative",
            "title": "Salary",
            "scale": {
              "domain": [81.9445013836958, 94.0215112566948]
            }
          }
        }
      }
    },
    {
      "$schema": "https://vega.github.io/schema/vega-lite/v4.json",
      "meta": {
        "axes": true,
        "description": "Plot mean Salary of each group, with errorbar"
      },
      "data": {
        "values": [
          {
            "gemini_id": 1,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763,
            "y_raw": 81.9445013836958
          },
          {
            "gemini_id": 2,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763,
            "y_raw": 82.8953005648218
          },
          {
            "gemini_id": 3,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763,
            "y_raw": 83.2656172472052
          },
          {
            "gemini_id": 4,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763,
            "y_raw": 82.899547266541
          },
          {
            "gemini_id": 5,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763,
            "y_raw": 90.1877911367919
          },
          {
            "gemini_id": 6,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763,
            "y_raw": 90.3138903337531
          },
          {
            "gemini_id": 7,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763,
            "y_raw": 90.3365755749401
          },
          {
            "gemini_id": 8,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763,
            "y_raw": 89.6885157823563
          },
          {
            "gemini_id": 9,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763,
            "y_raw": 89.657391943736
          },
          {
            "gemini_id": 10,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763,
            "y_raw": 89.8103184474166
          },
          {
            "gemini_id": 11,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763,
            "y_raw": 90.1445505130105
          },
          {
            "gemini_id": 12,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763,
            "y_raw": 90.2597002927214
          },
          {
            "gemini_id": 13,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763,
            "y_raw": 89.5807276440319
          },
          {
            "gemini_id": 14,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763,
            "y_raw": 91.4775695463177
          },
          {
            "gemini_id": 15,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763,
            "y_raw": 90.5421400056221
          },
          {
            "gemini_id": 16,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763,
            "y_raw": 90.9508253019303
          },
          {
            "gemini_id": 17,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763,
            "y_raw": 84.3256172758993
          },
          {
            "gemini_id": 18,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763,
            "y_raw": 90.7608228451572
          },
          {
            "gemini_id": 19,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763,
            "y_raw": 91.2149588565808
          },
          {
            "gemini_id": 20,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763,
            "y_raw": 91.4811559985392
          },
          {
            "gemini_id": 21,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763,
            "y_raw": 91.203505871119
          },
          {
            "gemini_id": 22,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763,
            "y_raw": 84.1406831252389
          },
          {
            "gemini_id": 23,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763,
            "y_raw": 90.900099467719
          },
          {
            "gemini_id": 24,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763,
            "y_raw": 91.3447520111222
          },
          {
            "gemini_id": 25,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763,
            "y_raw": 90.6169246234931
          },
          {
            "gemini_id": 26,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763,
            "y_raw": 91.1798533124384
          },
          {
            "gemini_id": 27,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763,
            "y_raw": 91.2493746823166
          },
          {
            "gemini_id": 28,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763,
            "y_raw": 91.4049337708857
          },
          {
            "gemini_id": 29,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763,
            "y_raw": 91.1165353488177
          },
          {
            "gemini_id": 30,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763,
            "y_raw": 91.1068642993923
          },
          {
            "gemini_id": 31,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763,
            "y_raw": 90.6704280367121
          },
          {
            "gemini_id": 32,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763,
            "y_raw": 91.4698466714472
          },
          {
            "gemini_id": 33,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763,
            "y_raw": 91.0579056167044
          },
          {
            "gemini_id": 34,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763,
            "y_raw": 90.9434416298755
          },
          {
            "gemini_id": 35,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763,
            "y_raw": 91.1740557027515
          },
          {
            "gemini_id": 36,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763,
            "y_raw": 91.2401522365399
          },
          {
            "gemini_id": 37,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763,
            "y_raw": 90.5011388328858
          },
          {
            "gemini_id": 38,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763,
            "y_raw": 85.3303201349918
          },
          {
            "gemini_id": 39,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763,
            "y_raw": 90.6040293425322
          },
          {
            "gemini_id": 40,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763,
            "y_raw": 85.4951418309938
          },
          {
            "gemini_id": 41,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763,
            "y_raw": 91.4005046924576
          },
          {
            "gemini_id": 42,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763,
            "y_raw": 91.1476999609731
          },
          {
            "gemini_id": 43,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763,
            "y_raw": 90.7045878821518
          },
          {
            "gemini_id": 44,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763,
            "y_raw": 90.6188371984754
          },
          {
            "gemini_id": 45,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763,
            "y_raw": 90.5633510330226
          },
          {
            "gemini_id": 46,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763,
            "y_raw": 90.5981954357121
          },
          {
            "gemini_id": 47,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763,
            "y_raw": 91.1700340267271
          },
          {
            "gemini_id": 48,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763,
            "y_raw": 90.7472879537381
          },
          {
            "gemini_id": 49,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763,
            "y_raw": 92.0161147855688
          },
          {
            "gemini_id": 50,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763,
            "y_raw": 92.2819435379934
          },
          {
            "gemini_id": 51,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763,
            "y_raw": 91.5201518230606
          },
          {
            "gemini_id": 52,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763,
            "y_raw": 92.2406232669018
          },
          {
            "gemini_id": 53,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763,
            "y_raw": 84.5408536496107
          },
          {
            "gemini_id": 54,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763,
            "y_raw": 91.6161431246437
          },
          {
            "gemini_id": 55,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763,
            "y_raw": 92.0414693744387
          },
          {
            "gemini_id": 56,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763,
            "y_raw": 92.2921498068608
          },
          {
            "gemini_id": 57,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763,
            "y_raw": 91.6981512298808
          },
          {
            "gemini_id": 58,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763,
            "y_raw": 91.8960476492066
          },
          {
            "gemini_id": 59,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763,
            "y_raw": 92.4187721665949
          },
          {
            "gemini_id": 60,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763,
            "y_raw": 91.8766731780488
          },
          {
            "gemini_id": 61,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763,
            "y_raw": 92.3804325407837
          },
          {
            "gemini_id": 62,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763,
            "y_raw": 92.1729675922543
          },
          {
            "gemini_id": 63,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763,
            "y_raw": 92.1522822889965
          },
          {
            "gemini_id": 64,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763,
            "y_raw": 85.4612494898029
          },
          {
            "gemini_id": 65,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763,
            "y_raw": 92.1945560907479
          },
          {
            "gemini_id": 66,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763,
            "y_raw": 91.5597189620603
          },
          {
            "gemini_id": 67,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763,
            "y_raw": 91.992212592857
          },
          {
            "gemini_id": 68,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763,
            "y_raw": 92.4685412924737
          },
          {
            "gemini_id": 69,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763,
            "y_raw": 91.9892992568202
          },
          {
            "gemini_id": 70,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763,
            "y_raw": 91.9956347632688
          },
          {
            "gemini_id": 71,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763,
            "y_raw": 92.3084856946953
          },
          {
            "gemini_id": 72,
            "Degree": "Masters",
            "x": 1,
            "y": 90.2263340061763,
            "y_raw": 91.7435715948232
          },
          {
            "gemini_id": 73,
            "Degree": "PhD",
            "x": 1,
            "y": 88.2456061263219,
            "y_raw": 84.4868333523627
          },
          {
            "gemini_id": 74,
            "Degree": "PhD",
            "x": 1,
            "y": 88.2456061263219,
            "y_raw": 83.8469139884692
          },
          {
            "gemini_id": 75,
            "Degree": "PhD",
            "x": 1,
            "y": 88.2456061263219,
            "y_raw": 83.7531382157467
          },
          {
            "gemini_id": 76,
            "Degree": "PhD",
            "x": 1,
            "y": 88.2456061263219,
            "y_raw": 85.2683244312648
          },
          {
            "gemini_id": 77,
            "Degree": "PhD",
            "x": 1,
            "y": 88.2456061263219,
            "y_raw": 91.4052118111867
          },
          {
            "gemini_id": 78,
            "Degree": "PhD",
            "x": 1,
            "y": 88.2456061263219,
            "y_raw": 85.3309176496696
          },
          {
            "gemini_id": 79,
            "Degree": "PhD",
            "x": 1,
            "y": 88.2456061263219,
            "y_raw": 92.3489408034366
          },
          {
            "gemini_id": 80,
            "Degree": "PhD",
            "x": 1,
            "y": 88.2456061263219,
            "y_raw": 84.7384647994768
          },
          {
            "gemini_id": 81,
            "Degree": "PhD",
            "x": 1,
            "y": 88.2456061263219,
            "y_raw": 85.0068552203011
          },
          {
            "gemini_id": 82,
            "Degree": "PhD",
            "x": 1,
            "y": 88.2456061263219,
            "y_raw": 85.1630066898651
          },
          {
            "gemini_id": 83,
            "Degree": "PhD",
            "x": 1,
            "y": 88.2456061263219,
            "y_raw": 85.3773716066498
          },
          {
            "gemini_id": 84,
            "Degree": "PhD",
            "x": 1,
            "y": 88.2456061263219,
            "y_raw": 85.0828845105134
          },
          {
            "gemini_id": 85,
            "Degree": "PhD",
            "x": 1,
            "y": 88.2456061263219,
            "y_raw": 86.0538539250847
          },
          {
            "gemini_id": 86,
            "Degree": "PhD",
            "x": 1,
            "y": 88.2456061263219,
            "y_raw": 93.1602621641941
          },
          {
            "gemini_id": 87,
            "Degree": "PhD",
            "x": 1,
            "y": 88.2456061263219,
            "y_raw": 85.9106459924951
          },
          {
            "gemini_id": 88,
            "Degree": "PhD",
            "x": 1,
            "y": 88.2456061263219,
            "y_raw": 93.4098555028904
          },
          {
            "gemini_id": 89,
            "Degree": "PhD",
            "x": 1,
            "y": 88.2456061263219,
            "y_raw": 86.0406335154548
          },
          {
            "gemini_id": 90,
            "Degree": "PhD",
            "x": 1,
            "y": 88.2456061263219,
            "y_raw": 93.0570627038833
          },
          {
            "gemini_id": 91,
            "Degree": "PhD",
            "x": 1,
            "y": 88.2456061263219,
            "y_raw": 86.4447282091714
          },
          {
            "gemini_id": 92,
            "Degree": "PhD",
            "x": 1,
            "y": 88.2456061263219,
            "y_raw": 92.7338204937987
          },
          {
            "gemini_id": 93,
            "Degree": "PhD",
            "x": 1,
            "y": 88.2456061263219,
            "y_raw": 86.3678887020797
          },
          {
            "gemini_id": 94,
            "Degree": "PhD",
            "x": 1,
            "y": 88.2456061263219,
            "y_raw": 87.049029128626
          },
          {
            "gemini_id": 95,
            "Degree": "PhD",
            "x": 1,
            "y": 88.2456061263219,
            "y_raw": 93.1600916916505
          },
          {
            "gemini_id": 96,
            "Degree": "PhD",
            "x": 1,
            "y": 88.2456061263219,
            "y_raw": 86.6827135430649
          },
          {
            "gemini_id": 97,
            "Degree": "PhD",
            "x": 1,
            "y": 88.2456061263219,
            "y_raw": 93.7030599385034
          },
          {
            "gemini_id": 98,
            "Degree": "PhD",
            "x": 1,
            "y": 88.2456061263219,
            "y_raw": 87.4391794742551
          },
          {
            "gemini_id": 99,
            "Degree": "PhD",
            "x": 1,
            "y": 88.2456061263219,
            "y_raw": 93.833772216225
          },
          {
            "gemini_id": 100,
            "Degree": "PhD",
            "x": 1,
            "y": 88.2456061263219,
            "y_raw": 94.0215112566948
          }
        ]
      },
      "facet": {
        "column": {
          "field": "Degree",
          "type": "ordinal",
          "title": "Degree"
        }
      },
      "spec": {
        "height": 300,
        "width": 150,
        "layer": [
          {
            "mark": "errorbar",
            "encoding": {
              "x": {
                "field": "x",
                "type": "quantitative",
                "axis": {
                  "values": [1, 1],
                  "labelExpr": ""
                },
                "title": "",
                "scale": {
                  "domain": [0.5, 1.5]
                }
              },
              "y": {
                "field": "y_raw",
                "type": "quantitative",
                "title": "Salary",
                "scale": {
                  "domain": [81.9445013836958, 94.0215112566948]
                }
              }
            }
          },
          {
            "mark": {
              "type": "point",
              "filled": true
            },
            "encoding": {
              "x": {
                "field": "x",
                "type": "quantitative",
                "axis": {
                  "values": [1, 1],
                  "labelExpr": ""
                },
                "title": "",
                "scale": {
                  "domain": [0.5, 1.5]
                }
              },
              "y": {
                "field": "y",
                "type": "quantitative",
                "title": "Salary",
                "scale": {
                  "domain": [81.9445013836958, 94.0215112566948]
                }
              }
            }
          }
        ]
      }
    }
  ]
})

// init("app", {
//   specs: [
//     {
//       "height": 300,
//       "width": 300,
//       "$schema": "https://vega.github.io/schema/vega-lite/v4.json",
//       "meta": {
//         "parse": "grid",
//         "description": "Initial data"
//       },
//       "data": {
//         "values": [
//           {
//             "n": 100
//           }
//         ]
//       },
//       "mark": {
//         "type": "point",
//         "filled": true
//       },
//       "encoding": {
//         "x": {
//           "field": "x",
//           "type": "quantitative",
//           "axis": null
//         },
//         "y": {
//           "field": "y",
//           "type": "quantitative",
//           "axis": null
//         }
//       }
//     },
//     {
//       "height": 300,
//       "width": 300,
//       "$schema": "https://vega.github.io/schema/vega-lite/v4.json",
//       "meta": {
//         "parse": "jitter",
//         "axes": false,
//         "description": "Plot Salary within each group"
//       },
//       "data": {
//         "values": [
//           {
//             "gemini_id": 1,
//             "x": 1,
//             "y": 81.9445013836958
//           },
//           {
//             "gemini_id": 2,
//             "x": 1,
//             "y": 84.4868333523627
//           },
//           {
//             "gemini_id": 3,
//             "x": 1,
//             "y": 82.8953005648218
//           },
//           {
//             "gemini_id": 4,
//             "x": 1,
//             "y": 83.8469139884692
//           },
//           {
//             "gemini_id": 5,
//             "x": 1,
//             "y": 83.7531382157467
//           },
//           {
//             "gemini_id": 6,
//             "x": 1,
//             "y": 85.2683244312648
//           },
//           {
//             "gemini_id": 7,
//             "x": 1,
//             "y": 91.4052118111867
//           },
//           {
//             "gemini_id": 8,
//             "x": 1,
//             "y": 85.3309176496696
//           },
//           {
//             "gemini_id": 9,
//             "x": 1,
//             "y": 83.2656172472052
//           },
//           {
//             "gemini_id": 10,
//             "x": 1,
//             "y": 92.3489408034366
//           },
//           {
//             "gemini_id": 11,
//             "x": 1,
//             "y": 82.899547266541
//           },
//           {
//             "gemini_id": 12,
//             "x": 1,
//             "y": 84.7384647994768
//           },
//           {
//             "gemini_id": 13,
//             "x": 1,
//             "y": 90.1877911367919
//           },
//           {
//             "gemini_id": 14,
//             "x": 1,
//             "y": 90.3138903337531
//           },
//           {
//             "gemini_id": 15,
//             "x": 1,
//             "y": 90.3365755749401
//           },
//           {
//             "gemini_id": 16,
//             "x": 1,
//             "y": 89.6885157823563
//           },
//           {
//             "gemini_id": 17,
//             "x": 1,
//             "y": 89.657391943736
//           },
//           {
//             "gemini_id": 18,
//             "x": 1,
//             "y": 89.8103184474166
//           },
//           {
//             "gemini_id": 19,
//             "x": 1,
//             "y": 85.0068552203011
//           },
//           {
//             "gemini_id": 20,
//             "x": 1,
//             "y": 90.1445505130105
//           },
//           {
//             "gemini_id": 21,
//             "x": 1,
//             "y": 90.2597002927214
//           },
//           {
//             "gemini_id": 22,
//             "x": 1,
//             "y": 85.1630066898651
//           },
//           {
//             "gemini_id": 23,
//             "x": 1,
//             "y": 89.5807276440319
//           },
//           {
//             "gemini_id": 24,
//             "x": 1,
//             "y": 85.3773716066498
//           },
//           {
//             "gemini_id": 25,
//             "x": 1,
//             "y": 85.0828845105134
//           },
//           {
//             "gemini_id": 26,
//             "x": 1,
//             "y": 91.4775695463177
//           },
//           {
//             "gemini_id": 27,
//             "x": 1,
//             "y": 90.5421400056221
//           },
//           {
//             "gemini_id": 28,
//             "x": 1,
//             "y": 90.9508253019303
//           },
//           {
//             "gemini_id": 29,
//             "x": 1,
//             "y": 84.3256172758993
//           },
//           {
//             "gemini_id": 30,
//             "x": 1,
//             "y": 90.7608228451572
//           },
//           {
//             "gemini_id": 31,
//             "x": 1,
//             "y": 91.2149588565808
//           },
//           {
//             "gemini_id": 32,
//             "x": 1,
//             "y": 91.4811559985392
//           },
//           {
//             "gemini_id": 33,
//             "x": 1,
//             "y": 91.203505871119
//           },
//           {
//             "gemini_id": 34,
//             "x": 1,
//             "y": 84.1406831252389
//           },
//           {
//             "gemini_id": 35,
//             "x": 1,
//             "y": 90.900099467719
//           },
//           {
//             "gemini_id": 36,
//             "x": 1,
//             "y": 91.3447520111222
//           },
//           {
//             "gemini_id": 37,
//             "x": 1,
//             "y": 90.6169246234931
//           },
//           {
//             "gemini_id": 38,
//             "x": 1,
//             "y": 91.1798533124384
//           },
//           {
//             "gemini_id": 39,
//             "x": 1,
//             "y": 91.2493746823166
//           },
//           {
//             "gemini_id": 40,
//             "x": 1,
//             "y": 91.4049337708857
//           },
//           {
//             "gemini_id": 41,
//             "x": 1,
//             "y": 91.1165353488177
//           },
//           {
//             "gemini_id": 42,
//             "x": 1,
//             "y": 91.1068642993923
//           },
//           {
//             "gemini_id": 43,
//             "x": 1,
//             "y": 86.0538539250847
//           },
//           {
//             "gemini_id": 44,
//             "x": 1,
//             "y": 90.6704280367121
//           },
//           {
//             "gemini_id": 45,
//             "x": 1,
//             "y": 91.4698466714472
//           },
//           {
//             "gemini_id": 46,
//             "x": 1,
//             "y": 91.0579056167044
//           },
//           {
//             "gemini_id": 47,
//             "x": 1,
//             "y": 93.1602621641941
//           },
//           {
//             "gemini_id": 48,
//             "x": 1,
//             "y": 85.9106459924951
//           },
//           {
//             "gemini_id": 49,
//             "x": 1,
//             "y": 93.4098555028904
//           },
//           {
//             "gemini_id": 50,
//             "x": 1,
//             "y": 90.9434416298755
//           },
//           {
//             "gemini_id": 51,
//             "x": 1,
//             "y": 91.1740557027515
//           },
//           {
//             "gemini_id": 52,
//             "x": 1,
//             "y": 86.0406335154548
//           },
//           {
//             "gemini_id": 53,
//             "x": 1,
//             "y": 93.0570627038833
//           },
//           {
//             "gemini_id": 54,
//             "x": 1,
//             "y": 91.2401522365399
//           },
//           {
//             "gemini_id": 55,
//             "x": 1,
//             "y": 90.5011388328858
//           },
//           {
//             "gemini_id": 56,
//             "x": 1,
//             "y": 85.3303201349918
//           },
//           {
//             "gemini_id": 57,
//             "x": 1,
//             "y": 90.6040293425322
//           },
//           {
//             "gemini_id": 58,
//             "x": 1,
//             "y": 85.4951418309938
//           },
//           {
//             "gemini_id": 59,
//             "x": 1,
//             "y": 91.4005046924576
//           },
//           {
//             "gemini_id": 60,
//             "x": 1,
//             "y": 91.1476999609731
//           },
//           {
//             "gemini_id": 61,
//             "x": 1,
//             "y": 90.7045878821518
//           },
//           {
//             "gemini_id": 62,
//             "x": 1,
//             "y": 90.6188371984754
//           },
//           {
//             "gemini_id": 63,
//             "x": 1,
//             "y": 90.5633510330226
//           },
//           {
//             "gemini_id": 64,
//             "x": 1,
//             "y": 90.5981954357121
//           },
//           {
//             "gemini_id": 65,
//             "x": 1,
//             "y": 91.1700340267271
//           },
//           {
//             "gemini_id": 66,
//             "x": 1,
//             "y": 90.7472879537381
//           },
//           {
//             "gemini_id": 67,
//             "x": 1,
//             "y": 86.4447282091714
//           },
//           {
//             "gemini_id": 68,
//             "x": 1,
//             "y": 92.0161147855688
//           },
//           {
//             "gemini_id": 69,
//             "x": 1,
//             "y": 92.2819435379934
//           },
//           {
//             "gemini_id": 70,
//             "x": 1,
//             "y": 91.5201518230606
//           },
//           {
//             "gemini_id": 71,
//             "x": 1,
//             "y": 92.2406232669018
//           },
//           {
//             "gemini_id": 72,
//             "x": 1,
//             "y": 92.7338204937987
//           },
//           {
//             "gemini_id": 73,
//             "x": 1,
//             "y": 86.3678887020797
//           },
//           {
//             "gemini_id": 74,
//             "x": 1,
//             "y": 84.5408536496107
//           },
//           {
//             "gemini_id": 75,
//             "x": 1,
//             "y": 91.6161431246437
//           },
//           {
//             "gemini_id": 76,
//             "x": 1,
//             "y": 92.0414693744387
//           },
//           {
//             "gemini_id": 77,
//             "x": 1,
//             "y": 92.2921498068608
//           },
//           {
//             "gemini_id": 78,
//             "x": 1,
//             "y": 91.6981512298808
//           },
//           {
//             "gemini_id": 79,
//             "x": 1,
//             "y": 91.8960476492066
//           },
//           {
//             "gemini_id": 80,
//             "x": 1,
//             "y": 92.4187721665949
//           },
//           {
//             "gemini_id": 81,
//             "x": 1,
//             "y": 87.049029128626
//           },
//           {
//             "gemini_id": 82,
//             "x": 1,
//             "y": 91.8766731780488
//           },
//           {
//             "gemini_id": 83,
//             "x": 1,
//             "y": 92.3804325407837
//           },
//           {
//             "gemini_id": 84,
//             "x": 1,
//             "y": 92.1729675922543
//           },
//           {
//             "gemini_id": 85,
//             "x": 1,
//             "y": 93.1600916916505
//           },
//           {
//             "gemini_id": 86,
//             "x": 1,
//             "y": 92.1522822889965
//           },
//           {
//             "gemini_id": 87,
//             "x": 1,
//             "y": 85.4612494898029
//           },
//           {
//             "gemini_id": 88,
//             "x": 1,
//             "y": 92.1945560907479
//           },
//           {
//             "gemini_id": 89,
//             "x": 1,
//             "y": 86.6827135430649
//           },
//           {
//             "gemini_id": 90,
//             "x": 1,
//             "y": 91.5597189620603
//           },
//           {
//             "gemini_id": 91,
//             "x": 1,
//             "y": 91.992212592857
//           },
//           {
//             "gemini_id": 92,
//             "x": 1,
//             "y": 92.4685412924737
//           },
//           {
//             "gemini_id": 93,
//             "x": 1,
//             "y": 93.7030599385034
//           },
//           {
//             "gemini_id": 94,
//             "x": 1,
//             "y": 87.4391794742551
//           },
//           {
//             "gemini_id": 95,
//             "x": 1,
//             "y": 91.9892992568202
//           },
//           {
//             "gemini_id": 96,
//             "x": 1,
//             "y": 91.9956347632688
//           },
//           {
//             "gemini_id": 97,
//             "x": 1,
//             "y": 92.3084856946953
//           },
//           {
//             "gemini_id": 98,
//             "x": 1,
//             "y": 91.7435715948232
//           },
//           {
//             "gemini_id": 99,
//             "x": 1,
//             "y": 93.833772216225
//           },
//           {
//             "gemini_id": 100,
//             "x": 1,
//             "y": 94.0215112566948
//           }
//         ]
//       },
//       "mark": {
//         "type": "point",
//         "filled": true
//       },
//       "encoding": {
//         "x": {
//           "field": "x",
//           "type": "quantitative",
//           "axis": {
//             "values": [1, 1],
//             "labelExpr": ""
//           },
//           "title": "",
//           "scale": {
//             "domain": [0.5, 1.5]
//           }
//         },
//         "y": {
//           "field": "y",
//           "type": "quantitative",
//           "title": "Salary",
//           "scale": {
//             "domain": [81.9445013836958, 94.0215112566948]
//           }
//         }
//       }
//     },
//     {
//       "height": 300,
//       "width": 300,
//       "$schema": "https://vega.github.io/schema/vega-lite/v4.json",
//       "meta": {
//         "axes": false,
//         "description": "Plot mean Salary of each group"
//       },
//       "data": {
//         "values": [
//           {
//             "gemini_id": 1,
//             "x": 1,
//             "y": 89.6717301998171
//           },
//           {
//             "gemini_id": 2,
//             "x": 1,
//             "y": 89.6717301998171
//           },
//           {
//             "gemini_id": 3,
//             "x": 1,
//             "y": 89.6717301998171
//           },
//           {
//             "gemini_id": 4,
//             "x": 1,
//             "y": 89.6717301998171
//           },
//           {
//             "gemini_id": 5,
//             "x": 1,
//             "y": 89.6717301998171
//           },
//           {
//             "gemini_id": 6,
//             "x": 1,
//             "y": 89.6717301998171
//           },
//           {
//             "gemini_id": 7,
//             "x": 1,
//             "y": 89.6717301998171
//           },
//           {
//             "gemini_id": 8,
//             "x": 1,
//             "y": 89.6717301998171
//           },
//           {
//             "gemini_id": 9,
//             "x": 1,
//             "y": 89.6717301998171
//           },
//           {
//             "gemini_id": 10,
//             "x": 1,
//             "y": 89.6717301998171
//           },
//           {
//             "gemini_id": 11,
//             "x": 1,
//             "y": 89.6717301998171
//           },
//           {
//             "gemini_id": 12,
//             "x": 1,
//             "y": 89.6717301998171
//           },
//           {
//             "gemini_id": 13,
//             "x": 1,
//             "y": 89.6717301998171
//           },
//           {
//             "gemini_id": 14,
//             "x": 1,
//             "y": 89.6717301998171
//           },
//           {
//             "gemini_id": 15,
//             "x": 1,
//             "y": 89.6717301998171
//           },
//           {
//             "gemini_id": 16,
//             "x": 1,
//             "y": 89.6717301998171
//           },
//           {
//             "gemini_id": 17,
//             "x": 1,
//             "y": 89.6717301998171
//           },
//           {
//             "gemini_id": 18,
//             "x": 1,
//             "y": 89.6717301998171
//           },
//           {
//             "gemini_id": 19,
//             "x": 1,
//             "y": 89.6717301998171
//           },
//           {
//             "gemini_id": 20,
//             "x": 1,
//             "y": 89.6717301998171
//           },
//           {
//             "gemini_id": 21,
//             "x": 1,
//             "y": 89.6717301998171
//           },
//           {
//             "gemini_id": 22,
//             "x": 1,
//             "y": 89.6717301998171
//           },
//           {
//             "gemini_id": 23,
//             "x": 1,
//             "y": 89.6717301998171
//           },
//           {
//             "gemini_id": 24,
//             "x": 1,
//             "y": 89.6717301998171
//           },
//           {
//             "gemini_id": 25,
//             "x": 1,
//             "y": 89.6717301998171
//           },
//           {
//             "gemini_id": 26,
//             "x": 1,
//             "y": 89.6717301998171
//           },
//           {
//             "gemini_id": 27,
//             "x": 1,
//             "y": 89.6717301998171
//           },
//           {
//             "gemini_id": 28,
//             "x": 1,
//             "y": 89.6717301998171
//           },
//           {
//             "gemini_id": 29,
//             "x": 1,
//             "y": 89.6717301998171
//           },
//           {
//             "gemini_id": 30,
//             "x": 1,
//             "y": 89.6717301998171
//           },
//           {
//             "gemini_id": 31,
//             "x": 1,
//             "y": 89.6717301998171
//           },
//           {
//             "gemini_id": 32,
//             "x": 1,
//             "y": 89.6717301998171
//           },
//           {
//             "gemini_id": 33,
//             "x": 1,
//             "y": 89.6717301998171
//           },
//           {
//             "gemini_id": 34,
//             "x": 1,
//             "y": 89.6717301998171
//           },
//           {
//             "gemini_id": 35,
//             "x": 1,
//             "y": 89.6717301998171
//           },
//           {
//             "gemini_id": 36,
//             "x": 1,
//             "y": 89.6717301998171
//           },
//           {
//             "gemini_id": 37,
//             "x": 1,
//             "y": 89.6717301998171
//           },
//           {
//             "gemini_id": 38,
//             "x": 1,
//             "y": 89.6717301998171
//           },
//           {
//             "gemini_id": 39,
//             "x": 1,
//             "y": 89.6717301998171
//           },
//           {
//             "gemini_id": 40,
//             "x": 1,
//             "y": 89.6717301998171
//           },
//           {
//             "gemini_id": 41,
//             "x": 1,
//             "y": 89.6717301998171
//           },
//           {
//             "gemini_id": 42,
//             "x": 1,
//             "y": 89.6717301998171
//           },
//           {
//             "gemini_id": 43,
//             "x": 1,
//             "y": 89.6717301998171
//           },
//           {
//             "gemini_id": 44,
//             "x": 1,
//             "y": 89.6717301998171
//           },
//           {
//             "gemini_id": 45,
//             "x": 1,
//             "y": 89.6717301998171
//           },
//           {
//             "gemini_id": 46,
//             "x": 1,
//             "y": 89.6717301998171
//           },
//           {
//             "gemini_id": 47,
//             "x": 1,
//             "y": 89.6717301998171
//           },
//           {
//             "gemini_id": 48,
//             "x": 1,
//             "y": 89.6717301998171
//           },
//           {
//             "gemini_id": 49,
//             "x": 1,
//             "y": 89.6717301998171
//           },
//           {
//             "gemini_id": 50,
//             "x": 1,
//             "y": 89.6717301998171
//           },
//           {
//             "gemini_id": 51,
//             "x": 1,
//             "y": 89.6717301998171
//           },
//           {
//             "gemini_id": 52,
//             "x": 1,
//             "y": 89.6717301998171
//           },
//           {
//             "gemini_id": 53,
//             "x": 1,
//             "y": 89.6717301998171
//           },
//           {
//             "gemini_id": 54,
//             "x": 1,
//             "y": 89.6717301998171
//           },
//           {
//             "gemini_id": 55,
//             "x": 1,
//             "y": 89.6717301998171
//           },
//           {
//             "gemini_id": 56,
//             "x": 1,
//             "y": 89.6717301998171
//           },
//           {
//             "gemini_id": 57,
//             "x": 1,
//             "y": 89.6717301998171
//           },
//           {
//             "gemini_id": 58,
//             "x": 1,
//             "y": 89.6717301998171
//           },
//           {
//             "gemini_id": 59,
//             "x": 1,
//             "y": 89.6717301998171
//           },
//           {
//             "gemini_id": 60,
//             "x": 1,
//             "y": 89.6717301998171
//           },
//           {
//             "gemini_id": 61,
//             "x": 1,
//             "y": 89.6717301998171
//           },
//           {
//             "gemini_id": 62,
//             "x": 1,
//             "y": 89.6717301998171
//           },
//           {
//             "gemini_id": 63,
//             "x": 1,
//             "y": 89.6717301998171
//           },
//           {
//             "gemini_id": 64,
//             "x": 1,
//             "y": 89.6717301998171
//           },
//           {
//             "gemini_id": 65,
//             "x": 1,
//             "y": 89.6717301998171
//           },
//           {
//             "gemini_id": 66,
//             "x": 1,
//             "y": 89.6717301998171
//           },
//           {
//             "gemini_id": 67,
//             "x": 1,
//             "y": 89.6717301998171
//           },
//           {
//             "gemini_id": 68,
//             "x": 1,
//             "y": 89.6717301998171
//           },
//           {
//             "gemini_id": 69,
//             "x": 1,
//             "y": 89.6717301998171
//           },
//           {
//             "gemini_id": 70,
//             "x": 1,
//             "y": 89.6717301998171
//           },
//           {
//             "gemini_id": 71,
//             "x": 1,
//             "y": 89.6717301998171
//           },
//           {
//             "gemini_id": 72,
//             "x": 1,
//             "y": 89.6717301998171
//           },
//           {
//             "gemini_id": 73,
//             "x": 1,
//             "y": 89.6717301998171
//           },
//           {
//             "gemini_id": 74,
//             "x": 1,
//             "y": 89.6717301998171
//           },
//           {
//             "gemini_id": 75,
//             "x": 1,
//             "y": 89.6717301998171
//           },
//           {
//             "gemini_id": 76,
//             "x": 1,
//             "y": 89.6717301998171
//           },
//           {
//             "gemini_id": 77,
//             "x": 1,
//             "y": 89.6717301998171
//           },
//           {
//             "gemini_id": 78,
//             "x": 1,
//             "y": 89.6717301998171
//           },
//           {
//             "gemini_id": 79,
//             "x": 1,
//             "y": 89.6717301998171
//           },
//           {
//             "gemini_id": 80,
//             "x": 1,
//             "y": 89.6717301998171
//           },
//           {
//             "gemini_id": 81,
//             "x": 1,
//             "y": 89.6717301998171
//           },
//           {
//             "gemini_id": 82,
//             "x": 1,
//             "y": 89.6717301998171
//           },
//           {
//             "gemini_id": 83,
//             "x": 1,
//             "y": 89.6717301998171
//           },
//           {
//             "gemini_id": 84,
//             "x": 1,
//             "y": 89.6717301998171
//           },
//           {
//             "gemini_id": 85,
//             "x": 1,
//             "y": 89.6717301998171
//           },
//           {
//             "gemini_id": 86,
//             "x": 1,
//             "y": 89.6717301998171
//           },
//           {
//             "gemini_id": 87,
//             "x": 1,
//             "y": 89.6717301998171
//           },
//           {
//             "gemini_id": 88,
//             "x": 1,
//             "y": 89.6717301998171
//           },
//           {
//             "gemini_id": 89,
//             "x": 1,
//             "y": 89.6717301998171
//           },
//           {
//             "gemini_id": 90,
//             "x": 1,
//             "y": 89.6717301998171
//           },
//           {
//             "gemini_id": 91,
//             "x": 1,
//             "y": 89.6717301998171
//           },
//           {
//             "gemini_id": 92,
//             "x": 1,
//             "y": 89.6717301998171
//           },
//           {
//             "gemini_id": 93,
//             "x": 1,
//             "y": 89.6717301998171
//           },
//           {
//             "gemini_id": 94,
//             "x": 1,
//             "y": 89.6717301998171
//           },
//           {
//             "gemini_id": 95,
//             "x": 1,
//             "y": 89.6717301998171
//           },
//           {
//             "gemini_id": 96,
//             "x": 1,
//             "y": 89.6717301998171
//           },
//           {
//             "gemini_id": 97,
//             "x": 1,
//             "y": 89.6717301998171
//           },
//           {
//             "gemini_id": 98,
//             "x": 1,
//             "y": 89.6717301998171
//           },
//           {
//             "gemini_id": 99,
//             "x": 1,
//             "y": 89.6717301998171
//           },
//           {
//             "gemini_id": 100,
//             "x": 1,
//             "y": 89.6717301998171
//           }
//         ]
//       },
//       "mark": {
//         "type": "point",
//         "filled": true
//       },
//       "encoding": {
//         "x": {
//           "field": "x",
//           "type": "quantitative",
//           "axis": {
//             "values": [1, 1],
//             "labelExpr": ""
//           },
//           "title": "",
//           "scale": {
//             "domain": [0.5, 1.5]
//           }
//         },
//         "y": {
//           "field": "y",
//           "type": "quantitative",
//           "title": "Salary",
//           "scale": {
//             "domain": [81.9445013836958, 94.0215112566948]
//           }
//         }
//       }
//     },
//     {
//       "height": 300,
//       "width": 300,
//       "$schema": "https://vega.github.io/schema/vega-lite/v4.json",
//       "meta": {
//         "axes": false,
//         "description": "Plot mean Salary of each group, with errorbar"
//       },
//       "data": {
//         "values": [
//           {
//             "gemini_id": 1,
//             "x": 1,
//             "y": 89.6717301998171,
//             "y_raw": 81.9445013836958
//           },
//           {
//             "gemini_id": 2,
//             "x": 1,
//             "y": 89.6717301998171,
//             "y_raw": 84.4868333523627
//           },
//           {
//             "gemini_id": 3,
//             "x": 1,
//             "y": 89.6717301998171,
//             "y_raw": 82.8953005648218
//           },
//           {
//             "gemini_id": 4,
//             "x": 1,
//             "y": 89.6717301998171,
//             "y_raw": 83.8469139884692
//           },
//           {
//             "gemini_id": 5,
//             "x": 1,
//             "y": 89.6717301998171,
//             "y_raw": 83.7531382157467
//           },
//           {
//             "gemini_id": 6,
//             "x": 1,
//             "y": 89.6717301998171,
//             "y_raw": 85.2683244312648
//           },
//           {
//             "gemini_id": 7,
//             "x": 1,
//             "y": 89.6717301998171,
//             "y_raw": 91.4052118111867
//           },
//           {
//             "gemini_id": 8,
//             "x": 1,
//             "y": 89.6717301998171,
//             "y_raw": 85.3309176496696
//           },
//           {
//             "gemini_id": 9,
//             "x": 1,
//             "y": 89.6717301998171,
//             "y_raw": 83.2656172472052
//           },
//           {
//             "gemini_id": 10,
//             "x": 1,
//             "y": 89.6717301998171,
//             "y_raw": 92.3489408034366
//           },
//           {
//             "gemini_id": 11,
//             "x": 1,
//             "y": 89.6717301998171,
//             "y_raw": 82.899547266541
//           },
//           {
//             "gemini_id": 12,
//             "x": 1,
//             "y": 89.6717301998171,
//             "y_raw": 84.7384647994768
//           },
//           {
//             "gemini_id": 13,
//             "x": 1,
//             "y": 89.6717301998171,
//             "y_raw": 90.1877911367919
//           },
//           {
//             "gemini_id": 14,
//             "x": 1,
//             "y": 89.6717301998171,
//             "y_raw": 90.3138903337531
//           },
//           {
//             "gemini_id": 15,
//             "x": 1,
//             "y": 89.6717301998171,
//             "y_raw": 90.3365755749401
//           },
//           {
//             "gemini_id": 16,
//             "x": 1,
//             "y": 89.6717301998171,
//             "y_raw": 89.6885157823563
//           },
//           {
//             "gemini_id": 17,
//             "x": 1,
//             "y": 89.6717301998171,
//             "y_raw": 89.657391943736
//           },
//           {
//             "gemini_id": 18,
//             "x": 1,
//             "y": 89.6717301998171,
//             "y_raw": 89.8103184474166
//           },
//           {
//             "gemini_id": 19,
//             "x": 1,
//             "y": 89.6717301998171,
//             "y_raw": 85.0068552203011
//           },
//           {
//             "gemini_id": 20,
//             "x": 1,
//             "y": 89.6717301998171,
//             "y_raw": 90.1445505130105
//           },
//           {
//             "gemini_id": 21,
//             "x": 1,
//             "y": 89.6717301998171,
//             "y_raw": 90.2597002927214
//           },
//           {
//             "gemini_id": 22,
//             "x": 1,
//             "y": 89.6717301998171,
//             "y_raw": 85.1630066898651
//           },
//           {
//             "gemini_id": 23,
//             "x": 1,
//             "y": 89.6717301998171,
//             "y_raw": 89.5807276440319
//           },
//           {
//             "gemini_id": 24,
//             "x": 1,
//             "y": 89.6717301998171,
//             "y_raw": 85.3773716066498
//           },
//           {
//             "gemini_id": 25,
//             "x": 1,
//             "y": 89.6717301998171,
//             "y_raw": 85.0828845105134
//           },
//           {
//             "gemini_id": 26,
//             "x": 1,
//             "y": 89.6717301998171,
//             "y_raw": 91.4775695463177
//           },
//           {
//             "gemini_id": 27,
//             "x": 1,
//             "y": 89.6717301998171,
//             "y_raw": 90.5421400056221
//           },
//           {
//             "gemini_id": 28,
//             "x": 1,
//             "y": 89.6717301998171,
//             "y_raw": 90.9508253019303
//           },
//           {
//             "gemini_id": 29,
//             "x": 1,
//             "y": 89.6717301998171,
//             "y_raw": 84.3256172758993
//           },
//           {
//             "gemini_id": 30,
//             "x": 1,
//             "y": 89.6717301998171,
//             "y_raw": 90.7608228451572
//           },
//           {
//             "gemini_id": 31,
//             "x": 1,
//             "y": 89.6717301998171,
//             "y_raw": 91.2149588565808
//           },
//           {
//             "gemini_id": 32,
//             "x": 1,
//             "y": 89.6717301998171,
//             "y_raw": 91.4811559985392
//           },
//           {
//             "gemini_id": 33,
//             "x": 1,
//             "y": 89.6717301998171,
//             "y_raw": 91.203505871119
//           },
//           {
//             "gemini_id": 34,
//             "x": 1,
//             "y": 89.6717301998171,
//             "y_raw": 84.1406831252389
//           },
//           {
//             "gemini_id": 35,
//             "x": 1,
//             "y": 89.6717301998171,
//             "y_raw": 90.900099467719
//           },
//           {
//             "gemini_id": 36,
//             "x": 1,
//             "y": 89.6717301998171,
//             "y_raw": 91.3447520111222
//           },
//           {
//             "gemini_id": 37,
//             "x": 1,
//             "y": 89.6717301998171,
//             "y_raw": 90.6169246234931
//           },
//           {
//             "gemini_id": 38,
//             "x": 1,
//             "y": 89.6717301998171,
//             "y_raw": 91.1798533124384
//           },
//           {
//             "gemini_id": 39,
//             "x": 1,
//             "y": 89.6717301998171,
//             "y_raw": 91.2493746823166
//           },
//           {
//             "gemini_id": 40,
//             "x": 1,
//             "y": 89.6717301998171,
//             "y_raw": 91.4049337708857
//           },
//           {
//             "gemini_id": 41,
//             "x": 1,
//             "y": 89.6717301998171,
//             "y_raw": 91.1165353488177
//           },
//           {
//             "gemini_id": 42,
//             "x": 1,
//             "y": 89.6717301998171,
//             "y_raw": 91.1068642993923
//           },
//           {
//             "gemini_id": 43,
//             "x": 1,
//             "y": 89.6717301998171,
//             "y_raw": 86.0538539250847
//           },
//           {
//             "gemini_id": 44,
//             "x": 1,
//             "y": 89.6717301998171,
//             "y_raw": 90.6704280367121
//           },
//           {
//             "gemini_id": 45,
//             "x": 1,
//             "y": 89.6717301998171,
//             "y_raw": 91.4698466714472
//           },
//           {
//             "gemini_id": 46,
//             "x": 1,
//             "y": 89.6717301998171,
//             "y_raw": 91.0579056167044
//           },
//           {
//             "gemini_id": 47,
//             "x": 1,
//             "y": 89.6717301998171,
//             "y_raw": 93.1602621641941
//           },
//           {
//             "gemini_id": 48,
//             "x": 1,
//             "y": 89.6717301998171,
//             "y_raw": 85.9106459924951
//           },
//           {
//             "gemini_id": 49,
//             "x": 1,
//             "y": 89.6717301998171,
//             "y_raw": 93.4098555028904
//           },
//           {
//             "gemini_id": 50,
//             "x": 1,
//             "y": 89.6717301998171,
//             "y_raw": 90.9434416298755
//           },
//           {
//             "gemini_id": 51,
//             "x": 1,
//             "y": 89.6717301998171,
//             "y_raw": 91.1740557027515
//           },
//           {
//             "gemini_id": 52,
//             "x": 1,
//             "y": 89.6717301998171,
//             "y_raw": 86.0406335154548
//           },
//           {
//             "gemini_id": 53,
//             "x": 1,
//             "y": 89.6717301998171,
//             "y_raw": 93.0570627038833
//           },
//           {
//             "gemini_id": 54,
//             "x": 1,
//             "y": 89.6717301998171,
//             "y_raw": 91.2401522365399
//           },
//           {
//             "gemini_id": 55,
//             "x": 1,
//             "y": 89.6717301998171,
//             "y_raw": 90.5011388328858
//           },
//           {
//             "gemini_id": 56,
//             "x": 1,
//             "y": 89.6717301998171,
//             "y_raw": 85.3303201349918
//           },
//           {
//             "gemini_id": 57,
//             "x": 1,
//             "y": 89.6717301998171,
//             "y_raw": 90.6040293425322
//           },
//           {
//             "gemini_id": 58,
//             "x": 1,
//             "y": 89.6717301998171,
//             "y_raw": 85.4951418309938
//           },
//           {
//             "gemini_id": 59,
//             "x": 1,
//             "y": 89.6717301998171,
//             "y_raw": 91.4005046924576
//           },
//           {
//             "gemini_id": 60,
//             "x": 1,
//             "y": 89.6717301998171,
//             "y_raw": 91.1476999609731
//           },
//           {
//             "gemini_id": 61,
//             "x": 1,
//             "y": 89.6717301998171,
//             "y_raw": 90.7045878821518
//           },
//           {
//             "gemini_id": 62,
//             "x": 1,
//             "y": 89.6717301998171,
//             "y_raw": 90.6188371984754
//           },
//           {
//             "gemini_id": 63,
//             "x": 1,
//             "y": 89.6717301998171,
//             "y_raw": 90.5633510330226
//           },
//           {
//             "gemini_id": 64,
//             "x": 1,
//             "y": 89.6717301998171,
//             "y_raw": 90.5981954357121
//           },
//           {
//             "gemini_id": 65,
//             "x": 1,
//             "y": 89.6717301998171,
//             "y_raw": 91.1700340267271
//           },
//           {
//             "gemini_id": 66,
//             "x": 1,
//             "y": 89.6717301998171,
//             "y_raw": 90.7472879537381
//           },
//           {
//             "gemini_id": 67,
//             "x": 1,
//             "y": 89.6717301998171,
//             "y_raw": 86.4447282091714
//           },
//           {
//             "gemini_id": 68,
//             "x": 1,
//             "y": 89.6717301998171,
//             "y_raw": 92.0161147855688
//           },
//           {
//             "gemini_id": 69,
//             "x": 1,
//             "y": 89.6717301998171,
//             "y_raw": 92.2819435379934
//           },
//           {
//             "gemini_id": 70,
//             "x": 1,
//             "y": 89.6717301998171,
//             "y_raw": 91.5201518230606
//           },
//           {
//             "gemini_id": 71,
//             "x": 1,
//             "y": 89.6717301998171,
//             "y_raw": 92.2406232669018
//           },
//           {
//             "gemini_id": 72,
//             "x": 1,
//             "y": 89.6717301998171,
//             "y_raw": 92.7338204937987
//           },
//           {
//             "gemini_id": 73,
//             "x": 1,
//             "y": 89.6717301998171,
//             "y_raw": 86.3678887020797
//           },
//           {
//             "gemini_id": 74,
//             "x": 1,
//             "y": 89.6717301998171,
//             "y_raw": 84.5408536496107
//           },
//           {
//             "gemini_id": 75,
//             "x": 1,
//             "y": 89.6717301998171,
//             "y_raw": 91.6161431246437
//           },
//           {
//             "gemini_id": 76,
//             "x": 1,
//             "y": 89.6717301998171,
//             "y_raw": 92.0414693744387
//           },
//           {
//             "gemini_id": 77,
//             "x": 1,
//             "y": 89.6717301998171,
//             "y_raw": 92.2921498068608
//           },
//           {
//             "gemini_id": 78,
//             "x": 1,
//             "y": 89.6717301998171,
//             "y_raw": 91.6981512298808
//           },
//           {
//             "gemini_id": 79,
//             "x": 1,
//             "y": 89.6717301998171,
//             "y_raw": 91.8960476492066
//           },
//           {
//             "gemini_id": 80,
//             "x": 1,
//             "y": 89.6717301998171,
//             "y_raw": 92.4187721665949
//           },
//           {
//             "gemini_id": 81,
//             "x": 1,
//             "y": 89.6717301998171,
//             "y_raw": 87.049029128626
//           },
//           {
//             "gemini_id": 82,
//             "x": 1,
//             "y": 89.6717301998171,
//             "y_raw": 91.8766731780488
//           },
//           {
//             "gemini_id": 83,
//             "x": 1,
//             "y": 89.6717301998171,
//             "y_raw": 92.3804325407837
//           },
//           {
//             "gemini_id": 84,
//             "x": 1,
//             "y": 89.6717301998171,
//             "y_raw": 92.1729675922543
//           },
//           {
//             "gemini_id": 85,
//             "x": 1,
//             "y": 89.6717301998171,
//             "y_raw": 93.1600916916505
//           },
//           {
//             "gemini_id": 86,
//             "x": 1,
//             "y": 89.6717301998171,
//             "y_raw": 92.1522822889965
//           },
//           {
//             "gemini_id": 87,
//             "x": 1,
//             "y": 89.6717301998171,
//             "y_raw": 85.4612494898029
//           },
//           {
//             "gemini_id": 88,
//             "x": 1,
//             "y": 89.6717301998171,
//             "y_raw": 92.1945560907479
//           },
//           {
//             "gemini_id": 89,
//             "x": 1,
//             "y": 89.6717301998171,
//             "y_raw": 86.6827135430649
//           },
//           {
//             "gemini_id": 90,
//             "x": 1,
//             "y": 89.6717301998171,
//             "y_raw": 91.5597189620603
//           },
//           {
//             "gemini_id": 91,
//             "x": 1,
//             "y": 89.6717301998171,
//             "y_raw": 91.992212592857
//           },
//           {
//             "gemini_id": 92,
//             "x": 1,
//             "y": 89.6717301998171,
//             "y_raw": 92.4685412924737
//           },
//           {
//             "gemini_id": 93,
//             "x": 1,
//             "y": 89.6717301998171,
//             "y_raw": 93.7030599385034
//           },
//           {
//             "gemini_id": 94,
//             "x": 1,
//             "y": 89.6717301998171,
//             "y_raw": 87.4391794742551
//           },
//           {
//             "gemini_id": 95,
//             "x": 1,
//             "y": 89.6717301998171,
//             "y_raw": 91.9892992568202
//           },
//           {
//             "gemini_id": 96,
//             "x": 1,
//             "y": 89.6717301998171,
//             "y_raw": 91.9956347632688
//           },
//           {
//             "gemini_id": 97,
//             "x": 1,
//             "y": 89.6717301998171,
//             "y_raw": 92.3084856946953
//           },
//           {
//             "gemini_id": 98,
//             "x": 1,
//             "y": 89.6717301998171,
//             "y_raw": 91.7435715948232
//           },
//           {
//             "gemini_id": 99,
//             "x": 1,
//             "y": 89.6717301998171,
//             "y_raw": 93.833772216225
//           },
//           {
//             "gemini_id": 100,
//             "x": 1,
//             "y": 89.6717301998171,
//             "y_raw": 94.0215112566948
//           }
//         ]
//       },
//       "layer": [
//         {
//           "mark": "errorbar",
//           "encoding": {
//             "x": {
//               "field": "x",
//               "type": "quantitative",
//               "axis": {
//                 "values": [1, 1],
//                 "labelExpr": ""
//               },
//               "title": "",
//               "scale": {
//                 "domain": [0.5, 1.5]
//               }
//             },
//             "y": {
//               "field": "y_raw",
//               "type": "quantitative",
//               "title": "Salary",
//               "scale": {
//                 "domain": [81.9445013836958, 94.0215112566948]
//               }
//             }
//           }
//         },
//         {
//           "mark": {
//             "type": "point",
//             "filled": true
//           },
//           "encoding": {
//             "x": {
//               "field": "x",
//               "type": "quantitative",
//               "axis": {
//                 "values": [1, 1],
//                 "labelExpr": ""
//               },
//               "title": "",
//               "scale": {
//                 "domain": [0.5, 1.5]
//               }
//             },
//             "y": {
//               "field": "y",
//               "type": "quantitative",
//               "title": "Salary",
//               "scale": {
//                 "domain": [81.9445013836958, 94.0215112566948]
//               }
//             }
//           }
//         }
//       ]
//     }
//   ]
// })