#' Generate specs of data distribution and summarized data
#'
#' @param .data Optionally grouped input data
#' @param summary_operation Summary operation including summary function and column operated on.
#' @param toJSON Whether to converts the spec to JSON. Defaults to TRUE.
#' @param pretty Whether to pretty the JSON output of the spec. Defaults to TRUE, and only relevant when \code{toJSON} is TRUE.
prep_specs_summarize <- function(.data, summary_operation, toJSON = TRUE, pretty = TRUE) {

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

  # END: same as animate_group_by_sanddance()

  # Arrange by grouping variables so IDs are the same across frames, and add ID
  .data <- .data %>%
    # Ungroup for arranging
    dplyr::ungroup() %>%
    dplyr::arrange(!!!group_vars) %>%
    dplyr::mutate(gemini_id = dplyr::row_number()) %>%
    # Add groups back in
    dplyr::group_by(!!!group_vars)

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

  # Prep encoding

  x_encoding <- list(field = "x", type = "quantitative")
  y_encoding <- list(field = "y", type = "quantitative", title = rlang::quo_name(summary_variable))
  color_encoding <- list(field = rlang::quo_name(color_var), type = "nominal", axis = NULL)
  facet_col_encoding <- list(field = col_facet_var_chr, type = "nominal", title = col_facet_var_chr)
  facet_row_encoding <- list(field = row_facet_var_chr, type = "nominal", title = row_facet_var_chr)

  # State 1: Scatter plot (with any grouping)

  data_1 <- .data %>%
    dplyr::select(.data$gemini_id, y = {{ summary_variable }}, tidyselect::any_of(group_vars_chr))

  # Add an x variable to use as the center of jittering
  # It can just be 1, except if there are three grouping variables (since then there's facet, row, and colour grouping, and the colour is also offset)

  # Generate the labels for these too - label by colour grouping variable or not at all

  if (n_groups == 3) {
    data_1 <- data_1 %>%
      dplyr::mutate(
        x = forcats::fct_explicit_na({{ color_var }}),
        x = as.numeric(.data$x)
      )

    x_labels <- data_1 %>%
      dplyr::ungroup() %>%
      dplyr::distinct(x, label = {{ color_var }}) %>%
      generate_labelsExpr()
  } else {
    data_1 <- data_1 %>%
      dplyr::mutate(x = 1)

    x_labels <- generate_labelsExpr(NULL)
  }

  # Set up specs based on number of groups
  x_encoding <- append(x_encoding, list(axis = list(values = x_labels[["breaks"]], labelExpr = x_labels[["labelExpr"]]), title = NULL))

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

  # meta = list(parse = "jitter") communicates to the JS code that the x values need to be jittered

  if (n_groups == 0) {
    specs_list[[1]] <- list(
      `$schema` = vegawidget::vega_schema(),
      meta = list(
        parse = "jitter",
        axes = TRUE
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
        axes = TRUE
      ),
      data = list(values = data_1),
      facet = facet,
      spec = list(
        mark = list(type = "point", filled = TRUE),
        encoding = encoding
      )
    ) %>%
      vegawidget::as_vegaspec()
  }

  # State 2: Summary plot (with any grouping)
  # There should still be a point for each datapoint, just all overlapping
  # None should disappear, otherwise makes animating

  data_2 <- data_1 %>%
    dplyr::mutate(dplyr::across(.data$y, !!summary_function, na.rm = TRUE))

  # Add an x variable to place the point
  # It can just be 1, except if there are three grouping variables (since then there's facet, row, and colour grouping, and the colour is also offset)
  if (n_groups == 3) {
    data_2 <- data_2 %>%
      dplyr::mutate(
        x = forcats::fct_explicit_na({{ color_var }}),
        x = as.numeric(.data$x)
      )
  } else {
    data_2 <- data_2 %>%
      dplyr::mutate(x = 1)
  }

  if (n_groups == 0) {
    specs_list[[2]] <- list(
      `$schema` = vegawidget::vega_schema(),
      meta = list(axes = TRUE),
      data = list(values = data_2),
      mark = list(type = "point", filled = TRUE),
      encoding = encoding
    ) %>%
      vegawidget::as_vegaspec()
  } else {
    specs_list[[2]] <- list(
      `$schema` = vegawidget::vega_schema(),
      meta = list(axes = TRUE),
      data = list(values = data_2),
      facet = facet,
      spec = list(
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
      breaks = 1,
      labelExpr = ""
    ))
  }

  data <- data %>%
    dplyr::mutate(label = dplyr::coalesce(label, "unknown"))

  n_breaks <- nrow(data)
  breaks <- data[["x"]]
  labels <- data[["label"]]

  labelExpr <- c(glue::glue("datum.label == {breaks[1:(n_breaks - 1)]} ? '{labels[1:(n_breaks - 1)]}'"), glue::glue("'{labels[n_breaks]}'")) %>% paste0(collapse = " : ")

  list(breaks = breaks, labelExpr = labelExpr)
}
