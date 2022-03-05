generate_mapping <- function(data_states, tidy_functions_arg, plot_mapping) {

  # Check if there is any grouping or summarizing in the pipeline
  pipeline_has_group_by <- any(names(data_states) == "group_by")
  pipeline_has_mutate <- any(names(data_states) == "mutate")
  pipeline_has_summarize <- any(names(data_states) == "summarize")
  pipeline_has_count <- any(names(data_states) == "count")

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
  } else if (pipeline_has_count) {
    .group_vars <- data_states[["count"]] %>%
      dplyr::select(-.data$n) %>%
      names()

    n_group_vars <- length(.group_vars)
  } else if (!pipeline_has_group_by & !pipeline_has_count) {
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

  # Mutation mapping
  # If we have mutations, we need mappings for it
  # Somewhat mimicking the summarize mappings generated below
  # We want:
  # - a mutation name that is the name of the variable output by the mutation
  # - a mutation function that is the primary function of the mutated variable
  # - a mutation expression/set of params that is the full expression of how the variable is derived

  if(!pipeline_has_mutate) {
    mutations_mappings <- list(
      mutation_name = NULL,
      mutation_expression = NULL,
      mutation_variables = NULL
    )
  } else {
    mutate_operation <- tidy_functions_arg[["mutate"]][[2]] %>%
      rlang::parse_exprs() %>%
      purrr::pluck(1) %>%
      as.list()

    # Optionally, pass a summary_parameters mapping that gets used in the generation of data_2
    # This is generic for potential applications with optional parameters

    mutations = tidy_functions_arg[["mutate"]][-1]
    number_of_mutations = length(mutations)

    # This pulls out the variables in the data that are used to produce the mutation
    # TODO add handling here if multiple mutates are specified
    variables_for_mutation <- intersect(mutate_operation, names(data_states[["mutate"]]))

    # For now leaving handling here the same for single mutation and multiple mutations steps
    # We can figure out if we want to handle differently later

    if(number_of_mutations>1) {
      mutations_mappings <- list(
        mutation_function = mutate_operation %>%
            purrr::pluck(1) %>%
            rlang::quo_name(),
        mutation_name = names(mutations),
        mutation_expression = unname(mutations),
        mutation_variables = variables_for_mutation
      )
    }

    else {
      mutations_mappings <- list(
        mutation_function = mutate_operation %>%
          purrr::pluck(1) %>%
          rlang::quo_name(),
        mutation_name = names(mutations),
        mutation_expression = unname(mutations),
        mutation_variables = variables_for_mutation
      )
    }

  }

  # Y mapping
  # If there is no summarize, then Y can be NULL
  # Otherwise it's parsed from the summarize section of the pipeline

  if (!pipeline_has_summarize) {
    y_mapping <- list(
      y = NULL,
      summary_function = NULL,
      summary_name = NULL
    )
  } else {
    summarize_operation <- tidy_functions_arg[["summarize"]][[2]] %>%
      rlang::parse_exprs() %>%
      purrr::pluck(1) %>%
      as.list()

    # Optionally, pass a summary_parameters mapping that gets used in the generation of data_2
    # This is generic for potential applications with optional parameters
    if(length(summarize_operation)>2) {
      y_mapping <- list(
        summary_function = summarize_operation %>%
          purrr::pluck(1) %>%
          rlang::quo_name(),
        summary_name = names(tidy_functions_arg[["summarize"]][2]),
        summary_parameters = summarize_operation[[3:length(summarize_operation)]]
      )
    }

    else {
      y_mapping <- list(
        summary_function = summarize_operation %>%
          purrr::pluck(1) %>%
          rlang::quo_name(),
        summary_name = names(tidy_functions_arg[["summarize"]][2])
      )
    }

    y_var <- summarize_operation %>%
      purrr::pluck(2)

    if (!identical(y_var, NULL)) {
      y_mapping[["y"]] <- rlang::quo_name(y_var)
    }
  }

  # Group mapping
  if (!is.null(plot_mapping)) {
    group_mapping <- plot_mapping[c("row", "column")]
    group_mapping <- append(group_mapping, list(groups = .group_vars))
  } else {
    if (!pipeline_has_group_by & !pipeline_has_count) {
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
    append(group_mapping) %>%
    append(mutations_mappings)

  # Remove "empty" entries
  purrr::compact(mapping)
}
