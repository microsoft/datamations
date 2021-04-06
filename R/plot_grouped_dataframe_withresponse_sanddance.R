#' plot a dataframe with grouping, but instead of icon array, do a jittered plot
#' inferring the response variable to keep interface clean???
#'
#' @param .data
#' @param response_var class name???
#' @param xlim
#' @param ylim
#' @importFrom stringr str_replace
#' @importFrom ggplot2 scale_x_continuous
#' @export
plot_grouped_dataframe_withresponse_sanddance <- function(
                                                          .data, response_var, xlim = NULL, ylim = NULL,
                                                          mapping = NULL, var_levels = NULL, in_flight = TRUE, show_y_axis = FALSE, title = "") {


  # recover chr or factor types
  # if (! is.null(var_levels)) {
  #   .data <- .data %>%
  #     left_join(var_levels %>% select(group, x), by = "group") %>%
  #     select(-c(x.x)) %>%
  #     mutate(x = x.y)
  # }

  # recover the color column
  if (!is.null(var_levels)) {
    class(.data$x) <- c("mapped_discrete", "numeric")

    .data <- .data %>%
      separate(
        .data$group,
        into = str_split(mapping$group, "_")[[1]],
        remove = FALSE
      )
  }




  group_var <- attributes(.data)$groups %>%
    names() %>%
    first() # chr,


  color_var <- sym(mapping$colour)

  # recover x labels
  group_levels <- group_keys(.data) %>%
    pull(.data$group) %>%
    str_replace("_", " in\n") # natural langage, not masters_industry

  breaks <- 1:length(group_levels)


  p <- NULL

  if (!is.null(group_var)) {
    if (!in_flight) { # show the axes
      p <- ggplot(.data) +
        geom_point(aes(x = .data$x, y = .data$y, color = !!color_var)) +
        coord_cartesian(xlim = xlim, ylim = ylim) +
        theme(
          panel.background = element_rect(fill = "white", colour = "grey50"),
          legend.key = element_rect(fill = "white"),
          legend.position = "bottom"
        ) +
        labs(
          title = title,
          x = str_replace(`$`(mapping, x), "_", " and "),
          y = `$`(mapping, y),
          color = `$`(mapping, colour)
        ) +
        scale_x_continuous(labels = group_levels, breaks = breaks) +
        scale_y_continuous(labels = label_dollar(prefix = "$", suffix = "k"))
    } else { # hide axes
      p <- ggplot(.data) +
        geom_point(aes(x = .data$x, y = .data$y, color = !!color_var)) +
        coord_cartesian(xlim = xlim, ylim = ylim) +
        labs(
          title = .data$tile,
          x = str_replace(`$`(mapping, x), "_", " and "),
          y = `$`(mapping, y),
          color = `$`(mapping, colour)
        ) +
        theme_inflight(show_y_axis) +
        scale_x_continuous(labels = group_levels, breaks = breaks) +
        scale_y_continuous(labels = label_dollar(prefix = "$", suffix = "k"))
    }

    p
  } else {
    stop("no group var found")
  }
}
