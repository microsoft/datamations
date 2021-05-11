#' @importFrom dplyr any_of arrange bind_rows filter group_by group_size group_split group_vars is_grouped_df left_join mutate n n_groups pull select summarize ungroup group_indices
#' @importFrom gganimate anim_save ease_aes transition_states view_follow
#' @importFrom ggplot2 aes element_blank geom_point ggplot ggtitle scale_color_manual theme
#' @importFrom magick image_read image_write
#' @importFrom purrr accumulate map map2 map2_dbl map2_dfr map_chr map_dbl map_dfr map_if pmap_dbl pmap_dfr reduce
#' @importFrom rlang parse_expr
#' @importFrom stats median
#' @importFrom tibble as_tibble tibble
dmta_image <- function(state1, image) {
  time1 <- state1$coords %>%
    mutate(Time = 1)

  anim_data <- time1

  anim <- anim_data %>%
    ggplot(aes(x = .data$Col, y = .data$Row_Coord)) +
    geom_point(aes(color = .data$Color, group = .data$Row_Coord), shape = 15, size = 3) +
    # xlim(-15, 20) +
    scale_color_manual(
      breaks = unique(anim_data$Color),
      values = as.character(unique(anim_data$Color))
    ) +
    theme_zilch() +
    transition_states(.data$Time,
      transition_length = 12,
      state_length = 10, wrap = FALSE
    ) +
    ease_aes("cubic-in-out") +
    view_follow(fixed_x = c(-15, 19))

  anim_path <- tempfile(fileext = ".gif")
  anim_save(animation = anim, filename = anim_path)

  return(list(coords = time1 %>%
    select(.data$Color, .data$Row, .data$Col, .data$Row_Coord, .data$Col_Coord) %>%
    arrange(.data$Row, .data$Col), anim_path = anim_path))
}
