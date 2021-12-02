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
  if (!"data" %in% names(previous_frame)) {
    previous_frame <- previous_frame[[length(previous_frame)]]
  }

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
      dplyr::mutate(datamations_filter = dplyr::coalesce(.data$datamations_filter, FALSE)) %>%
      # Rename Y_FIELD in the end, since it's the name used in the spec
      dplyr::rename_at(mapping$summary_name, ~ paste0(Y_FIELD_CHR))

    spec <- previous_frame

    # Reconstruct the previous spec, replacing the data and adding a filter transform
    spec[["data"]][["values"]] <- original_data_with_filter_flag

    final_filtered_data <- original_data_with_filter_flag %>%
      dplyr::filter(.data$datamations_filter)

    # Re-evaluate x axis values
    if (nrow(final_filtered_data) == 0) {

      # Set encoding.x.axis.scale.values = [] to remove x-axis values all together
      spec$encoding$x$axis$values <- character()
    } else if (nrow(final_filtered_data) > 0) {
      if (mapping$x == 1) {
        original_data_with_filter_flag <- final_filtered_data %>%
          dplyr::mutate(!!X_FIELD := 1)

        x_labels <- generate_labelsExpr(NULL)
        x_domain <- generate_x_domain(NULL)
        x_title <- ""
      } else {
        x_var <- rlang::parse_expr(mapping$x)

        final_filtered_data <- final_filtered_data %>%
          dplyr::mutate(
            !!X_FIELD := as.numeric({{ x_var }})
          )

        x_labels <- final_filtered_data %>%
          dplyr::ungroup() %>%
          dplyr::distinct(!!X_FIELD, label = {{ x_var }}) %>%
          generate_labelsExpr()

        # Use I() (class AsIs) to prevent unboxing when converting to vega lite specs, edge case
        x_labels$breaks <- if (length(x_labels$breaks) == 1) {
          I(x_labels$breaks)
        } else {
          x_labels$breaks
        }

        x_domain <- final_filtered_data %>%
          dplyr::ungroup() %>%
          dplyr::distinct(!!X_FIELD, label = {{ x_var }}) %>%
          generate_x_domain()

        x_title <- mapping$x
      }

      # Handle replacing if spec has spec.encoding instead of encoding
      if ("spec" %in% names(spec)) {
        spec[["spec"]][["encoding"]][["x"]] <- list(field = X_FIELD_CHR, type = "quantitative", axis = list(values = x_labels[["breaks"]], labelExpr = x_labels[["labelExpr"]], labelAngle = -90), title = x_title, scale = x_domain)
      } else {
        spec[["encoding"]][["x"]] <- list(field = X_FIELD_CHR, type = "quantitative", axis = list(values = x_labels[["breaks"]], labelExpr = x_labels[["labelExpr"]], labelAngle = -90), title = x_title, scale = x_domain)
      }
    }

    # Update title of frame
    spec[["meta"]][["description"]] <- glue::glue("Filter {filter_operation}",
      filter_operation = glue::glue_collapse(filter_operation, sep = ", ")
    )
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
      dplyr::mutate(datamations_filter = dplyr::coalesce(.data$datamations_filter, FALSE))

    spec <- previous_frame

    # Update title of frame
    spec[["meta"]][["description"]] <- glue::glue("Filter {filter_operation}{within_group}",
      filter_operation = glue::glue_collapse(filter_operation, sep = ", "),
      within_group = ifelse(length(original_data %>% dplyr::group_vars()) > 0, " within each group", "")
    )

    # Explicitly set color domain in case any colors got filtered out
    if ("spec" %in% names(spec)) {
      spec[["spec"]][["encoding"]][["color"]][["scale"]][["domain"]] <- spec[["spec"]][["encoding"]][["color"]][["legend"]][["values"]]
    } else {
      spec[["encoding"]][["color"]][["scale"]][["domain"]] <- spec[["encoding"]][["color"]][["legend"]][["values"]]
    }
  }

  # IDs to filter
  filter_ids <- original_data_with_filter_flag %>%
    dplyr::ungroup() %>%
    dplyr::filter(.data$datamations_filter) %>%
    dplyr::pull(.data$gemini_id)

  # Remove datamations_filter column if present
  spec[["data"]][["values"]] <- spec[["data"]][["values"]] %>%
    dplyr::select(-tidyselect::any_of("datamations_filter"))

  # Apply filter transformation
  if (length(filter_ids) == 1) {
    spec[["transform"]] <- list(list(filter = glue::glue("datum.gemini_id == {filter_ids}")))
  } else {
    spec[["transform"]] <- list(list(filter = list(field = "gemini_id", oneOf = filter_ids)))
  }

  list(spec)
}
