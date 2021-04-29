prep_specs_data <- function(.data, ..., pretty = TRUE) {

  # Generate the data and specs for each state
  specs_list <- vector("list", length = 1)

  # Prep encoding

  x_encoding <- list(field = "x", type = "quantitative", axis = NULL)
  y_encoding <- list(field = "y", type = "quantitative", axis = NULL)

  # TODO: these are not "real specs" as they don't actually have an x or y, only n - the first few frames need to be processed on the JS side into infogrids.

  # State 1: Ungrouped icon array

  # Add a count (total) to each record

  data_1 <- .data %>%
    dplyr::count()

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
    vegawidget::as_vegaspec() %>%
    vegawidget::vw_as_json(pretty = pretty)

  specs_list

}
