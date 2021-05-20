#' Pipeline UI Function
#'
#' @description A shiny Module.
#'
#' @param id,input,output,session Internal parameters for {shiny}.
#'
#' @noRd
#'
#' @importFrom shiny NS tagList
mod_pipeline_ui <- function(id){
  ns <- NS(id)
  tagList(
    shiny::uiOutput(ns("pipeline_ui"))
  )
}

#' Pipeline Server Functions
#'
#' @noRd
mod_pipeline_server <- function(id, inputs){
  moduleServer(id, function(input, output, session){
    ns <- session$ns

    pipeline <- shiny::eventReactive(inputs$go(), {
      pipeline_group_by <- !is.null(inputs$group_by())
      if (pipeline_group_by) {
        glue::glue("{inputs$dataset()} %>% group_by({paste0(inputs$group_by(), collapse = ', ')}) %>% summarize({inputs$summary_function()} = {inputs$summary_function()}({inputs$summary_variable()}, na.rm = TRUE))")
      } else {
        glue::glue("{inputs$dataset()} %>% summarize({inputs$summary_function()} = {inputs$summary_function()}({inputs$summary_var()}, na.rm = TRUE))")
      }
    })

    # Outputs -----

    output$pipeline <- shiny::renderText({
      pipeline()
    })

    shiny::observeEvent(inputs$go(), {
      output$pipeline_ui <- shiny::renderUI({
        shiny::fluidRow(
          shiny::h2("tidyverse pipeline"),
          shiny::verbatimTextOutput(ns("pipeline"))
        )
      })
    })

  #   # Evaluate and return results from pipeline
  #   pipeline_res <- shiny::reactive({
  #     eval(rlang::parse_expr(pipeline()))
  #   })
  #
  #   return(pipeline_res)

    return(pipeline)
  })
}

## To be copied in the UI
# mod_pipeline_ui("pipeline")

## To be copied in the server
# mod_pipeline_server("pipeline")
