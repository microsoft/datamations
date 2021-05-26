#' Pipeline UI Function
#'
#' @description A shiny Module.
#'
#' @param id,input,output,session Internal parameters for {shiny}.
#'
#' @noRd
#'
#' @importFrom shiny NS tagList
mod_pipeline_ui <- function(id) {
  ns <- NS(id)
  shiny::tagList(
    shiny::hr(),
    shiny::fluidRow(
      shinydashboard::box(
        width = 12,
        solidHeader = TRUE,
        shiny::h2("tidyverse pipeline"),
        shinyAce::aceEditor(
          outputId = ns("pipeline_editor"),
          mode = "r",
          fontSize = 16,
          readOnly = TRUE,
          highlightActiveLine = FALSE,
          autoScrollEditorIntoView = TRUE,
          minLines = 2,
          maxLines = 30,
          value = "# Code will appear here based on selections above"
        ),
      )
    )
  )
}

#' Pipeline Server Functions
#'
#' @noRd
mod_pipeline_server <- function(id, inputs) {
  shiny::moduleServer(id, function(input, output, session) {
    ns <- session$ns

    pipeline <- shiny::eventReactive(inputs$go(), {
      pipeline_group_by <- !is.null(inputs$group_by())
      if (pipeline_group_by) {
        glue::glue("{inputs$dataset()} %>% group_by({paste0(inputs$group_by(), collapse = ', ')}) %>% summarize({inputs$summary_function()} = {inputs$summary_function()}({inputs$summary_variable()}, na.rm = TRUE))")
      } else {
        glue::glue("{inputs$dataset()} %>% summarize({inputs$summary_function()} = {inputs$summary_function()}({inputs$summary_var()}, na.rm = TRUE))")
      }
    })

    # Update editor with pipeline

    shiny::observeEvent(inputs$go(), {
      text <- c("library(dplyr)\n", pipeline())
      if (inputs$dataset() == "penguins") {
        text <- c("library(palmerpenguins)\n", text)
      }
      text <- styler::style_text(text)
      shinyAce::updateAceEditor(session, "pipeline_editor", value = paste0(text, collapse = "\n"))
    })

    return(pipeline)
  })
}

## To be copied in the UI
# mod_pipeline_ui("pipeline")

## To be copied in the server
# mod_pipeline_server("pipeline")
