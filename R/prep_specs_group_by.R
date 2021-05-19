#' Generate specs of data in grouped icon array
#'
#' @param .data Input data
#' @param mapping A list that describes mapping for the datamations, including x and y variables, sjummary variable and operation, variables used in facets and in colors, etc. Generated in \code{datamation_sanddance} using \code{generate_mapping}.
#' @inheritParams datamation_sanddance
#' @inheritParams prep_specs_data
prep_specs_group_by <- function(.data, mapping, toJSON = TRUE, pretty = TRUE, height = 300, width = 300) {

  # Extract mapping ----

  # Extract grouping variables from mapping
  group_vars_chr <- mapping$groups

  # Convert to symbol
  group_vars <- group_vars_chr %>%
    as.list() %>%
    purrr::map(rlang::parse_expr)

  # Prep data ----

  # Convert NA to "NA", put at the end of factors, and arrange by all grouping variables so that IDs are consistent
  .data <- .data %>%
    arrange_by_groups_coalesce_na(group_vars, group_vars_chr)

  # Prep encoding ----

  x_encoding <- list(field = "x", type = "quantitative", axis = NULL)
  y_encoding <- list(field = "y", type = "quantitative", axis = NULL)
  color_encoding <- list(field = rlang::quo_name(mapping$color), type = "nominal")

  # Need to manually set order of colour legend, otherwise it's not in the same order as the grids/points!
  if (!is.null(mapping$color)) {
    color_encoding <- append(color_encoding, list(legend = list(values = levels(.data[[mapping$color]]))))
  }

  spec_encoding <- list(
    x = x_encoding,
    y = y_encoding,
    color = color_encoding
  )

  facet_col_encoding <- list(field = mapping$column, type = "ordinal", title = mapping$column)
  facet_row_encoding <- list(field = mapping$row, type = "ordinal", title = mapping$row)

  facet_encoding <- list(
    column = facet_col_encoding,
    row = facet_row_encoding
  )

  # Calculate number of facets for sizing
  facet_dims <- .data %>%
    calculate_facet_dimensions(group_vars, mapping)

  # Generate specs -----

  # These are not "real specs" as they don't actually have an x or y, only n
  # meta = list(parse = "grid") communicates to the JS code to turn these into real specs

  # Generate the data and specs for each state

  specs_list <- vector("list", length = length(group_vars))

  # Order of grouping should go column -> row -> colour
  # But only if they actually exist in the mapping!

  # State 1: Grouped icon aray, first grouping in column facets ----

  # Add a count (grouped) to each record
  data_1 <- .data %>%
    dplyr::count(!!rlang::parse_expr(mapping$column))

  # Generate description
  description <- generate_group_by_description(mapping, "column")

  specs_list[[1]] <- generate_vega_specs(data_1,
    mapping = mapping,
    meta = list(parse = "grid", description = description),
    spec_encoding = spec_encoding,
    facet_encoding = facet_encoding,
    height = height, width = width,
    facet_dims = facet_dims,
    column = TRUE
  )

  # State 2: Grouped icon array, first group in col and second in row facets ----

  if (!is.null(mapping$row)) {
    data_2 <- .data %>%
      dplyr::count(!!rlang::parse_expr(mapping$column), !!rlang::parse_expr(mapping$row))

    description <- generate_group_by_description(mapping, "column", "row")

    specs_list[[2]] <- generate_vega_specs(data_2,
      mapping = mapping,
      meta = list(parse = "grid", description = description),
      spec_encoding = spec_encoding,
      facet_encoding = facet_encoding,
      height = height, width = width,
      facet_dims = facet_dims,
      column = TRUE, row = TRUE
    )
  }

  # State 3: Grouped icon array, first group in col, second in row facets, third in colour -----

  if (!is.null(mapping$color)) {
    data_3 <- .data %>%
      dplyr::count(!!rlang::parse_expr(mapping$column), !!rlang::parse_expr(mapping$row), !!rlang::parse_expr(mapping$color))

    description <- generate_group_by_description(mapping, "column", "row", "color")

    specs_list[[3]] <- generate_vega_specs(data_3,
      mapping = mapping,
      meta = list(parse = "grid", description = description),
      spec_encoding = spec_encoding,
      facet_encoding = facet_encoding,
      height = height, width = width,
      facet_dims = facet_dims,
      column = TRUE, row = TRUE, color = TRUE
    )
  }

  # Convert specs to JSON
  if (toJSON) {
    specs_list <- specs_list %>%
      purrr::map(vegawidget::vw_as_json, pretty = pretty)
  }

  # Return the specs
  specs_list
}
