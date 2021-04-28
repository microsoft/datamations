#' Produces frames (plots) of transition from ungrouped to grouped icon arrays
#'
#' @param .data grouped dataframe
#' @param ... grouping variables
#' @param nframes number of frames per animation stage
#' @param is_last flag for whether this is the last stage of the pipeline. Defaults to \code{FALSE}
#' @param titles titles for animation stage
#' @return ggplot object
#' @importFrom rlang enquos sym .data :=
#' @importFrom purrr map_chr map_df walk
#' @importFrom dplyr first row_number tribble lag
#' @importFrom tidyr unite unnest
#' @importFrom ggplot2 layer_scales
#' @export
animate_group_by_sanddance <- function(.data, ..., nframes = 5, is_last = FALSE, titles = "") {

  # Map grouping variables
  group_vars <- c(...)
  # Count number of groups
  n_groups <- length(group_vars)

  # Use the first grouping variable for column facet
  col_facet_var <- first(group_vars)
  # And the second for the row facet
  row_facet_var <- dplyr::nth(group_vars, n = 2)
  # And the third for color
  color_var <- dplyr::nth(group_vars, n = 3)

  # Convert grouping variables to character
  group_vars_chr <- map_chr(group_vars, rlang::quo_name)

  # Keep an unaltered copy of the data to return later
  df <- .data

  # Convert grouping variables to character - useful if there are binary variables or with a small number of (numeric) options, since you can't map shape to a continuous variable
  # But we should be careful about too many categories and e.g. stop if there are too many
  .data <- .data %>%
    dplyr::mutate_at(dplyr::all_of(group_vars_chr), as.character)

  # Add an ID to the data to be used across frames
  .data <- .data %>%
    mutate(.id = row_number())

  # Generate the data and specs for each state
  specs_list <- vector("list", length = n_groups + 1)

  # Prep encoding

  x_encoding <- list(field = "x", type = "quantitative", axis = NULL)
  y_encoding <- list(field = "y", type = "quantitative", axis = NULL)
  facet_col_encoding <- list(field = rlang::quo_name(col_facet_var), type = "nominal", title = NULL)
  facet_row_encoding <- list(field = rlang::quo_name(row_facet_var), type = "nominal", title = NULL)
  color_encoding <- list(field = rlang::quo_name(color_var), type = "quantitative", axis = NULL)

  # TODO: these are not "real specs" as they don't actually have an x or y, only n - the first few frames need to be processed on the JS side into infogrids.

  # State 1: Ungrouped icon array

  # Add a count (total) to each record

  data_1 <- .data %>%
    dplyr::add_count() %>%
    select(.id, n, tidyselect::any_of(group_vars_chr))

  specs_list[[1]] <- list(
    `$schema` = vegawidget::vega_schema(),
    data = list(values = data_1),
    mark = "point",
    encoding = list(
      x = x_encoding,
      y = y_encoding
    )
  ) %>%
    vegawidget::as_vegaspec() %>%
    vegawidget::vw_as_json()

  # State 2: Grouped icon aray, first grouping in column facets

  # Add a count (grouped) to each record

  data_2 <- .data %>%
    group_by({{ col_facet_var }}) %>%
    dplyr::add_count() %>%
    ungroup() %>%
    select(.id, n, tidyselect::any_of(group_vars_chr))

  specs_list[[2]] <- list(
    `$schema` = vegawidget::vega_schema(),
    data = list(values = data_2),
    mark = "point",
    encoding = list(
      x = x_encoding,
      y = y_encoding,
      column = facet_col_encoding
    )
  ) %>%
    vegawidget::as_vegaspec() %>%
    vegawidget::vw_as_json()

  # State 3: Grouped icon array, first group in col and second in row facets

  if (n_groups %in% c(2, 3)) {

    data_3 <- .data %>%
      group_by({{ col_facet_var }}, {{ row_facet_var }}) %>%
      dplyr::add_count() %>%
      ungroup() %>%
      select(.id, n, tidyselect::any_of(group_vars_chr))

    specs_list[[3]] <- list(
      `$schema` = vegawidget::vega_schema(),
      data = list(values = data_3),
      mark = "point",
      encoding = list(
        x = x_encoding,
        y = y_encoding,
        column = facet_col_encoding,
        row = facet_row_encoding
      )
    ) %>%
      vegawidget::as_vegaspec() %>%
      vegawidget::vw_as_json()
  }

  # State 4: Grouped icon array, first group in col, second in row facets, third in colour

  if (n_groups == 3) {

    data_4 <- .data %>%
      group_by({{ col_facet_var }}, {{ row_facet_var }}, {{ color_var }}) %>%
      dplyr::add_count() %>%
      ungroup() %>%
      select(.id, n, tidyselect::any_of(group_vars_chr))

    specs_list[[4]] <- list(
      `$schema` = vegawidget::vega_schema(),
      data = list(values = data_4),
      mark = "point",
      encoding = list(
        x = x_encoding,
        y = y_encoding,
        column = facet_col_encoding,
        row = facet_row_encoding,
        color = color_encoding
      )
    ) %>%
      vegawidget::as_vegaspec() %>%
      vegawidget::vw_as_json()
  }

  # Return the specs
  specs_list
}
