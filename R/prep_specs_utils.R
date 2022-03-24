# General ----

# Generate vega specs
# Faceted and unfaceted ones need to be generated separately because the encoding is embedded in the faceted case
generate_vega_specs <- function(.data, mapping, meta, spec_encoding, facet_encoding, height, width, facet_dims, column = FALSE, row = FALSE, color = FALSE, errorbar = FALSE, y_type = NULL) {
  if (!column & !row) { # No facets
    generate_unfacet_vega_specs(.data, meta, spec_encoding, height, width, color, errorbar, y_type)
  } else { # Facets
    generate_facet_vega_specs(.data, mapping, meta, spec_encoding, facet_encoding, height, width, facet_dims, column, row, color, errorbar, y_type)
  }
}

# Generate vega specs that are not faceted
generate_unfacet_vega_specs <- function(.data, meta, spec_encoding, height, width, color = FALSE, errorbar = FALSE, y_type = NULL) {

  # Remove color encoding if it's flagged not to be shown, OR if it's just not in the mapping
  # So even if color = TRUE, if it's not there, it'll be removed!
  if (!color & "color" %in% names(spec_encoding)) {
    spec_encoding <- within(spec_encoding, rm("color"))
  }

  spec_encoding <- purrr::compact(spec_encoding)

  mark_type <- "point"

  # TODO - handle color

  # If there's no errorbar, everything can be on one layer
  if (!errorbar) {
    list(
      height = height,
      width = width,
      `$schema` = vegawidget::vega_schema(),
      meta = meta,
      data = list(values = .data),
      mark = list(type = mark_type, filled = TRUE, strokeWidth = 1),
      encoding = spec_encoding
    ) %>%
      vegawidget::as_vegaspec()
  } else { # If there is an error bar, then we need to put the points and error bars on multiple layers

    # The errorbar has its own encoding, and it uses data y_raw (the actual raw values) to calculate the errorbar
    errorbar_spec_encoding <- spec_encoding
    errorbar_spec_encoding$y$field <- Y_RAW_FIELD_CHR

    list(
      height = height,
      width = width,
      `$schema` = vegawidget::vega_schema(),
      meta = meta,
      data = list(values = .data),
      layer = list(
        # Errorbar layer
        list(
          mark = "errorbar",
          encoding = errorbar_spec_encoding
        ),
        # Point layer
        list(
          mark = list(type = mark_type, filled = TRUE, strokeWidth = 1),
          encoding = spec_encoding
        )
      )
    ) %>%
      vegawidget::as_vegaspec()
  }
}

# Generate vega specs that are faceted
generate_facet_vega_specs <- function(.data, mapping, meta, spec_encoding, facet_encoding, height, width, facet_dims, column = FALSE, row = FALSE, color = FALSE, errorbar = FALSE, y_type = NULL) {

  # Remove color encoding if it's flagged not to be shown, OR if it's just not in the mapping
  # So even if color = TRUE, if it's not there, it'll be removed!
  if ((is.null(mapping$color) | !color) & "color" %in% names(spec_encoding)) {
    spec_encoding <- within(spec_encoding, rm("color"))
  }

  spec_encoding <- purrr::compact(spec_encoding)

  mark_type <- "point"

  # Remove facet encoding(s) if they're flagged not to be shown, or aren't in the mapping
  # So even if e.g. row = TRUE, if there's no variable to facet by, it'll be removed!
  if (is.null(mapping$column) | !column) {
    facet_encoding <- facet_encoding[names(facet_encoding) != "column"]
  }

  if (is.null(mapping$row) | !row) {
    facet_encoding <- facet_encoding[names(facet_encoding) != "row"]
  }

  # If there's no rows in this spec, set nrow = 1
  if (!row) {
    facet_dims$nrow <- 1
  }

  # If there's no errorbar, everything can be on one layer
  if (!errorbar) {
    list(
      `$schema` = vegawidget::vega_schema(),
      meta = meta,
      data = list(values = .data),
      facet = facet_encoding,
      spec = list(
        height = height / facet_dims[["nrow"]],
        width = width / facet_dims[["ncol"]],
        mark = list(type = mark_type, filled = TRUE, strokeWidth = 1),
        encoding = spec_encoding
      )
    ) %>%
      vegawidget::as_vegaspec()
  } else {
    # If there is an error bar, then we need to put the points and error bars on multiple layers

    # The errorbar has its own encoding, and it uses data y_raw (the actual raw values) to calculate the errorbar
    errorbar_spec_encoding <- spec_encoding
    errorbar_spec_encoding$y$field <- Y_RAW_FIELD_CHR

    list(
      `$schema` = vegawidget::vega_schema(),
      meta = meta,
      data = list(values = .data),
      facet = facet_encoding,
      spec = list(
        height = height / facet_dims[["nrow"]],
        width = width / facet_dims[["ncol"]],
        layer = list(
          # Errorbar layer
          list(
            mark = "errorbar",
            encoding = errorbar_spec_encoding
          ),
          # Point layer
          list(
            mark = list(type = mark_type, filled = TRUE, strokeWidth = 1),
            encoding = spec_encoding
          )
        )
      )
    ) %>%
      vegawidget::as_vegaspec()
  }
}

