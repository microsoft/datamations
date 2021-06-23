#' Evaluate each pipeline step
#'
#' @param fittings Pipeline steps
#' @param envir Evaluation environment
#' @noRd
snake <- function(fittings, envir = parent.frame()) {
  c(
    eval(fittings[[1]], envir = envir) %>%
      dplyr::as_tibble() %>%
      list(),
    suppressMessages(purrr::accumulate(fittings, ~ call("%>%", .x, .y) %>% eval(envir = envir))[-1])
  ) %>%
    purrr::map_if(~ (is.data.frame(.x) || is.vector(.x)) && !dplyr::is_grouped_df(.x), dplyr::as_tibble)
}
