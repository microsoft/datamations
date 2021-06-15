#' datamations SandDance html widget
#'
#' @param specs JSON specs for pipeline
#' @param width Width of widget. Not currently used
#' @param height Height of widget. Not currently used
#' @param elementId Optional element ID for widget
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

#' Shiny bindings for datamationSandDance
#'
#' Output and render functions for using datamationSandDance within Shiny
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