# Group by ----

# Generate a description for group by steps
generate_group_by_description <- function(mapping, ...) {
  mapping_sep <- mapping[c(...)] %>%
    unlist() %>%
    paste0(collapse = ", ")
  glue::glue("Group by {mapping_sep}")
}

generate_group_by_tooltip <- function(.data) {
    tooltip_vars <- .data %>%
      dplyr::select(-one_of("n", "gemini_ids")) %>%
      names()

  purrr::map(tooltip_vars, ~ list(field = .x, type = "nominal"))
}

# Handle NAs in data by coercing to literal "NA", and order grouping levels alphabetically (with "NA" last) so that they appear consistently (and get consistent IDs) across frames
arrange_by_groups_coalesce_na <- function(.data, group_vars, group_vars_chr) {
  .data %>%
    # Remove any existing grouping
    dplyr::ungroup() %>%
    # Arrange once to get alphabetical order
    dplyr::arrange(!!!group_vars) %>%
    dplyr::mutate_at(dplyr::all_of(group_vars_chr), function(x) {
      x <- x %>%
        as.character() %>% # Convert numeric grouping variable to character
        dplyr::coalesce("NA") # NA to "NA"

      if (any(x == "NA")) {
        x %>%
          forcats::fct_inorder() %>% # Order factor alphabetically
          forcats::fct_relevel("NA", after = Inf) # Place any NAs last in factor
      } else {
        x %>%
          forcats::fct_inorder() %>%
          forcats::as_factor()
      }
    }) %>%
    # then again to get new order, with NAs last
    dplyr::arrange(!!!group_vars)
}

# Calculate the dimensions (number of rows and columns) of a faceted plot to set the size of each, since we want sizing to approximately be consistent across frames
calculate_facet_dimensions <- function(.data, group_vars, mapping) {
  .group_keys <- .data %>%
    dplyr::group_by(!!!group_vars) %>%
    dplyr::group_keys()

  if (!is.null(mapping$column)) {
    col_facets <- .group_keys %>%
      dplyr::pull(tidyselect::all_of(mapping$column)) %>%
      unique()

    n_col_facets <- col_facets %>%
      length()
  } else {
    n_col_facets <- 1
  }

  if (!is.null(mapping$row)) {
    row_facets <- .group_keys %>%
      dplyr::pull(tidyselect::all_of(mapping$row)) %>%
      unique()

    n_row_facets <- row_facets %>%
      length()
  } else {
    n_row_facets <- 1
  }

  list(
    nrow = n_row_facets,
    ncol = n_col_facets
  )
}

# Summarize ----

# Create an expression to label axes with values instead of numbers
# Similar to breaks = c(1, 2, 3), labels = c("One", "Two", "Three") etc in ggplot
# But more of an expression like an ifelse()
generate_labelsExpr <- function(data) {
  if (is.null(data)) {
    return(list(
      breaks = c(1, 1), # Do 1 twice, otherwise it gets auto unboxed which doesn't actually work!
      labelExpr = ""
    ))
  }

  data <- data %>%
    dplyr::mutate(label = dplyr::coalesce(.data$label, "undefined")) %>%
    dplyr::arrange(.data$datamations_x)

  n_breaks <- nrow(data)
  breaks <- data[[X_FIELD_CHR]]
  labels <- data[["label"]]

  labelExpr <- c(glue::glue("round(datum.label) == {ceiling(breaks[1:(n_breaks - 1)])} ? '{labels[1:(n_breaks - 1)]}'"), glue::glue("'{labels[n_breaks]}'")) %>% paste0(collapse = " : ")

  list(breaks = breaks, labelExpr = labelExpr)
}

