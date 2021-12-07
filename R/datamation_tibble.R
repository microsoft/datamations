#' Create a tibble datamation
#' @importFrom dplyr any_of arrange bind_rows filter group_by group_size group_split group_vars is_grouped_df left_join mutate n n_groups pull select summarize ungroup group_indices
#' @importFrom gganimate anim_save ease_aes transition_states view_follow
#' @importFrom ggplot2 aes element_blank geom_point ggplot ggtitle scale_color_manual theme
#' @importFrom magick image_read image_write
#' @importFrom purrr accumulate map map2 map2_dbl map2_dfr map_chr map_dbl map_dfr map_if pmap_dbl pmap_dfr reduce
#' @importFrom rlang parse_expr
#' @importFrom stats median
#' @importFrom tibble as_tibble tibble
#' @importFrom magrittr "%>%"
#' @importFrom purrr map map_chr
#' @importFrom rlang parse_expr
#' @param pipeline A tidyverse pipeline.
#' @param envir An environment.
#' @param output Path to where gif will be saved.
#' @param titles Optional titles for the datamation frames
#' @param xlim Optional x limits
#' @param ylim Optional y limits
#' @export
datamation_tibble <- function(pipeline, envir = rlang::global_env(),
                              output = "output.gif", titles = NA,
                              xlim = c(NA, NA), ylim = c(NA, NA)) {

  # Specify which functions are supported, for parsing functions out and for erroring if any are not in this list
  supported_tidy_functions <- c("group_by", "summarize", "filter")

  # Convert pipeline into list
  fittings <- pipeline %>%
    parse_pipeline(supported_tidy_functions)

  data_states <- fittings %>%
    snake(envir = envir)

  if (length(data_states) < 2) {
    stop("No data transformation detected by datamation_tibble", call. = FALSE)
  }

  tidy_functions_list <- fittings %>%
    map(as.list) %>%
    map(~ .x[[1]]) %>%
    map_chr(as.character)

  tidy_functions_list <- tidy_functions_list[-1]

  supported_tidy_functions <- c("group_by", "ungroup", "summarize", "summarise", "filter")

  map(tidy_functions_list, ~ if (!(.x %in% supported_tidy_functions)) {
    stop(paste(.x, "not supported by datamation_tibble"), call. = FALSE)
  })

  anim_list <- list()
  dimensions <- list(
    xmin = xlim[1],
    xmax = xlim[2],
    ymin = ylim[1],
    ymax = ylim[2]
  )

  current_state <- list(
    df = data_states[[1]],
    fitting = fittings[[2]],
    title_state = list(titles = titles, current_title = 1),
    coords = make_coords(data_states[[1]],
      row_ceiling = dimensions$ymax
    ) %>%
      mutate(Color = "#C0C0C0")
  )
  next_state <- list(df = data_states[[2]])

  for (i in 1:(length(data_states) - 1)) {
    if (tidy_functions_list[i] == "group_by") {
      result <- dmta_group_by(current_state, next_state,
        dimensions = dimensions, anim_title = titles[i]
      )
      anim_list <- c(anim_list, result$anim_path)
      current_state <- result
      current_state[["df"]] <- data_states[[i + 1]]
      if (length(data_states) >= i + 2) {
        current_state[["fitting"]] <- fittings[[i + 2]]
        next_state <- list(df = data_states[[i + 2]])
      }
    } else if (tidy_functions_list[i] == "ungroup") {
      result <- dmta_ungroup(current_state, next_state,
        dimensions = dimensions,
        anim_title = titles[i]
      )
      anim_list <- c(anim_list, result$anim_path)
      current_state <- result
      current_state[["df"]] <- data_states[[i + 1]]
      if (length(data_states) >= i + 2) {
        current_state[["fitting"]] <- fittings[[i + 2]]
        next_state <- list(df = data_states[[i + 2]])
      }
    } else if (tidy_functions_list[i] %in% c("summarize", "summarise")) {
      result <- dmta_summarize(current_state, next_state,
        dimensions = dimensions, anim_title = titles[i]
      )
      anim_list <- c(anim_list, result$anim_path)
      current_state <- result
      current_state[["df"]] <- data_states[[i + 1]]
      if (length(data_states) >= i + 2) {
        current_state[["fitting"]] <- fittings[[i + 2]]
        next_state <- list(df = data_states[[i + 2]])
      }
    }
  }

  anim_list <- unlist(anim_list)
  if (length(anim_list) == 1) {
    file.copy(anim_list[[1]], output, overwrite = TRUE)
  } else if (length(anim_list > 1)) {
    suppressWarnings(cat_gifs(anim_list, output = output))
  }

  invisible(output)
}
