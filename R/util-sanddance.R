#' Pad continuous x-axis to look like discrete scale
adjust_scale <- function(range_c) {

  range <- range_c[2] - range_c[1]
  unit <- 1
  padding <- (0.6 * unit - 0.05 * range) / (2 * 0.05 + 1)

  c(range_c[1] - padding, range_c[2] + padding)
}

#' helper function to get_boot_ci
sample_mean <- function(d, i){
  sample <- d[i]
  mean(sample)
}

#' @importFrom boot boot boot.ci
get_boot_ci <- function(d){
  boot_res <- boot(data=d, statistic = sample_mean, R = 1000)
  boot_ci_res <- boot.ci(boot_res, type="norm")$normal
  tibble(
    mean = boot_res$t0,
    .lower = boot_ci_res[2],
    .upper = boot_ci_res[3],
    .width = 0.95
  )
}

#' @param x dataframe
#' @param group_vars symbol: assume that if there's multiple grouping vars, they have been pasted together
#' @param response_var symbol
#' @importFrom rlang set_names
boots_wrapper <- function(x, group_var, response_var){

  grouped_x <- x %>%
    group_by({{ group_var }})

  grouped_x %>%
    group_split() %>%
    set_names(unlist(group_keys(grouped_x))) %>%
    map_dfr(
      ~ get_boot_ci(
        .x %>% pull({{ response_var }})
     ) , .id = as.character(enexpr(group_var))
    )

}
