#' datamation_sanddance UI Function
#'
#' @description A shiny Module.
#'
#' @param id,input,output,session Internal parameters for {shiny}.
#'
#' @noRd
#'
#' @importFrom shiny NS tagList
mod_datamation_sanddance_ui <- function(id) {
  ns <- NS(id)
  shiny::uiOutput(ns("datamation_ui"))
}

#' datamation_sanddance Server Functions
#'
#' @noRd
mod_datamation_sanddance_server <- function(id, inputs, pipeline) {
  moduleServer(id, function(input, output, session) {
    ns <- session$ns

    # Render UI

    shiny::observeEvent(inputs$go(), {

      # Generate datamation -----
      datamation <- shiny::reactive({
        datamation_sanddance(pipeline(), height = inputs$height(), width = inputs$width())
      })

      # Create an output for it
      output$datamation <- datamations::renderDatamationSandDance(
        datamation()
      )

      output$datamation_ui <- shiny::renderUI({
        datamations::datamationSandDanceOutput(ns("datamation"))
      })
    })
  })
}

## To be copied in the UI
# mod_datamation_sanddance_ui("datamation_sanddance")

## To be copied in the server
# mod_datamation_sanddance_server("datamation_sanddance")
