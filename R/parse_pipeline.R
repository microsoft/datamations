parse_pipeline <- function(pipeline, supported_tidy_functions = c("group_by", "summarize", "summarise")) {
  pipeline %>%
    split_pipeline(supported_tidy_functions = supported_tidy_functions) %>%
    purrr::map(rlang::parse_expr)
}

split_pipeline <- function(pipeline, supported_tidy_functions = c("group_by", "summarize", "summarise")) {
  pipeline %>%
    stringr::str_split("%>%") %>%
    purrr::pluck(1) %>%
    stringr::str_trim()
}
