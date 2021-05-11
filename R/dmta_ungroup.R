#' @importFrom dplyr is_grouped_df mutate select arrange bind_rows
#' @importFrom ggplot2 ggplot aes geom_point scale_color_manual ggtitle
#' @importFrom gganimate transition_states ease_aes view_follow anim_save
#' @importFrom dplyr any_of arrange bind_rows filter group_by group_size group_split group_vars is_grouped_df left_join mutate n n_groups pull select summarize ungroup group_indices
#' @importFrom gganimate anim_save ease_aes transition_states view_follow
#' @importFrom ggplot2 aes element_blank geom_point ggplot ggtitle scale_color_manual theme
#' @importFrom magick image_read image_write
#' @importFrom purrr accumulate map map2 map2_dbl map2_dfr map_chr map_dbl map_dfr map_if pmap_dbl pmap_dfr reduce
#' @importFrom rlang parse_expr
#' @importFrom stats median
#' @importFrom tibble as_tibble tibble
dmta_ungroup <- function(state1, state2, dimensions, anim_title = NA) {
  # tibble is not grouped to begin with
  if (!is_grouped_df(state1$df)) {
    if (!tibble::has_name(state1$coords, "Row_Coord")) {
      time1 <- state1$coords %>%
        mutate(Time = 1, Row_Coord = .data$Row)
    } else {
      time1 <- state1$coords %>%
        mutate(Time = 1)
    }

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

  # tibble is grouped
  time1 <- state1$coords %>%
    mutate(Time = 1)

  time2 <- state1$coords %>%
    mutate(Time = 2, Color = "#C0C0C0")

  time3 <- state1$coords %>%
    mutate(Time = 3, Row_Coord = .data$Row_Ungrouped_Coord, Color = "#C0C0C0")

  anim_data <- bind_rows(
    time1,
    time2,
    time3
  )

  anim <- anim_data %>%
    ggplot(aes(x = .data$Col, y = .data$Row_Coord)) +
    geom_point(aes(color = .data$Color, group = .data$Row_Ungrouped_Coord), shape = 15, size = 3) +
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
    view_follow(fixed_x = c(-15, 19), fixed_y = c(-5, 34))

  anim_path <- tempfile(fileext = ".gif")
  anim_save(animation = anim, filename = anim_path)

  list(coords = time3 %>%
    mutate(Row = .data$Row_Ungrouped_Coord, Row_Coord = .data$Row_Ungrouped_Coord) %>%
    select(.data$Color, .data$Row, .data$Col, .data$Row_Coord, .data$Col_Coord) %>%
    arrange(.data$Row, .data$Col), anim_path = anim_path)
}
