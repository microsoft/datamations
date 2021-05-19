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
  # Specify which functions are supported, for parsing functions out and for erroring if any are not in this list
  supported_tidy_functions <- c("group_by", "summarize")

  # Convert pipeline into list
  full_fittings <- pipeline %>%
    parse_pipeline(supported_tidy_functions)

  # Remove any plotting fittings
  ggplot_fittings <- full_fittings %>%
    purrr::map(function(x) {
      x %>% rlang::quo_name() %>% stringr::str_starts("ggplot")
      }) %>%
    unlist()

  fittings <- full_fittings[!ggplot_fittings]

  # Get data at each stage
  data_states <- fittings %>%
    snake(envir = envir)

  # Error if there's no data transformation
  if (length(data_states) < 2) {
    stop("No data transformation detected by `datamation_sanddance`.", call. = FALSE)
  }

  # Extract function names from pipeline
  tidy_functions_list <- parse_functions(fittings)

  # Check that all functions are supported
  purrr::map(
    tidy_functions_list[-1], # Since the first one is data
    ~ if (!(.x %in% supported_tidy_functions)) {
      stop(paste(.x, "is not supported by `datamation_sanddance`"), call. = FALSE)
    }
  )

  # Extract arguments
  tidy_function_args <- fittings %>%
    purrr::map(as.list) %>%
    purrr::map(as.character)

  # Construct mapping
  names(data_states) <- tidy_functions_list
  names(tidy_function_args) <- tidy_functions_list

  mapping <- generate_mapping(data_states, tidy_function_args)

  res <- purrr::map(1:length(fittings), function(i) {

    # Starts with data in the previous stage, unless it is the first stage (the data itself)
    if (i == 1) {
      data <- data_states[[1]]
      verb <- "data"
    } else {
      data <- data_states[[i - 1]]
      verb <- tidy_function_args[[i]][[1]]
    }

    call_verb <- switch(verb,
      data = prep_specs_data,
      group_by = prep_specs_group_by,
      summarize = prep_specs_summarize
    )

    do.call(call_verb, list(data, mapping, toJSON = FALSE, pretty = pretty, height = height, width = width))
  })

  # Unlist into a single list
  res <- unlist(res, recursive = FALSE)

  # Convert to JSON
  res <- jsonlite::toJSON(res, auto_unbox = TRUE, pretty = pretty, null = "null", digits = NA)

  # Create widget
  datamationSandDance(res, elementId = elementId)
}
