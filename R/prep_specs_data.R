#' Generate spec of data in ungrouped icon array
#'
#' @param .data Input data
#' @param ... Additional arguments, unused.
#' @param toJSON Whether to converts the spec to JSON. Defaults to TRUE.
#' @param pretty Whether to pretty the JSON output of the spec. Defaults to TRUE, and only relevant when \code{toJSON} is TRUE.
prep_specs_data <- function(.data, ..., toJSON = TRUE, pretty = TRUE) {

  # Generate the data and specs for each state
  specs_list <- vector("list", length = 1)

  # Prep encoding

  x_encoding <- list(field = "x", type = "quantitative", axis = NULL)
  y_encoding <- list(field = "y", type = "quantitative", axis = NULL)

  # State 1: Ungrouped icon array

  # Add a count (total) to each record

  data_1 <- .data %>%
    dplyr::count()

  # These are not "real specs" as they don't actually have an x or y, only n
  # meta = list(parse = "grid") communicates to the JS code to turn these into real specs

  specs_list[[1]] <- list(
    `$schema` = vegawidget::vega_schema(),
    meta = list(parse = "grid"),
    data = list(values = data_1),
    mark = "point",
    encoding = list(
      x = x_encoding,
      y = y_encoding
    )
  ) %>%
    vegawidget::as_vegaspec()

  # Convert specs to JSON
  if (toJSON) {
    specs_list <- specs_list %>%
      purrr::map(vegawidget::vw_as_json, pretty = pretty)
  }

  specs_list

}
