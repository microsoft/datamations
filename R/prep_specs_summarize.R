#' Generate specs of data distribution and summarized data steps of datamations
#'
#' @param .data Input data
#' @param mapping A list that describes mapping for the datamations, including x and y variables, sjummary variable and operation, variables used in facets and in colors, etc. Generated in \code{datamation_sanddance} using \code{generate_mapping}.
#' @inheritParams datamation_sanddance
#' @inheritParams prep_specs_data
#' @noRd
prep_specs_summarize <- function(.data, mapping, toJSON = TRUE, pretty = TRUE, height = 300, width = 300) {

  # Get summary function and variable

  summary_function <- mapping$summary_function %>%
    rlang::parse_expr()

  summary_variable <- mapping$y %>%
    rlang::parse_expr()

  .data <- .data %>%
    arrange_by_groups_coalesce_na(group_vars, group_vars_chr) %>%
    # Add an ID used internally by our JS code / by gemini that controls how points are animated between frames
    # Not defined in any of the previous steps since the JS takes care of generating it
    dplyr::mutate(
      gemini_id = dplyr::row_number(),
      gemini_id = .data$gemini_id - 1
    )

  # Check whether the response variable is numeric or binary / categorical
  # If it is numeric, the first summary frame should be a jittered distribution
  # If it is binary / categorical, the first summary frame is an info grid (and so much of the same logic needs to be pulled in from prep_specs_group_by)

  y_type <- check_type(.data[[Y_FIELD_CHR]])

  # Mapping and encoding for numeric ----
  if (y_type == "numeric") {
    ## Extract mapping ----

    # Extract grouping variables from mapping
    group_vars_chr <- mapping$groups

    # Convert to symbol
    group_vars <- group_vars_chr %>%
      as.list() %>%
      purrr::map(rlang::parse_expr)

    ### Prep data ----

    # Convert NA to "NA", put at the end of factors, and arrange by all grouping variables so that IDs are consistent
    .data <- .data %>%
      arrange_by_groups_coalesce_na(group_vars, group_vars_chr) %>%
      # Add an ID used internally by our JS code / by gemini that controls how points are animated between frames
      # Not defined in any of the previous steps since the JS takes care of generating it
      dplyr::mutate(gemini_id = dplyr::row_number() - 1)

    # Add an x variable to use as the center of jittering
    # It can just be 1, except if mapping$x is not 1!
    # Generate the labels for these too - label by colour grouping variable or not at all

    if (mapping$x == 1) {
      .data <- .data %>%
        dplyr::mutate(!!X_FIELD := 1)

      x_labels <- generate_labelsExpr(NULL)
      x_domain <- generate_x_domain(NULL)
      x_title <- ""
    } else {
      x_var <- rlang::parse_expr(mapping$x)

      .data <- .data %>%
        dplyr::mutate(
          !!X_FIELD := as.numeric({{ x_var }})
        )

      x_labels <- .data %>%
        dplyr::ungroup() %>%
        dplyr::distinct(!!X_FIELD, label = {{ x_var }}) %>%
        generate_labelsExpr()

      x_domain <- .data %>%
        dplyr::ungroup() %>%
        dplyr::distinct(!!X_FIELD, label = {{ x_var }}) %>%
        generate_x_domain()

      x_title <- mapping$x
    }

    ### Prep encoding ----

    x_encoding <- list(field = X_FIELD_CHR, type = "quantitative", axis = list(values = x_labels[["breaks"]], labelExpr = x_labels[["labelExpr"]], labelAngle = -90), title = x_title, scale = x_domain)

    y_range <- range(.data[[Y_FIELD_CHR]], na.rm = TRUE)
    y_encoding <- list(field = Y_FIELD_CHR, type = "quantitative", title = mapping$y, scale = list(domain = y_range))

    color_encoding <- list(field = rlang::quo_name(mapping$color), type = "nominal")

    # Need to manually set order of colour legend, otherwise it's not in the same order as the grids/points!
    if (!is.null(mapping$color)) {
      color_encoding <- append(color_encoding, list(legend = list(values = levels(.data[[mapping$color]]))))
    }

    spec_encoding <- list(
      x = x_encoding,
      y = y_encoding,
      color = color_encoding
    )

    # Flag for whether the plot will have facets - used to set axes = TRUE (if it does have facets, and the "fake facets" need to be used) or FALSE (if it doesn't, and the real axes can be used)
    has_facets <- !is.null(mapping$column) | !is.null(mapping$row)

    facet_col_encoding <- list(field = mapping$column, type = "ordinal", title = mapping$column)
    facet_row_encoding <- list(field = mapping$row, type = "ordinal", title = mapping$row)

    facet_encoding <- list(
      column = facet_col_encoding,
      row = facet_row_encoding
    )

    # Calculate number of facets for sizing
    facet_dims <- .data %>%
      calculate_facet_dimensions(group_vars, mapping)
  } else if (y_type %in% c("binary", "categorical")) {
    # Mapping and encoding for binary / categorical ----

    ## Extract mapping -----
    # Extract grouping variables from mapping
    group_vars_chr <- mapping$groups

    # Convert to symbol
    group_vars <- group_vars_chr %>%
      as.list() %>%
      purrr::map(rlang::parse_expr)

    ### Prep data ----

    # Convert NA to "NA", put at the end of factors, and arrange by all grouping variables so that IDs are consistent
    .data <- .data %>%
      arrange_by_groups_coalesce_na(group_vars, group_vars_chr)

    ### Prep encoding ----

    x_encoding <- list(field = X_FIELD_CHR, type = "quantitative", axis = NULL)
    y_encoding <- list(field = Y_FIELD_CHR, type = "quantitative", axis = NULL)

    color_name <- if (is.null(mapping$color)) {
      NULL
    } else {
      rlang::quo_name(mapping$color)
    }

    color_encoding <- list(field = color_name, type = "nominal")

    # Need to manually set order of colour legend, otherwise it's not in the same order as the grids/points!
    if (!is.null(mapping$color)) {
      color_encoding <- append(color_encoding, list(legend = list(values = levels(.data[[mapping$color]]))))
    }

    spec_encoding <- list(
      x = x_encoding,
      y = y_encoding,
      color = color_encoding
    )

    # Flag for whether the plot will have facets - used to set axes = TRUE (if it does have facets, and the "fake facets" need to be used) or FALSE (if it doesn't, and the real axes can be used)
    has_facets <- !is.null(mapping$column) | !is.null(mapping$row)

    facet_col_encoding <- list(field = mapping$column, type = "ordinal", title = mapping$column)
    facet_row_encoding <- list(field = mapping$row, type = "ordinal", title = mapping$row)

    facet_encoding <- list(
      column = facet_col_encoding,
      row = facet_row_encoding
    )

    # Calculate number of facets for sizing
    facet_dims <- .data %>%
      calculate_facet_dimensions(group_vars, mapping)
  }

  # Generate the data and specs for each state
  specs_list <- list()

  # State 1: Scatter plot or icon array (with any grouping) -----
  # Scatter plot if the variable is continuous, icon array if discrete (categorical, binary)

  # Determine whether plot is scatter or icon array

  # If it is numeric, prepare to visualize data in a jittered scatterplot
  if (y_type == "numeric") {
    data_1 <- .data %>%
      dplyr::select(.data$gemini_id, tidyselect::any_of(group_vars_chr), !!X_FIELD, !!Y_FIELD) %>%
      dplyr::mutate(!!Y_TOOLTIP_FIELD := !!Y_FIELD)
  } else { # Otherwise, another infogrid!
    data_1 <- .data %>%
      dplyr::count(!!!group_vars, datamations_y) %>%
      dplyr::mutate(!!Y_TOOLTIP_FIELD := !!Y_FIELD)
  }

  # Remove NA values, since their values will not be displayed - better to have them fade off
  data_1 <- data_1 %>%
    dplyr::filter(!is.na(!!Y_FIELD))

  # Generate description
  description <- generate_summarize_description(summary_variable, group_by = length(group_vars) != 0)

  # Generate tooltip
  spec_encoding$tooltip <- generate_summarize_tooltip(data_1, mapping$y)

  if (y_type == "numeric") {
    # meta = list(parse = "jitter") communicates to the JS code that the x values need to be jittered
    meta <- list(parse = "jitter", axes = has_facets, description = description)
  } else {
    # meta = list(parse = "grid") communicates to the JS code to turn these into real specs
    # Use this if the response variable is categorical
    meta <- list(parse = "grid", axes = has_facets, description = description)

    if (y_type == "binary") {
      # Use stroke and fillOpacity
      # stroke should be the color variable, or a constant if there is not one

      if (is.null(mapping$color)) {
        data_1 <- data_1 %>%
          dplyr::mutate(stroke = 1)
        spec_encoding$stroke <- list(field = "stroke", legend = NULL)
      } else {
        spec_encoding$stroke <- list(field = mapping$color)
      }

      spec_encoding$fillOpacity <- list(field = Y_FIELD_CHR, type = "nominal", scale = list(range = c(0, 1)))
    } else if (y_type == "categorical") {
      # Use shape
      spec_encoding$shape <- list(field = Y_FIELD_CHR, type = "nominal")
    }
  }

  # Variables that need to be passed to JS
  if (!is.null(mapping$x)) {
    # If there is a grouping variable on the x-axis, then each jitter field needs to be split by that X, so we have to tell the JS code that
    meta <- append(meta, list(splitField = mapping$x))

    if (!has_facets) {
      # If there are facets, they're fake and don't actually have labels, so we need to send those over too!
      meta <- append(meta, list(xAxisLabels = levels(data_1[[mapping$x]])))
    }
  }

  spec <- generate_vega_specs(
    .data = data_1,
    mapping = mapping,
    meta = meta,
    spec_encoding = spec_encoding, facet_encoding = facet_encoding,
    height = height, width = width, facet_dims = facet_dims,
    # Flags for column / row  facets or color
    column = !is.null(mapping$column), row = !is.null(mapping$row), color = !is.null(mapping$color)
  )

  specs_list <- append(specs_list, list(spec))

  # Switch settings for states ----

  # If Y is not numeric, then the first frame was still an infogrid
  # But we need to get all the correct settings / encodings for a numeric plot

  if (y_type != "numeric") {

    # Convert NA to "NA", put at the end of factors, and arrange by all grouping variables so that IDs are consistent
    .data <- .data %>%
      arrange_by_groups_coalesce_na(group_vars, group_vars_chr) %>%
      # Add an ID used internally by our JS code / by gemini that controls how points are animated between frames
      # Not defined in any of the previous steps since the JS takes care of generating it
      dplyr::mutate(gemini_id = dplyr::row_number() - 1)

    # Add an x variable to use as the center of jittering
    # It can just be 1, except if mapping$x is not 1!
    # Generate the labels for these too - label by colour grouping variable or not at all

    if (mapping$x == 1) {
      .data <- .data %>%
        dplyr::mutate(!!X_FIELD := 1)

      x_labels <- generate_labelsExpr(NULL)
      x_domain <- generate_x_domain(NULL)
      x_title <- ""
    } else {
      x_var <- rlang::parse_expr(mapping$x)

      .data <- .data %>%
        dplyr::mutate(
          !!X_FIELD := as.numeric({{ x_var }})
        )

      x_labels <- .data %>%
        dplyr::ungroup() %>%
        dplyr::distinct(!!X_FIELD, label = {{ x_var }}) %>%
        generate_labelsExpr()

      x_domain <- .data %>%
        dplyr::ungroup() %>%
        dplyr::distinct(!!X_FIELD, label = {{ x_var }}) %>%
        generate_x_domain()

      x_title <- mapping$x
    }

    x_encoding <- list(field = X_FIELD_CHR, type = "quantitative", axis = list(values = x_labels[["breaks"]], labelExpr = x_labels[["labelExpr"]], labelAngle = -90), title = x_title, scale = x_domain)

    y_encoding <- list(field = Y_FIELD_CHR, type = "quantitative", title = mapping$y)

    color_encoding <- list(field = rlang::quo_name(mapping$color), type = "nominal")

    if (!is.null(mapping$color)) {
      color_encoding <- append(color_encoding, list(legend = list(values = levels(.data[[mapping$color]]))))
    }

    spec_encoding <- list(
      x = x_encoding,
      y = y_encoding,
      color = color_encoding
    )

    data_1 <- .data %>%
      dplyr::select(.data$gemini_id, tidyselect::any_of(group_vars_chr), !!X_FIELD, !!Y_FIELD) %>%
      dplyr::mutate(!!Y_TOOLTIP_FIELD := !!Y_FIELD)
  }

  # State 2: Summary plot (with any grouping) -----
  # There should still be a point for each datapoint, just all overlapping
  data_2 <- data_1 %>%
    dplyr::group_by(!!!group_vars) %>%
    dplyr::mutate(dplyr::across(c(!!Y_FIELD, !!Y_TOOLTIP_FIELD), !!summary_function, na.rm = TRUE))

  # Generate description
  description <- generate_summarize_description(summary_variable, summary_function, group_by = length(group_vars) != 0)

  # Tooltip
  spec_encoding$tooltip <- generate_summarize_tooltip(data_2, mapping$y, mapping$summary_function)

  spec_encoding$y$title <- glue::glue("{mapping$summary_function}({mapping$y})")

  # Remove any stroke/fillOpacity/shape

  spec_encoding$stroke <- spec_encoding$fillOpacity <- spec_encoding$shape <- NULL

  spec <- generate_vega_specs(
    .data = data_2,
    mapping = mapping,
    meta = list(axes = has_facets, description = description),
    spec_encoding = spec_encoding, facet_encoding = facet_encoding,
    height = height, width = width, facet_dims = facet_dims,
    # Flags for column / row  facets or color
    column = !is.null(mapping$column), row = !is.null(mapping$row), color = !is.null(mapping$color)
  )

  specs_list <- append(specs_list, list(spec))

  if (mapping$summary_function == "mean") {

    # State 3: Error bars -----
    # Only if the summary function is mean!

    data_3 <- data_1 %>%
      # The errorbar is calculated by vega so we need to send the raw y values, and the summarised ones
      dplyr::mutate(!!Y_RAW_FIELD := !!Y_FIELD) %>%
      dplyr::group_by(!!!group_vars) %>%
      dplyr::mutate(dplyr::across(c(!!Y_FIELD, !!Y_TOOLTIP_FIELD), !!summary_function, na.rm = TRUE))

    # Calculating errorbar for tooltips and to set the range for the zoom in the next step
    data_errorbar <- data_3 %>%
      dplyr::summarize(
        !!Y_FIELD := !!Y_FIELD,
        sd = stats::sd(!!Y_RAW_FIELD, na.rm = TRUE),
        n = n()
      ) %>%
      dplyr::distinct() %>%
      dplyr::mutate(
        se = .data$sd / sqrt(.data$n),
        Lower = !!Y_FIELD - .data$se,
        Upper = !!Y_FIELD + .data$se
      ) %>%
      dplyr::select(-!!Y_FIELD, -.data$sd, -.data$n, -.data$se)

    join_vars <- data_3 %>%
      dplyr::select(-.data$gemini_id, -!!X_FIELD, -!!Y_FIELD, -!!Y_TOOLTIP_FIELD, -!!Y_RAW_FIELD) %>%
      names()

    data_3 <- data_3 %>%
      dplyr::left_join(data_errorbar, by = join_vars)

    errorbar_tooltip <- purrr::map(c("Upper", "Lower"), ~ list(field = .x, type = "nominal", title = glue::glue("mean({summary_variable}) {sign} standard error",
      sign = ifelse(.x == "Upper", "+", "-")
    )))
    tooltip_encoding_first <- list(spec_encoding$tooltip[[1]])
    tooltip_encoding_rest <- list(spec_encoding$tooltip[-1])

    errorbar_tooltip <- append(tooltip_encoding_first, errorbar_tooltip)
    errorbar_tooltip <- append(errorbar_tooltip, tooltip_encoding_rest)

    # Replacing the "original" tooltip with the errorbar one, since we can't visualize tooltips on errorbars because they're on another layer
    # So just show the errorbar info on the point, too!
    spec_encoding$tooltip <- errorbar_tooltip

    description <- generate_summarize_description(summary_variable, summary_function, errorbar = TRUE, group_by = length(group_vars) != 0)

    spec <- generate_vega_specs(
      .data = data_3,
      mapping = mapping,
      meta = list(axes = has_facets, description = description),
      spec_encoding = spec_encoding, facet_encoding = facet_encoding,
      height = height, width = width, facet_dims = facet_dims,
      column = !is.null(mapping$column), row = !is.null(mapping$row), color = !is.null(mapping$color),
      errorbar = TRUE
    )

    specs_list <- append(specs_list, list(spec))

    # Step 4: Zoom -----
    # Zoom in on the summarised value
    # If it's mean (and there's error bars), need to calculate the error bars manually and get the range from there
    # Otherwise, just do the range of the Y + some padding

    description <- generate_summarize_description(summary_variable, summary_function, group_by = length(group_vars) != 0)
    description <- glue::glue("{description}, with errorbar, zoomed in")

    lcl <- min(data_errorbar[["Lower"]], na.rm = TRUE)
    ucl <- max(data_errorbar[["Upper"]], na.rm = TRUE)
    range_y_errorbar <- c(lcl, ucl)

    spec_encoding$y$scale$domain <- range_y_errorbar

    spec <- generate_vega_specs(
      .data = data_3,
      mapping = mapping,
      meta = list(axes = has_facets, description = description),
      spec_encoding = spec_encoding, facet_encoding = facet_encoding,
      height = height, width = width, facet_dims = facet_dims,
      column = !is.null(mapping$column), row = !is.null(mapping$row), color = !is.null(mapping$color),
      errorbar = TRUE
    )
  } else {
    description <- glue::glue("{description}, zoomed in")

    # Range is just the range of the actual y
    range_y <- range(data_2[[Y_FIELD_CHR]], na.rm = TRUE)
    spec_encoding$y$scale$domain <- range_y

    spec <- generate_vega_specs(
      .data = data_2,
      mapping = mapping,
      meta = list(axes = has_facets, description = description),
      spec_encoding = spec_encoding, facet_encoding = facet_encoding,
      height = height, width = width, facet_dims = facet_dims,
      column = !is.null(mapping$column), row = !is.null(mapping$row), color = !is.null(mapping$color)
    )
  }

  specs_list <- append(specs_list, list(spec))

  # Convert specs to JSON
  if (toJSON) {
    specs_list <- specs_list %>%
      purrr::map(vegawidget::vw_as_json, pretty = pretty)
  }

  # Return the specs
  specs_list
}

check_type <- function(x) {
  if (all(x %in% c(TRUE, FALSE)) |
    (is.factor(x) & length(levels(x)) == 2) |
    (is.character(x) & length(unique(x)) == 2)) {
    "binary"
  } else if (inherits(x, "numeric") | inherits(x, "integer")) {
    "numeric"
  } else {
    "categorical"
  }
}
