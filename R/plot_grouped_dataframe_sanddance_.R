#' Plot grouped dataframe, in sanddance style (icon array). Should look like a bunch of icon
#' arrays spaced out along x axis.
#'
#' @param coords with x, y, plus optional aesthetics columns
#' @importFrom stringr str_split
#' @importFrom rlang as_label
#' @importFrom ggplot2 coord_equal scale_x_continuous element_text geom_line
#' @importFrom tidyr pivot_longer
#' @return ggplot object
plot_grouped_dataframe_sanddance <- function(coords, xlim = NULL, ylim = NULL, is_coord_equal = TRUE,
                                             mapping = NULL, in_flight = FALSE, title = "") {

  # Return a plot immediately if there is no mapping - this is just used to get the axis limits at the beginning
  if (is.null(mapping)) {
    p <- ggplot(coords) +
      geom_point(aes(.data$x, .data$y)) +
      modded_waffle_theme

    return(p)
  }

  # Check which mapping variables are present in the data
  colour_var_chr <- rlang::quo_name(mapping[["colour"]])
  shape_var_chr <- rlang::quo_name(mapping[["shape"]])

  plot_mapping <- dplyr::case_when(
    !colour_var_chr %in% names(coords) & !shape_var_chr %in% names(coords) ~ "none",
    colour_var_chr %in% names(coords) & !shape_var_chr %in% names(coords) ~ "color",
    colour_var_chr %in% names(coords) & shape_var_chr %in% names(coords) ~ "color, shape"
  )

  # Plot according to mapping variables

  if (plot_mapping == "none") {
    p <- ggplot(coords) +
      geom_point(aes(.data$x, .data$y), color = "grey")
  } else if (plot_mapping == "color") {
    p <- ggplot(coords) +
      geom_point(aes(.data$x, .data$y, colour = !!mapping[["colour"]]))
  } else if (plot_mapping == "color, shape") {
    p <- ggplot(coords) +
      geom_point(aes(.data$x, .data$y, colour = !!mapping[["colour"]], shape = !!mapping[["shape"]])) +
      # TODO: Can't handle more than 6 secondary grouping variables when doing this - might come up eventually :)
      ggplot2::scale_shape_manual(values = c(19, 1, 15, 0, 17, 2)) +
      ggplot2::guides(colour = ggplot2::guide_legend(order = 1), shape = ggplot2::guide_legend(order = 2))
  }

  p <- p +
    modded_waffle_theme

  if (is_coord_equal) {
    p + coord_equal(xlim = xlim, ylim = ylim)
  } else {
    p + coord_cartesian(xlim = xlim, ylim = ylim)
  }
}

# modded_waffle_theme <- theme(
#   line = element_line(color = "white"),
#   text = element_text(color = "white"),
#   rect = element_rect(color = "white"),
#   title = element_text(color = "white"),
#   panel.grid = element_blank(),
#   panel.border = element_blank(),
#   panel.background = element_blank(),
#   axis.text = element_text(color = "white"),
#   axis.title = element_text(color = "white"),
#   axis.ticks = element_blank(),
#   legend.text = element_text(color = "black"),
#   legend.key = element_rect(fill = "white"),
#   legend.title = element_text(color = "black"),
#   plot.background = element_blank(),
#   legend.position = "bottom"
# )
