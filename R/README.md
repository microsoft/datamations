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
