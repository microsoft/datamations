#' Generate specs of data distribution and summarized data steps of datamations
#'
#' @param .data Input data
#' @param mapping A list that describes mapping for the datamations, including x and y variables, summary variable and operation, variables used in facets and in colors, etc. Generated in \code{datamation_sanddance} using \code{generate_mapping}.
#' @inheritParams datamation_sanddance
#' @inheritParams prep_specs_data
#' @noRd
prep_specs_mutate <- function(.data, mapping, toJSON = TRUE, pretty = TRUE, height = 300, width = 300, grouping_before, ...) {

  # Get mutation expression
  # Mutation function name not needed here (and sometimes hard to parse, as often mathematical expression)

  if(!is.null(mapping$mutation_expression)) {
    mutation_expression <- mapping$mutation_expression
  }

    if(!is.null(mapping$mutation_variables)) {
    mutation_variables <- mapping$mutation_variables
  }

  # TODO -- Here we need a sensible set of specs for the mutation
  # Should resemble first half of a summarize: listed set of values with associated gemini ids

  mutation_function_on_variable <- !identical(mapping$mutation_function, NULL)
  mutation_basis_on_variable <- !identical(mapping$mutation_variables, NULL)

  if (mutation_function_on_variable) {
    mutation_variable <- mapping$mutation_name %>%
      rlang::parse_expr()

    mutation_variable_chr <- rlang::as_name(mutation_variable)

    # Prep data with initial mutation
    .data <- .data %>%
      dplyr::mutate(
        !!mutation_variable := !!rlang::parse_expr(mutation_expression)
      )

    if(mutation_basis_on_variable) {
      mutation_basis <- rlang::as_name(mutation_variables[1]) %>%
        rlang::parse_expr()

      mutation_basis_chr <- rlang::as_name(mutation_basis)

      basis_type <- check_type(.data[[mutation_variable]])

      # add a split grid if there are multiple mutation basis variables defined and we have no grouped mapping
      # If we have a grouped mapping, just take first mutation variable
      if(grouping_before) mutation_variables <- mutation_variables[1]

      if(length(mutation_variables)>1) {

        mutation_basis_two <- rlang::as_name(mutation_variables[2]) %>%
          rlang::parse_expr()

        mutation_basis_two_chr <- rlang::as_name(mutation_basis_two)

        basis_type_two <- check_type(.data[[mutation_variable]])

      }
    } else {basis_type <- 'null'}

    # Check whether the response variable is numeric or binary / categorical
    # If it is numeric, the first summary frame should be a jittered distribution
    # If it is binary / categorical, the first summary frame is an info grid (and so much of the same logic needs to be pulled in from prep_specs_group_by)

    y_type <- check_type(.data[[mutation_variable]])
  } else {
    y_type <- "null"
  }

  # If the grouping doesn't happen until after the mutation, set the group mapping NULL
  if(!grouping_before) {mapping$groups <- NULL}
  # For the x mapping, we want this as 1 so it doesn't facet
  if(!grouping_before) {mapping$x <- 1}

  # Mapping and encoding for numeric ----
  if (basis_type == "numeric") {
    ## Extract mapping ----

    # Extract grouping variables from mapping
    # TODO -- Need to add a check if this grouping happens before or after the mutate step
    group_vars_chr <- mapping$groups

    # Convert to symbol
    group_vars <- group_vars_chr %>%
      as.list() %>%
      purrr::map(rlang::parse_expr)

    ### Prep data ----

    # If gemini_id is not already added, e.g. if this function is called on its own for testing purposes
    if (!"gemini_id" %in% names(.data)) {
      # Convert NA to "NA", put at the end of factors, and arrange by all grouping variables so that IDs are consistent
      .data <- .data %>%
        arrange_by_groups_coalesce_na(group_vars, group_vars_chr) %>%
        # Add an ID used internally by our JS code / by gemini that controls how points are animated between frames
        # Not defined in any of the previous steps since the JS takes care of generating it
        dplyr::mutate(gemini_id = dplyr::row_number())
    }

    data_1 <- .data %>%
      dplyr::rename(!!Y_FIELD := {{ mutation_basis }}
      )

    # Add an x variable to use as the center of jittering
    # It can just be 1, except if mapping$x is not 1!
    # Generate the labels for these too - label by colour grouping variable or not at all

    # if we have only one mutation variable and no groups, do the following:
    if (length(mutation_variables)==1 && mapping$x==1) {
      data_1 <- data_1 %>%
        dplyr::mutate(!!X_FIELD := 1)

      x_labels <- generate_labelsExpr(NULL)
      x_domain <- generate_x_domain(NULL)
      x_title <- NULL
    # if we have more than one mutation variable and no groups, do the following:
    } else if (length(mutation_variables)>1) {
      x_var <- rlang::parse_expr(mutation_basis_two_chr)

      data_1 <- data_1 %>%
        dplyr::mutate(
          !!X_FIELD := as.numeric({{ x_var }})
        )

      x_labels <- data_1 %>%
        dplyr::ungroup() %>%
        dplyr::distinct(!!X_FIELD, label = {{ x_var }}) %>%
        generate_labelsExpr()

      x_domain <- data_1 %>%
        dplyr::ungroup() %>%
        dplyr::distinct(!!X_FIELD, label = {{ x_var }}) %>%
        generate_x_domain()

      x_title <- mutation_basis_two_chr
    # in cases where we have grouping, use default grid showing single variable transition
    } else {
      x_var <- rlang::parse_expr(mapping$x)

      data_1 <- data_1 %>%
        dplyr::mutate(
          !!X_FIELD := as.numeric({{ x_var }})
        )

      x_labels <- data_1 %>%
        dplyr::ungroup() %>%
        dplyr::distinct(!!X_FIELD, label = {{ x_var }}) %>%
        generate_labelsExpr()

      x_domain <- data_1 %>%
        dplyr::ungroup() %>%
        dplyr::distinct(!!X_FIELD, label = {{ x_var }}) %>%
        generate_x_domain()

      x_title <- mapping$x
    }

    ### Prep encoding ----
    if(length(mutation_variables)>1) {
      x_range <- range(data_1[["datamations_x"]], na.rm = TRUE)

      x_encoding <- list(field = X_FIELD_CHR, type = "quantitative", title = x_title, scale = list(domain = x_range))
    } else {
      x_encoding <- list(field = X_FIELD_CHR, type = "quantitative", axis = list(values = x_labels[["breaks"]], labelExpr = x_labels[["labelExpr"]], labelAngle = -90), title = x_title, scale = x_domain)
    }
    y_range <- range(data_1[[Y_FIELD_CHR]], na.rm = TRUE)

    if(!is.null(mapping$mutation_variables)) {
      y_encoding <- list(field = Y_FIELD_CHR, type = "quantitative", title = mutation_basis_chr, scale = list(domain = y_range))
    }
    else {
      y_encoding <- list(field = Y_FIELD_CHR, type = "quantitative", scale = list(domain = y_range))
    }

    if (!is.null(mapping$color)) {
      color_encoding <- list(field = rlang::quo_name(mapping$color), type = "nominal")
      color_encoding <- append(color_encoding, list(legend = list(values = levels(data_1[[mapping$color]]))))
    }

    spec_encoding <- list(
      x = x_encoding,
      y = y_encoding
    )

    if(exists("color_encoding")) { spec_encoding$color <- color_encoding }

    # Flag for whether the plot will have facets - used to set axes = TRUE (if it does have facets, and the "fake facets" need to be used) or FALSE (if it doesn't, and the real axes can be used)
    has_facets <- !is.null(mapping$column) | !is.null(mapping$row)

    facet_col_encoding <- list(field = mapping$column, type = "ordinal", title = mapping$column)

    if (!is.null(mapping$column)) {
      facet_col_encoding$sort <- unique(data_1[[mapping$column]])
    }

    facet_row_encoding <- list(field = mapping$row, type = "ordinal", title = mapping$row)

    if (!is.null(mapping$row)) {
      facet_row_encoding$sort <- unique(data_1[[mapping$row]])
    }

    facet_encoding <- list(
      column = facet_col_encoding,
      row = facet_row_encoding
    )

    # Calculate number of facets for sizing
    facet_dims <- data_1 %>%
      calculate_facet_dimensions(group_vars, mapping)
  } else if (basis_type %in% c("binary", "categorical")) {
    # Mapping and encoding for binary / categorical ----

    ## Extract mapping -----
    # Extract grouping variables from mapping
    group_vars_chr <- mapping$groups

    # Convert to symbol
    group_vars <- group_vars_chr %>%
      as.list() %>%
      purrr::map(rlang::parse_expr)

    ### Prep data ----

    # If gemini_id is not already added, e.g. if this function is called on its own for testing purposes
    if (!"gemini_id" %in% names(.data)) {
      # Convert NA to "NA", put at the end of factors, and arrange by all grouping variables so that IDs are consistent
      .data <- .data %>%
        arrange_by_groups_coalesce_na(group_vars, group_vars_chr) %>%
        # Add an ID used internally by our JS code / by gemini that controls how points are animated between frames
        # Not defined in any of the previous steps since the JS takes care of generating it
        dplyr::mutate(gemini_id = dplyr::row_number())
    }

    data_1 <- .data

    ### Prep encoding ----

    x_encoding <- list(field = X_FIELD_CHR, type = "quantitative", axis = NULL)
    y_encoding <- list(field = Y_FIELD_CHR, type = "quantitative", axis = NULL)

    color_name <- if (is.null(mapping$color)) {
      NULL
    } else {
      rlang::quo_name(mapping$color)
    }

    if (!is.null(mapping$color)) {
      color_encoding <- list(field = rlang::quo_name(mapping$color), type = "nominal")
      color_encoding <- append(color_encoding, list(legend = list(values = levels(.data[[mapping$color]]))))
    }

    spec_encoding <- list(
      x = x_encoding,
      y = y_encoding
    )

    if(exists("color_encoding")) { spec_encoding$color <- color_encoding }


    # Flag for whether the plot will have facets - used to set axes = TRUE (if it does have facets, and the "fake facets" need to be used) or FALSE (if it doesn't, and the real axes can be used)
    has_facets <- !is.null(mapping$column) | !is.null(mapping$row)

    facet_col_encoding <- list(field = mapping$column, type = "ordinal", title = mapping$column)

    if (!is.null(mapping$column)) {
      facet_col_encoding$sort <- unique(.data[[mapping$column]])
    }

    facet_row_encoding <- list(field = mapping$row, type = "ordinal", title = mapping$row)

    if (!is.null(mapping$row)) {
      facet_row_encoding$sort <- unique(.data[[mapping$row]])
    }

    facet_encoding <- list(
      column = facet_col_encoding,
      row = facet_row_encoding
    )

    facet_encoding <- list(
      column = facet_col_encoding,
      row = facet_row_encoding
    )

    # Calculate number of facets for sizing
    facet_dims <- .data %>%
      calculate_facet_dimensions(group_vars, mapping)
  } else {
    data_1 <- .data
  }

  # Generate the data and specs for each state
  specs_list <- list()

  # State 1: Scatter plot or icon array (with any grouping) for original variable -----
  # Scatter plot if the variable is continuous, icon array if discrete (categorical, binary)

  if (basis_type %in% c("numeric", "binary", "categorical")) {

    # If it is numeric, prepare to visualize data in a jittered scatterplot
    if (basis_type == "numeric") {
      data_1 <- data_1 %>%
        dplyr::select(gemini_id, tidyselect::any_of(group_vars_chr), !!X_FIELD, !!Y_FIELD) %>%
        dplyr::mutate(!!Y_TOOLTIP_FIELD := !!Y_FIELD)

      # Generate tooltip
      spec_encoding$tooltip <- generate_mutation_tooltip(data_1, mutation_basis_chr)
    } else if (basis_type %in% c("binary", "categorical")) { # Otherwise, another infogrid!
      # Mutation already created, no necessary updates to this data
      data_1 <- data_1

      # If the mutation variable is a factor, order according to its values to match the legend
      # If it's TRUE / FALSE, the order in R is FALSE / TRUE or 0 / 1 but change so that it's actually T/F 1/0

      if (is.factor(data_1[[mutation_basis_chr]])) {
        data_1 <- data_1 %>%
          dplyr::arrange(!!!group_vars, !!mutation_basis)
      } else if (all(data_1[[mutation_basis_chr]] %in% c(TRUE, FALSE))) {
        data_1 <- data_1 %>%
          dplyr::arrange(!!!group_vars, -!!mutation_basis)
      }

      # Generate tooltip
      tooltip_groups <- generate_group_by_tooltip(data_1)
      tooltip_y <- list(field = mutation_basis_chr, type = "nominal")

      spec_encoding$tooltip <- append(list(tooltip_y), tooltip_groups)
    }

    if (basis_type == "numeric") {

      # Generate description
      description <- generate_generic_description(mutation_basis, group_by = length(group_vars) != 0)

      # meta = list(parse = "jitter") communicates to the JS code that the x values need to be jittered
      # No jitter if we provide an x value
      if(length(mutation_variables)==1) {
        meta <- list(parse = "jitter", axes = has_facets, description = description)
      }
      else {
        meta <- list(axes = FALSE, description = description)
      }
    } else if (basis_type %in% c("binary", "categorical")) {

      # Generate description
      description <- generate_generic_description(mutation_basis, group_by = length(group_vars) != 0)

      # meta = list(parse = "grid") communicates to the JS code to turn these into real specs
      # Use this if the response variable is categorical
      meta <- list(parse = "grid", axes = has_facets, description = description)

      if (basis_type == "binary") {
        if (!is.null(mapping$color)) {

          # If there is a variable mapped to color:
          # color: mapping$color
          # stroke: mapping$color
          # fillOpacity: mapping$y, scale: domain: 0, 1
          # shape: mapping$y, scale: range: circle, legend: symbolFillColor: expr: first value set to grey color, second value is transparent

          spec_encoding$stroke <- list(field = mapping$color)

          spec_encoding$fillOpacity <- list(field = mutation_basis_chr, type = "nominal", scale = list(range = c(0, 1)))

          # For the fill, if it's a factor, take the first
          # If it's TRUE / FALSE, do TRUE first

          values <- unique(.data[[mutation_basis_chr]])

          first_value <- if (identical(sort(values), c(0, 1))) {
            1
          } else if (identical(sort(values), c(FALSE, TRUE))) {
            "true"
          } else if (is.factor(values)) {
            levels(values)[[1]]
          } else {
            values[[1]]
          }

          shape_fill_legend_expr <- glue::glue("datum.label == '{first_value}' ? '#888' : 'transparent'",
            first_value = first_value
          )

          value_order <- if (identical(sort(values), c(0, 1))) {
            c(1, 0)
          } else if (identical(sort(values), c(FALSE, TRUE))) {
            c(TRUE, FALSE)
          } else if (is.factor(values)) {
            levels(values)
          } else {
            values
          }

          spec_encoding$shape <- list(
            field = mutation_basis_chr,
            scale = list(
              domain = value_order,
              range = c("circle", "circle")
            ),
            legend = list(symbolFillColor = list(expr = shape_fill_legend_expr))
          )
        } else {
          color <- "#4c78a8"
          white <- "#ffffff"
          # If there is NOT a variable mapped to color:
          # fill: mapping$y, scale: range: grey, white
          # stroke: mapping$y, scale: range: grey, grey

          values <- unique(.data[[mutation_basis_chr]])

          value_order <- if (identical(sort(values), c(0, 1))) {
            c(1, 0)
          } else if (identical(sort(values), c(FALSE, TRUE))) {
            c(TRUE, FALSE)
          } else if (is.factor(values)) {
            levels(values)
          } else {
            values
          }

          spec_encoding$fill <- list(field = mutation_basis_chr, scale = list(domain = value_order, range = c(color, white)))
          spec_encoding$stroke <- list(field = mutation_basis_chr, scale = list(domain = value_order, range = c(color, color)))
        }
      } else if (basis_type == "categorical") {
        # Use shape
        spec_encoding$shape <- list(field = mutation_basis_chr, type = "nominal")

        # Set the legend order to match the order in the data, or factor levels

        values <- unique(.data[[mutation_basis_chr]])

        legend_order <- if (is.factor(values)) {
          levels(values)
        } else {
          values
        }

        spec_encoding$shape$scale$domain <- legend_order
      }
    }

    # Variables that need to be passed to JS
    if(!is.null(mapping$x) && !mapping$x==1 && length(mutation_variables)==1) {
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

  }

  # State 2: Scatter plot or icon array (with any grouping) for new variable-----
  # Scatter plot if the variable is continuous, icon array if discrete (categorical, binary)


# Mapping and encoding for numeric ----
  if (y_type == "numeric") {
    ## Extract mapping ----

    # Extract grouping variables from mapping
    # TODO -- Need to add a check if this grouping happens before or after the mutate step
    group_vars_chr <- mapping$groups

    # Convert to symbol
    group_vars <- group_vars_chr %>%
      as.list() %>%
      purrr::map(rlang::parse_expr)

    ### Prep data ----

    # If gemini_id is not already added, e.g. if this function is called on its own for testing purposes
    if (!"gemini_id" %in% names(.data)) {
      # Convert NA to "NA", put at the end of factors, and arrange by all grouping variables so that IDs are consistent
      .data <- .data %>%
        arrange_by_groups_coalesce_na(group_vars, group_vars_chr) %>%
        # Add an ID used internally by our JS code / by gemini that controls how points are animated between frames
        # Not defined in any of the previous steps since the JS takes care of generating it
        dplyr::mutate(gemini_id = dplyr::row_number())
    }


    data_2 <- .data %>%
      dplyr::rename(!!Y_FIELD := {{ mutation_variable }},

      )

    # Add an x variable to use as the center of jittering
    # It can just be 1, except if mapping$x is not 1!
    # Generate the labels for these too - label by colour grouping variable or not at all

    if (length(mutation_variables)==1 && mapping$x==1) {
      data_2 <- data_2 %>%
        dplyr::mutate(!!X_FIELD := 1)

      x_labels <- generate_labelsExpr(NULL)
      x_domain <- generate_x_domain(NULL)
      x_title <- NULL
    } else if (length(mutation_variables)>1 && mapping$x==1) {
      x_var <- rlang::parse_expr(mutation_basis_two_chr)

      data_2 <- data_2 %>%
        dplyr::mutate(
          !!X_FIELD := as.numeric({{ x_var }})
        )

      x_labels <- data_2 %>%
        dplyr::ungroup() %>%
        dplyr::distinct(!!X_FIELD, label = {{ x_var }}) %>%
        generate_labelsExpr()

      x_domain <- data_2 %>%
        dplyr::ungroup() %>%
        dplyr::distinct(!!X_FIELD, label = {{ x_var }}) %>%
        generate_x_domain()

      x_title <- mutation_basis_two_chr
    } else {
      x_var <- rlang::parse_expr(mapping$x)

      data_2 <- data_2 %>%
        dplyr::mutate(
          !!X_FIELD := as.numeric({{ x_var }})
        )

      x_labels <- data_2 %>%
        dplyr::ungroup() %>%
        dplyr::distinct(!!X_FIELD, label = {{ x_var }}) %>%
        generate_labelsExpr()

      x_domain <- data_2 %>%
        dplyr::ungroup() %>%
        dplyr::distinct(!!X_FIELD, label = {{ x_var }}) %>%
        generate_x_domain()

      x_title <- mapping$x
    }

    ### Prep encoding ----
    if(length(mutation_variables)>1) {
      x_range <- range(data_1[["datamations_x"]], na.rm = TRUE)

      x_encoding <- list(field = X_FIELD_CHR, type = "quantitative", title = x_title, scale = list(domain = x_range))
    } else {
      x_encoding <- list(field = X_FIELD_CHR, type = "quantitative", axis = list(values = x_labels[["breaks"]], labelExpr = x_labels[["labelExpr"]], labelAngle = -90), title = x_title, scale = x_domain)
    }
    y_range <- range(data_2[[Y_FIELD_CHR]], na.rm = TRUE)

    if(!is.null(mapping$mutation_variables)) {
      y_encoding <- list(field = Y_FIELD_CHR, type = "quantitative", title = mapping$mutation_name, scale = list(domain = y_range))
    }
    else {
      y_encoding <- list(field = Y_FIELD_CHR, type = "quantitative", scale = list(domain = y_range))
    }

    if (!is.null(mapping$color)) {
      color_encoding <- list(field = rlang::quo_name(mapping$color), type = "nominal")
      color_encoding <- append(color_encoding, list(legend = list(values = levels(data_2[[mapping$color]]))))
    }

    spec_encoding <- list(
      x = x_encoding,
      y = y_encoding
    )

    if(exists("color_encoding")) { spec_encoding$color <- color_encoding }

    # Flag for whether the plot will have facets - used to set axes = TRUE (if it does have facets, and the "fake facets" need to be used) or FALSE (if it doesn't, and the real axes can be used)
    has_facets <- !is.null(mapping$column) | !is.null(mapping$row)

    facet_col_encoding <- list(field = mapping$column, type = "ordinal", title = mapping$column)

    if (!is.null(mapping$column)) {
      facet_col_encoding$sort <- unique(data_2[[mapping$column]])
    }

    facet_row_encoding <- list(field = mapping$row, type = "ordinal", title = mapping$row)

    if (!is.null(mapping$row)) {
      facet_row_encoding$sort <- unique(data_2[[mapping$row]])
    }

    facet_encoding <- list(
      column = facet_col_encoding,
      row = facet_row_encoding
    )

    # Calculate number of facets for sizing
    facet_dims <- data_2 %>%
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

    # If gemini_id is not already added, e.g. if this function is called on its own for testing purposes
    if (!"gemini_id" %in% names(.data)) {
      # Convert NA to "NA", put at the end of factors, and arrange by all grouping variables so that IDs are consistent
      .data <- .data %>%
        arrange_by_groups_coalesce_na(group_vars, group_vars_chr) %>%
        # Add an ID used internally by our JS code / by gemini that controls how points are animated between frames
        # Not defined in any of the previous steps since the JS takes care of generating it
        dplyr::mutate(gemini_id = dplyr::row_number())
    }

    data_2 <- .data

    ### Prep encoding ----

    x_encoding <- list(field = X_FIELD_CHR, type = "quantitative", axis = NULL)
    y_encoding <- list(field = Y_FIELD_CHR, type = "quantitative", axis = NULL)

    color_name <- if (is.null(mapping$color)) {
      NULL
    } else {
      rlang::quo_name(mapping$color)
    }

    if (!is.null(mapping$color)) {
      color_encoding <- list(field = rlang::quo_name(mapping$color), type = "nominal")
      color_encoding <- append(color_encoding, list(legend = list(values = levels(.data[[mapping$color]]))))
    }

    spec_encoding <- list(
      x = x_encoding,
      y = y_encoding
    )

    if(exists("color_encoding")) { spec_encoding$color <- color_encoding }


    # Flag for whether the plot will have facets - used to set axes = TRUE (if it does have facets, and the "fake facets" need to be used) or FALSE (if it doesn't, and the real axes can be used)
    has_facets <- !is.null(mapping$column) | !is.null(mapping$row)

    facet_col_encoding <- list(field = mapping$column, type = "ordinal", title = mapping$column)

    if (!is.null(mapping$column)) {
      facet_col_encoding$sort <- unique(.data[[mapping$column]])
    }

    facet_row_encoding <- list(field = mapping$row, type = "ordinal", title = mapping$row)

    if (!is.null(mapping$row)) {
      facet_row_encoding$sort <- unique(.data[[mapping$row]])
    }

    facet_encoding <- list(
      column = facet_col_encoding,
      row = facet_row_encoding
    )

    facet_encoding <- list(
      column = facet_col_encoding,
      row = facet_row_encoding
    )

    # Calculate number of facets for sizing
    facet_dims <- .data %>%
      calculate_facet_dimensions(group_vars, mapping)
  }  else {
    data_2 <- .data
  }


  if (y_type %in% c("numeric", "binary", "categorical")) {

    # If it is numeric, prepare to visualize data in a jittered scatterplot
    if (y_type == "numeric") {
      data_2 <- data_2 %>%
        dplyr::select(gemini_id, tidyselect::any_of(group_vars_chr), !!X_FIELD, !!Y_FIELD) %>%
        dplyr::mutate(!!Y_TOOLTIP_FIELD := !!Y_FIELD)

      # Generate tooltip
      spec_encoding$tooltip <- generate_mutation_tooltip(data_2, mapping$mutation_name)
    } else if (y_type %in% c("binary", "categorical")) { # Otherwise, another infogrid!
      # Mutation already created, no necessary updates to this data
      data_2 <- data_2

      # If the mutation variable is a factor, order according to its values to match the legend
      # If it's TRUE / FALSE, the order in R is FALSE / TRUE or 0 / 1 but change so that it's actually T/F 1/0

      if (is.factor(data_2[[mutation_variable_chr]])) {
        data_2 <- data_2 %>%
          dplyr::arrange(!!!group_vars, !!mutation_variable)
      } else if (all(data_2[[mutation_variable_chr]] %in% c(TRUE, FALSE))) {
        data_2 <- data_2 %>%
          dplyr::arrange(!!!group_vars, -!!mutation_variable)
      }

      # Generate tooltip
      tooltip_groups <- generate_group_by_tooltip(data_2)
      tooltip_y <- list(field = mutation_variable_chr, type = "nominal")

      spec_encoding$tooltip <- append(list(tooltip_y), tooltip_groups)
    }

    if (y_type == "numeric") {

      # Generate description
      description <- generate_mutation_description(mutation_variable, mutation_expression, group_by = length(group_vars) != 0)

      # meta = list(parse = "jitter") communicates to the JS code that the x values need to be jittered
      # No jitter if we provide an x value
      if(length(mutation_variables)==1) {
        meta <- list(parse = "jitter", axes = has_facets, description = description)
      }
      else {
        meta <- list(axes = FALSE, description = description)
      }    } else if (y_type %in% c("binary", "categorical")) {

      # Generate description
      description <- generate_mutation_description(mutation_variable, mutation_expression, group_by = length(group_vars) != 0)

      # meta = list(parse = "grid") communicates to the JS code to turn these into real specs
      # Use this if the response variable is categorical
      meta <- list(parse = "grid", axes = has_facets, description = description)

      if (y_type == "binary") {
        if (!is.null(mapping$color)) {

          # If there is a variable mapped to color:
          # color: mapping$color
          # stroke: mapping$color
          # fillOpacity: mapping$y, scale: domain: 0, 1
          # shape: mapping$y, scale: range: circle, legend: symbolFillColor: expr: first value set to grey color, second value is transparent

          spec_encoding$stroke <- list(field = mapping$color)

          spec_encoding$fillOpacity <- list(field = mutation_variable_chr, type = "nominal", scale = list(range = c(0, 1)))

          # For the fill, if it's a factor, take the first
          # If it's TRUE / FALSE, do TRUE first

          values <- unique(.data[[mutation_variable_chr]])

          first_value <- if (identical(sort(values), c(0, 1))) {
            1
          } else if (identical(sort(values), c(FALSE, TRUE))) {
            "true"
          } else if (is.factor(values)) {
            levels(values)[[1]]
          } else {
            values[[1]]
          }

          shape_fill_legend_expr <- glue::glue("datum.label == '{first_value}' ? '#888' : 'transparent'",
            first_value = first_value
          )

          value_order <- if (identical(sort(values), c(0, 1))) {
            c(1, 0)
          } else if (identical(sort(values), c(FALSE, TRUE))) {
            c(TRUE, FALSE)
          } else if (is.factor(values)) {
            levels(values)
          } else {
            values
          }

          spec_encoding$shape <- list(
            field = mutation_variable_chr,
            scale = list(
              domain = value_order,
              range = c("circle", "circle")
            ),
            legend = list(symbolFillColor = list(expr = shape_fill_legend_expr))
          )
        } else {
          color <- "#4c78a8"
          white <- "#ffffff"
          # If there is NOT a variable mapped to color:
          # fill: mapping$y, scale: range: grey, white
          # stroke: mapping$y, scale: range: grey, grey

          values <- unique(.data[[mutation_variable_chr]])

          value_order <- if (identical(sort(values), c(0, 1))) {
            c(1, 0)
          } else if (identical(sort(values), c(FALSE, TRUE))) {
            c(TRUE, FALSE)
          } else if (is.factor(values)) {
            levels(values)
          } else {
            values
          }

          spec_encoding$fill <- list(field = mutation_variable_chr, scale = list(domain = value_order, range = c(color, white)))
          spec_encoding$stroke <- list(field = mutation_variable_chr, scale = list(domain = value_order, range = c(color, color)))
        }
      } else if (y_type == "categorical") {
        # Use shape
        spec_encoding$shape <- list(field = mutation_variable_chr, type = "nominal")

        # Set the legend order to match the order in the data, or factor levels

        values <- unique(.data[[mutation_variable_chr]])

        legend_order <- if (is.factor(values)) {
          levels(values)
        } else {
          values
        }

        spec_encoding$shape$scale$domain <- legend_order
      }
    }

    # Variables that need to be passed to JS
    if(!is.null(mapping$x) && !mapping$x==1 && length(mutation_variables)==1) {
      # If there is a grouping variable on the x-axis, then each jitter field needs to be split by that X, so we have to tell the JS code that
      meta <- append(meta, list(splitField = mapping$x))

      if (!has_facets) {
        # If there are facets, they're fake and don't actually have labels, so we need to send those over too!
        meta <- append(meta, list(xAxisLabels = levels(data_2[[mapping$x]])))
      }
    }

    spec <- generate_vega_specs(
      .data = data_2,
      mapping = mapping,
      meta = meta,
      spec_encoding = spec_encoding, facet_encoding = facet_encoding,
      height = height, width = width, facet_dims = facet_dims,
      # Flags for column / row  facets or color
      column = !is.null(mapping$column), row = !is.null(mapping$row), color = !is.null(mapping$color)
    )

    specs_list <- append(specs_list, list(spec))

  }

  # Return the specs
  specs_list
}

