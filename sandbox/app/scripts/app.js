const repoUrl = "https://raw.githubusercontent.com/jhofman/datamations";
const dataUrl = repoUrl + "/refactor-test/sandbox/specs-for-infogrid/";
const frameDuration = 1200;

let specsArray, frames, metas, files, rawFiles;

async function init(id, { specUrls, specs }) {
  files = [];
  rawFiles = [];

  if (specs) {
    files = specs.map((d) => {
      return {
        ...d,
        width: 600,
        height: 600,
      };
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

      // hacky, but don't know why this is needed.
      if (i === 4) {
        newSpec.width += 10;
        newSpec.height -= 10;
      }

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

  drawFrame(1, id);
}

let counter = 0,
  intervalId;

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

  d3.select(axisSelector)
    .style("opacity", meta.axes ? 1 : 0)
    .html("");
  d3.select(visSelector).classed("with-axes", meta.axes);

  // draw axis
  if (meta.axes) {
    vegaEmbed(axisSelector, rawFiles[index], { renderer: "svg" });
  }

  // draw vis
  return vegaEmbed(visSelector, specsArray[index], { renderer: "svg" });
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
    anim.play(visSelector);

    // show/hide axis vega chart
    if (prevHasAxes && !currHasAxes) {
      d3.select(axisSelector).transition().duration(1000).style("opacity", 0);

      d3.select(visSelector).classed("with-axes", false);
    } else if (!prevHasAxes && currHasAxes) {
      d3.select(axisSelector).transition().duration(100).style("opacity", 1);

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
      return files.map((d, i) => {
        // todo: ask sharla to remove axis: null and use them to define which axis needs to be rendered
        if (i >= 4) {
          d.meta = {
            ...d.meta,
            axes: true,
          };
          delete d.spec.encoding.x.axis;
          delete d.spec.encoding.y.axis;
        }

        return {
          ...d,
          width: 600,
          height: 600,
        };
      });
    })
    .catch((e) => {
      console.error(e.message);
    });
}

// with urls
init("vis", {
  specUrls: [
    dataUrl + "01-ungrouped.json",
    dataUrl + "02-column-facet.json",
    dataUrl + "03-column-row-facet.json",
    dataUrl + "04-column-row-facet-color.json",
    dataUrl + "05-jitter.json",
    dataUrl + "06-summary.json",
  ],
});
