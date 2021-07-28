#' Concatenate GIFs
#'
#' @param paths A vector of paths to `.gif` files.
#' @param output A path where the GIF will be written.
#' @importFrom magick image_read image_write
#' @importFrom purrr map reduce
#' @importFrom magrittr "%>%"
#' @noRd
#' @examples
#' \dontrun{
#'
#' library(ggplot2)
#' library(gganimate)
#' library(tibble)
#' library(dplyr)
#'
#' mt_animate <- mtcars %>%
#'   tibble::as_tibble() %>%
#'   dplyr::mutate(Row = row_number())
#'
#' part1 <- mt_animate %>%
#'   dplyr::filter(Row < 17)
#'
#' part2 <- mt_animate %>%
#'   dplyr::filter(Row >= 17)
#'
#' temp_dir <- tempdir()
#'
#' part1 %>%
#'   ggplot(aes(mpg, hp)) +
#'   geom_point() +
#'   labs(title = "Row: {frame_time}") +
#'   transition_time(Row) +
#'   ease_aes("linear")
#'
#' anim_save(filename = file.path(temp_dir, "part1.gif"))
#'
#' part2 %>%
#'   ggplot(aes(mpg, hp)) +
#'   geom_point() +
#'   labs(title = "Row: {frame_time}") +
#'   transition_time(Row) +
#'   ease_aes("linear")
#'
#' anim_save(filename = file.path(temp_dir, "part2.gif"))
#'
#' cat_gifs(
#'   c(
#'     file.path(temp_dir, "part1.gif"),
#'     file.path(temp_dir, "part2.gif")
#'   )
#' )
#' }
cat_gifs <- function(paths, output = "output.gif") {
  paths %>%
    map(image_read) %>%
    reduce(c) %>%
    image_write(output)

  invisible(output)
}
