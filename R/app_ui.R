#' The application User Interface
#'
#' @param request Internal parameter for `{shiny}`.
#' @noRd
app_ui <- function(request) {
  shiny::fluidPage(
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
}
