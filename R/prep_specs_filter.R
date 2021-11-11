#' Generate specs of data distribution and summarized data steps of datamations
#'
#' @param .data Input data
#' @param mapping A list that describes mapping for the datamations, including x and y variables, sjummary variable and operation, variables used in facets and in colors, etc. Generated in \code{datamation_sanddance} using \code{generate_mapping}.
#' @param previous_frame The previous step's frame, which will be used to create the filter frame
#' @param filter_operation The filter operation
#' @inheritParams datamation_sanddance
#' @inheritParams prep_specs_data
#' @noRd
prep_specs_filter <- function(.data, mapping, previous_frame, filter_operation, toJSON = TRUE, pretty = TRUE, height = 300, width = 300) {

  # Apply filtering to data - constructing a column that says whether values should be filtered
  # Don't support info grid for now - just start with simple case :)

  # It will probably be easiest to regenerate the spec data, with the filter, than to use the data from the previous spec / previous step in order to do it
  # Because if it's filtering e.g. median > 90, the specs just have datamations_y - so you need to filter that
  # But how do you know to do that?
  # E.g. what if you want to filter Degree == "Masters"?
  # Will want to ensure the IDs match between them, just one with a flag on what to filter
  # It's a bit weird because the spec data is all of the data points, with no indication as to which is the column that's the summary column, but the data is the summarized data
  # Maybe it would be easiest to name datamations_y to the summary column? Is it available in mapping? Or we don't even keep track of what it's named?

  # We have mapping$y, mapping$summary_function
  # But need to keep track of mapping$summary_name
  # Then maybe df %>% mutate(summary_name = datamations_y)
  # And then anything filtered on could be used. That's probably the easiest actually.

  # And again it'll be different if it's an infogrid - that might actually be easier

  infogrid_frame <- previous_frame[["meta"]][["parse"]] == "grid"

  if (!infogrid_frame) {
    browser()

    original_data <- previous_frame[["data"]][["values"]] %>%
      dplyr::mutate(temp_datamations_id = dplyr::row_number())

    filtered_data <- original_data %>%
      dplyr::filter(eval(rlang::parse_expr(filter_operation)))
  }
}
