const repoUrl = "https://raw.githubusercontent.com/jhofman/datamations";
// const dataUrl = "./data/";
const dataUrl = repoUrl + "/fixes/sandbox/specs-for-infogrid/";
const frameDuration = 2000;

let vegaLiteSpecs, vegaSpecs, frames, metas, rawFiles;

let counter = 0,
  intervalId;

async function init(id, { specUrls, specs, autoPlay }) {
  vegaLiteSpecs = [];
  rawFiles = [];

  if (specs) {
    vegaLiteSpecs = specs;
  } else if (specUrls) {
    vegaLiteSpecs = await loadData(specUrls);
  }

  const { slider } = getSelectors(id);

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
    } else if (vlSpec.layer || (vlSpec.spec && vlSpec.spec.layer)) {
      const arr = splitLayers(vlSpec);
      vegaLiteSpecs[i] = [];

      for (let j = 0; j < arr.length; j++) {
        const s = arr[j];
        // fake facets
        if (s.facet && s.spec) {
          const newSpec = await hackFacet(s);
          vegaLiteSpecs[i].push(newSpec);
        } else {
          vegaLiteSpecs[i].push(s);
        }
      }
    }

    const facet = vegaLiteSpecs[i].facet;
    const spec = vegaLiteSpecs[i].spec;

    // fake facets
    if (facet && spec) {
      const newSpec = await hackFacet(vegaLiteSpecs[i]);
      vegaLiteSpecs[i] = newSpec;
    }
  }

  vegaSpecs = vegaLiteSpecs.map((d) => {
    const s = Array.isArray(d) ? d.find((d) => d.meta.animated) : d;
    console.log(s);
    return gemini.vl2vg4gemini(s);
  });

  frames = [];

  for (let i = 1; i < vegaSpecs.length; i++) {
    const prev = vegaSpecs[i - 1];
    const curr = vegaSpecs[i];

    const prevMeta = metas[i - 1];
    const currMeta = metas[i];

    const recommendations = gemini.recommend(prev, curr, {
      stageN: 1,
      scales: {
        x: {
          domainDimension: "diff",
        },
        y: {
          domainDimension: "diff",
        },
      },
      marks: {
        marks: {
          change: {
            "scale": ["x", "y"],
            data: {
              keys: ["gemini_id"],
              update: true,
              enter: true,
              exit: true,
            },
            encode: {
              update: true,
              enter: true,
              exit: true,
            },
          },
        },
      },
      totalDuration: frameDuration,
    });

    recommendations
      .then((resp) => {
        const gemSpec = {
          timeline: {
            concat: [
              {
                sync: [
                  {
                    component: {
                      mark: "marks",
                    },
                    change: {
                      data: {
                        keys: ["gemini_id"],
                        update: true,
                        enter: true,
                        exit: false,
                      },
                      encode: {
                        update: true,
                        enter: true,
                        exit: true,
                      },
                    },
                    timing: {
                      duration: {
                        ratio: 1,
                      },
                    },
                  },
                ],
              },
            ],
          },
          totalDuration: 1200,
        };

        frames.push({
          source: prev,
          target: curr,
          gemSpec: resp[0] ? resp[0].spec : gemSpec,
          prevMeta,
          currMeta,
        });
      })
      .catch((e) => {
        console.log(e);
      });
  }

  d3.select(slider).property("max", vegaLiteSpecs.length - 1);
  drawFrame(0, id);

  if (autoPlay) {
    setTimeout(() => {
      play(id);
    }, 100);
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
  const { 
    axisSelector, 
    visSelector, 
    descr, 
    slider, 
    otherLayers 
  } = getSelectors(id);

  d3.select(slider).property("value", index);
  d3.select(descr).html(meta.description || "frame " + index);

  d3.select(axisSelector)
    .style("opacity", meta.axes ? 1 : 0)
    .html("");

  d3.select(visSelector).classed("with-axes", meta.axes);
  d3.select(otherLayers).classed("with-axes", meta.axes).html("");

  // draw axis
  if (meta.axes) {
    drawAxis(index, id);
  }

  // shift vis
  if (meta.transformX) {
    d3.select(visSelector)
      .style("left", meta.transformX + 'px');
  }

  // draw vis
  return drawChart(spec, id);
}

