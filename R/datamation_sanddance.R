#' Create a plot datamation
#'
#' Create a plot datamation from a tidyverse pipeline.
#'
#' @param pipeline Tidyverse pipeline
#' @param envir Environment where code is evaluated. Defaults to the global environment.
#' @param pretty Whether to pretty the JSON output. Defaults to TRUE.
#' @param elementId Optional ID for the widget element.
#' @param height Height of the plotting area of the widget (excluding axes and legends). This is an approximation and not an exact science, since sizes may vary depending on labels, legends, facets, etc! Defaults to 300 (pixels).
#' @param width Width of the plotting area of the widget (excluding axes and legends). This is an approximation and not an exact science, since sizes may vary depending on labels, legends, facets, etc! Defaults to 300 (pixels).
#' @export
#'
#' @examples {
#'   library(dplyr)
#'
#'   "small_salary %>%
#'   group_by(Degree) %>%
#'   summarize(mean = mean(Salary))" %>%
#'     datamation_sanddance()
#'
#'   library(ggplot2)
#'
#'   "small_salary %>%
#'   group_by(Work, Degree) %>%
#'   summarize(mean_salary = mean(Salary)) %>%
#'   ggplot(aes(x = Work, y = mean_salary)) +
#'   geom_point() +
#'   facet_grid(rows = vars(Degree))" %>%
#'     datamation_sanddance()
#' }
datamation_sanddance <- function(pipeline, envir = rlang::global_env(), pretty = TRUE, elementId = NULL, height = 300, width = 300) {

  # Check that dplyr is loaded
  if (!"dplyr" %in% (.packages())) {
    stop("Please load dplyr via `library(dplyr)` to generate this datamation.", call. = FALSE)
  }

  # Specify which functions are supported, for parsing functions out and for erroring if any are not in this list
  supported_tidy_functions <- c("group_by", "summarize")

  # Convert pipeline into list
  full_fittings <- pipeline %>%
    parse_pipeline(supported_tidy_functions)

  # Check if there's any ggplot2 in the fittings
  contains_ggplot <- stringr::str_detect(pipeline, "ggplot")

  # If there is, assume the last element is the plotting
  if (contains_ggplot) {
    # Remove the ggplot element
    fittings <- full_fittings[1:(length(full_fittings) - 1)]
    ggplot2_fittings <- full_fittings[[length(full_fittings)]]
    ggplot2_fittings <- as.character(ggplot2_fittings)

    # Check that ggplot2 is loaded, error if not
    if (!"ggplot2" %in% (.packages())) {
      stop("Please load ggplot2 via `library(ggplot2)` to generate this datamation.", call. = FALSE)
    }

    # Check ggplot2 code for what is supported
    parse_ggplot2_code(ggplot2_fittings)
  } else {
    fittings <- full_fittings
  }

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

  # If there's a ggplot specification, get the mapping (x and facets) from the final plot
  if (contains_ggplot) {
    # Evaluate plot
    pipeline_plot <- pipeline %>%
      rlang::parse_expr() %>%
      eval()

    # Parse aspects of mapping from plot
    plot_mapping <- generate_mapping_from_plot(pipeline_plot)
  } else {
    plot_mapping <- NULL
  }

  # Construct mapping - x, y, facets, etc
  names(data_states) <- tidy_functions_list
  names(tidy_function_args) <- tidy_functions_list

  mapping <- generate_mapping(data_states, tidy_function_args, plot_mapping)

  # Iterate over each step of the pipeline
  res <- purrr::map(1:length(fittings), function(i) {

    # Starts with data in the previous stage, unless it is the first stage (the data itself)
    if (i == 1) {
      data <- data_states[[1]]
      verb <- "data"
    } else {
      data <- data_states[[i - 1]]
      verb <- tidy_function_args[[i]][[1]]
    }

    # Define which function to call for that step in the pipeline
    call_verb <- switch(verb,
      data = prep_specs_data,
      group_by = prep_specs_group_by,
      summarize = prep_specs_summarize
    )

    # Call that function with the data and mapping
    do.call(call_verb, list(data, mapping, toJSON = FALSE, pretty = pretty, height = height, width = width))
  })

  # Unlist into a single list
  res <- unlist(res, recursive = FALSE)

  # Convert to JSON
  res <- jsonlite::toJSON(res, auto_unbox = TRUE, pretty = pretty, null = "null", digits = NA)

  # Create widget
  datamationSandDance(res, elementId = elementId)
}

#' datamations_sanddance htmlwidget
#'
#' @param specs JSON specs for pipeline
#' @param width Width of widget. Not currently used
#' @param height Height of widget. Not currently used
#' @param elementId Optional element ID for widget
#'
#' @noRd
datamationSandDance <- function(specs, width = NULL, height = NULL, elementId = NULL) {

  # forward options using x
  x <- list(
    specs = specs
  )

  # create widget
  htmlwidgets::createWidget(
    name = "datamationSandDance",
    x,
    width = width,
    height = height,
    package = "datamations",
    elementId = elementId
  )
}

#' Output and render functions for using datamation_sanddance in Shiny
#'
#' Output and render functions for using datamation_sanddance within Shiny
#' applications and interactive Rmd documents.
#'
#' @param outputId output variable to read from
#' @param width,height Must be a valid CSS unit (like \code{'100\%'},
#'   \code{'400px'}, \code{'auto'}) or a number, which will be coerced to a
#'   string and have \code{'px'} appended.
#' @param expr An expression that generates a datamationSandDance
#' @param env The environment in which to evaluate \code{expr}.
#' @param quoted Is \code{expr} a quoted expression (with \code{quote()})? This
#'   is useful if you want to save an expression in a variable.
#'
#' @name datamationSandDance-shiny
#'
#' @export
datamationSandDanceOutput <- function(outputId, width = "100%", height = "400px") {
  htmlwidgets::shinyWidgetOutput(outputId, "datamationSandDance", width, height, package = "datamations")
}

#' @rdname datamationSandDance-shiny
#' @export
renderDatamationSandDance <- function(expr, env = parent.frame(), quoted = FALSE) {
  if (!quoted) {
    expr <- substitute(expr)
  } # force quoted
  htmlwidgets::shinyRenderWidget(expr, datamationSandDanceOutput, env, quoted = TRUE)
}

datamationSandDance_html <- function(...) {
  id <- c(...)[["id"]]

  shiny::tags$div(
    ...,
    shiny::tags$div(
      class = "controls-wrapper",
      shiny::tags$div(
        class = "control-bar",
        shiny::tags$div(
          class = "button-wrapper",
          shiny::tags$button(onclick = htmlwidgets::JS(paste0("play('", id, "')")), "Replay")
        ),
        shiny::tags$div(
          class = "slider-wrapper",
          shiny::tags$input(class = "slider", type = "range", min = "0", value = "0", onchange = htmlwidgets::JS(paste0("onSlide('", id, "')")))
        )
      ),
      shiny::tags$div(class = "description")
    ),
    shiny::tags$div(
      class = "vega-vis-wrapper",
      shiny::tags$div(class = "vega-for-axis"),
      shiny::tags$div(class = "vega-other-layers"),
      shiny::tags$div(class = "vega-vis")
    )
  )
}
