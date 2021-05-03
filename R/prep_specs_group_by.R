#' Generate specs of data in grouped icon array
#'
#' @param .data Input data
#' @param ... Grouping variables
#' @param pretty Whether to pretty the JSON output of the spec. Defaults to TRUE.
prep_specs_group_by <- function(.data, ..., pretty = TRUE) {

  # Map grouping variables
  group_vars <- c(...)
  # Count number of groups
  n_groups <- length(group_vars)

  # Use the first grouping variable for column facet
  col_facet_var <- dplyr::first(group_vars)
  # And the second for the row facet
  row_facet_var <- dplyr::nth(group_vars, n = 2)
  # And the third for color
  color_var <- dplyr::nth(group_vars, n = 3)

  # Convert grouping variables to character
  group_vars_chr <- purrr::map_chr(group_vars, rlang::quo_name)

  # Convert grouping variables to character - useful if there are binary variables or with a small number of (numeric) options, since you can't map shape to a continuous variable
  # But we should be careful about too many categories and e.g. stop if there are too many
  .data <- .data %>%
    dplyr::mutate_at(dplyr::all_of(group_vars_chr), as.character)

  # Generate the data and specs for each state
  specs_list <- vector("list", length = n_groups)

  # Prep encoding

  x_encoding <- list(field = "x", type = "quantitative", axis = NULL)
  y_encoding <- list(field = "y", type = "quantitative", axis = NULL)
  color_encoding <- list(field = rlang::quo_name(color_var), type = "nominal", axis = NULL)
  facet_col_encoding <- list(field = rlang::quo_name(col_facet_var), type = "nominal", title = NULL)
  facet_row_encoding <- list(field = rlang::quo_name(row_facet_var), type = "nominal", title = NULL)

  # These are not "real specs" as they don't actually have an x or y, only n
  # meta = list(parse = "grid") communicates to the JS code to turn these into real specs

  # State 1: Grouped icon aray, first grouping in column facets

  # Add a count (grouped) to each record

  data_1 <- .data %>%
    dplyr::count({{ col_facet_var }})

  specs_list[[1]] <- list(
    `$schema` = vegawidget::vega_schema(),
    meta = list(parse = "grid"),
    data = list(values = data_1),
    facet = list(column = facet_col_encoding),
    spec = list(
      mark = "point",
      encoding = list(
        x = x_encoding,
        y = y_encoding
      )
    )
  ) %>%
    vegawidget::as_vegaspec() %>%
    vegawidget::vw_as_json(pretty = pretty)

  # State 2: Grouped icon array, first group in col and second in row facets

  if (n_groups %in% c(2, 3)) {
    data_2 <- .data %>%
      dplyr::count({{ col_facet_var }}, {{ row_facet_var }})

    specs_list[[2]] <- list(
      `$schema` = vegawidget::vega_schema(),
      meta = list(parse = "grid"),
      data = list(values = data_2),
      facet = list(
        column = facet_col_encoding,
        row = facet_row_encoding
      ),
      spec = list(
        mark = "point",
        encoding = list(
          x = x_encoding,
          y = y_encoding
        )
      )
    ) %>%
      vegawidget::as_vegaspec() %>%
      vegawidget::vw_as_json(pretty = pretty)
  }

  # State 3: Grouped icon array, first group in col, second in row facets, third in colour

  if (n_groups == 3) {
    data_3 <- .data %>%
      dplyr::count({{ col_facet_var }}, {{ row_facet_var }}, {{ color_var }})

    specs_list[[3]] <- list(
      `$schema` = vegawidget::vega_schema(),
      meta = list(parse = "grid"),
      data = list(values = data_3),
      facet = list(
        column = facet_col_encoding,
        row = facet_row_encoding
      ),
      spec = list(
        mark = "point",
        encoding = list(
          x = x_encoding,
          y = y_encoding,
          color = color_encoding
        )
      )
    ) %>%
      vegawidget::as_vegaspec() %>%
      vegawidget::vw_as_json(pretty = pretty)
  }

  # Return the specs
  specs_list
}