function drawChart(spec, id) {
  const { visSelector, otherLayers } = getSelectors(id);
  const layers = document.querySelector(otherLayers);

  if (Array.isArray(spec)) {
    return new Promise((res) => {
      spec.forEach((s, i) => {
        let target;

        if (s.meta.animated) {
          target = visSelector;
        } else {
          const div = document.createElement("div");
          div.classList.add("hidden");
          layers.appendChild(div);
          target = div;
        }

        vegaEmbed(target, s, { renderer: "svg" }).then(() => {
          if (i === spec.length - 1) {
            res();
          }
        });
      });
    });
  } else {
    return vegaEmbed(visSelector, spec, { renderer: "svg" });
  }
}

function drawAxis(index, id) {
  let spec = rawFiles[index];

  if (spec.spec && spec.spec.layer) {
    const split = splitLayers(spec);
    spec = split[1];
  }

  const columnFacet = spec.facet && spec.facet.column;
  const { axisSelector } = getSelectors(id);

  // update axis domain to matched hacked facet view
  const encoding = spec.spec ? spec.spec.encoding : spec.encoding;

  if (!encoding.y.scale) {
    const extentY = d3.extent(spec.data.values, (d) => d.y);
    encoding.y.scale = { domain: extentY };
  }

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

  const { 
    axisSelector, 
    visSelector, 
    otherLayers, 
    descr, 
    slider 
  } = getSelectors(id);
  
  let { source, target, gemSpec, prevMeta, currMeta } = frames[index];

  let anim = await gemini.animate(source, target, gemSpec);

  let prevHasAxes = prevMeta.axes;
  let currHasAxes = currMeta.axes;

  drawFrame(index, id).then(() => {
    d3.select(descr).html(currMeta.description);

    anim.play(visSelector).then(() => {
      d3.select(slider).property("value", index + 1);
    });

    if (currMeta.transformX) {
      d3.select(visSelector)
        .transition()
        .duration(750)
        .style("left", currMeta.transformX + 'px');
    }

    // show/hide axis vega chart
    if (currHasAxes) {
      drawAxis(index + 1, id);
      d3.select(axisSelector)
        .transition()
        .duration(1000)
        .style("opacity", 1);
      d3.select(visSelector).classed("with-axes", true);
      d3.select(otherLayers).classed("with-axes", true);
    } else {
      d3.select(axisSelector).transition().duration(1000).style("opacity", 0);
      d3.select(visSelector).classed("with-axes", false);
      d3.select(otherLayers).classed("with-axes", false);
    }

    const nextSpec = vegaLiteSpecs[index + 1];

    if (nextSpec && Array.isArray(nextSpec)) {
      const statics = nextSpec.filter((d) => !d.meta.animated);

      d3.select(otherLayers)
        .style("opacity", 0)
        .transition()
        .delay(frameDuration / 2)
        .duration(frameDuration / 2)
        .style("opacity", 1);

      statics.forEach((s) => {
        const div = document.createElement("div");
        div.classList.add("hidden");
        vegaEmbed(div, s, { renderer: "svg" });
        document.querySelector(otherLayers).appendChild(div);
      });
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
  const base = "#" + id;

  return {
    axisSelector: base + " .vega-for-axis",
    visSelector: base + " .vega-vis",
    descr: base + " .description",
    slider: base + " .slider",
    otherLayers: base + " .vega-other-layers",
  };
}

function splitLayers(input) {
  const specArray = [];
  const spec = input.spec;

  if (spec && spec.layer) {
    spec.layer.forEach((d, i) => {
      const obj = JSON.parse(JSON.stringify(input));
      const animated = i === spec.layer.length - 1;

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
  } else if (input.layer) {
    input.layer.forEach((d, i) => {
      const obj = JSON.parse(JSON.stringify(input));
      const animated = i === input.layer.length - 1;

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
}

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

// d3.json(
//   "https://raw.githubusercontent.com/microsoft/datamations/parse-ggplot2/sandbox/errorbar/specs_with_facet.json"
// ).then((res) => {
//   init("app", {
//     specs: res.filter((d, i) => i !== 2),
//   });
// });

// d3.json('https://raw.githubusercontent.com/microsoft/datamations/parse-ggplot2/sandbox/errorbar/specs_no_facet.json')
//   .then(res => {
//     init("app", {
//       specs: res
//     })
//   });

d3.json(
  "https://raw.githubusercontent.com/microsoft/datamations/parse-ggplot2/sandbox/errorbar/zoomed_specs.json"
).then((res) => {
  init("app", {
    specs: res
  });
});
