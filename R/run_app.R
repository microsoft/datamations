#' Run the Shiny Application
#' @export
run_app <- function() {
  library(dplyr)
  library(palmerpenguins)

  ui <- shiny::fluidPage(
    style = "max-width: 1200px;",
    shiny::h1("datamations"),
    shiny::p("Construct a tidyverse pipeline by choosing from the options below. You select a data set, then up to three variables to group by, and finally a variable to summarize and a summary function to apply to it."),
    shiny::fluidRow(
      shiny::column(
        width = 3,
        shiny::selectInput("dataset",
          "Dataset",
          choices = c("small_salary", "penguins")
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
        shiny::selectInput(
          "summary_function",
          "Summary function",
          choices = c("mean", "median", "min", "max")
        )
      )
    ),
    shiny::fluidRow(
      shiny::column(
        width = 3,
        shiny::numericInput("height", "Height", min = 200, max = 600, value = 300)
      ),
      shiny::column(
        width = 3,
        shiny::numericInput("width", "Width", min = 200, max = 600, value = 300)
      ),
      shiny::column(
        width = 3,
        shiny::actionButton("go", "Go", width = "100%", style = "margin-top: 25px;")
      )
    ),
    shiny::uiOutput("pipeline_ui"),
    shiny::fluidRow(
      shiny::column(
        width = 6,
        shiny::uiOutput("datamation_ui")
      ),
      shiny::column(
        width = 6,
        shiny::h2("data stages"),
        shiny::tabsetPanel(id = "tab")
      )
    )
  )

  server <- function(input, output, session) {

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
      datamation_sanddance(pipeline(), height = input$height, width = input$width)
    })

    # Generate tabs of data -----

    # Generate the data, and render DTs for them
    data_for_tabs <- shiny::reactive({
      pipeline_group_by <- !is.null(input$group_by)

      supported_tidy_functions <- c("group_by", "summarize", "summarise")

      fittings <- pipeline() %>%
        parse_pipeline(supported_tidy_functions)

      data_states <- fittings %>%
        snake(envir = rlang::global_env())

      data_states_tabs <- vector("list", length = ifelse(pipeline_group_by, 3, 2))

      # State 1: Just the data on its own - full data? Relevant columns only?
      data_states_tabs[[1]] <- data_states[[1]]

      # No group by
      # State 2: summarized data
      if (!pipeline_group_by) {
        data_states_tabs[[2]] <- data_states[[2]]
        names(data_states_tabs) <- c("Initial data", glue::glue("{input$summary_function} {input$summary_var}"))
      }

      # Yes group by

      if (pipeline_group_by) {

        # State 2: Grouped data, ordered by group - full data? Relevant columns only?

        state_2 <- data_states[[2]]

        # Get grouping variables to select and arrange by
        grouping_vars <- group_vars(state_2)
        grouping_vars <- rlang::parse_exprs(grouping_vars)

        data_states_tabs[[2]] <- state_2 %>%
          ungroup() %>%
          select(!!!grouping_vars, rlang::parse_expr(input$summary_var)) %>%
          arrange(!!!grouping_vars)

        # State 3: summarised data, ordering columns and data just in case
        data_states_tabs[[3]] <- data_states[[3]] %>%
          ungroup() %>%
          select(!!!grouping_vars, rlang::parse_expr(input$summary_function)) %>%
          arrange(!!!grouping_vars)

        names(data_states_tabs) <- c("Initial data", glue::glue("Group by {paste0(input$group_by, collapse = ', ')}"), glue::glue("{input$summary_function} {input$summary_var} in each group"))
      }

      data_states_tabs
    })

    # Render each of the data tabs into an output
    shiny::observeEvent(input$go, {
      purrr::iwalk(data_for_tabs(), function(x, y) {
        output_name <- paste0("data", y)
        output[[output_name]] <- reactable::renderReactable(
          x %>%
            dplyr::mutate_if(is.numeric, round, 3) %>%
            reactable::reactable(
              fullWidth = FALSE,
              width = 600
            )
        )
      })
    })

    # Will actually create the tabs and show the output in the next step

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
          style = paste0("height: ", input$height * 2, "px;"),
          datamations::datamationSandDanceOutput("datamation")
        )
      })

      # Actually add the tabs to the tab panel - so weird!
      purrr::imap(
        data_for_tabs(),
        function(x, y) {
          output_name <- paste0("data", y)
          tab <- shiny::tabPanel(y, reactable::reactableOutput(output_name))
          shiny::appendTab("tab", tab, select = y == "Initial data") # Select it if it's the first tab
        }
      )
    })
  }

  shiny::shinyApp(ui, server)
}
