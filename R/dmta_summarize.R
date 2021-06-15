#' @importFrom dplyr is_grouped_df mutate n left_join bind_rows select filter group_vars pull group_by summarize group_split arrange ungroup if_else as_tibble tibble
#' @importFrom purrr map2_dfr pmap_dfr pmap_dbl map2_dbl map2_chr flatten map2 map_dfr
#' @importFrom ggplot2 ggplot aes geom_point scale_color_manual ggtitle
#' @importFrom gganimate anim_save ease_aes transition_states view_follow transition_states ease_aes view_follow anim_save
#' @importFrom ggplot2 aes element_blank geom_point ggplot ggtitle scale_color_manual theme
#' @importFrom magick image_read image_write
#' @importFrom purrr accumulate map map2 map2_dbl map2_dfr map_chr map_dbl map_dfr map_if pmap_dbl pmap_dfr reduce
#' @importFrom rlang parse_expr
#' @importFrom stats median

dmta_summarize <- function(state1, state2, dimensions,
                           outline = TRUE, anim_title = NA) {
  # state1 <- current_state; state2 <- next_state; outline = FALSE

  new_columns <- state1$fitting %>%
    as.list()
  new_columns <- names(new_columns[-1])

  vars_that_make_new_cols <- state1$fitting %>%
    as.list()
  vars_that_make_new_cols <- vars_that_make_new_cols[-1] %>%
    map(~ as.list(.x)[-1] %>% as.character())

  col_indices_that_make_new_cols <- colnames(state1$df) %in% (unlist(vars_that_make_new_cols) %>% unique()) %>%
    which()
  col_tbl <- tibble(
    Col_Name = colnames(state1$df),
    Col = seq_along(.data$Col_Name)
  )

  # tibble is not grouped to begin with
  if (!is_grouped_df(state1$df)) {
    summ_offset <- 4

    if (!tibble::has_name(state1$coords, "Row_Coord")) {
      time1 <- state1$coords %>%
        mutate(Time = 1, Row_Coord = .data$Row, ID = 1:n())
    } else {
      time1 <- state1$coords %>%
        mutate(Time = 1, ID = 1:n())
    }

    time1 <- time1 %>%
      mutate(ID = as.character(.data$ID))

    if (outline) {
      color_tbl <- tibble(
        Col = c(col_indices_that_make_new_cols, (1:length(state1$df))[-col_indices_that_make_new_cols]),
        Fill = c(
          rep("#000000", length(col_indices_that_make_new_cols)),
          rep("#C0C0C0", (1:length(state1$df))[-col_indices_that_make_new_cols] %>% length())
        )
      )

      time2 <- time1 %>%
        mutate(Time = 2) %>%
        left_join(color_tbl)
    } else {
      time2 <- time1 %>%
        mutate(Time = 2)
    }

    mid_point <- state1$df %>%
      nrow()
    mid_point <- median(1:mid_point)

    mover_data <- map(new_columns, ~ vars_that_make_new_cols[[.x]]) %>%
      map2_dfr(1:length(.), ~ tibble(Col_Name = .x, Summary_Col = .y)) %>%
      # mutate(Time = 1:n() + 2) %>%
      mutate(Time = .data$Summary_Col + 2) %>%
      left_join(col_tbl)

    append_to_time2 <- mover_data %>%
      pmap_dfr(~ time2 %>%
        filter(Col == ..4) %>%
        mutate(ID = paste0(.data$ID, "M", ..3)) %>%
        mutate(When = ..3))

    movements <- list()

    for (i in seq_along(mover_data$Time %>% unique())) {
      result <- append_to_time2 %>%
        mutate(Time = unique(mover_data$Time)[i]) %>%
        mutate(Row_Coord = as.numeric(.data$Row_Coord)) %>%
        mutate(Row_Coord = pmap_dbl(
          list(.data$Time, .data$When, .data$Col_Coord),
          F ~ if_else(..1 == ..2, mid_point, ..3)
        )) %>%
        mutate(Col_Coord = pmap_dbl(
          list(.data$Time, .data$When, .data$Col_Coord),
          ~ if_else(..1 == ..2, unique(mover_data$Summary_Col)[i] + length(state1$df), ..3)
        )) %>%
        mutate(Moved = .data$Time == .data$When) %>%
        mutate(Col_Coord = map2_dbl(.data$Moved, .data$Col_Coord, ~ if_else(.x, .y + summ_offset, .y))) %>%
        mutate(Color = map2_chr(.data$Moved, .data$Color, ~ if_else(.x, "#C0C0C0", .y)))

      movements[[i]] <- result
    }

    movements <- movements %>%
      map(~ .x %>%
        group_by(.data$When) %>%
        group_split()) %>%
      flatten()

    move_matrix <- matrix(1:length(movements), ncol = sqrt(length(movements)), byrow = TRUE)
    move_matrix[lower.tri(move_matrix)] <- 0

    for (row in 1:nrow(move_matrix)) {
      for (col in 1:ncol(move_matrix)) {
        if (move_matrix[row, col] == 0) {
          move_matrix[row, col] <- max(move_matrix[, col])
        }
      }
    }

    movements <- map(1:nrow(move_matrix), ~ movements[move_matrix[.x, ]]) %>%
      map2(mover_data$Time %>% unique(), ~ bind_rows(.x) %>% mutate(Time = .y))

    anim_data <- bind_rows(
      time1,
      time2 %>% bind_rows(append_to_time2 %>% select(-.data$When)),
      map_dfr(mover_data$Time, ~ time2 %>% mutate(Time = .x)),
      movements %>% bind_rows() %>% select(-.data$When, -.data$Moved)
    )

    end_of_summ_time <- max(anim_data$Time)
    after_summ <- list()

    after_summ[[1]] <- anim_data %>%
      filter(.data$Time == end_of_summ_time) %>%
      mutate(Color = map_chr(.data$ID, ~ if_else(grepl("M", .x), "#C0C0C0", "#FFFFFF"))) %>%
      mutate(Time = .data$Time + 1)

    after_summ[[2]] <- after_summ[[1]] %>%
      filter(.data$Col_Coord > length(state1$df)) %>%
      mutate(
        Row_Coord = max(state1$coords$Row_Coord),
        Col_Coord = .data$Col_Coord - (length(state1$df) + summ_offset)
      ) %>%
      mutate(Time = .data$Time + 1)

    anim_data <- bind_rows(
      anim_data,
      after_summ %>% bind_rows()
    )

    anim <- anim_data %>%
      ggplot(aes(x = .data$Col_Coord, y = .data$Row_Coord)) +
      geom_point(aes(color = .data$Color, group = .data$ID), shape = 15, size = 3) +
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
      view_follow(fixed_x = c(-15, 19), fixed_y = c(-5, max(anim_data$Row_Coord)))

    anim_path <- tempfile(fileext = ".gif")
    anim_save(animation = anim, filename = anim_path)

    return(list(
      coords = make_coords(state2$df, row_ceiling = dimensions$ymax) %>% mutate(Color = "#C0C0C0"),
      anim_path = anim_path
    ))
  } else {
    summ_offset <- 4 + length(state1$df %>% group_vars())

    time1 <- state1$coords %>%
      mutate(Time = 1, ID = 1:n()) %>%
      mutate(ID = as.character(.data$ID))

    grouping_cols <- time1 %>%
      filter(.data$Color != "#C0C0C0") %>%
      pull(.data$Col) %>%
      unique()

    # color_tbl <- tibble(
    #   Col = col_indices_that_make_new_cols,
    #   New_Color = RColorBrewer::brewer.pal(8, "Set3")[seq_along(col_indices_that_make_new_cols)]
    # )

    time2 <- time1 %>%
      mutate(Time = 2)

    # %>%
    #   left_join(color_tbl) %>%
    #   mutate(New_Color = map_chr(New_Color, ~ if_else(is.na(.x), "#C0C0C0", .x))) %>%
    #   mutate(Color = map2_chr(Color, New_Color, ~ if_else(.x == "#C0C0C0", .y, .x))) %>%
    #   select(-New_Color)

    summ_rows <- state1$coords %>%
      group_by(.data$Group_Index) %>%
      summarize(Row_Coord = mean(.data$Row_Coord))

    mover_data <- map(new_columns, ~ vars_that_make_new_cols[[.x]]) %>%
      map2_dfr(1:length(.), ~ tibble(Col_Name = .x, Summary_Col = .y)) %>%
      # mutate(Time = 1:n() + 2) %>%
      mutate(Time = .data$Summary_Col + 2) %>%
      left_join(col_tbl)

    append_to_time2 <- mover_data %>%
      pmap_dfr(~ time2 %>%
        filter(Col == ..4) %>%
        mutate(ID = paste0(.data$ID, "M", ..3)) %>%
        mutate(When = ..3))

    movements <- list()

    for (i in seq_along(mover_data$Time %>% unique())) {
      result <- append_to_time2 %>%
        mutate(Time = unique(mover_data$Time)[i]) %>%
        mutate(Row_Coord = as.numeric(.data$Row_Coord)) %>%
        mutate(Row_Coord = pmap_dbl(
          list(.data$Time, .data$When, .data$Row_Coord, .data$Group_Index),
          ~ if_else(..1 == ..2, summ_rows$Row_Coord[..4], ..3)
        )) %>%
        mutate(Col_Coord = pmap_dbl(
          list(.data$Time, .data$When, .data$Col_Coord),
          ~ if_else(..1 == ..2, unique(mover_data$Summary_Col)[i] + length(state1$df), ..3)
        )) %>%
        mutate(Moved = .data$Time == .data$When) %>%
        mutate(Col_Coord = map2_dbl(.data$Moved, .data$Col_Coord, ~ if_else(.x, .y + summ_offset, .y))) %>%
        mutate(Color = map2_chr(.data$Moved, .data$Color, ~ if_else(.x, "#C0C0C0", .y)))

      movements[[i]] <- result
    }

    movements <- movements %>%
      map(~ .x %>%
        group_by(.data$When) %>%
        group_split()) %>%
      flatten()

    move_matrix <- matrix(1:length(movements), ncol = sqrt(length(movements)), byrow = TRUE)
    move_matrix[lower.tri(move_matrix)] <- 0

    for (row in 1:nrow(move_matrix)) {
      for (col in 1:ncol(move_matrix)) {
        if (move_matrix[row, col] == 0) {
          move_matrix[row, col] <- max(move_matrix[, col])
        }
      }
    }

    movements <- map(1:nrow(move_matrix), ~ movements[move_matrix[.x, ]]) %>%
      map2(mover_data$Time %>% unique(), ~ bind_rows(.x) %>% mutate(Time = .y))

    anim_data <- bind_rows(
      time1,
      time2 %>% bind_rows(append_to_time2 %>% select(-.data$When)),
      map_dfr(mover_data$Time, ~ time2 %>% mutate(Time = .x)),
      movements %>% bind_rows() %>% select(-.data$When, -.data$Moved)
    )

    end_of_summ_time <- max(anim_data$Time)
    after_summ <- list()

    after_summ[[1]] <- anim_data %>%
      filter(.data$Time == end_of_summ_time) %>%
      mutate(Color = map_chr(.data$ID, ~ if_else(grepl("M", .x), "#C0C0C0", "#FFFFFF"))) %>%
      mutate(Time = .data$Time + 1)

    after_summ[[2]] <- after_summ[[1]] %>%
      filter(.data$Col_Coord > length(state1$df)) %>%
      mutate(
        Row_Coord = map_dbl(.data$Group_Index, ~ seq(max(state1$coords$Row_Coord), 0)[summ_rows$Group_Index][.x]),
        Col_Coord = .data$Col_Coord - (length(state1$df) + summ_offset)
      ) %>%
      mutate(Col_Coord = .data$Col_Coord + length(state1$df %>% group_vars())) %>%
      mutate(Time = .data$Time + 1)

    anim_data <- bind_rows(
      anim_data,
      after_summ %>% bind_rows()
    )

    # Group_Index Col Name Color
    column_group_info <- state1$coords %>%
      select(.data$Color, .data$Row_Coord, .data$Col_Coord, .data$Group_Index, .data$Col) %>%
      unique() %>%
      filter(.data$Color != "#C0C0C0") %>%
      select(-.data$Row_Coord) %>%
      group_by(.data$Group_Index, .data$Col_Coord) %>%
      group_split() %>%
      map(unique) %>%
      bind_rows() %>%
      left_join(
        tibble(
          Col = state1$df %>%
            group_vars() %>%
            map(~ .x == colnames(state1$df)) %>%
            map_dbl(which)
        ) %>%
          mutate(LTR_Order = 1:n()) %>%
          left_join(col_tbl)
      ) %>%
      arrange(.data$LTR_Order, .data$Group_Index) %>%
      left_join(summ_rows)

    group_timing <- list()

    group_timing[[2]] <- column_group_info %>%
      mutate(Col_Coord = .data$LTR_Order) %>%
      mutate(Col_Coord = .data$Col_Coord + length(state1$df) + 4) %>%
      mutate(ID = 1:n()) %>%
      mutate(ID = paste0(.data$ID, "G")) %>%
      select(.data$Color, .data$Row_Coord, .data$Col_Coord, .data$Group_Index, .data$ID) %>%
      mutate(Time = 2)

    group_timing[[1]] <- group_timing[[2]] %>%
      mutate(Time = 1, Color = "#FFFFFF")

    times <- anim_data$Time %>%
      unique() %>%
      sort()
    times <- times[c(-1, -2, -length(times))]

    for (i in times) {
      group_timing[[i]] <- group_timing[[2]] %>%
        mutate(Time = i)
    }

    group_timing[[max(anim_data$Time)]] <- group_timing[[2]] %>%
      mutate(Color = "#C0C0C0") %>%
      mutate(Row_Coord = map_dbl(.data$Group_Index, ~ seq(max(state1$coords$Row_Coord), 0)[summ_rows$Group_Index][.x])) %>%
      mutate(Col_Coord = .data$Col_Coord - (length(state1$df) + 4)) %>%
      mutate(Time = max(anim_data$Time))

    anim_data <- bind_rows(
      anim_data,
      group_timing %>% bind_rows()
    )

    anim <- anim_data %>%
      ggplot(aes(x = .data$Col_Coord, y = .data$Row_Coord)) +
      geom_point(aes(color = .data$Color, group = .data$ID), shape = "\u25AC", size = 3) +
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

    if (!is_grouped_df(state2$df)) {
      return(list(
        coords = make_coords(state2$df, row_ceiling = dimensions$ymax) %>% mutate(Color = "#C0C0C0"),
        anim_path = anim_path
      ))
    } else {
      last_coords <- anim_data %>%
        filter(.data$Time == max(anim_data$Time)) %>%
        {
          map_coords(unique(.$Row_Coord), unique(.$Col_Coord))
        } %>%
        mutate(Color = "#C0C0C0")

      # select(Color, Row, Col, Row_Coord, Col_Coord) %>%
      # arrange(Row, Col) %>%
      # mutate(Color = "#C0C0C0") %>%
      # filter(!is.na(Row), !is.na(Col))

      result <- dmta_group_by(list(
        df = state2$df %>% ungroup(),
        coords = last_coords
      ), state2,
      anim_title = paste("Re-grouping by", paste(state2$df %>% group_vars(), collapse = ", ")),
      dimensions = dimensions
      )
      return(list(coords = result$coords, anim_path = c(anim_path, result$anim_path)))
    }
  }
}
