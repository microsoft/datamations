HTMLWidgets.widget({
    name: "datamationSandDance",

    type: "output",

    factory: function (el, width, height) {
        return {

            renderValue: function (x) {
                el.id = el.id.replace(/-/g, "");
                window['app' + el.id] = App(el.id, {specs: x.specs, autoPlay: true});
            },

            resize: function (width, height) { },
        };
    },
});
