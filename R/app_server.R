#' The application server
#'
#' @param input,output,session Internal parameters for {shiny}.
#' @noRd
app_server <- function(input, output, session) {
  library(dplyr)
  library(palmerpenguins)

  inputs <- mod_inputs_server("inputs")
  pipeline <- mod_pipeline_server("pipeline", inputs)

  mod_datamation_sanddance_server("datamation_sanddance", inputs, pipeline)

  mod_data_tabs_server("data_tabs", inputs, pipeline)
}
