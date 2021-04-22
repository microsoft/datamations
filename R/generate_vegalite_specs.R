generate_vegalite_specs <- function(data, mapping, show_axes = FALSE) {

  # Check which mapping variables are present in the data
  colour_var_chr <- rlang::quo_name(mapping[["colour"]])
  shape_var_chr <- rlang::quo_name(mapping[["shape"]])

  plot_mapping <- dplyr::case_when(
    !colour_var_chr %in% names(data) & !shape_var_chr %in% names(data) ~ "none",
    colour_var_chr %in% names(data) & !shape_var_chr %in% names(data) ~ "color",
    colour_var_chr %in% names(data) & shape_var_chr %in% names(data) ~ "color, shape"
  )

  x_encoding <- list(field = "x", type = "quantitative", scale = list(type = "linear"), title = NULL)
  y_encoding <- list(field = "y", type = "quantitative", scale = list(type = "linear"), title = NULL)

  if (!show_axes) {
    x_encoding <- append(x_encoding, list(axis = NULL))
    y_encoding <- append(y_encoding, list(axis = NULL))
  }

  encoding <- list(x = x_encoding, y = y_encoding)

  if (plot_mapping == "color") {
    color_encoding <- list(field = colour_var_chr, type = "nominal")
    encoding <- append(encoding, list(color = color_encoding))
  } else if (plot_mapping == "color, shape") {
    color_encoding <- list(field = colour_var_chr, type = "nominal")
    shape_encoding <- list(field = shape_var_chr, type = "nominal")
    encoding <- append(encoding, list(color = color_encoding, shape = shape_encoding))
  }

  list(
    `$schema` = vegawidget::vega_schema(library = "vega_lite"),
    data = list(values = data),
    mark = "point",
    encoding = encoding
  ) %>%
    vegawidget::as_vegaspec() %>%
    vegawidget::vegawidget(embed = vegawidget::vega_embed(actions = FALSE))
}
