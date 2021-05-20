#' Inputs UI
#'
#' @description A shiny Module.
#'
#' @param id,input,output,session Internal parameters for {shiny}.
#'
#' @noRd
#'
#' @importFrom shiny NS tagList
mod_inputs_ui <- function(id) {
  ns <- shiny::NS(id)
  tagList(
    shiny::p("Construct a tidyverse pipeline by choosing from the options below. You select a data set, then up to three variables to group by, and finally a variable to summarize and a summary function to apply to it."),
    shiny::fluidRow(
      shiny::column(
        width = 3,
        shiny::selectInput(ns("dataset"),
          "Dataset",
          choices = c("small_salary", "penguins")
        )
      ),
      shiny::column(
        width = 3,
        shiny::uiOutput(ns("group_by"))
      ),
      shiny::column(
        width = 3,
        shiny::uiOutput(ns("summary_variable"))
      ),
      shiny::column(
        width = 3,
        shiny::selectInput(
          ns("summary_function"),
          "Summary function",
          choices = c("mean", "median", "min", "max")
        )
      )
    ),
    shiny::fluidRow(
      shiny::column(
        width = 3,
        shiny::numericInput(ns("height"), "Height", min = 200, max = 600, value = 300)
      ),
      shiny::column(
        width = 3,
        shiny::numericInput(ns("width"), "Width", min = 200, max = 600, value = 300)
      ),
      shiny::column(
        width = 3,
        shiny::actionButton(ns("go"), "Go", width = "100%", style = "margin-top: 25px;")
      )
    )
  )
}

#' Inputs server
#'
#' @noRd
mod_inputs_server <- function(id) {
  moduleServer(id, function(input, output, session) {
    ns <- session$ns

    # Select dataset ----

    dataset <- shiny::reactive({
      switch(input$dataset,
        mtcars = datasets::mtcars,
        penguins = palmerpenguins::penguins,
        small_salary = datamations::small_salary
      )
    })

    # Update group by variables based on dataset ----

    output$group_by <- shiny::renderUI({
      group_by_vars <- dataset() %>%
        dplyr::select_if(~ is.factor(.x) | is.character(.x)) %>%
        names()

      shiny::selectInput(
        ns("group_by"),
        "Group by",
        choices = group_by_vars,
        selected = group_by_vars[[1]],
        multiple = TRUE
      )
    })

    # Update summary variables based on dataset ----

    output$summary_variable <- shiny::renderUI({
      summarise_vars <- dataset() %>%
        dplyr::select_if(is.numeric) %>%
        names()

      shiny::selectInput(
        ns("summary_variable"),
        "Summary variable",
        choices = summarise_vars
      )
    })

    inputs <- list(
      dataset = shiny::reactive(input$dataset),
      group_by = shiny::reactive(input$group_by),
      summary_variable = shiny::reactive(input$summary_variable),
      summary_function = shiny::reactive(input$summary_function),
      height = shiny::reactive(input$height),
      width = shiny::reactive(input$width),
      go = shiny::reactive(input$go)
    )

    return(inputs)
  })
}

## To be copied in the UI
# mod_inputs_ui("inputs")

## To be copied in the server
# mod_inputs_server("inputs")