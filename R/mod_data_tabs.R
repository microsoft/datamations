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
  tagList(
    shiny::h2("data stages"),
    shiny::uiOutput(ns("data_tabs_ui"))
  )
}

#' data_tabs Server Functions
#'
#' @noRd
mod_data_tabs_server <- function(id, inputs, pipeline) {
  moduleServer(id, function(input, output, session) {
    ns <- session$ns

    # Generate tabs of data -----

    # Generate the data, and render DTs for them
    data_for_tabs <- shiny::reactive({
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
        names(data_states_tabs) <- c("Initial data", glue::glue("{inputs$summary_function} {inputs$summary_var}"))
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

        names(data_states_tabs) <- c("Initial data", glue::glue("Group by {paste0(inputs$group_by(), collapse = ', ')}"), glue::glue("{inputs$summary_function()} {inputs$summary_variable()} in each group"))
      }

      data_states_tabs
    })

    # Render each of the data tabs into an output
    shiny::observeEvent(inputs$go(), {
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

    # Render UIs
    shiny::observeEvent(inputs$go(), {

      output$data_tabs_ui <- shiny::renderUI({
        tabs <- purrr::imap(
          data_for_tabs(),
          function(x, y) {
            output_name <- ns(paste0("data", y))
            shiny::tabPanel(y, reactable::reactableOutput(output_name))
          })
        names(tabs) <- NULL

        do.call(shiny::tabsetPanel, tabs)
      })
    })
  })
}

## To be copied in the UI
# mod_data_tabs_ui("data_tabs")

## To be copied in the server
# mod_data_tabs_server("data_tabs")
