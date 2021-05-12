const frameDuration = 2500;

let specsArray, frames, metas, files, rawFiles;
let counter = 0, intervalId;

async function init(id, {
  specUrls,
  specs,
  autoPlay,
}) {
  files = [];
  rawFiles = [];

  if (specs) {
    files = specs.map((d) => {
      if (!d.width) d.width = 600;
      if (!d.height) d.height = 600;
      return { ...d };
    });
  } else if (specUrls) {
    files = await loadData(specUrls);
  }

  files.forEach((d) => {
    rawFiles.push(JSON.parse(JSON.stringify(d)));
  });

  metas = files.map((d) => d.meta);

  for (let i = 0; i < files.length; i++) {
    const parse = files[i].meta.parse;

    // parsing
    if (parse === "grid") {
      files[i] = await getGridSpec(files[i]);
    } else if (parse === "jitter") {
      files[i] = await getJitterSpec(files[i]);
    }

    const facet = files[i].facet;
    const spec = files[i].spec;

    // fake facets
    if (facet && spec) {
      const meta = files[i].meta;
      const withAxes = meta && meta.axes;

      files[i].data.name = "source";

      const { newSpec, view } = await hackFacet(files[i]);

      files[i] = newSpec;

      if (withAxes) {
        const vis = document.querySelector("#" + id + " .vega-vis");
        const origin = view._origin;
        vis.style.left = origin[0] + "px";
      }
    }
  }

  specsArray = files.map((d) => gemini.vl2vg4gemini(d));
  frames = [];

  for (let i = 1; i < specsArray.length; i++) {
    const prev = specsArray[i - 1];
    const curr = specsArray[i];

    const prevMeta = metas[i - 1];
    const currMeta = metas[i];

    const recommendations = gemini.recommend(prev, curr, {
      stageN: 1,
      scales: {
        domainDimension: "same",
      },
      marks: {
        change: {
          data: ["gemini_id"],
          encode: {
            update: true,
            enter: true,
            exit: true,
          },
        },
      },
      totalDuration: frameDuration,
    });

    recommendations
      .then((resp) => {
        frames.push({
          source: prev,
          target: curr,
          gemSpec: resp[0].spec,
          prevMeta,
          currMeta,
        });
      })
      .catch((e) => {});
  }

  d3.select('#' + id + ' .slider').property('max', files.length - 1);
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
  if (!specsArray[index]) return;

  const meta = metas[index];
  const axisSelector = "#" + id + " .vega-for-axis";
  const visSelector = "#" + id + " .vega-vis";
  const descr = '#' + id + ' .description';

  d3.select('#' + id + ' .slider').property('value', index);
  d3.select(descr).html(meta.description || 'frame ' + index);

  d3.select(axisSelector)
    .style("opacity", meta.axes ? 1 : 0)
    .html("");

  d3.select(visSelector).classed("with-axes", meta.axes);

  // draw axis
  if (meta.axes) {
    drawAxis(index, id);
  }

  // draw vis
  return vegaEmbed(visSelector, specsArray[index], { renderer: "svg" });
}

function drawAxis(index, id) {
  const spec = rawFiles[index];
  const columnFacet = spec.facet && spec.facet.column;
  const axisSelector = "#" + id + " .vega-for-axis";

  // update axis domain to matched hacked facet view
  const extentY = d3.extent(spec.data.values, (d) => d.y);
  const encoding = spec.spec ? spec.spec.encoding : spec.encoding;
  encoding.y.scale = { domain: extentY };

  vegaEmbed(axisSelector, rawFiles[index], { renderer: "svg" }).then(() => {
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

  const axisSelector = "#" + id + " .vega-for-axis";
  const visSelector = "#" + id + " .vega-vis";
  const { source, target, gemSpec, prevMeta, currMeta } = frames[index];

  let anim = await gemini.animate(source, target, gemSpec);

  let prevHasAxes = prevMeta.axes;
  let currHasAxes = currMeta.axes;

  drawFrame(index, id).then(() => {
    anim.play(visSelector).then(() => {
      d3.select('#' + id + ' .slider').property('value', index + 1);
    });

    // show/hide axis vega chart
    if (prevHasAxes && !currHasAxes) {
      d3.select(axisSelector).transition().duration(1000).style("opacity", 0);
      d3.select(visSelector).classed("with-axes", false);
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
  )
    .then((files) => {
      // make adjustments here if needed
      return files;
    })
    .catch((e) => {
      console.error(e.message);
    });
}

function onSlide(id) {
  const index = document.querySelector('#' + id + ' .slider').value;
  drawFrame(index, id);
  if (intervalId) clearInterval(intervalId);
}
