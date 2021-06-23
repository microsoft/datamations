#' Run the Shiny Application
#'
#' @export
#' @noRd
run_app <- function() {
  shiny::shinyApp(
    ui = app_ui,
    server = app_server
  )
}
