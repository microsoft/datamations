generate_mapping <- function(data_states, tidy_functions_arg) {

  # Check if there is any grouping or summarizing in the pipeline
  pipeline_has_group_by <- any(names(data_states) == "group_by")
  pipeline_has_summarize <- any(names(data_states) == "summarize")

  # Extract grouping variables and count of them
  .group_vars <- data_states[["group_by"]] %>%
    group_vars()

  n_group_vars <- length(.group_vars)

  # X mapping
  # If there are 3 grouping variables, X is the third one - otherwise, it's just 1
  if (identical(n_group_vars, 3L)) { # Use identical to handle NULL if there is no grouping at all
    x_mapping <- list(x = dplyr::nth(.group_vars, 3))
  } else {
    x_mapping <- list(x = 1)
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
  if (!pipeline_has_group_by) {
    group_mapping <- NULL
  } else {
    if (n_group_vars >= 1) {
      group_mapping <- list(column = dplyr::nth(.group_vars, 1))
    }

    if (n_group_vars >= 2) {
      group_mapping <- append(
        group_mapping,
        list(row = dplyr::nth(.group_vars, 2))
      )
    }

    if (n_group_vars == 3) {
      group_mapping <- append(
        group_mapping,
        list(color = dplyr::nth(.group_vars, 3))
      )
    }

    group_mapping <- append(group_mapping, list(groups = .group_vars))
  }

  # Combine all
  mapping <- append(x_mapping, y_mapping) %>%
    append(group_mapping)

  mapping
}
