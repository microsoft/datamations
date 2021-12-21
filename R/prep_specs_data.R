#' Generate spec of data for initial data step of datamations
#'
#' @param .data Input data
#' @param mapping Mapping, unused.
#' @param toJSON Whether to converts the spec to JSON. Defaults to TRUE.
#' @inheritParams datamation_sanddance
#' @noRd
prep_specs_data <- function(.data, mapping, toJSON = TRUE, pretty = TRUE, height = 300, width = 300) {

  # Generate the data and specs for each state
  specs_list <- vector("list", length = 1)

  # Prep encoding
  x_encoding <- list(field = X_FIELD_CHR, type = "quantitative", axis = NULL)
  y_encoding <- list(field = Y_FIELD_CHR, type = "quantitative", axis = NULL)

  spec_encoding <- list(x = x_encoding, y = y_encoding)

  # State 1: Ungrouped icon array

  # Add a count (total) to each record

  data_1 <- .data %>%
    dplyr::count() %>%
    add_ids_to_count_data(.data)

  # Generate description

  description <- "Initial data"

  # These are not "real specs" as they don't actually have an x or y, only n
  # meta = list(parse = "grid") communicates to the JS code to turn these into real specs

  specs_list[[1]] <- generate_vega_specs(data_1,
    mapping = mapping,
    meta = list(parse = "grid", description = description),
    spec_encoding = spec_encoding,
    height = height, width = width,
    column = FALSE, row = FALSE, color = FALSE
  )

  # Convert specs to JSON
  if (toJSON) {
    specs_list <- specs_list %>%
      purrr::map(vegawidget::vw_as_json, pretty = pretty)
  }

  specs_list
}
