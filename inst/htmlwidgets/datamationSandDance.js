HTMLWidgets.widget({

  name: 'datamationSandDance',

  type: 'output',

  factory: function (el, width, height) {

    return {

      renderValue: function (x) {

        const frameDuration = 1200;

        const specFiles = [
          "01-infogrid_grey.json",
          "02-infogrid_color.json",
          "03-infogrid_color_split.json",
          "04-infogrid_color_split_work.json",
          "05-distribution.json",
          "06-mean.json",
        ];

        const sliderEl = document.getElementById("slider");

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

        function init() {
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

                if (i === specsArray.length - 1) {
                  console.log(frames);
                  sliderEl.max = frames.length - 1;
                }
              });
            }

            vegaEmbed("#" + el.id, specsArray[0], { renderer: "svg" });
            d3.select("#frame").html(specFiles[0]);
          });
        }

        let animating = false,
          counter = 0,
          intervalId;

        function play() {
          counter = 0;
          vegaEmbed("#" + el.id, specsArray[counter], { renderer: "svg" });
          d3.select("#frame").html(specFiles[counter]);
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

          if (animating) return;

          d3.select("#frame").html(specFiles[index + 1]);
          sliderEl.value = index;

          animating = true;

          let anim = await gemini.animate(source, target, spec);

          await anim.play("#" + el.id);

          animating = false;
        }

        init();
        play();

      },

      resize: function (width, height) {

      }

    };
  }
});
