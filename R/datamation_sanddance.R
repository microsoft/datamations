#' Create a tibble datamation
#' @importFrom dplyr any_of arrange bind_rows filter group_by group_size group_split group_vars is_grouped_df left_join mutate n n_groups pull select summarize ungroup group_indices
#' @importFrom gganimate anim_save ease_aes transition_states view_follow
#' @importFrom ggplot2 aes element_blank geom_point ggplot ggtitle scale_color_manual theme
#' @importFrom magick image_read image_write
#' @importFrom purrr accumulate flatten map map2 map2_dbl map2_dfr map_chr map_dbl map_dfr map_if pmap_dbl pmap_dfr reduce
#' @importFrom rlang parse_expr
#' @importFrom stats median
#' @importFrom tibble as_tibble tibble
#' @importFrom magrittr "%>%"
#' @importFrom purrr map map_chr
#' @param pipeline A tidyverse pipeline.
#' @param envir An environment.
#' @param output Path to where gif will be saved.
#' @export
datamation_sanddance <- function(pipeline, envir = rlang::global_env(),
                              output = "output.gif", titles = "",
                              xlim = c(NA, NA), ylim = c(NA, NA), ...) {

  # BEGIN from datamation_tibble.R

  fittings <- pipeline %>%
    parse_expr() %>%
    dismantle()

  data_states <- fittings %>%
    snake(envir = envir)

  if(length(data_states) < 2) {stop("No data transformation detected by datamation_tibble", call. = FALSE)}

  tidy_functions_list <- fittings %>%
    map(as.list) %>%
    map(~ .x[[1]]) %>%
    map_chr(as.character) %>%
    {.[-1]}

  tidy_func_arg <- fittings %>%
    map(as.list) %>%
    map(as.character)

  # ACHTUNG: ungroup not implemented?
  supported_tidy_functions <- c("group_by", "summarize", "summarise")

  map(tidy_functions_list,
      ~ if(!(.x %in% supported_tidy_functions)) {
        stop(paste(.x, "not supported by datamation_tibble"), call. = FALSE)
      })


  # END from datamation_tibble.R

  saveGIF({
    # NEW: assemble function + data + variables
    for (i in 2:length(fittings)){
      data <- data_states[[i-1]]
      verb <- tidy_func_arg[[i]][[1]]
      args <- tidy_func_arg[[i]][[2]]


      call_verb <-
        switch(verb,
               group_by = animate_group_by_sanddance,
               summarise = animate_summarize_mean_sanddance,
               summarize = animate_summarize_mean_sanddance
        )

      call_args <-
        switch(verb,
               group_by = parse_expr(args),
               summarise = parse_expr(args)[[-1]],
               summarize = parse_expr(args)[[-1]]
        )

      caption <-
        switch(verb,
               group_by = titles[i - 1],
               summarise = titles[(i - 1):i],
               summarize = titles[(i - 1):i]
        )

      do.call(call_verb, list(data, call_args, titles=caption, ...))
    }
  }, movie.name=output, interval = 0.1, ani.width = 500, ani.height = 350, ani.res = 100)

}
