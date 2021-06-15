#' @importFrom dplyr any_of arrange bind_rows filter group_by group_size group_split group_vars is_grouped_df left_join mutate n n_groups pull select summarize ungroup group_indices if_else
#' @importFrom gganimate anim_save ease_aes transition_states view_follow
#' @importFrom ggplot2 aes element_blank geom_point ggplot ggtitle scale_color_manual theme
#' @importFrom magick image_read image_write
#' @importFrom purrr accumulate map map2 map2_dbl map2_dfr map_chr map_dbl map_dfr map_if pmap_dbl pmap_dfr reduce
#' @importFrom rlang parse_expr
#' @importFrom stats median
#' @importFrom tibble as_tibble tibble
dmta_group_by <- function(state1, state2, dimensions, anim_title = NA) {
  grouping_columns <- state2$df %>%
    group_vars()

  grouping_columns <- which(names(state2$df) %in% grouping_columns)

  n_columns <- length(state1$df)
  n_groups_ <- n_groups(state2$df)

  time1 <- state1$coords %>%
    mutate(Time = 1)

  if (!tibble::has_name(time1, "Row_Ungrouped_Coord")) {
    time1 <- time1 %>%
      mutate(Row_Ungrouped_Coord = .data$Row_Coord)
  }

  color_tbl <- state2$df %>%
    select(any_of(group_vars(state2$df))) %>%
    map(as.factor) %>%
    map(as.numeric) %>%
    map(~ scales::hue_pal()(max(.x))[.x]) %>%
    as_tibble()

  time2 <- time1 %>%
    mutate(Color = map2(.data$Col, .data$Row, ~ color_tbl[[colnames(state2$df)[.x]]][.y]) %>%
      map_chr(~ if_else(is.null(.x), "#C0C0C0", .x))) %>%
    arrange(.data$Row, .data$Col, .data$Time) %>%
    mutate(Time = 2)

  time3 <- time2 %>%
    arrange(.data$Row, .data$Col) %>%
    mutate(Group_Index = rep(state2$df %>% group_indices(), each = n_columns)) %>%
    arrange(.data$Group_Index, .data$Row) %>%
    mutate(Row_Coord = rep(max(.$Row_Coord):min(.$Row_Coord), each = n_columns)) %>%
    mutate(Time = 3) %>%
    mutate(Row_Coord = .data$Row_Coord - (.data$Group_Index - 1))

  anim_data <- bind_rows(
    time1,
    time2,
    time3 %>%
      select(-.data$Group_Index)
  )

  anim <- anim_data %>%
    ggplot(aes(x = .data$Col, y = .data$Row_Coord)) +
    geom_point(aes(color = .data$Color, group = .data$Row_Ungrouped_Coord), shape = "\u25AC", size = 3) +
    scale_color_manual(
      breaks = unique(anim_data$Color),
      values = as.character(unique(anim_data$Color))
    ) +
    theme_zilch()

  if (is.na(anim_title)) {
    anim <- anim + ggtitle(deparse(state1$fitting))
  } else {
    anim <- anim + ggtitle(anim_title)
  }

  anim <- anim +
    transition_states(.data$Time,
      transition_length = 12,
      state_length = 10, wrap = FALSE
    ) +
    ease_aes("cubic-in-out") +
    view_follow(fixed_x = c(-15, 19), fixed_y = c(-5, max(anim_data$Row_Coord)))

  anim_path <- tempfile(fileext = ".gif")
  anim_save(animation = anim, filename = anim_path)

  list(coords = time3, anim_path = anim_path)
}
