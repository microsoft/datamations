#' Generate specs of data for tally step of datamation
#'
#' @param .data Input data
#' @param mapping A list that describes mapping for the datamations, including x and y variables, summary variable and operation, variables used in facets and in colors, etc. Generated in \code{datamation_sanddance} using \code{generate_mapping}.
#' @inheritParams datamation_sanddance
#' @inheritParams prep_specs_data
#' @noRd
prep_specs_tally <- function(.data, mapping, toJSON = TRUE, pretty = TRUE, height = 300, width = 300) {

  # tally() does not have group by variables. It usually follows group_by(),
  # which is yet to be implemented.

  # prep_specs_summarize

  res <- list()

  # Summarize ----

  # Fake mapping by adding summary_function and summary_name

  mapping$summary_function <- mapping$summary_name <- "n"


  res[["summarize"]] <- prep_specs_summarize(.data, mapping, toJSON = toJSON, pretty = pretty, height = height, width = width)

  # Add meta field for "tally" custom animation
  res[["summarize"]][[1]][["meta"]][["custom_animation"]] <- "tally"

  # Update title of spec
  title <- "Plot tally"
  res[["summarize"]][[1]][["meta"]][["description"]] <- title

  # Unlist and return
  res <- res %>%
    unlist(recursive = FALSE)

  names(res) <- NULL

  res
}
