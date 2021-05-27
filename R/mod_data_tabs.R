#' data_tabs UI Function
#'
#' @description A shiny Module.
#'
#' @param id,input,output,session Internal parameters for {shiny}.
#'
#' @noRd
#'
#' @importFrom shiny NS tagList
mod_data_tabs_ui <- function(id) {
  ns <- NS(id)
  shiny::uiOutput(ns("data_tabs_ui"))
}

#' data_tabs Server Functions
#'
#' @noRd
mod_data_tabs_server <- function(id, inputs, pipeline, datamation_state) {
  shiny::moduleServer(id, function(input, output, session) {
    ns <- session$ns

    shiny::observeEvent(inputs$go(), {

      # Generate the data, and render DTs for them
      pipeline_group_by <- !is.null(inputs$group_by())

      supported_tidy_functions <- c("group_by", "summarize")

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
        names(data_states_tabs) <- c("Initial data", "Summarized data")
        data_states_titles <- c("Initial data", glue::glue("{inputs$summary_function()} {inputs$summary_var()}"))
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
          select(!!!grouping_vars, rlang::parse_expr(inputs$summary_var())) %>%
          arrange(!!!grouping_vars)

        # State 3: summarised data, ordering columns and data just in case
        data_states_tabs[[3]] <- data_states[[3]] %>%
          ungroup() %>%
          select(!!!grouping_vars, rlang::parse_expr(inputs$summary_function())) %>%
          arrange(!!!grouping_vars)

        names(data_states_tabs) <- c("Initial data", "Grouped data", "Summarized data")
        data_states_titles <- c("Initial data", glue::glue("Group by {paste0(inputs$group_by(), collapse = ', ')}"), glue::glue("{inputs$summary_function()} {inputs$summary_variable()} in each group"))
      }

      # Render each of the data tabs into an output
      purrr::iwalk(data_states_tabs, function(x, y) {
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

      output$data_tabs_ui <- shiny::renderUI({
        tabs <- purrr::map(
          seq_along(data_states_tabs),
          function(i) {
            output_name <- ns(paste0("data", names(data_states_tabs)[[i]]))
            shiny::tabPanel(names(data_states_tabs)[[i]], shiny::h3(shiny::p(data_states_titles[[i]])), reactable::reactableOutput(output_name), value = i - 1)
          }
        )
        names(tabs) <- NULL

        data_tabs_panel <- function(...) {
          shiny::tabsetPanel(id = ns("data_tabs_panel"), ...)
        }

        do.call(data_tabs_panel, tabs)
      })



      # Change the tab shown based on the slider ----
      shiny::observeEvent(datamation_state(), {
        # Match the states to the tabs

        # 0 is the first state, always initial data

        if (datamation_state() == 0) {
          shiny::updateTabsetPanel(
            session = session,
            inputId = ns("data_tabs_panel"),
            selected = "0"
          )
        }
      })
    })
  })
}

## To be copied in the UI
# mod_data_tabs_ui("data_tabs")

## To be copied in the server
# mod_data_tabs_server("data_tabs")
