#' Run the Shiny Application
#'
#' @param ... A series of options to be used inside the app.
#'
#' @export
run_app <- function() {

  library(dplyr)
  library(palmerpenguins)

  ui <- shiny::fluidPage(
    shiny::fluidRow(
      shiny::column(
        width = 2,
        shiny::selectInput("dataset",
          "Dataset",
          choices = c("penguins", "small_salary_data")
        )
      ),
      shiny::column(
        width = 2,
        shiny::uiOutput("group_by")
      ),
      shiny::column(
        width = 2,
        shiny::uiOutput("summary_var")
      ),
      shiny::column(
        width = 2,
        shiny::uiOutput("summary_function")
      )
    ),
    shiny::fluidRow(
      shiny::verbatimTextOutput("pipeline"),
      shiny::uiOutput("datamation_frames") # ,
      # textOutput("datamation_specs")
    )
  )

  server <- function(input, output, session) {
    dataset <- shiny::reactive({
      switch(input$dataset,
        mtcars = mtcars,
        penguins = palmerpenguins::penguins,
        small_salary_data = datamations::small_salary_data
      )
    })

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

    output$summary_function <- shiny::renderUI({
      shiny::selectInput(
        "summary_function",
        "Summary function",
        choices = c("mean", "median", "min", "max")
      )
    })

    pipeline <- shiny::reactive({
      glue::glue("{input$dataset} %>% group_by({paste0(input$group_by, collapse = ', ')}) %>% summarize({input$summary_function} = {input$summary_function}({input$summary_var}, na.rm = TRUE))")
    })

    output$pipeline <- shiny::renderText({
      pipeline()
    })

    vegalite_specs <- shiny::reactive({
      shiny::req(pipeline())
      datamation_sanddance(pipeline())
    })

    output$datamation_frames <- shiny::renderUI({
      vegalite_specs()
    })

    output$datamation_specs <- shiny::renderText({
      shiny::req(vegalite_specs())
      specs <- vegalite_specs()
      map(specs, vegawidget::vw_as_json)
    })
  }

  shiny::shinyApp(ui, server)
}
