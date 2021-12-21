# datamation_sanddance()

[datamation_sanddance()](https://github.com/microsoft/datamations/blob/main/R/datamation_sanddance.R#L31) is the main function that a user will call to generate a datamation. The code is documented to walk through each step, but at a high level:

* It uses [parse_pipeline()](https://github.com/microsoft/datamations/blob/main/R/parse_pipeline.R#L15) to parse the pipeline into steps,
* and [snake()](https://github.com/microsoft/datamations/blob/main/R/snake.R#L6) to evaluate how the data looks at each step.
* Then [parse_functions()](https://github.com/microsoft/datamations/blob/main/R/parse_functions.R#L5) extracts the actual function *names* from the pipeline steps,
* It checks that all functions are supported, then extracts the function arguments.
* Generates "mapping" (facets, x, etc) using [generate_mapping_from_plot()](https://github.com/microsoft/datamations/blob/main/R/generate_mapping_from_plot.R#L1) if the code contains a ggplot2 specification
* and finishes generating the mapping via [generate_mapping()](https://github.com/microsoft/datamations/blob/main/R/generate_mapping.R#L1).
* Then, it loops over all of the steps in the pipeline and uses the function (i.e. group by, summarize, filter), data, and arguments to generate the specs for each step, using functions:

    * [prep_specs_data()](https://github.com/microsoft/datamations/blob/main/R/prep_specs_data.R#L8) to generate the vega lite specs for the initial infogrid
    * [prep_specs_group_by()](https://github.com/microsoft/datamations/blob/main/R/prep_specs_group_by.R#L8) to generate the specs for the grouped info grids
    * [prep_specs_summarize()](https://github.com/microsoft/datamations/blob/main/R/prep_specs_summarize.R#L8) to generate the specs for the distribution and summary (e.g. mean, error bar, etc) frames
    * [prep_specs_filter()](https://github.com/microsoft/datamations/blob/main/R/prep_specs_filter.R#L10) to generate the spec - this is whatever the previous spec was, filtered according to the operation in `filter()`
* Finally, all of the specs are returned and passed off to [datamationSandDance()](https://github.com/microsoft/datamations/blob/main/R/datamation_sanddance.R#L146), which actually passes them off to the Javascript code.

    * [datamationSandDance_html()](https://github.com/microsoft/datamations/blob/more-docs/R/datamation_sanddance.R#L194) controls the "look" of the widget, e.g. that there is a slider, description, etc.

## [prep_specs_data()](https://github.com/microsoft/datamations/blob/main/R/prep_specs_data.R#L8)

* Preps encoding based on the mapping from the main function
* Generates specs for an ungrouped icon array, using [generate_vega_specs()](https://github.com/microsoft/datamations/blob/more-docs/R/prep_specs_utils.R#L5)

## [prep_specs_group_by()](https://github.com/microsoft/datamations/blob/main/R/prep_specs_group_by.R#L8)

* Preps encoding based on the mapping from the main function
* Generates specs for each grouping variable, in the following order: column -> row -> x/color, based on what actually exists in the mapping, all using [generate_vega_specs()](https://github.com/microsoft/datamations/blob/more-docs/R/prep_specs_utils.R#L5)

    * Step 1: Generates specs for a grouped icon array, by column
    
        * Sends `meta.parse = "grid"` to indicate to the JS that this is not a real vega lite spec, and needs to be parsed into one
        * Sends a "colour" variable, only if colour is the same as the column facet variable (so they're animated in the same step)
    
    * Step 2: Generates specs for a grouped icon array, by row (and column, if it needs to be done)
    
        * Sends `meta.parse = "grid"` to indicate to the JS that this is not a real vega lite spec, and needs to be parsed into one
        * If the X variable is the same as the row facet variable, send `meta.splitField = mapping$x` (whatever the x variable is in the mapping), to indicate to the JS that the info grid needs to be split "within" a facet frame
        * Sends a "colour" variable, only if colour is the same as the row facet variable (so they're animated in the same step)
        
    * Step 3: Generates specs for grouped icon array, by x (and column/row if they're done)
    
        * Sends `meta.parse = "grid"` to indicate to the JS that this is not a real vega lite spec, and needs to be parsed into one
        * Sends `meta.splitField = mapping$x`, to indicate to the JS that the info grid needs to be split "within" a facet frame
        * Sends `meta.axes = TRUE` if there are faceting variables, to indicate that "fake facets" need to be drawn
        * Sends a "colour" variable, only if colour is the same as the x variable (so they're animated in the same step)

## [prep_specs_summarize()](https://github.com/microsoft/datamations/blob/main/R/prep_specs_summarize.R#L8)

* Preps encoding based on the mapping from the main function
* Generates center points for X values, to be used as the center of jittering when distributions are shown, as well as an expression to convert these numeric X values to actual labels (e.g. 1 = Male, 2 = Female) in [generate_labelsExpr()](https://github.com/microsoft/datamations/blob/main/R/prep_specs_utils.R#L212) and the full X domain (with 0.5 padding on left and right) via [generate_x_domain()](https://github.com/microsoft/datamations/blob/main/R/prep_specs_utils.R#L212)

* Step 1: Generates specs for scatter plot (with any grouping), via [generate_vega_specs()](https://github.com/microsoft/datamations/blob/more-docs/R/prep_specs_utils.R#L5)

    * Sends `meta.parse = "jitter"` to indicate to the JS that the x values need to be jittered
    * Sends `meta.axes = TRUE` if the plot has "fake facets" and axes need to be drawn, and `FALSE` if not (so the real axes can be used for X and Y)
    * Sends `meta.splitField = mapping$x` if there's a grouping variable on the x-axis, since each jitter field needs to be split by that X
    * Sends `meta.xAxisLabels` with the actual values of the X variable if there are facets, because if they are, they're fake and occupying the real axes, and so we need to actually send xAxisLabels to get drawn on
    
        * TODO for me: this has flag !has_facets, but I think it should be just has_facets (i.e. the opposite)
        
* Step 2: Generate specs for summary plot, e.g. mean, with any grouping, via [generate_vega_specs()](https://github.com/microsoft/datamations/blob/more-docs/R/prep_specs_utils.R#L5)

    * Just sends `meta.axes = TRUE` if the plot has "fake facets" and axes need to be drawn, and `FALSE` if not (so the real axes can be used for X and Y)

* Step 3: Generate specs for errorbars plot (only if the summary function is mean), via [generate_vega_specs()](https://github.com/microsoft/datamations/blob/more-docs/R/prep_specs_utils.R#L5)

    * Passes both the summarized and "raw" y-values to vega lite, since the errorbar is calculated by vega lite and needs the raw y-values to calculate this
    * Just sends `meta.axes = TRUE` if the plot has "fake facets" and axes need to be drawn, and `FALSE` if not (so the real axes can be used for X and Y)
 
* Step 4: Generate specs for zoomed plot

    * If the summary function is tthe mean, and there's error bars, calculate the error bars manually to get the range of the plot
    * Otherwise, just do the range of the y-values
    * Again, just sends `meta.axes = TRUE` if the plot has "fake facets" and axes need to be drawn, and `FALSE` if not (so the real axes can be used for X and Y)


## [prep_specs_filter()](https://github.com/microsoft/datamations/blob/main/R/prep_specs_filter.R#L10)

* Reuse specs of previous frame (whether it was from the initial data, group_by, or summarize step)
* Get `gemini_id`s of rows that are filtered _in_ based on the operation in `filter()`
* Update specs to have `transform.filter = {"field": "gemini_id", "oneOf": [1, 2, ...]}}` if there are multiple IDs (or `transform.filter = {datum.gemini_id == 1}` if there is only one)

# shiny app

To embed a datamation_sanddance() object in a Shiny app, use [renderDatamationSandDance()](https://github.com/microsoft/datamations/blob/more-docs/R/datamation_sanddance.R#L187) in the server function, and [datamationSandDanceOutput()](https://github.com/microsoft/datamations/blob/more-docs/R/datamation_sanddance.R#L181) in the UI function.

For the actual "datamations" Shiny app:

* [app.R](https://github.com/microsoft/datamations/blob/main/app.R) (in the main package directory, not in this `R/` subdirectory) actually runs the app, by calling [run_app()](https://github.com/microsoft/datamations/blob/main/R/run_app.R) It needs to live here in order to be deployed on shinyapps.io.

* [run_app()](https://github.com/microsoft/datamations/blob/main/R/run_app.R) creates a shiny app by calling the UI function ([app_ui()](https://github.com/microsoft/datamations/blob/main/R/app_ui.R)) and the server function ([app_server()](https://github.com/microsoft/datamations/blob/main/R/app_server.R))

    * These mainly just call the app modules (discussed below), with a couple extra things: the UI function [sends the slider value](https://github.com/microsoft/datamations/blob/main/R/app_ui.R#L11) to Shiny so that the tabs change, and [listens to the tab value](https://github.com/microsoft/datamations/blob/main/R/app_ui.R#L18) for changing the slider and frame.
    
* [mod_inputs.R](https://github.com/microsoft/datamations/blob/main/R/mod_inputs.R) contains the module for the app inputs (data set, group by variables, summary function and variable)
* [mod_pipeline.R](https://github.com/microsoft/datamations/blob/main/R/mod_pipeline.R) contains the module for constructing and displaying the tidyverse pipeline, generated from the inputs
* [mod_datamation_sanddance.R](https://github.com/microsoft/datamations/blob/main/R/mod_datamation_sanddance.R) generates the actual datamation
* [mod_data_tabs.R](https://github.com/microsoft/datamations/blob/main/R/mod_data_tabs.R) generates the tabs that show the data at each stage
