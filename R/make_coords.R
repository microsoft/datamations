#' @importFrom dplyr any_of arrange bind_rows filter group_by group_size group_split group_vars is_grouped_df left_join mutate n n_groups pull select summarize ungroup group_indices
#' @importFrom gganimate anim_save ease_aes transition_states view_follow
#' @importFrom ggplot2 aes element_blank geom_point ggplot ggtitle scale_color_manual theme
#' @importFrom magick image_read image_write
#' @importFrom purrr accumulate map map2 map2_dbl map2_dfr map_chr map_dbl map_dfr map_if pmap_dbl pmap_dfr reduce
#' @importFrom rlang parse_expr
#' @importFrom stats median
#' @importFrom tibble as_tibble tibble
make_coords <- function(df, row_ceiling = nrow(df)) {
  n_values <- nrow(df) * length(df)

  coordinates <- tibble(
    Color = rep(NA, n_values),
    Row = rep(NA, n_values),
    Col = rep(NA, n_values),
    Row_Coord = rep(NA, n_values),
    Col_Coord = rep(NA, n_values)
  )

  i <- 1
  for (row in seq_along(1:nrow(df))) {
    for (col in seq_along(1:length(df))) {
      coordinates$Row[i] <- row
      coordinates$Col[i] <- col
      coordinates$Row_Coord[i] <- rev(seq_along(1:nrow(df)))[row]
      # coordinates$Row_Coord[i] <- (row_ceiling:1)[seq_along(1:nrow(df))][row]
      coordinates$Col_Coord[i] <- col
      i <- i + 1
    }
  }

  coordinates
}
