#' Generate specs of data distribution and summarized data steps of datamations
#'
#' @param .data Input data
#' @param mapping A list that describes mapping for the datamations, including x and y variables, sjummary variable and operation, variables used in facets and in colors, etc. Generated in \code{datamation_sanddance} using \code{generate_mapping}.
#' @param previous_frame The previous step's frame, which will be used to create the filter frame
#' @param filter_operation The filter operation
#' @inheritParams datamation_sanddance
#' @inheritParams prep_specs_data
#' @noRd
prep_specs_filter <- function(.data, mapping, previous_frame, filter_operation, toJSON = TRUE, pretty = TRUE, height = 300, width = 300) {

  # Apply filtering to data - constructing a column that says whether values should be filtered
  # Don't support info grid for now - just start with simple case :)

  infogrid_frame <- identical(previous_frame[["meta"]][["parse"]], "grid")

  if (!infogrid_frame) {
    # Get previous frame's data, rename datamations_y to the original name
    original_data <- previous_frame[["data"]][["values"]] %>%
      dplyr::rename_at(Y_FIELD_CHR, ~ paste0(mapping$summary_name)) %>%
      # Add an ID to keep track of which records are filtered in / out
      dplyr::mutate(temp_datamations_id = dplyr::row_number())

    filter_operation_combined <- glue::glue_collapse(filter_operation, sep = "& ")

    filtered_data <- original_data %>%
      # Filter the data
      dplyr::filter(eval(rlang::parse_expr(filter_operation_combined))) %>%
      # Add a flag that the ones left are kept
      dplyr::mutate(datamations_filter = 1)

    # Reconstruct the original data, with a flag of 1 / 0 for filtered in / out
    original_data_with_filter_flag <- original_data %>%
      dplyr::left_join(filtered_data, by = names(original_data)) %>%
      dplyr::mutate(datamations_filter = dplyr::coalesce(datamations_filter, 0)) %>%
      # Rename Y_FIELD in the end, since it's the name used in the spec
      dplyr::rename_at(mapping$summary_name, ~ paste0(Y_FIELD_CHR))

    # Reconstruct the previous spec, replacing the data and adding a filter transform
    spec <- previous_frame
    spec[["data"]][["values"]] <- original_data_with_filter_flag
    spec[["transform"]] <- list(list(filter = "datum.datamations_filter == 1"))

    # Update title of frame
    spec[["meta"]][["description"]] <- glue::glue("Filter {filter_operation}",
      filter_operation = glue::glue_collapse(filter_operation, sep = ", ")
    )

    list(spec)
  }
}
