const frameDuration = 1200;

const specFiles = [
  "01-infogrid_grey.json",
  "02-infogrid_color.json",
  "03-infogrid_color_split.json",
  "04-infogrid_color_split_work.json",
  "05-distribution.json",
  "06-mean.json",
];

let frames = [];
let specsArray = [];
let geminiSpecs = [];

function loadData() {
  return Promise.all(
    specFiles.map((d) => {
      return d3.json("https://raw.githubusercontent.com/jhofman/datamations/vegawidget-exploration/sandbox/vegawidget/work_degree/specs/" + d);
    })
  )
    .then((files) => {
      // make adjustments here
      return files.map((d) => {
        return {
          ...d,
          width: 400,
          height: 250,
        };
      });
    })
    .catch((e) => {
      console.error(e.message);
    });
}

function init(id) {
  loadData().then((files) => {
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
            data: ["id"],
            encode: {
              update: true,
              enter: true,
              exit: true,
            },
          }
        },
        totalDuration: frameDuration
      });
      recommendations.then(resp => {
        frames.push({
          source: prev,
          target: curr,
          gemSpec: resp[0].spec,
        });
      });
    }

    vegaEmbed("#" + id, specsArray[0], { renderer: "svg" });
  });
}

let animating = false,
  counter = 0,
  intervalId;

function play(id) {
  counter = 0;
  vegaEmbed("#" + id, specsArray[counter], { renderer: "svg" });
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

async function animateFrame(index, id) {
  if (!frames[index]) return;

  const source = frames[index].source;
  const target = frames[index].target;
  const spec = frames[index].gemSpec;

  if (animating) return;

  animating = true;
  let anim = await gemini.animate(source, target, spec);
  await anim.play("#" + id);
  animating = false;
}
