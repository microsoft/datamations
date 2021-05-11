HTMLWidgets.widget({
    name: "datamationSandDance",

    type: "output",

    factory: function (el, width, height) {
        return {
            renderValue: function (x) {

                init(el.id, {specs: x.specs});

                play(el.id);

            },

            resize: function (width, height) { },
        };
    },
});
