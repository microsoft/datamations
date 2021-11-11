#' Generate specs of data distribution and summarized data steps of datamations
#'
#' @param .data Input data
#' @param mapping A list that describes mapping for the datamations, including x and y variables, sjummary variable and operation, variables used in facets and in colors, etc. Generated in \code{datamation_sanddance} using \code{generate_mapping}.
#' @param previous_frame The previous step's frame, which will be used to create the filter frame
#' @param filter_operation The filter operation
#' @inheritParams datamation_sanddance
#' @inheritParams prep_specs_data
#' @noRd
prep_specs_filter <- function(.data, mapping, toJSON = TRUE, pretty = TRUE, height = 300, width = 300) {
}
