#' Run the Shiny Application
#'
#' @param ... A series of options to be used inside the app.
#'
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
        width = 3,
        shiny::uiOutput("summary_var")
      ),
      shiny::column(
        width = 3,
        shiny::uiOutput("summary_function")
      )
    ),
    shiny::fluidRow(
      shiny::h2("Tidyverse pipeline"),
      shiny::verbatimTextOutput("pipeline")
    ),
    shiny::tabsetPanel(
      shiny::tabPanel(
        title = "Initial data",
        reactable::reactableOutput("data_start")
      ),
      shiny::tabPanel(
        title = "Transformed data",
        reactable::reactableOutput("data_transformed")
      ),
      shiny::tabPanel(
        title = "Plot",
        shiny::plotOutput("final_plot")
      )
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
      pipeline_group_by <- !is.null(input$group_by)
      if (pipeline_group_by) {
        glue::glue("{input$dataset} %>% group_by({paste0(input$group_by, collapse = ', ')}) %>% summarize({input$summary_function} = {input$summary_function}({input$summary_var}, na.rm = TRUE))")
      } else {
        glue::glue("{input$dataset} %>% summarize({input$summary_function} = {input$summary_function}({input$summary_var}, na.rm = TRUE))")
      }
    })

    output$pipeline <- shiny::renderText({
      pipeline()
    })

    datamation <- shiny::reactive({
      shiny::req(pipeline())
      datamation_sanddance(pipeline())
    })

    output$data_start <- reactable::renderReactable({
      req(input$group_by)

      eval(rlang::parse_expr(input$dataset)) %>%
        dplyr::select(tidyselect::any_of(c(input$group_by, input$summary_var))) %>%
        reactable::reactable(defaultPageSize = 5)
    })

    pipeline_res <- reactive({
      eval(rlang::parse_expr(pipeline()))
    })

    output$data_transformed <- reactable::renderReactable({
      pipeline_res() %>%
        dplyr::mutate_if(is.numeric, round, 3) %>%
        reactable::reactable(defaultPageSize = 5)
    })

    output$final_plot <- shiny::renderPlot({
      pipeline_res() %>%
        create_final_plot(input$group_by, input$summary_var, input$summary_function)
    })
  }

  shiny::shinyApp(ui, server)
}

create_final_plot <- function(data, group_by_var, summary_var, summary_function) {

  n_groups <- length(group_by_var)

  if (n_groups == 3) {
    data <- data %>%
      dplyr::rename_at(group_by_var[[3]], ~ paste0("x"))
  } else {
    data <- data %>%
      dplyr::mutate(x = 1)
  }

  p <- ggplot2::ggplot(data, ggplot2::aes_string(x = "x", y = summary_function))

  if (n_groups == 1) {
    p <- p +
      ggplot2::facet_grid(reformulate(group_by_var[[1]], "."))
  } else if (n_groups %in% 2:3) {
    p <- p +
      ggplot2::facet_grid(reformulate(group_by_var[[1]], group_by_var[[2]]))
  }

  if (n_groups == 3) {
    p <- p +
      ggplot2::geom_point(ggplot2::aes_string(color = "x"), size = 5)

    labs <- ggplot2::labs(x = NULL, y = glue::glue("{summary_function}({summary_var})"), color = group_by_var[[3]])
  } else {
    p <- p +
      ggplot2::geom_point(size = 5)

    labs <- ggplot2::labs(x = NULL, y = glue::glue("{summary_function}({summary_var})"))
  }

  p +
    labs +
    ggplot2::theme_minimal(base_size = 24) +
    ggplot2::theme(axis.text.x = ggplot2::element_blank())
}
