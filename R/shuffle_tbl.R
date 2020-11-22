#' @export
shuffle_tbl <- function(df) {
  df[sample(1:nrow(df)),]
}
