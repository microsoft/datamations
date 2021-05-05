HTMLWidgets.widget({
    name: "datamationSandDance",

    type: "output",

    factory: function (el, width, height) {
        return {
            renderValue: function (x) {

                init(el.id, [
                    dataUrl + "01-ungrouped.json",
                    dataUrl + "02-column-facet.json",
                    dataUrl + "03-column-row-facet.json",
                    dataUrl + "04-column-row-facet-color.json",
                    dataUrl + "05-jitter.json",
                    dataUrl + "06-summary.json",
                ]);

                //init(el.id, x.specs);

            },

            resize: function (width, height) { },
        };
    },
});
