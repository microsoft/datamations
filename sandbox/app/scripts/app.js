function App({
  specUrls, // if urls, fetch it
  specs, // if specs as array, use them
  container = "#vis",
}) {
  const frameDuration = 1200;
  let specsArray, frames;

  async function init() {
    let files = [];

    if (specs) {
      files = specs;
    } else {
      files = await loadData();
    }

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
        const width = facet.column ? 600 : 200;
        const height = facet.row ? 600 : 200;

        files[i].data.name = "source";

        files[i] = await hackFacet(files[i], width, height);
      }
    }

    specsArray = files.map((d) => gemini.vl2vg4gemini(d));
    frames = [];

    for (let i = 1; i < specsArray.length; i++) {
      const prev = specsArray[i - 1];
      const curr = specsArray[i];

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
          });
        })
        .catch((e) => {});
    }

    vegaEmbed(container, specsArray[0], {
      renderer: "svg",
    });
  }

  let animating = false,
    counter = 0,
    intervalId;

  function play() {
    counter = 0;
    const tick = () => {
      animateFrame(counter);
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

  async function animateFrame(index) {
    if (!frames[index]) return;

    const source = frames[index].source;
    const target = frames[index].target;
    const spec = frames[index].gemSpec;

    let anim = await gemini.animate(source, target, spec);

    vegaEmbed(container, source, { renderer: "svg" }).then(() => {
      anim.play(container);
    });
  }

  function drawFrame(index) {
    vegaEmbed(container, specsArray[index], {
      renderer: "svg",
    });
  }

  function loadData() {
    return Promise.all(
      specUrls.map((url) => {
        return d3.json(url);
      })
    )
      .then((files) => {
        // make adjustments here if needed
        return files.map((d) => {
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

  init();

  return {
    play,
    animateFrame,
    drawFrame,
  };
}
