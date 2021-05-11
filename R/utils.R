#' Build list of limits (for later use of tweening between)
#'
#' @param xlims a vector of x limits
#' @param ylims a vector of y limits
#' @param id_name
#'
#' @return A list of limits, one element for every pair of limits in \code{xlims} and \code{ylims}. Each element is a data frame containing \code{xlim}, \code{ylim}, \code{time} (the same as the element number) and an ID, named as specified in \code{id_name}, that describes if each set of values is the minimum (1) or maximum (2) limit value.
build_limits_list <- function(xlims, ylims, id_name) {
  n_lims <- length(xlims) / 2

  df <- data.frame(
    xlim = xlims,
    ylim = ylims,
    time = rep(1:n_lims, each = 2)
  )

  df[[id_name]] <- rep(c(1, 2), n_lims)

  split(df, df$time)
}
