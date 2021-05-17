#' Generate specs of data distribution and summarized data
#'
#' @param .data Optionally grouped input data
#' @param summary_operation Summary operation including summary function and column operated on.
#' @inheritParams datamation_sanddance
#' @inheritParams prep_specs_data
prep_specs_summarize <- function(.data, summary_operation, toJSON = TRUE, pretty = TRUE, height = 300, width = 300) {

  # START: same as animate_group_by_sanddance

  # Map grouping variables
  group_vars <- dplyr::groups(.data)
  # Count number of groups
  n_groups <- length(group_vars)

  # Use the first grouping variable for column facet
  col_facet_var <- dplyr::first(group_vars)
  col_facet_var_chr <- rlang::quo_name(col_facet_var)
  # And the second for the row facet
  row_facet_var <- dplyr::nth(group_vars, n = 2)
  row_facet_var_chr <- rlang::quo_name(row_facet_var)
  # And the third for color
  color_var <- dplyr::nth(group_vars, n = 3)

  # Convert grouping variables to character
  group_vars_chr <- purrr::map_chr(group_vars, rlang::quo_name)

  # Keep an unaltered copy of the data to return later
  df <- .data

  # Convert grouping variables to character - useful if there are binary variables or with a small number of (numeric) options, since you can't map shape to a continuous variable
  # But we should be careful about too many categories and e.g. stop if there are too many
  .data <- .data %>%
    dplyr::mutate_at(dplyr::all_of(group_vars_chr), as.character)

  # Convert NA to "NA", put at the end of factors, and arrange by all grouping variables so that IDs are consistent
  .data <- .data %>%
    # Arrange once to get in alphabetical order
    dplyr::ungroup() %>%
    dplyr::arrange(!!!group_vars) %>%
    dplyr::mutate_at(dplyr::all_of(group_vars_chr), function(x) {
      x <- x %>%
        dplyr::coalesce(x, "NA")

      if (any(x == "NA")) {
        x %>%
          forcats::fct_inorder() %>%
          forcats::fct_relevel("NA", after = Inf)
      }
      else {
        forcats::fct_inorder(x) %>%
          forcats::as_factor()
      }
    }) %>%
    # Arrange again to put NAs last
    dplyr::arrange(!!!group_vars) %>%
    dplyr::mutate(gemini_id = dplyr::row_number()) %>%
    # Add groups back in
    dplyr::group_by(!!!group_vars)

  # END: same as animate_group_by_sanddance()

  # Get summary function and variable

  summary_function <- summary_operation %>%
    purrr::pluck(1) %>%
    as.list() %>%
    dplyr::nth(1)

  summary_variable <- summary_operation %>%
    purrr::pluck(1) %>%
    as.list() %>%
    dplyr::nth(2)

  # Generate the data and specs for each state
  specs_list <- vector("list", length = 2)

  # Prep encoding ----

  x_encoding <- list(field = "x", type = "quantitative")
  y_encoding <- list(field = "y", type = "quantitative", title = rlang::quo_name(summary_variable))
  color_encoding <- list(field = rlang::quo_name(color_var), type = "nominal")

  # Need to manually set order of colour legend, otherwise it's not in the same order as the grids/points!
  if (!is.null(color_var)) {
    color_encoding <- append(color_encoding, list(legend = list(values = levels(.data[[color_var]]))))
  }


  # Calculate number of facets for sizing, and respect order
  .group_keys <- .data %>%
    dplyr::group_by(!!!group_vars) %>%
    dplyr::group_keys()

  if (!is.null(col_facet_var)) {
    col_facets <- .group_keys %>%
      dplyr::pull({{ col_facet_var }}) %>%
      unique()

    n_col_facets <- col_facets %>%
      length()
  } else {
    n_col_facets <- 1
  }

  facet_col_encoding <- list(field = col_facet_var_chr, type = "ordinal", title = col_facet_var_chr)

  facet_row_encoding <- list(field = row_facet_var_chr, type = "ordinal", title = row_facet_var_chr)

  if (!is.null(row_facet_var)) {
    row_facets <- .group_keys %>%
      dplyr::pull({{ row_facet_var }}) %>%
      unique()

    n_row_facets <- row_facets %>%
      length()
  } else {
    n_row_facets <- 1
  }

  # State 1: Scatter plot (with any grouping) -----

  data_1 <- .data %>%
    dplyr::select(.data$gemini_id, y = {{ summary_variable }}, tidyselect::any_of(group_vars_chr))

  # Remove NA values, since their values will not be displayed - better to have them fade off
  # TODO - this isn't working - look into it more.
  data_1 <- data_1 %>%
    dplyr::filter(!is.na(y))

  # Add an x variable to use as the center of jittering
  # It can just be 1, except if there are three grouping variables (since then there's facet, row, and colour grouping, and the colour is also offset)

  # Generate the labels for these too - label by colour grouping variable or not at all

  if (n_groups == 3) {
    data_1 <- data_1 %>%
      dplyr::mutate(
        x = as.numeric({{ color_var }})
      )

    x_labels <- data_1 %>%
      dplyr::ungroup() %>%
      dplyr::distinct(.data$x, label = {{ color_var }}) %>%
      generate_labelsExpr()

    x_domain <- data_1 %>%
      dplyr::ungroup() %>%
      dplyr::distinct(.data$x, label = {{ color_var }}) %>%
      generate_x_domain()
  } else {
    data_1 <- data_1 %>%
      dplyr::mutate(x = 1)

    x_labels <- generate_labelsExpr(NULL)

    x_domain <- generate_x_domain(NULL)
  }

  # Set up specs based on number of groups
  x_encoding <- append(x_encoding, list(axis = list(values = x_labels[["breaks"]], labelExpr = x_labels[["labelExpr"]]), title = NULL))

  # Only need to set the domain for X in the final plot, since jitter plot is already centered on the JS side

  encoding <- list(
    x = x_encoding,
    y = y_encoding
  )

  if (n_groups == 1) {
    facet <- list(column = facet_col_encoding)
  } else if (n_groups == 2) {
    facet <- list(
      column = facet_col_encoding,
      row = facet_row_encoding
    )
  } else if (n_groups == 3) {
    encoding <- append(encoding, list(
      color = color_encoding
    ))

    facet <- list(
      column = facet_col_encoding,
      row = facet_row_encoding
    )
  }

  # Generate description
  description <- generate_summarize_description(summary_variable)

  # meta = list(parse = "jitter") communicates to the JS code that the x values need to be jittered

  if (n_groups == 0) {
    specs_list[[1]] <- list(
      height = height,
      width = width,
      `$schema` = vegawidget::vega_schema(),
      meta = list(
        parse = "jitter",
        axes = FALSE,
        description = description
      ),
      data = list(values = data_1),
      mark = list(type = "point", filled = TRUE),
      encoding = encoding
    ) %>%
      vegawidget::as_vegaspec()
  } else {
    specs_list[[1]] <- list(
      `$schema` = vegawidget::vega_schema(),
      meta = list(
        parse = "jitter",
        axes = TRUE,
        description = description
      ),
      data = list(values = data_1),
      facet = facet,
      spec = list(
        height = height / n_row_facets,
        width = width / n_col_facets,
        mark = list(type = "point", filled = TRUE),
        encoding = encoding
      )
    ) %>%
      vegawidget::as_vegaspec()
  }

  # State 2: Summary plot (with any grouping) -----
  # There should still be a point for each datapoint, just all overlapping
  # None should disappear, otherwise makes animating

  data_2 <- data_1 %>%
    dplyr::mutate(dplyr::across(.data$y, !!summary_function, na.rm = TRUE))

  # Add an x variable to place the point
  # It can just be 1, except if there are three grouping variables (since then there's facet, row, and colour grouping, and the colour is also offset)
  if (n_groups == 3) {
    data_2 <- data_2 %>%
      dplyr::mutate(
        x = as.numeric({{ color_var }})
      )
  } else {
    data_2 <- data_2 %>%
      dplyr::mutate(x = 1)
  }

  # Set X domain
  encoding$x$scale <- x_domain

  # Determine and set Y domain - based on range of previous frame
  encoding$y$scale$domain <- range(data_1[["y"]], na.rm = TRUE)

  # Generate description
  description <- generate_summarize_description(summary_variable, summary_function)

  if (n_groups == 0) {
    specs_list[[2]] <- list(
      height = height,
      width = width,
      `$schema` = vegawidget::vega_schema(),
      meta = list(axes = FALSE, description = description),
      data = list(values = data_2),
      mark = list(type = "point", filled = TRUE),
      encoding = encoding
    ) %>%
      vegawidget::as_vegaspec()
  } else {
    specs_list[[2]] <- list(
      `$schema` = vegawidget::vega_schema(),
      meta = list(axes = TRUE, description = description),
      data = list(values = data_2),
      facet = facet,
      spec = list(
        height = height / n_row_facets,
        width = width / n_col_facets,
        mark = list(type = "point", filled = TRUE),
        encoding = encoding
      )
    ) %>%
      vegawidget::as_vegaspec()
  }

  # Convert specs to JSON
  if (toJSON) {
    specs_list <- specs_list %>%
      purrr::map(vegawidget::vw_as_json, pretty = pretty)
  }

  # Return the specs
  specs_list
}

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

generate_summarize_description <- function(summary_variable, summary_function = NULL) {
  if (is.null(summary_function)) {
    glue::glue("Plot {summary_variable} within each group")
  } else {
    glue::glue("Plot {summary_function} {summary_variable} of each group")
  }
}
