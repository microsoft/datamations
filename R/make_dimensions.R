#' @importFrom stats median
#' @importFrom purrr map_dbl
#' @importFrom dplyr group_size
#' @importFrom dplyr any_of arrange bind_rows filter group_by group_size group_split group_vars is_grouped_df left_join mutate n n_groups pull select summarize ungroup group_indices
#' @importFrom gganimate anim_save ease_aes transition_states view_follow
#' @importFrom ggplot2 aes element_blank geom_point ggplot ggtitle scale_color_manual theme
#' @importFrom magick image_read image_write
#' @importFrom purrr accumulate flatten map map2 map2_dbl map2_dfr map_chr map_dbl map_dfr map_if pmap_dbl pmap_dfr reduce
#' @importFrom rlang parse_expr
#' @importFrom stats median
#' @importFrom tibble as_tibble tibble
make_dimensions <- function(data_states, fittings) {

  row_counts <- data_states %>%
    map_dbl(nrow)

  group_counts <- data_states %>%
    map(group_size) %>%
    map_dbl(length)

  max_row <- max(row_counts + group_counts)

  col_counts <- data_states %>%
    map_dbl(length)

  max_col <- max(col_counts)

  size <- max(max_row, max_col)

  x_midpoint <- 1:max_col %>% median() %>% floor()

  list(xmin = x_midpoint - ceiling(size/2),
       xmax = x_midpoint + ceiling(size/2),
       ymin = 0,
       ymax = size)
}

