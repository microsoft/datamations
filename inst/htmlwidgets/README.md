Contains files for the Javascript side of generating a datamation.

* [datamationSandDance.js](https://github.com/microsoft/datamations/blob/main/inst/htmlwidgets/datamationSandDance.js) is called by [datamationSandDance()](https://github.com/microsoft/datamations/blob/main/R/datamation_sanddance.R#L146) as the last step of generating a datamation via [datamation_sanddance()](https://github.com/microsoft/datamations/blob/main/R/datamation_sanddance.R#L31) - it just takes the specs and passed them off to the javascript code, in `js/`
* [datamationSandDance.yaml](https://github.com/microsoft/datamations/blob/main/inst/htmlwidgets/datamationSandDance.yaml) defines javascript dependencies for the widget
* `css/` styles the datamation HTML elements, with layout controlled by [datamationSandDance_html()](https://github.com/microsoft/datamations/blob/main/R/datamation_sanddance.R#L194)
* `js/` contains all of the actual JS code for the datamation
* `d3/`, `gemini/`, `vega/`, `vega-embed/`, and `vega-lite/` are dependencies
