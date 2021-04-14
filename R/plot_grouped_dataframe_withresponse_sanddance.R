#' plot a dataframe with grouping, but instead of icon array, do a jittered plot
#' inferring the response variable to keep interface clean???
#'
#' @param .data
#' @importFrom stringr str_replace
#' @importFrom ggplot2 scale_x_continuous
#' @export
plot_grouped_dataframe_withresponse_sanddance <- function(.data, xlim = NULL, ylim = NULL, mapping = NULL, title = "") {

  # Check which mapping variables are present in the data
  colour_var_chr <- rlang::quo_name(mapping[["colour"]])
  shape_var_chr <- rlang::quo_name(mapping[["shape"]])

  plot_mapping <- dplyr::case_when(
    !colour_var_chr %in% names(.data) & !shape_var_chr %in% names(.data) ~ "none",
    colour_var_chr %in% names(.data) & !shape_var_chr %in% names(.data) ~ "color",
    colour_var_chr %in% names(.data) & shape_var_chr %in% names(.data) ~ "color, shape"
  )

  # Plot according to mapping variables

  if (plot_mapping == "none") {
    browser()
  } else if (plot_mapping == "color") {
    p <- ggplot(.data) +
      geom_quasirandom(aes(x = x, y = y, color = !!mapping[["colour"]]))
  } else if (plot_mapping == "color, shape") {
    p <- ggplot(.data) +
      geom_quasirandom(aes(.data$x, .data$y, colour = !!mapping[["colour"]], shape = !!mapping[["shape"]])) +
      # TODO: Can't handle more than 6 secondary grouping variables when doing this - might come up eventually :)
      ggplot2::scale_shape_manual(values = c(19, 1, 15, 0, 17, 2)) +
      ggplot2::guides(colour = ggplot2::guide_legend(order = 1), shape = ggplot2::guide_legend(order = 2))
  }

  p +
    theme(
      panel.background = element_rect(fill = "white", colour = "grey50"),
      legend.key = element_rect(fill = "white"),
      legend.position = "bottom"
    ) +
    coord_cartesian(xlim = xlim, ylim = ylim)

}






#' plot a dataframe with grouping, but instead of icon array, do a jittered plot
#' inferring the response variable to keep interface clean???
#'
#' @param .data
#' @importFrom stringr str_replace
#' @importFrom ggplot2 scale_x_continuous
#' @export
plot_grouped_dataframe_withresponse_sanddance_point <- function(.data, xlim = NULL, ylim = NULL, mapping = NULL, title = "") {

  # Check which mapping variables are present in the data
  colour_var_chr <- rlang::quo_name(mapping[["colour"]])
  shape_var_chr <- rlang::quo_name(mapping[["shape"]])

  plot_mapping <- dplyr::case_when(
    !colour_var_chr %in% names(.data) & !shape_var_chr %in% names(.data) ~ "none",
    colour_var_chr %in% names(.data) & !shape_var_chr %in% names(.data) ~ "color",
    colour_var_chr %in% names(.data) & shape_var_chr %in% names(.data) ~ "color, shape"
  )

  # Plot according to mapping variables

  if (plot_mapping == "none") {
    browser()
  } else if (plot_mapping == "color") {
    p <- ggplot(.data) +
      geom_point(aes(x = x, y = y, color = !!mapping[["colour"]]))
  } else if (plot_mapping == "color, shape") {
    p <- ggplot(.data) +
      geom_point(aes(.data$x, .data$y, colour = !!mapping[["colour"]], shape = !!mapping[["shape"]])) +
      # TODO: Can't handle more than 6 secondary grouping variables when doing this - might come up eventually :)
      ggplot2::scale_shape_manual(values = c(19, 1, 15, 0, 17, 2)) +
      ggplot2::guides(colour = ggplot2::guide_legend(order = 1), shape = ggplot2::guide_legend(order = 2))
  }

  p +
    theme(
      panel.background = element_rect(fill = "white", colour = "grey50"),
      legend.key = element_rect(fill = "white"),
      legend.position = "bottom"
    ) +
    coord_cartesian(xlim = xlim, ylim = ylim)

}

