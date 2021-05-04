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
  # And the second for the row facet
  row_facet_var <- dplyr::nth(group_vars, n = 2)
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

  # Add an ID to the data to be used across frames
  gemini_id <- 1:nrow(.data)
  id_df <- dplyr::tibble(gemini_id = gemini_id)

  .data <- .data %>%
    dplyr::bind_cols(id_df)

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

  # Prep encoding

  x_encoding <- list(field = "x", type = "quantitative", axis = NULL)
  y_encoding <- list(field = "y", type = "quantitative", axis = NULL)
  color_encoding <- list(field = rlang::quo_name(color_var), type = "nominal", axis = NULL)
  facet_col_encoding <- list(field = rlang::quo_name(col_facet_var), type = "nominal", title = NULL)
  facet_row_encoding <- list(field = rlang::quo_name(row_facet_var), type = "nominal", title = NULL)

  # State 1: Scatter plot (with any grouping)

  data_1 <- .data %>%
    dplyr::select(gemini_id, y = {{ summary_variable }}, tidyselect::any_of(group_vars_chr))

  # Add an x variable to use as the center of jittering
  # It can just be 1, except if there are three grouping variables (since then there's facet, row, and colour grouping, and the colour is also offset)
  if (n_groups == 3) {
    data_1 <- data_1 %>%
      dplyr::mutate(
        x = forcats::fct_explicit_na({{ color_var }}),
        x = as.numeric(x)
      )
  } else {
    data_1 <- data_1 %>%
      dplyr::mutate(x = 1)
  }

  # Set up specs based on number of groups
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
      meta = list(parse = "jitter"),
      data = list(values = data_1),
      mark = "point",
      encoding = encoding
    ) %>%
      vegawidget::as_vegaspec()
  } else {
    specs_list[[1]] <- list(
      `$schema` = vegawidget::vega_schema(),
      meta = list(parse = "jitter"),
      data = list(values = data_1),
      facet = facet,
      spec = list(
        mark = "point",
        encoding = encoding
      )
    ) %>%
      vegawidget::as_vegaspec()
  }

  # State 2: Summary plot (with any grouping)
  # There should still be a point for each datapoint, just all overlapping
  # None should disappear, otherwise makes animating

  data_2 <- data_1 %>%
    dplyr::mutate(dplyr::across(y, !!summary_function, na.rm = TRUE))

  # Add an x variable to place the point
  # It can just be 1, except if there are three grouping variables (since then there's facet, row, and colour grouping, and the colour is also offset)
  if (n_groups == 3) {
    data_1 <- data_1 %>%
      dplyr::mutate(
        x = forcats::fct_explicit_na({{ color_var }}),
        x = as.numeric(x)
      )
  } else {
    data_1 <- data_1 %>%
      dplyr::mutate(x = 1)
  }

  if (n_groups == 0) {
    specs_list[[2]] <- list(
      `$schema` = vegawidget::vega_schema(),
      meta = list(),
      data = list(values = data_2),
      mark = "point",
      encoding = encoding
    ) %>%
      vegawidget::as_vegaspec()
  } else {
    specs_list[[2]] <- list(
      `$schema` = vegawidget::vega_schema(),
      meta = list(),
      data = list(values = data_2),
      facet = facet,
      spec = list(
        mark = "point",
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
