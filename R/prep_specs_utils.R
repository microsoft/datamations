# General ----

generate_vega_specs <- function(.data, mapping, meta, spec_encoding, facet_encoding, height, width, facet_dims, column = FALSE, row = FALSE, color = FALSE, errorbar = FALSE) {
  if (!column & !row) {
    generate_unfacet_vega_specs(.data, meta, spec_encoding, height, width, color, errorbar)
  } else {
    generate_facet_vega_specs(.data, mapping, meta, spec_encoding, facet_encoding, height, width, facet_dims, column, row, color, errorbar)
  }
}

generate_unfacet_vega_specs <- function(.data, meta, spec_encoding, height, width, color = FALSE, errorbar = FALSE) {

  # Remove color encoding if it's flagged not to be shown, OR if it's just not in the mapping
  # So even if color = TRUE, if it's not there, it'll be removed!
  if (!color) {
    spec_encoding <- spec_encoding[c("x", "y")]
  }

  # todo - handle color
  if (!errorbar) {
    list(
      height = height,
      width = width,
      `$schema` = vegawidget::vega_schema(),
      meta = meta,
      data = list(values = .data),
      mark = list(type = "point", filled = TRUE),
      encoding = spec_encoding
    ) %>%
      vegawidget::as_vegaspec()
  } else {
    errorbar_spec_encoding <- spec_encoding
    errorbar_spec_encoding$y$field <- "y_raw"

    list(
      height = height,
      width = width,
      `$schema` = vegawidget::vega_schema(),
      meta = meta,
      data = list(values = .data),
      layer = list(
        list(
          mark = "errorbar",
          encoding = errorbar_spec_encoding
        ),
        list(
          mark = list(type = "point", filled = TRUE),
          encoding = spec_encoding
        )
      )
    ) %>%
      vegawidget::as_vegaspec()
  }
}

generate_facet_vega_specs <- function(.data, mapping, meta, spec_encoding, facet_encoding, height, width, facet_dims, column = FALSE, row = FALSE, color = FALSE, errorbar = FALSE) {

  # Remove color encoding if it's flagged not to be shown, OR if it's just not in the mapping
  # So even if color = TRUE, if it's not there, it'll be removed!
  if (is.null(mapping$color) | !color) {
    spec_encoding <- spec_encoding[c("x", "y")]
  }

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

  if (!errorbar) {
    list(
      `$schema` = vegawidget::vega_schema(),
      meta = meta,
      data = list(values = .data),
      facet = facet_encoding,
      spec = list(
        height = height / facet_dims[["nrow"]],
        width = width / facet_dims[["ncol"]],
        mark = list(type = "point", filled = TRUE),
        encoding = spec_encoding
      )
    ) %>%
      vegawidget::as_vegaspec()
  } else {
    errorbar_spec_encoding <- spec_encoding
    errorbar_spec_encoding$y$field <- "y_raw"

    list(
      `$schema` = vegawidget::vega_schema(),
      meta = meta,
      data = list(values = .data),
      facet = facet_encoding,
      spec = list(
        height = height / facet_dims[["nrow"]],
        width = width / facet_dims[["ncol"]],
        layer = list(
          list(
            mark = "errorbar",
            encoding = errorbar_spec_encoding
          ),
          list(
            mark = list(type = "point", filled = TRUE),
            encoding = spec_encoding
          )
        )
      )
    ) %>%
      vegawidget::as_vegaspec()
  }
}

# Group by ----

generate_group_by_description <- function(mapping, ...) {
  mapping_sep <- mapping[c(...)] %>%
    unlist() %>%
    paste0(collapse = ", ")
  glue::glue("Group by {mapping_sep}")
}

arrange_by_groups_coalesce_na <- function(.data, group_vars, group_vars_chr) {
  .data %>%
    # Remove any existing grouping
    dplyr::ungroup() %>%
    # Arrange once to get alphabetical order
    dplyr::arrange(!!!group_vars) %>%
    dplyr::mutate_at(dplyr::all_of(group_vars_chr), function(x) {
      x <- x %>%
        dplyr::coalesce(x, "NA") # NA to "NA"

      if (any(x == "NA")) {
        x %>%
          forcats::fct_inorder() %>% # Order factor alphabetically
          forcats::fct_relevel("NA", after = Inf) # Place any NAs last in factor
      }
      else {
        x %>%
          forcats::fct_inorder() %>%
          forcats::as_factor()
      }
    }) %>%
    # then again to get new order, with NAs last
    dplyr::arrange(!!!group_vars)
}

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

generate_labelsExpr <- function(data) {
  if (is.null(data)) {
    return(list(
      breaks = c(1, 1), # Do 1 twice, otherwise it gets auto unboxed which doesn't actually work!
      labelExpr = ""
    ))
  }

  data <- data %>%
    dplyr::mutate(label = dplyr::coalesce(.data$label, "undefined"))

  n_breaks <- nrow(data)
  breaks <- data[["x"]]
  labels <- data[["label"]]

  labelExpr <- c(glue::glue("round(datum.label) == {ceiling(breaks[1:(n_breaks - 1)])} ? '{labels[1:(n_breaks - 1)]}'"), glue::glue("'{labels[n_breaks]}'")) %>% paste0(collapse = " : ")

  list(breaks = breaks, labelExpr = labelExpr)
}

generate_x_domain <- function(data) {
  if (is.null(data)) {
    list(domain = c(0.5, 1.5))
  } else {
    list(domain = c(min(data[["x"]]) - 0.5, max(data[["x"]]) + 0.5))
  }
}

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
  } else {
    glue::glue("Plot {summary_function} {summary_variable}{group_description}",
      group_description = ifelse(group_by, " of each group", "")
    )
  }
}
