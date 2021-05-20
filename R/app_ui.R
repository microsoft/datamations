#' The application User Interface
#'
#' @param request Internal parameter for `{shiny}`.
#' @noRd
app_ui <- function(request) {
  shiny::fluidPage(
    style = "max-width: 1200px;",
    shiny::h1("datamations"),
    mod_inputs_ui("inputs"),
    mod_pipeline_ui("pipeline"),
    mod_datamation_sanddance_ui("datamation_sanddance"),
    shiny::fluidRow(
      shiny::column(
        width = 6,
      )
    #   shiny::column(
    #     width = 6,
    #     shiny::h2("data stages"),
    #     shiny::tabsetPanel(id = "tab")
    #   )
    )
  )
}
