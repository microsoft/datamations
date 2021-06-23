# datamation_sanddance()

[datamation_sanddance()](https://github.com/microsoft/datamations/blob/main/R/datamation_sanddance.R#L31) is the main function that a user will call to generate a datamation. The code is documented to walk through each step, but at a high level:

* It uses [parse_pipeline()]{https://github.com/microsoft/datamations/blob/main/R/parse_pipeline.R#L15) to parse the pipeline into steps,
* and [snake()](https://github.com/microsoft/datamations/blob/main/R/snake.R#L6) to evaluate how the data looks at each step.
* Then [parse_functions()](https://github.com/microsoft/datamations/blob/main/R/parse_functions.R#L5) extracts the actual function *names* from the pipeline steps,
* It checks that all functions are supported, then extracts the function arguments.
* Generates "mapping" (facets, x, etc) using [generate_mapping_from_plot()](https://github.com/microsoft/datamations/blob/main/R/generate_mapping_from_plot.R#L1) if the code contains a ggplot2 specification
* and finishes generating the mapping via [generate_mapping()](https://github.com/microsoft/datamations/blob/main/R/generate_mapping.R#L1).
* Then, it loops over all of the steps in the pipeline and uses the function (e.g. group by, summarize), data, and arguments to generate the specs for each step, using functions:

    * [prep_specs_data()](https://github.com/microsoft/datamations/blob/main/R/prep_specs_data.R#L8) to generate the vega lite specs for the initial infogrid
    * [prep_specs_group_by()](https://github.com/microsoft/datamations/blob/main/R/prep_specs_group_by.R#L8) to generate the specs for the grouped info grids
    * [prep_specs_summarize()](https://github.com/microsoft/datamations/blob/main/R/prep_specs_summarize.R#L8) to generate the specs for the distribution and summary (e.g. mean, error bar, etc) frames
* Finally, all of the specs are returned and passed off to [datamationSandDance()](https://github.com/microsoft/datamations/blob/main/R/datamation_sanddance.R#L146), which actually passes them off to the javascript code.

## prep_specs_data()

* Preps encoding based on the mapping from the main function
* Generates specs for an ungrouped icon array, using [generate_vega_specs()](https://github.com/microsoft/datamations/blob/more-docs/R/prep_specs_utils.R#L5)

## prep_specs_group_by()

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
        * Sends `meta.axes = TRUE` if there is a column or row facet variable, to indicate that "fake facets" need to be drawn
        * Sends a "colour" variable, only if colour is the same as the x variable (so they're animated in the same step)

## prep_specs_summarize()

# shiny app
