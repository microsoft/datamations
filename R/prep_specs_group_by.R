#' Generate specs of data for group by step of datamation
#'
#' @param .data Input data
#' @param mapping A list that describes mapping for the datamations, including x and y variables, summary variable and operation, variables used in facets and in colors, etc. Generated in \code{datamation_sanddance} using \code{generate_mapping}.
#' @inheritParams datamation_sanddance
#' @inheritParams prep_specs_data
#' @noRd
prep_specs_group_by <- function(.data, mapping, toJSON = TRUE, pretty = TRUE, height = 300, width = 300, mutation_before = FALSE, ...) {

  # Extract mapping ----

  # Extract grouping variables from mapping
  group_vars_chr <- mapping$groups

  # Convert to symbol
  group_vars <- group_vars_chr %>%
    as.list() %>%
    purrr::map(rlang::parse_expr)

  # Prep data ----

  # Prep encoding ----

  x_encoding <- list(field = X_FIELD_CHR, type = "quantitative", axis = NULL)
  y_encoding <- list(field = Y_FIELD_CHR, type = "quantitative", axis = NULL)

  color_name <- if (is.null(mapping$color)) {
    NULL
  } else {
    rlang::quo_name(mapping$color)
  }

  color_encoding <- list(field = color_name, type = "nominal")

  # Need to manually set order of colour legend, otherwise it's not in the same order as the grids/points!
  if (!is.null(mapping$color)) {
    color_encoding <- append(color_encoding, list(legend = list(values = levels(.data[[mapping$color]]))))
  }

  spec_encoding <- list(
    x = x_encoding,
    y = y_encoding
  )

  # Only append color to the specs if the color mapping isnt null
  if(!is.null(color_name)) { spec_encoding$color <- color_encoding }

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

  specs_list <- list()

  # If we have a mutation before we do not want to show info grids, return an empty spec set and transition directly to following steps
  if(mutation_before) {
    return(specs_list)
  }

  # Order of grouping should go column -> row -> x/color
  # But only if they actually exist in the mapping!

  # TODO to handle: In ggplot2, color is not necessarily along with x
  # It might be the column variable, or row variable, or a totally different variable etc
  # Right now color isn't extracted from ggplot2 at all :(

  # State 1: Grouped icon array, by column ----

  # Flag whether to create a column frame
  do_column <- !is.null(mapping$column)

  if (do_column) {
    # Add a count (grouped) to each record
    count_data <- .data %>%
      dplyr::count(dplyr::across(mapping$column)) %>%
      add_ids_to_count_data(.data, mapping$column)

    # Generate description
    description <- generate_group_by_description(mapping, "column")

    # Add tooltip
    spec_encoding$tooltip <- generate_group_by_tooltip(count_data)

    spec <- generate_vega_specs(count_data,
      mapping = mapping,
      meta = list(parse = "grid", description = description),
      spec_encoding = spec_encoding,
      facet_encoding = facet_encoding,
      height = height, width = width,
      facet_dims = facet_dims,
      column = TRUE, color = identical(mapping$column, mapping$color) # Also do color if it's the same as the column variable
    )

      specs_list <- specs_list %>%
        append(list(spec))
  }


  # State 2: Grouped icon array, by column and row ----

  # Flag whether to do a row frame
  do_row <- !is.null(mapping$row)

  if (do_row) {
    # Add a count (grouped) to each record
    count_data <- .data %>%
      dplyr::count(dplyr::across(tidyselect::any_of(c(mapping$column, mapping$row)))) %>%
      add_ids_to_count_data(.data, mapping$column, mapping$row)

    # Generate description
    description <- generate_group_by_description(mapping, "column", "row")

    # Add tooltip
    spec_encoding$tooltip <- generate_group_by_tooltip(count_data)

    meta <- list(parse = "grid", description = description)

    # Split on X if it's the same as the row mapping
    # This is a variable needed by the JS code in order to split the infogrid "within" a facet frame
    if (identical(mapping$x, mapping$row)) {
      meta <- append(meta, list(splitField = mapping$x))
    }

    spec <- generate_vega_specs(count_data,
      mapping = mapping,
      meta = meta,
      spec_encoding = spec_encoding,
      facet_encoding = facet_encoding,
      height = height, width = width,
      facet_dims = facet_dims,
      column = TRUE, row = TRUE, color = identical(mapping$row, mapping$color) | identical(mapping$row, mapping$color) # Also do color if it's the same as the row variable, or the column!
    )

    specs_list <- specs_list %>%
      append(list(spec))
  }
  

  # State 3: Grouped icon array, by column, row, and x/color ----

  # If x is the same as the row/column variable, don't do it twice
  # AND if the mapping is not just 1
  do_x <- (!is.null(mapping$x) & !(identical(mapping$x, mapping$column) | identical(mapping$x, mapping$row))) & mapping$x != 1

  if (do_x) {
    count_data <- .data %>%
      dplyr::count(dplyr::across(tidyselect::any_of(c(mapping$column, mapping$row, mapping$x)))) %>%
      add_ids_to_count_data(.data, mapping$column, mapping$row, mapping$x)

    description <- generate_group_by_description(mapping, "column", "row", "x")

    # Add tooltip
    spec_encoding$tooltip <- generate_group_by_tooltip(count_data)

    spec <- generate_vega_specs(count_data,
      mapping = mapping,
      meta = list(parse = "grid", description = description, splitField = mapping$x, axes = !is.null(mapping$column) | (is.null(mapping$column) & !is.null(mapping$row))),
      spec_encoding = spec_encoding,
      facet_encoding = facet_encoding,
      height = height, width = width,
      facet_dims = facet_dims,
      column = !is.null(mapping$column), row = !is.null(mapping$row), color = identical(mapping$row, mapping$color) | identical(mapping$column, mapping$color) | identical(mapping$x, mapping$color)
    )

    specs_list <- specs_list %>%
      append(list(spec))
  }

  # State 4: Grouped icon array, by column, row, x, and color
  # If color is specified and separate from x - happens when specified via ggplot2!

  # If x is the same as the row/column variable, don't do it twice
  # AND if the mapping is not just 1
  do_color <- !is.null(mapping$color) & !(identical(mapping$color, mapping$column) | identical(mapping$color, mapping$row) | identical(mapping$color, mapping$x))

  if (do_color) {
    count_data <- .data %>%
      dplyr::count(dplyr::across(tidyselect::any_of(c(mapping$column, mapping$row, mapping$x, mapping$color)))) %>%
      add_ids_to_count_data(.data, mapping$column, mapping$row, mapping$x, mapping$color)

    description <- generate_group_by_description(mapping, "column", "row", "x", "color")

    spec <- generate_vega_specs(count_data,
      mapping = mapping,
      meta = list(parse = "grid", description = description, splitField = mapping$x, axes = !is.null(mapping$column) | (is.null(mapping$column) & !is.null(mapping$row))),
      spec_encoding = spec_encoding,
      facet_encoding = facet_encoding,
      height = height, width = width,
      facet_dims = facet_dims,
      column = !is.null(mapping$column), row = !is.null(mapping$row), color = TRUE
    )

    specs_list <- specs_list %>%
      append(list(spec))
  }

  # Convert specs to JSON
  if (toJSON) {
    specs_list <- specs_list %>%
      purrr::map(vegawidget::vw_as_json, pretty = pretty)
  }

  # Return the specs

  specs_list
}

add_ids_to_count_data <- function(count_data, .data, ...) {
  group_vars <- list(...) %>%
    purrr::compact() %>%
    purrr::map(rlang::sym)

  group_ids <- .data %>%
    dplyr::group_by(!!!group_vars) %>%
    dplyr::group_data() %>%
    dplyr::rename(gemini_ids = .data$.rows)

  join_names <- count_data %>%
    dplyr::select(-.data$n) %>%
    names()

  count_data %>%
    dplyr::left_join(group_ids, by = join_names)
}