# Generate the x-axis domain
# They have values e.g. 1, 2, 3, but we want some padding on either end so it goes from 0.5 to 3.5
# And this ensures a consistent domain across frames
generate_x_domain <- function(data) {
  if (is.null(data)) {
    list(domain = c(0.5, 1.5))
  } else {
    list(domain = c(min(data[[X_FIELD_CHR]]) - 1.0, max(data[[X_FIELD_CHR]]) + 1.0))
  }
}

# Generate description for summarize steps
# Depending on whether there's errorbars, any groups, etc.
generate_summarize_description <- function(summary_variable, summary_function = NULL, errorbar = FALSE, group_by = TRUE) {
  if (errorbar) {
    return(glue::glue("Plot mean {summary_variable}{group_description}, with errorbar",
      group_description = ifelse(group_by, " of each group", "")
    ))
  }

  if (is.null(summary_function)) {
    glue::glue("Plot {summary_variable}{group_description}",
      group_description = ifelse(group_by, " within each group", "")
    )
  } else if (is.null(summary_variable)) {
    glue::glue("Plot {summary_function}(){group_description}",
      group_description = ifelse(group_by, " of each group", "")
    )
  } else {
    glue::glue("Plot {summary_function} {summary_variable}{group_description}",
      group_description = ifelse(group_by, " of each group", "")
    )
  }
}

generate_summarize_tooltip <- function(.data, summary_variable, summary_function = NULL) {
  if (is.null(summary_function)) {
    y_tooltip <- list(field = Y_TOOLTIP_FIELD_CHR, type = "quantitative", title = summary_variable)
  } else {
    if (!is.null(summary_variable)) {
      y_tooltip <- list(field = Y_TOOLTIP_FIELD_CHR, type = "quantitative", title = glue::glue("{summary_function}({summary_variable})"))
    } else {
      y_tooltip <- list(field = Y_TOOLTIP_FIELD_CHR, type = "quantitative")
    }
  }

  tooltip_vars <- .data %>%
    dplyr::select(-tidyselect::any_of(c("gemini_id", X_FIELD_CHR, Y_FIELD_CHR, Y_TOOLTIP_FIELD_CHR, "stroke", "gemini_ids"))) %>%
    names()

  tooltip <- purrr::map(tooltip_vars, ~ list(field = .x, type = "nominal"))

  append(list(y_tooltip), tooltip)
}

  split_strings <- function(string, max_characters, min_final) {

    if(nchar(string) < max_characters) return (string)

    number_of_chops = trunc(nchar(string) / max_characters)
    split_starts <- seq(1, nchar(string), by = max_characters)
    last_split <- split_starts[length(split_starts)]

    # TODO UPDATE CUTOFF HANDLING HERE
    #if ((nchar(string) - last)<min_final) split_starts <- setdiff(split_starts, last_split)

    string_vec <- sapply(split_starts, function(ii) {
      substr(string, ii, ii+max_characters-1)
    })

    return(string_vec)

  }

  split_string_sensibly <- function(string, max_characters, min_final) {

    if(stringr::str_detect(string, '_')) {
      split_string <- strsplit(string, "(?<=[_])", perl = TRUE)[[1]]
    }

    if(any(nchar(split_string)>max_characters)) {
      strings_cutoff <- lapply(split_string, split_strings, max_characters, min_final)
      strings_flattened <- unlist(strings_cutoff)

      prelim_string <- strings_flattened

    } else {
      prelim_string <- split_string
    }

    final_string <- list()

    # post adjustments
    # Look at biterms and check character count, combine if less than threshold
    for (i in seq(1, length(prelim_string), 2)) {
      # if we are not at the final string
      if(!is.na(prelim_string[i+1])) {
        # if the character count of the biterm is less than the max
        if(nchar(prelim_string[i]) + nchar(prelim_string[i+1]) < max_characters) {
        final_string[i] <- paste0(prelim_string[i], prelim_string[i+1])
        } else {
          final_string[i] <- prelim_string[i]
          final_string[i+1] <- prelim_string[i+1]
        }
      } else {
        final_string[i] <- prelim_string[i]
      }
    }
    return(unlist(final_string))

  }
