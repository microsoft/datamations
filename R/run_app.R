#' Run the Shiny Application
#' @export
run_app <- function() {
  library(dplyr)
  library(palmerpenguins)

  ui <- shiny::fluidPage(
    style = "max-width: 1000px;",
    shiny::h1("datamations"),
    shiny::p("Construct a tidyverse pipeline by choosing from the options below. You select a data set, then up to three variables to group by, and finally a variable to summarize and a summary function to apply to it."),
    shiny::fluidRow(
      shiny::column(
        width = 3,
        shiny::selectInput("dataset",
          "Dataset",
          choices = c("penguins", "small_salary_data")
        )
      ),
      shiny::column(
        width = 3,
        shiny::uiOutput("group_by")
      ),
      shiny::column(
        width = 2,
        shiny::uiOutput("summary_var")
      ),
      shiny::column(
        width = 2,
        shiny::selectInput(
          "summary_function",
          "Summary function",
          choices = c("mean", "median", "min", "max")
        )
      ),
      shiny::column(
        width = 2,
        shiny::actionButton("go", "Go", width = "100%", style = "margin-top: 25px;")
      )
    ),
    shiny::uiOutput("pipeline_ui"),
    shiny::uiOutput("datamation_ui")
  )

  server <- function(input, output, session) {

    # Select dataset ----

    dataset <- shiny::reactive({
      switch(input$dataset,
        mtcars = datasets::mtcars,
        penguins = palmerpenguins::penguins,
        small_salary_data = datamations::small_salary_data
      )
    })

    # Update group by variables based on dataset ----

    output$group_by <- shiny::renderUI({
      group_by_vars <- dataset() %>%
        dplyr::select_if(~ is.factor(.x) | is.character(.x)) %>%
        names()

      shiny::selectInput(
        "group_by",
        "Group by",
        choices = group_by_vars,
        selected = group_by_vars[[1]],
        multiple = TRUE
      )
    })

    # Update summary variables based on dataset ----

    output$summary_var <- shiny::renderUI({
      summarise_vars <- dataset() %>%
        dplyr::select_if(is.numeric) %>%
        names()

      shiny::selectInput(
        "summary_var",
        "Summary variable",
        choices = summarise_vars
      )
    })
    # Generate pipeline -----

    pipeline <- shiny::eventReactive(input$go, {
      pipeline_group_by <- !is.null(input$group_by)
      if (pipeline_group_by) {
        glue::glue("{input$dataset} %>% group_by({paste0(input$group_by, collapse = ', ')}) %>% summarize({input$summary_function} = {input$summary_function}({input$summary_var}, na.rm = TRUE))")
      } else {
        glue::glue("{input$dataset} %>% summarize({input$summary_function} = {input$summary_function}({input$summary_var}, na.rm = TRUE))")
      }
    })

    # Evaluate pipeline ----

    pipeline_res <- shiny::reactive({
      eval(rlang::parse_expr(pipeline()))
    })

    # Generate datamation -----

    datamation <- shiny::reactive({
      datamation_sanddance(pipeline())
    })

    # Outputs -----

    output$pipeline <- shiny::renderText({
      pipeline()
    })

    output$datamation <- datamations::renderDatamationSandDance(
      datamation()
    )

    # Render UIs
    shiny::observeEvent(input$go, {
      output$pipeline_ui <- shiny::renderUI({
        shiny::fluidRow(
          shiny::h2("tidyverse pipeline"),
          shiny::verbatimTextOutput("pipeline")
        )
      })

      output$datamation_ui <- shiny::renderUI({
        shiny::fluidRow(
          shiny::h2("datamation"),
          datamations::datamationSandDanceOutput("datamation")
        )
      })
    })
  }

  shiny::shinyApp(ui, server)
}
