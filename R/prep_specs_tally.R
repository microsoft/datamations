#' Generate specs of data for tally step of datamation
#'
#' @param .data Input data
#' @param mapping A list that describes mapping for the datamations, including x and y variables, summary variable and operation, variables used in facets and in colors, etc. Generated in \code{datamation_sanddance} using \code{generate_mapping}.
#' @inheritParams datamation_sanddance
#' @inheritParams prep_specs_data
#' @noRd
prep_specs_tally <- function(.data, mapping, toJSON = TRUE, pretty = TRUE, height = 300, width = 300, mutation_before, ...) {

  # Treat tally as summarize(n = n()) with optional group mappings
  # Call prep_specs_group_by and prep_specs_summarize

  res <- list()

  # Group by ----

  res[["group_by"]] <- prep_specs_group_by(.data, mapping, toJSON = toJSON, pretty = pretty, height = height, width = width, mutation_before = FALSE)

  # Summarize ----

  # Fake mapping by adding summary_function and summary_name

  mapping$summary_function <- mapping$summary_name <- "n"

  # Fake "previous frame" (group_by) data

  group_vars <- mapping$groups %>%
    as.list() %>%
    purrr::map(rlang::parse_expr)

  .data <- .data %>%
    dplyr::group_by(!!!group_vars)

  res[["summarize"]] <- prep_specs_summarize(.data, mapping, toJSON = toJSON, pretty = pretty, height = height, width = width, mutation_before = FALSE)

  # Add meta field for "tally" custom animation
  res[["summarize"]][[1]][["meta"]][["custom_animation"]] <- "tally"

  # Update title of spec
  title <- ifelse(length(group_vars) == 0, "Plot tally", "Plot tally of each group")
  res[["summarize"]][[1]][["meta"]][["description"]] <- title

  # Unlist and return
  res <- res %>%
    unlist(recursive = FALSE)

  names(res) <- NULL

  res

}
