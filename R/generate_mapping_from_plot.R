generate_mapping_from_plot <- function(plot) {
  # Extract x variable
  x <- plot$mapping$x %>%
    rlang::quo_name()

  #  Need to get y variable from the pipeline, since we want the "original" variable, not the transformed one that appears on the plot

  plot_mapping <- list(x = x)

  # Extract facets - error that facet_wrap() is not supported, use facet_grid()?
  row <- plot$facet$params$rows %>%
    unlist() %>%
    purrr::pluck(1)

  if(!is.null(row)) {
    plot_mapping <- append(plot_mapping, list(row = rlang::quo_name(row)))
  }

  column <- plot$facet$params$cols %>%
    unlist() %>%
    purrr::pluck(1)

  if(!is.null(column)) {
    plot_mapping <- append(plot_mapping, list(column = rlang::quo_name(column)))
  }

  plot_mapping
}
