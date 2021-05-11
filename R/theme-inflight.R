#' minimal theme that only shows legend and x axis ticks
#' @importFrom ggplot2 element_line element_text
theme_inflight <- function(show_y_axis = FALSE) {
  if (!show_y_axis) {
    theme(
      # line = element_line(color = "white"),
      text = element_text(color = "white"),
      rect = element_rect(color = "white"),
      title = element_text(color = "white"),
      panel.grid = element_blank(),
      panel.border = element_blank(),
      panel.background = element_blank(),
      axis.text.y = element_text(color = "white"),
      axis.title.y = element_text(color = "white"),
      axis.ticks.y = element_blank(),
      axis.line.x = element_line(color = "grey"),
      # axis.line = element_blank(),
      # axis.ticks.length = unit(0, "null"),
      # plot.title = element_text(size = 18),
      legend.text = element_text(color = "black"),
      legend.title = element_text(color = "black"),
      legend.key = element_rect(fill = "white"),
      legend.position = "bottom",
      plot.background = element_blank(),
      plot.title = element_text("black")
      # panel.spacing = unit(c(0, 0, 0, 0), "null")
    )
  } else {
    theme(
      panel.background = element_rect(fill = "white", colour = "grey50"),
      legend.key = element_rect(fill = "white"),
      legend.position = "bottom"
    )
  }
}
