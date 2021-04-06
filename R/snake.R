#' @export
#' @importFrom tibble as_tibble
#' @importFrom purrr map_if accumulate
#' @importFrom dplyr any_of arrange bind_rows filter group_by group_size group_split group_vars is_grouped_df left_join mutate n n_groups pull select summarize ungroup group_indices
#' @importFrom gganimate anim_save ease_aes transition_states view_follow
#' @importFrom ggplot2 aes element_blank geom_point ggplot ggtitle scale_color_manual theme
#' @importFrom magick image_read image_write
#' @importFrom purrr accumulate map map2 map2_dbl map2_dfr map_chr map_dbl map_dfr map_if pmap_dbl pmap_dfr reduce
#' @importFrom rlang parse_expr
#' @importFrom stats median
#' @importFrom tibble as_tibble tibble
snake <- function(fittings, envir = parent.frame()) {
  c(
    eval(fittings[[1]], envir = envir) %>% as_tibble() %>% list(),
    accumulate(fittings, ~ call("%>%", .x, .y) %>% eval(envir = envir))[-1]
  ) %>% map_if(~(is.data.frame(.x) || is.vector(.x)) && !is_grouped_df(.x), as_tibble)
}
