const repoUrl = "https://raw.githubusercontent.com/jhofman/datamations";
// const dataUrl = "./data/";
const dataUrl = repoUrl + "/fixes/sandbox/specs-for-infogrid/";
const frameDuration = 2000;

let vegaLiteSpecs, vegaSpecs, frames, metas, rawFiles, counter = 0, intervalId;

async function init(id, { specUrls, specs, autoPlay }) {
  vegaLiteSpecs = [];
  vegaSpecs = [];
  rawFiles = [];
  frames = [];
  metas = [];
  counter = 0;

  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }

  if (specs) {
    vegaLiteSpecs = JSON.parse(JSON.stringify(specs));
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
        if (s.facet && s.spec && s.meta.animated) {
          const newSpec = await hackFacet(s);
          vegaLiteSpecs[i].push(newSpec);
          metas[i] = newSpec.meta;
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
    return gemini.vl2vg4gemini(s);
  });

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
        console.error(e);
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
    otherLayers,
    controls,
  } = getSelectors(id);

  d3.select(slider).property("value", index);
  d3.select(descr).html(meta.description || "frame " + index);

  d3.select(axisSelector)
    .style("opacity", meta.axes ? 1 : 0)
    .html("");

  d3.select(visSelector).classed("with-axes", meta.axes);
  d3.select(otherLayers).classed("with-axes", meta.axes);

  // draw axis
  if (meta.axes) {
    drawAxis(index, id);
  }

  // shift vis
  if (meta.transformX) {
    d3.select(visSelector)
      .style("left", meta.transformX + 'px')
  }

  d3.select(controls).style("width", (spec.width + 10) + 'px');

  // draw vis
  return drawChart(spec, id);
}

function drawChart(spec, id) {
  const { visSelector, otherLayers } = getSelectors(id);
  const layers = document.querySelector(otherLayers);
  layers.innerHTML = "";

  if (Array.isArray(spec)) {
    return new Promise((res) => {
      spec.forEach((s, i) => {
        let target;

        if (s.meta.animated) {
          target = visSelector;
        } else {
          const div = document.createElement("div");
          div.classList.add("vega-hidden-layer");
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
  const { axisSelector, controls, otherLayers } = getSelectors(id);

  // update axis domain to matched hacked facet view
  const encoding = spec.spec ? spec.spec.encoding : spec.encoding;

  if (!encoding.y.scale) {
    const extentY = d3.extent(spec.data.values, (d) => d.y);
    encoding.y.scale = { domain: extentY };
  }

  if (encoding.color) {
    encoding.color.legend = null;
  }

  if (encoding.x && encoding.x.axis) {
    encoding.x.axis.labelAngle = -90;
  }

  return vegaEmbed(axisSelector, spec, { renderer: "svg" }).then(() => {
    if (columnFacet && columnFacet.title) {
      const fn = function () {
        const transform = d3.select(this).attr("transform");
        const x = transform.split("(")[1].split(",")[0];
        return `translate(${x}, 40)`;
      };

      d3.select(axisSelector + " svg > g").attr("transform", fn);
      d3.select(otherLayers + " svg > g").attr("transform", fn);
    }
    const width = d3.select(axisSelector).node().getBoundingClientRect().width;
    d3.select(controls).style("width", width + 'px');
  });
}

async function animateFrame(index, id) {
  if (!frames[index]) return;

  const { 
    axisSelector, 
    visSelector, 
    otherLayers, 
    descr, 
    slider,
    controls
  } = getSelectors(id);
  
  let { source, target, gemSpec, prevMeta, currMeta } = frames[index];
  let anim = await gemini.animate(source, target, gemSpec);
  let prevHasAxes = prevMeta.axes;
  let currHasAxes = currMeta.axes;
  let width = target.width;

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
      d3.select(controls).style("width", (width + 10) + 'px');
    }

    const nextSpec = vegaLiteSpecs[index + 1];

    if (nextSpec && Array.isArray(nextSpec)) {
      const statics = nextSpec.filter((d) => !d.meta.animated);

      d3.select(otherLayers)
        .html("")
        .style("opacity", 0)
        .transition()
        .delay(frameDuration / 3)
        .duration(frameDuration / 2)
        .style("opacity", 1);

      statics.forEach((s) => {
        const div = document.createElement("div");
        div.classList.add("vega-hidden-layer");
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
  )
  // fallback for old spec to work again
  // if no splitField is set, I am setting color.field
  // .then(data => {
  //   return data.map(d => {
  //     const encoding = d.spec ? d.spec.encoding : d.encoding;
  //     if (encoding.color && !d.meta.splitField) {
  //       d.meta.splitField = encoding.color.field;
  //       console.log(d);
  //     }
  //     return d;
  //   })
  // })
  .catch((e) => {
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
    controls: base + " .controls-wrapper",
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