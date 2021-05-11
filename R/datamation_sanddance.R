#' Generate a plot datamation
#'
#' Generates the vega lite specs necessary for a plot datamation, based on a tidyverse pipeline.
#'
#' @param pipeline Tidyverse pipeline
#' @param envir Environment where code is evaluated. Defaults to the global environment.
#' @param pretty Whether to pretty the JSON output. Defaults to TRUE.
#' @param elementId Optional ID for the widget element.
#' @param height Height of the plotting area of the widget (excluding axes and legends). This is an approximation and not an exact science, since sizes may vary depending on labels, legends, facets, etc! Defaults to 300 (pixels).
#' @param width Width of the plotting area of the widget (excluding axes and legends). This is an approximation and not an exact science, since sizes may vary depending on labels, legends, facets, etc! Defaults to 300 (pixels).
#' @export
datamation_sanddance <- function(pipeline, envir = rlang::global_env(), pretty = TRUE, elementId = NULL, height = 300, width = 300) {
  supported_tidy_functions <- c("group_by", "summarize", "summarise")

  fittings <- pipeline %>%
    parse_pipeline(supported_tidy_functions)

  data_states <- fittings %>%
    snake(envir = envir)

  if (length(data_states) < 2) {
    stop("No data transformation detected by `datamation_sanddance`.", call. = FALSE)
  }

  tidy_functions_list <- parse_functions(fittings)

  tidy_func_arg <- fittings %>%
    purrr::map(as.list) %>%
    purrr::map(as.character)

  purrr::map(
    tidy_functions_list,
    ~ if (!(.x %in% supported_tidy_functions)) {
      stop(paste(.x, "is not supported by `datamation_sanddance`"), call. = FALSE)
    }
  )

  res <- purrr::map(1:length(fittings), function(i) {

    # Starts with data in the previous stage, unless it is the first stage (the data itself)
    if (i == 1) {
      data <- data_states[[1]]
      verb <- "data"
    } else {
      data <- data_states[[i - 1]]
      verb <- tidy_func_arg[[i]][[1]]
    }

    call_verb <- switch(verb,
      data = prep_specs_data,
      group_by = prep_specs_group_by,
      summarise = prep_specs_summarize,
      summarize = prep_specs_summarize
    )

    args <- switch(verb,
      data = NA_character_,
      group_by = tidy_func_arg[[i]][-1],
      summarise = tidy_func_arg[[i]][[2]],
      summarize = tidy_func_arg[[i]][[2]]
    )

    call_args <- switch(verb,
      data = NA_character_,
      group_by = rlang::parse_exprs(args),
      # TODO: What if there's more than one calculation??
      summarise = rlang::parse_exprs(args),
      summarize = rlang::parse_exprs(args)
    )

    do.call(call_verb, list(data, call_args, toJSON = FALSE, pretty = pretty, height = height, width = width))
  })

  # Unlist into a single list
  res <- unlist(res, recursive  = FALSE)

  # Convert to JSON
  res <- jsonlite::toJSON(res, auto_unbox = TRUE, pretty = pretty, null = "null", digits = NA)

  # Create widget
  datamationSandDance(res, elementId = elementId)
}
