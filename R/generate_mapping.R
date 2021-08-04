generate_mapping <- function(data_states, tidy_functions_arg, plot_mapping) {

  # Check if there is any grouping or summarizing in the pipeline
  pipeline_has_group_by <- any(names(data_states) == "group_by")
  pipeline_has_summarize <- any(names(data_states) == "summarize")

  # Extract grouping variables and count of them
  # If there is mapping, use column -> row -> x -> color
  if (!is.null(plot_mapping)) {
    .group_vars <- plot_mapping[c("column", "row", "x", "color")] %>%
      unlist() %>%
      unname() %>%
      unique()

    n_group_vars <- length(.group_vars)
  } else if (pipeline_has_group_by) { # If not, take the order supplied in the grouping
    .group_vars <- data_states[["group_by"]] %>%
      group_vars()

    n_group_vars <- length(.group_vars)
  } else if (!pipeline_has_group_by) {
    n_group_vars <- 0
  }

  # If there is mapping from the plot, start with that
  if (!is.null(plot_mapping)) {
    x_mapping <- list(
      x = plot_mapping$x,
      color = plot_mapping$color
    )
  } else {
    # X mapping

    if (n_group_vars > 0) {
      # 1 grouping variable = first is X
      # 2 grouping variables = second is X
      # 3 grouping variables = third is X
      # 4 grouping variables = third is X

      x_location <- ifelse(n_group_vars == 4, 3, n_group_vars)

      x_mapping <- list(x = dplyr::nth(.group_vars, x_location))
    } else {
      x_mapping <- list(x = 1)
    }
  }

  # Y mapping
  # If there is no summarize, then Y can be NULL
  # Otherwise it's parsed from the summarize section of the pipeline

  if (!pipeline_has_summarize) {
    y_mapping <- list(
      y = NULL,
      summary_function = NULL
    )
  } else {
    summarize_operation <- tidy_functions_arg[["summarize"]][[2]] %>%
      rlang::parse_exprs() %>%
      purrr::pluck(1) %>%
      as.list()

    y_mapping <- list(
      y = summarize_operation %>%
        purrr::pluck(2) %>%
        rlang::quo_name(),
      summary_function = summarize_operation %>%
        purrr::pluck(1) %>%
        rlang::quo_name()
    )
  }

  # Group mapping
  if (!is.null(plot_mapping)) {
    group_mapping <- plot_mapping[c("row", "column")]
    group_mapping <- append(group_mapping, list(groups = .group_vars))
  } else {
    if (!pipeline_has_group_by) {
      group_mapping <- NULL
    } else {

      # One variable - x
      # Two variables - column, x
      # Three variables - column, row, x

      group_mapping <- switch(n_group_vars,
        "1" = list(x = dplyr::nth(.group_vars, 1)),
        "2" = list(column = dplyr::nth(.group_vars, 1), x = dplyr::nth(.group_vars, 2), color = dplyr::nth(.group_vars, 2)),
        "3" = list(column = dplyr::nth(.group_vars, 1), row = dplyr::nth(.group_vars, 2), x = dplyr::nth(.group_vars, 3), color = dplyr::nth(.group_vars, 3))
      )

      group_mapping <- append(group_mapping, list(groups = .group_vars))
    }
  }

  # Combine all
  mapping <- append(x_mapping, y_mapping) %>%
    append(group_mapping)

  # Remove "empty" entries
  purrr::compact(mapping)
}
