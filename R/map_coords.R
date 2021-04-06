#' @importFrom tibble tibble
#' @importFrom dplyr any_of arrange bind_rows filter group_by group_size group_split group_vars is_grouped_df left_join mutate n n_groups pull select summarize ungroup group_indices
#' @importFrom gganimate anim_save ease_aes transition_states view_follow
#' @importFrom ggplot2 aes element_blank geom_point ggplot ggtitle scale_color_manual theme
#' @importFrom magick image_read image_write
#' @importFrom purrr accumulate map map2 map2_dbl map2_dfr map_chr map_dbl map_dfr map_if pmap_dbl pmap_dfr reduce
#' @importFrom rlang parse_expr
#' @importFrom stats median
#' @importFrom tibble as_tibble tibble
map_coords <- function(rows, cols) {
  # rows <- 26:29;cols <- 1:3
  n_values <- length(rows) * length(cols)

  rows <- sort(rows) %>% rev()
  cols <- sort(cols)

  coordinates <- tibble(
    Row = rep(NA, n_values),
    Col = rep(NA, n_values),
    Row_Coord = rep(NA, n_values),
    Col_Coord = rep(NA, n_values)
  )

  i <- 1
  for (row in rows) {
    for (col in cols) {
      coordinates$Row[i] <- which(row == rows)
      coordinates$Col[i] <- which(col == cols)
      coordinates$Row_Coord[i] <- row
      coordinates$Col_Coord[i] <- col
      i <- i + 1
    }
  }

  coordinates
}
