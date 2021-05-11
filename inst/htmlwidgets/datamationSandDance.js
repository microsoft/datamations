HTMLWidgets.widget({
    name: "datamationSandDance",

    type: "output",

    factory: function (el, width, height) {
        return {
            renderValue: function (x) {

                init(el.id, {specs: x.specs});
            },

            resize: function (width, height) { },
        };
    },
});
