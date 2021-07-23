#' Parse functions from pipeline steps
#'
#' @param fittings List of pipeline steps
#' @noRd
parse_functions <- function(fittings) {
  functions <- fittings %>%
    # Splits expressions into the functions and arguments
    purrr::map(as.list) %>%
    # Keeping the functions only
    purrr::map(~ .x[[1]]) %>%
    purrr::map_chr(as.character)

  # Rename the first "function" to just be data
  functions[1] <- "data"

  functions
}

#' Parse ggplot2 code for validity
#'
#' @param ggplot2_fittings List of ggplot2 steps
#' @noRd
parse_ggplot2_code <- function(ggplot2_fittings) {

  ## Facet wrap
  contains_facet_wrap <- purrr::map_lgl(ggplot2_fittings, function(x) {
    stringr::str_detect(x, "facet_wrap")
  }) %>%
    any()

  if (contains_facet_wrap) {
    stop("datamations does not support `facet_wrap()`. Please use `facet_grid()` if you would like to see a faceted datamation.", call. = FALSE)
  }

  ## geom other than geom_point()
  contains_geom_not_point <- purrr::map_lgl(ggplot2_fittings, function(x) {
    stringr::str_detect(x, "geom") & !stringr::str_detect(x, "geom_point")
  }) %>%
    any()

  if (contains_geom_not_point) {
    stop("datamations with ggplot2 code only supports `geom_point()`.", call. = FALSE)
  }

  ## No geom_point
  doesnt_contain_geom_point <- purrr::map_lgl(ggplot2_fittings, function(x) {
    !stringr::str_detect(x, "geom_point")
  }) %>%
    all()

  if (doesnt_contain_geom_point) {
    stop("datamations using ggplot2 code requires a call to `geom_point()`.", call. = FALSE)
  }
}
