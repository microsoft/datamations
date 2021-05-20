#' The application User Interface
#'
#' @param request Internal parameter for `{shiny}`.
#' @noRd
app_ui <- function(request) {
  shiny::tagList(
    shinyWidgets::useShinydashboard(),
    shiny::fluidPage(
      style = "max-width: 1200px;",
      shiny::h1("datamations"),
      mod_inputs_ui("inputs"),
      mod_pipeline_ui("pipeline"),
      shiny::fluidRow(
        shiny::column(
          width = 6,
          mod_datamation_sanddance_ui("datamation_sanddance")
        ),
        shiny::column(
          width = 6,
          mod_data_tabs_ui("data_tabs")
        )
      )
    )
  )
}
