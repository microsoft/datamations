#' Parse functions from pipeline steps
#'
#' @param fittings List of pipeline steps
parse_functions <- function(fittings) {
  functions <- fittings %>%
    # Splits expressions into the functions and arguments
    purrr::map(as.list) %>%
    # Keeping the functions only
    purrr::map(~ .x[[1]]) %>%
    purrr::map_chr(as.character)

  # Assumes the first element is the data - NOT always the case
  functions[-1]
}
