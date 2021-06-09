HTMLWidgets.widget({
    name: "datamationSandDance",

    type: "output",

    factory: function (el, width, height) {
        return {

            renderValue: function (x) {
                console.log(x);
                init(el.id, {specs: x.specs, autoPlay: true});
                console.log("init ran");
            },

            resize: function (width, height) { },
        };
    },
});
