generate_mapping_from_plot <- function(plot) {
  # Extract x and color variable
  x <- plot$mapping$x %>%
    rlang::quo_name()

  color <- plot$mapping$colour %>%
    rlang::quo_name()

  # If there is no plot mapping, the mapping was done in the geom, so grab from there instead
  if (x == "NULL" & "GeomPoint" %in% class(plot$layers[[1]]$geom)) {
    x <- plot$layers[[1]]$mapping$x %>%
      rlang::quo_name()

    color <- plot$layers[[1]]$mapping$colour %>%
      rlang::quo_name()
  }

  if (color == "NULL") {
    color <- NULL
  }

  #  Need to get y variable from the pipeline, since we want the "original" variable, not the transformed one that appears on the plot

  plot_mapping <- list(x = x, color = color)

  # Extract facets - error that facet_wrap() is not supported, use facet_grid()?
  row <- plot$facet$params$rows %>%
    unlist() %>%
    purrr::pluck(1)

  if (!is.null(row)) {
    plot_mapping <- append(plot_mapping, list(row = rlang::quo_name(row)))
  }

  column <- plot$facet$params$cols %>%
    unlist() %>%
    purrr::pluck(1)

  if (!is.null(column)) {
    plot_mapping <- append(plot_mapping, list(column = rlang::quo_name(column)))
  }

  # Remove empty elements
  purrr::compact(plot_mapping)
}
