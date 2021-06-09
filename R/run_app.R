#' Run the Shiny Application
#'
#' @param ... A series of options to be used inside the app.
#'
#' @export
run_app <- function() {
  shiny::shinyApp(
      ui = app_ui,
      server = app_server
    )
}
