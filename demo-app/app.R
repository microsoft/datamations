library(shiny)
library(datamations)
library(dplyr)
library(shinyAce)

# Define UI for application that draws a histogram
ui <- fluidPage(
  style = "max-width: 1200px;",
      # Send slider value, for changing tabs
    shiny::tags$script(shiny::HTML('
    $(document).ready(function() {
    $(document).on("change", ".slider", function() {
  Shiny.onInputChange("slider_state", $(this).val());
  })
  })')),
    # Listen to tab value, for changing slider!
    shiny::tags$script("
      Shiny.addCustomMessageHandler('slider-from-tab', function(tab) {
      document.getElementById('datamation_sanddance-datamation').getElementsByClassName('slider')[0].value = tab;
      onSlide('datamation_sanddance-datamation');
      });
    "),
  tags$link(rel = "stylesheet", type = "text/css", href = "style.css"),
  shiny::includeHTML('githublink.html'),
  # Show a plot of the generated distribution
  uiOutput('header', class = "header-container"),
  uiOutput('constructors', class = "container"),
  uiOutput('editor', class = "container"),
  uiOutput('datamation_ui', class = "container")
)

# Define server logic required to draw a histogram
server <- function(session, input, output) {

  slider_state <- shiny::reactiveVal()
  tab_change <- shiny::reactiveVal()

  shiny::observeEvent(input$slider_state, {
    slider_state(input$slider_state)
    tab_change("slider")
  })

    output$header <- renderUI({
      tagList(
        tags$h1(class = "header", tags$span("{"), "datamations", tags$span("}"), "-"),
        tags$p(tags$span("{datamations} is a framework for the automatic generation of explanation of the steps of an analysis pipeline. It automatically turns code into animations, showing the state of the data at each step of an analysis. Test out the functionality of the package by building a pipeline below."))
      )
    })

    output$constructors <- renderUI({
      tagList(
        shiny::p("Construct a tidyverse pipeline by choosing from the options below. Select a data set, then up to three variables to group by, and finally a variable to summarize and a summary function to apply to it."),
        shiny::hr(),
          tags$div(
            class = "button-container",
            shiny::selectInput(inputId = "dataset",
                               "Dataset",
                               width = "150px",
                               selected = "small_salary",
                               choices = c("small_salary", "penguins", "jeter_justice"),
            ),
            #tags$button(class = "add-button", shiny::icon("plus")),
            shiny::selectInput(
              inputId = "group_by",
              "Group by",
              width = "150px",
              choices = c("Work", "Degree"),
              selected = "Degree",
              multiple = TRUE
            ),
            shiny::selectInput(
              inputId = "summary_variable",
              width = "150px",
              "Summary variable",
              choices = "Salary"
            ),
            shiny::selectInput(
              inputId = "summary_function",
              width = "150px",
              "Summary function",
              choices = c("mean" = "mean", "median", "min", "max", "quantile")
            ),
            shiny::actionButton(inputId = "go", HTML("Run <span>➜</span>"), width = "100px", style = "height: 40px;")
          )
      )
    })

    dataset <- shiny::reactive({
      if(!is.null(input$dataset)) {
        switch(input$dataset,
        penguins = palmerpenguins::penguins,
        small_salary = datamations::small_salary,
        jeter_justice = datamations::jeter_justice
      )
      }
    })


    shiny::observe({
      if(is.null(dataset())) return()
      group_by_vars <- dataset() %>%
        dplyr::select_if(
          sapply(., is.character) |
          sapply(., is.factor) |
          grepl("year",names(.))
          ) %>%
        names()

      shiny::updateSelectInput(
        session = session,
        inputId = "group_by",
        choices = group_by_vars,
        selected = group_by_vars[[1]]
      )

      summarise_vars <- dataset() %>%
        dplyr::select_if(is.numeric) %>%
        names()

      shiny::updateSelectInput(
        session = session,
        inputId = "summary_variable",
        choices = summarise_vars
      )
    })

    ## EDITOR AND PIPELINE HANDLING

    output$editor <- renderUI({
      shiny::tagList(
        shiny::fluidRow(
          shinydashboard::box(
            width = 12,
            solidHeader = TRUE,
            shiny::h2("Pipeline", class = "header-two-short"),
            shinyAce::aceEditor(
              outputId = "pipeline_editor",
              height = "500px",
              mode = "r",
              fontSize = 16,
              readOnly = TRUE,
              highlightActiveLine = FALSE,
              autoScrollEditorIntoView = TRUE,
              minLines = 5,
              maxLines = 30,
              value = "# Code will appear here based on selections above"
            ),
          )
        )
      )
    })

    pipeline <- shiny::eventReactive(input$go, {
      pipeline_group_by <- !is.null(input$group_by)
      if (pipeline_group_by) {
        if(input$summary_function=="quantile") {
          glue::glue("{input$dataset} %>% group_by({paste0(input$group_by, collapse = ', ')}) %>% summarize({input$summary_function} = {input$summary_function}({input$summary_variable}, 0.1))")
        } else {
          glue::glue("{input$dataset} %>% group_by({paste0(input$group_by, collapse = ', ')}) %>% summarize({input$summary_function} = {input$summary_function}({input$summary_variable}, na.rm = TRUE))")
        }
        } else {
        glue::glue("{input$dataset} %>% summarize({input$summary_function} = {input$summary_function}({input$summary_var}, na.rm = TRUE))")
      }
    })


    shiny::observeEvent(input$go, {
      text <- c("library(dplyr)\n", pipeline())
      # Load dplyr
      eval(parse(text = "library(dplyr)"))
      if (input$dataset == "penguins") {
        text <- c("library(palmerpenguins)\n", text)
        # Load palmerpenguins
        eval(parse(text = "library(palmerpenguins)"))
      }
      text <- styler::style_text(text)
      shinyAce::updateAceEditor(session, "pipeline_editor", value = paste0(text, collapse = "\n"))
    })

    output$datamation_ui <- renderUI({
      shiny::fluidRow(
        shinydashboard::box(
          width = 12,
          solidHeader = TRUE,
          shiny::column(
            width = 6,
            shiny::h2("Datamation", class = "header-two-medium"),
            datamations::datamationSandDanceOutput("datamation", height = 500)
          ),
          shiny::column(
            width = 6,
            shiny::h2("Data stages", class = "header-two-long"),
            shiny::tabsetPanel(id = "data_tabs_panel",
                               tabPanel("1"),
                               tabPanel("2"),
                               tabPanel("3"))
          )
        )
      )
    })


    shiny::observeEvent(pipeline(), {

      # Generate datamation -----
      datamation <- shiny::reactive({
        datamation_sanddance(pipeline(), height = 300, width = 300)
      })

      # Create an output for it
      output$datamation <- datamations::renderDatamationSandDance({
        datamation()
      })
    })

    # Handle the data stages tabset

    shiny::observeEvent(pipeline(), {

      # Clear existing tabs - note that this still tries to remove the tabs at the very beginning even if they don't exist - might need to look into this to see if it's causing any issues or if we can set to remove them only if they actually exist.
      # Doesn't seem to be causing issues though, just a warning in the console
      purrr::walk(c("1", "2", "3"), ~ shiny::removeTab(
        inputId = "data_tabs_panel",
        target = .x, session = session
      ))

      # Generate the data, and render DTs for them
      pipeline_group_by <- !is.null(input$group_by)

      supported_tidy_functions <- c("group_by", "summarize", "filter", "count")

      fittings <- pipeline() %>%
        datamations:::parse_pipeline(supported_tidy_functions)

      data_states <- fittings %>%
        datamations:::snake(envir = rlang::global_env())

      data_states_tabs <- vector("list", length = ifelse(pipeline_group_by, 3, 2))


      # State 1: Just the data on its own - full data? Relevant columns only?
      data_states_tabs[[1]] <- data_states[[1]]

      # No group by
      # State 2: summarized data
      if (!pipeline_group_by) {
        data_states_tabs[[2]] <- data_states[[2]]
        names(data_states_tabs) <- c("Initial data", "Summarized data")
        data_states_titles <- c("Initial data", glue::glue("{input$summary_function} {input$summary_var}"))
      }

      # Yes group by

      if (pipeline_group_by) {

        # State 2: Grouped data, ordered by group - full data? Relevant columns only?

        state_2 <- data_states[[2]]

        # Get grouping variables to select and arrange by
        grouping_vars <- group_vars(state_2)
        grouping_vars <- rlang::parse_exprs(grouping_vars)

        data_states_tabs[[2]] <- state_2 %>%
          ungroup() #%>%
          #select(!!!grouping_vars, rlang::parse_expr(input$summary_var)) %>%
          #arrange(!!!grouping_vars)


        # State 3: summarised data, ordering columns and data just in case
        data_states_tabs[[3]] <- data_states[[3]] %>%
          ungroup()# %>%
          #select(!!!grouping_vars, rlang::parse_expr(input$summary_function)) %>%
          #arrange(!!!grouping_vars)

        names(data_states_tabs) <- c("Initial data", "Grouped data", "Summarized data")
        data_states_titles <- c("Initial data", glue::glue("Group by {paste0(input$group_by, collapse = ', ')}"), glue::glue("{input$summary_function} {input$summary_variable} in each group"))
      }

      # Create tabs and generate tables for them
      purrr::walk(
        seq_along(data_states_tabs),
        function(i) {
          # Generate content
          content <- data_states_tabs[[i]] %>%
            dplyr::mutate_if(is.numeric, round, 3)

          if (i == 1) {
            content <- content %>%
              reactable::reactable(
                fullWidth = FALSE,
                width = 400
              )
          } else {
            content <- content %>%
              reactable::reactable(
                fullWidth = FALSE,
                width = 400
              )
          }

          # Create and append tab
          tab <<- shiny::tabPanel(names(data_states_tabs)[[i]], shiny::h3(shiny::p(data_states_titles[[i]])), content, value = i)
          shiny::appendTab(inputId = "data_tabs_panel", tab, select = i == 1, session = session)
        }
      )
    })

    # # Change the tab shown based on the slider ----
    shiny::observeEvent(slider_state(), {
      selected_tab <- determine_tab_from_slider(slider_state(), input$group_by)
      selected_tab <- as.character(selected_tab)

      shiny::updateTabsetPanel(
        session = session,
        inputId = "data_tabs_panel",
        selected = selected_tab
      )
    })

    # Listen to changes to the tab from clicking, and update tab_change if that's the case
    shinyjs::onclick("data_tabs_panel", tab_change("click"))

    # Change the slider based on the tab selected ----

    shiny::observeEvent(input$data_tabs_panel, {

      # This will actually happen when the tabs are first inserted, since the first is selected - and so slider_state() and tab_change() haven't triggered yet, and are NULL - in this case, don't update anything, just return

      if (is.null(tab_change()) & is.null(slider_state())) {
        return(NULL)
      }

      # If it was the slider that changes the tab, *don't* have the tab change the slider -- circular, messy logic!

      if (tab_change() == "slider") {
        return(NULL)
      }

      # Match the tab to the slider! Opposite logic as above

      tab_state <- input$data_tabs_panel

      selected_slider <- determine_slider_from_tab(tab_state, input$group_by)
      selected_slider <- as.character(selected_slider)

      session$sendCustomMessage("slider-from-tab", selected_slider)
    })
    determine_tab_from_slider <- function(slider, group_by) {
    # Determining the tab from the slider position

    # Add 1 since javascript is 0 indexed, and 1 indexing makes more sense to me for creating logic with :)
    slider <- as.numeric(slider) + 1

    # If the slider is in the first position, then this is the initial data and the tab is also the initial data
    if (slider == 1) {
      tab <- 1
    }

    # If there are grouping variables, then:
    # The first "group by" frame is the second slider, and the last is 1 (initial data) + n_groups + 1 (distribution)
    # So the slider range is 2:(1 + 1 + n_groups), and this should go to the second tab
    # And the "summarize" range is (3 + n_groups):end, and this should go to the third tab
    if (!is.null(group_by)) {
      group_by_slider_range <- 2:(1 + 1 + length(group_by))

      if (slider %in% group_by_slider_range) {
        tab <- 2
      } else if (slider > max(group_by_slider_range)) {
        tab <- 3
      }
    }

    # If there are no grouping variables, then the first frame is the initial data, the second frame is the distribution, and anything beyond is the summarize range
    if (is.null(group_by) & slider != 1) {
      if (slider == 2) { # The distribution
        tab <- 1
      } else if (slider > 2) {
        tab <- 2
      }
    }

    tab
  }

  determine_slider_from_tab <- function(tab, group_by) {
    # Determining the slider position from the tab selected

    # If the tab value is 1 (the initial data), then the slider is always 1

    if (tab == 1) {
      slider <- 1
    }

    # If there are grouping variables, then:
    # The first frame of the "group by" is in the second position - after the initial data, and just go to that
    # There is 1 frame per grouping variable, plus one frame for the distribution
    # So the first frame of the "summarize" is in: 1 (initial frame) + 1 (distribution) + n_groups + 1 (after all those)
    if (!is.null(group_by)) {
      if (tab == 2) { # The second tab is group by
        slider <- 2
      } else if (tab == 3) {
        slider <- 3 + length(group_by)
      }
    }

    # If there is no grouping variable, then:
    # There is 1 frame for the initial data, and 1 frame for the distribution
    # So the first frame of the "summarize" step is 3
    if (is.null(group_by) & tab != 1) {
      slider <- 3
    }

    # Handle 0 indexing in javascript
    slider - 1
  }

}

# Run the application
shinyApp(ui = ui, server = server)
