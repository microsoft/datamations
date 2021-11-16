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

  infogrid_frame <- identical(previous_frame[["meta"]][["parse"]], "grid")

  # Non-infogrid case - previous step was summarize ----
  if (!infogrid_frame) {
    # Get previous frame's data, rename datamations_y to the original name
    original_data <- previous_frame[["data"]][["values"]] %>%
      dplyr::rename_at(Y_FIELD_CHR, ~ paste0(mapping$summary_name))

    filter_operation_combined <- glue::glue_collapse(filter_operation, sep = "& ")

    filtered_data <- original_data %>%
      # Filter the data
      dplyr::filter(eval(rlang::parse_expr(filter_operation_combined))) %>%
      # Add a flag that the ones left are kept
      dplyr::mutate(datamations_filter = TRUE)

    # Reconstruct the original data, with a flag of TRUE / FALSE for filtered in / out
    original_data_with_filter_flag <- original_data %>%
      dplyr::left_join(filtered_data, by = names(original_data)) %>%
      dplyr::mutate(datamations_filter = dplyr::coalesce(datamations_filter, FALSE)) %>%
      # Rename Y_FIELD in the end, since it's the name used in the spec
      dplyr::rename_at(mapping$summary_name, ~ paste0(Y_FIELD_CHR))

    filter_ids <- original_data_with_filter_flag %>%
      dplyr::ungroup() %>%
      dplyr::filter(.data$datamations_filter) %>%
      dplyr::pull(.data$gemini_id)

    # Reconstruct the previous spec, replacing the data and adding a filter transform
    spec <- previous_frame
    spec[["data"]][["values"]] <- original_data_with_filter_flag
    spec[["transform"]] <- list(list(filter = list(field = "gemini_id", oneOf = filter_ids)))

    # Update title of frame
    spec[["meta"]][["description"]] <- glue::glue("Filter {filter_operation}",
      filter_operation = glue::glue_collapse(filter_operation, sep = ", ")
    )

    list(spec)
  } else {
    # Infogrid case - previous step was initial data or group by ----

    filter_operation_combined <- glue::glue_collapse(filter_operation, sep = "& ")

    # Extract grouping variables from mapping
    group_vars_chr <- mapping$groups

    # Convert to symbol
    group_vars <- group_vars_chr %>%
      as.list() %>%
      purrr::map(rlang::parse_expr)

    original_data <- .data

    # Take data from previous frame and apply filter
    filtered_data <- original_data %>%
      # Filter the data
      dplyr::filter(eval(rlang::parse_expr(filter_operation_combined))) %>%
      # Add a flag that the ones left are kept
      dplyr::mutate(datamations_filter = TRUE)

    # Reconstruct the original data, with a flag of TRUE / FALSE for filtered in / out
    original_data_with_filter_flag <- original_data %>%
      dplyr::left_join(filtered_data, by = names(original_data)) %>%
      dplyr::mutate(datamations_filter = dplyr::coalesce(datamations_filter, FALSE))

    filter_ids <- original_data_with_filter_flag %>%
      dplyr::ungroup() %>%
      dplyr::filter(.data$datamations_filter) %>%
      dplyr::pull(.data$gemini_id)

    # Reconstruct the previous spec
    # Keep the same data (so all IDs are present), but just add the filter
    spec <- previous_frame
    spec[["transform"]] <- list(list(filter = list(field = "gemini_id", oneOf = filter_ids)))

    # Update title of frame
    spec[["meta"]][["description"]] <- glue::glue("Filter {filter_operation}",
      filter_operation = glue::glue_collapse(filter_operation, sep = ", ")
    )

    list(spec)
  }
}
