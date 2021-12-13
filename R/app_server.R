#' The application server
#'
#' @param input,output,session Internal parameters for {shiny}.
#' @noRd
app_server <- function(input, output, session) {
  inputs <- mod_inputs_server("inputs")
  pipeline <- mod_pipeline_server("pipeline", inputs)

  mod_datamation_sanddance_server("datamation_sanddance", pipeline)

  slider_state <- shiny::reactiveVal()
  tab_change <- shiny::reactiveVal()

  shiny::observeEvent(input$slider_state, {
    slider_state(input$slider_state)
    tab_change("slider")
  })

  mod_data_tabs_server("data_tabs", inputs, pipeline, slider_state, tab_change)
}
