#' @param .data
#' @param summary_operation quoted
#' @param nframes number of frames per animation "stage"
#' @param output returns the first step, the second step, or both
#' @importFrom tweenr keep_state tween_state
#' @importFrom ggbeeswarm geom_beeswarm geom_quasirandom
#' @importFrom scales label_dollar comma_format label_number
#' @importFrom stringr str_replace
#' @importFrom rlang enexpr is_empty
#' @importFrom dplyr mutate_all funs rename right_join group_keys
#' @importFrom ggplot2 layer_data geom_pointrange coord_cartesian scale_y_continuous element_rect xlab scale_x_discrete labs
#' @importFrom stats setNames
#' @importFrom tidyr separate
#' @export
prep_specs_summarize <- function(.data, summary_operation, pretty = TRUE) {

  # START: same as animate_group_by_sanddance

  # Map grouping variables
  group_vars <- dplyr::groups(.data)
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
  .id <- 1:nrow(.data)
  id_df <- tibble(.id = .id)

  .data <- .data %>%
    dplyr::bind_cols(id_df)

  # END: same as animate_group_by_sanddance()

  # Get summary function and variable

  summary_function <- summary_operation %>%
    purrr::pluck(1) %>%
    as.list() %>%
    dplyr::nth(1)

  summary_variable <- summary_operation %>%
    purrr::pluck(1) %>%
    as.list() %>%
    dplyr::nth(2)

  # Generate the data and specs for each state
  specs_list <- vector("list", length = 2)

  # Prep encoding

  x_encoding <- list(field = "x", type = "quantitative", axis = NULL)
  y_encoding <- list(field = "y", type = "quantitative", axis = NULL)
  facet_col_encoding <- list(field = rlang::quo_name(col_facet_var), type = "nominal", title = NULL)
  facet_row_encoding <- list(field = rlang::quo_name(row_facet_var), type = "nominal", title = NULL)
  color_encoding <- list(field = rlang::quo_name(color_var), type = "quantitative", axis = NULL)

  # State 1: Scatter plot (with any grouping)

  data_stage1_original <- .data %>%
    mutate(x = 1) %>%
    select(.id, x, y = {{ summary_variable }}, tidyselect::any_of(group_vars_chr))

  # Create quasirandom plot to scatter points horizontally only
  stage1_quasirandom_plot <- plot_grouped_dataframe_withresponse_sanddance(data_stage1_original)
  stage1_quasirandom_data <- layer_data(stage1_quasirandom_plot)

  # Use values from quasirandom
  data_stage1 <- data_stage1_original
  data_stage1$x <- stage1_quasirandom_data$x

  # Set up encoding based on number of groups
  encoding <- list(
    x = x_encoding,
    y = y_encoding
  )

  if (n_groups == 1) {
    encoding <- append(encoding, list(column = facet_col_encoding))
  } else if (n_groups == 2) {
    encoding <- append(encoding, list(
      column = facet_col_encoding,
      row = facet_row_encoding
    ))
  } else if (n_groups == 3) {
    encoding <- append(encoding, list(
      column = facet_col_encoding,
      row = facet_row_encoding,
      color = color_encoding
    ))
  }

  specs_list[[1]] <- list(
    `$schema` = vegawidget::vega_schema(),
    data = list(values = data_stage1),
    mark = "point",
    encoding = encoding
  ) %>%
    vegawidget::as_vegaspec() %>%
    vegawidget::vw_as_json(pretty = pretty)

  # State 2: Summary plot (with any grouping)
  # There should still be a point for each datapoint, just all overlapping
  # None should disappear, otherwise makes animating

  data_stage2 <- data_stage1_original %>%
    dplyr::mutate(across(y, !!summary_function, na.rm = TRUE))

  specs_list[[2]] <- list(
    `$schema` = vegawidget::vega_schema(),
    data = list(values = data_stage2),
    mark = "point",
    encoding = encoding
  ) %>%
    vegawidget::as_vegaspec() %>%
    vegawidget::vw_as_json(pretty = pretty)

  # Return the specs
  specs_list
}
