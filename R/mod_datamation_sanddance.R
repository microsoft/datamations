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
  datamations::datamationSandDanceOutput(ns("datamation"))
  # See in server re: why this is commented out
  # shiny::uiOutput(ns("datamation_ui"))
}

#' datamation_sanddance Server Functions
#'
#' @noRd
mod_datamation_sanddance_server <- function(id, pipeline) {
  shiny::moduleServer(id, function(input, output, session) {
    ns <- session$ns

    # Render UI

    shiny::observeEvent(pipeline(), {

      # Generate datamation -----
      datamation <- shiny::reactive({
        datamation_sanddance(pipeline(), height = 300, width = 300)
      })

      # Create an output for it
      output$datamation <- datamations::renderDatamationSandDance({
        datamation()
      })

      # For some reason, doing renderUI is causing the javascript code to run twice (even when the actual R code is not) - so just use datamationSandDanceOutput directly, even if it means the slider shows initially!
      # output$datamation_ui <- shiny::renderUI({
      #   datamations::datamationSandDanceOutput(ns("datamation"))
      # })
    })
  })
}

## To be copied in the UI
# mod_datamation_sanddance_ui("datamation_sanddance")

## To be copied in the server
# mod_datamation_sanddance_server("datamation_sanddance")
