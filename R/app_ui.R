#' The application User Interface
#'
#' @param request Internal parameter for `{shiny}`.
#' @noRd
app_ui <- function(request) {
  shiny::tagList(
    shinyWidgets::useShinydashboard(),
    shinyjs::useShinyjs(),
    golem_add_external_resources(),
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
    shiny::fluidPage(
      style = "max-width: 1200px;",
      shiny::h1("Datamations"),
      mod_inputs_ui("inputs"),
      mod_pipeline_ui("pipeline"),
      shiny::fluidRow(
        shinydashboard::box(
          width = 12,
          solidHeader = TRUE,
          shiny::column(
            width = 6,
            shiny::h2("datamation"),
            mod_datamation_sanddance_ui("datamation_sanddance")
          ),
          shiny::column(
            width = 6,
            shiny::h2("data stages"),
            mod_data_tabs_ui("data_tabs")
          )
        )
      )
    )
  )
}

#' Add external Resources to the Application
#'
#' This function is internally used to add external
#' resources inside the Shiny application.
#'
#' @noRd
golem_add_external_resources <- function() {
  golem::add_resource_path(
    "www", app_sys("app/www")
  )

  shiny::tags$head(
    golem::favicon(ext = "png"),
    golem::bundle_resources(
      path = app_sys("app/www"),
      app_title = "Datamations"
    )
  )
}

app_sys <- function(...) {
  system.file(..., package = "datamations")
}
