HTMLWidgets.widget({
    name: "datamationSandDance",

    type: "output",

    factory: function (el, width, height) {
        return {
            renderValue: function (x) {

                //init(el.id, {specs: x.specs});


const repoUrl = "https://raw.githubusercontent.com/jhofman/datamations";
const dataUrl = repoUrl + "/refactor-test/sandbox/specs-for-infogrid/";
const frameDuration = 1200;


init(el.id, {
  specUrls: [
    dataUrl + "01-ungrouped.json",
    dataUrl + "02-column-facet.json",
    dataUrl + "03-column-row-facet.json",
    dataUrl + "04-column-row-facet-color.json",
    dataUrl + "05-jitter.json",
    dataUrl + "06-summary.json",
  ],
});

            },

            resize: function (width, height) { },
        };
    },
});
