
#' export all the gifs
#' @importFrom animation saveGIF
export_gifs <- function(df) {
  
  
  # Degree -- two groups 
  saveGIF({
    df %>%
      animate_group_by_sanddance(Degree, nframes = 30, is_last = TRUE) 
  }, movie.name="Degree_two_colors_groupby.gif", interval = 0.1, 
  ani.width = 500, ani.height = 350, ani.res = 100)
  
  
  saveGIF({
    df %>%
      group_by(Degree) %>%
      animate_summarize_mean_sanddance(Salary, nframes = 30, output = "first")
  }, movie.name="Degree_two_colors_summarizemean_step1.gif", interval = 0.1, 
  ani.width = 500, ani.height = 350, ani.res = 100)
  
  saveGIF({
    df %>%
      group_by(Degree) %>%
      animate_summarize_mean_sanddance(Salary, nframes = 30, output = "second")
  }, movie.name="Degree_two_colors_summarizemean_step2.gif", interval = 0.1, 
  ani.width = 500, ani.height = 350, ani.res = 100)
  
  saveGIF({
    df %>%
      group_by(Degree) %>%
      animate_summarize_mean_sanddance(Salary, nframes = 30)
  }, movie.name="Degree_two_colors_summarizemean.gif", interval = 0.1, 
  ani.width = 500, ani.height = 350, ani.res = 100)
  
  
  saveGIF({
    df %>%
      animate_group_by_sanddance(Degree, nframes = 30) %>%
      animate_summarize_mean_sanddance(Salary, nframes = 30)
  }, movie.name="Degree_two_colors.gif", interval = 0.1, 
  ani.width = 500, ani.height = 350, ani.res = 100)
  
  print("half done")
  
  
  # ======== Degree and Work, four groups
  
  
  saveGIF({
    df %>%
      animate_group_by_sanddance(Degree, Work, nframes = 30, is_last = TRUE)
  }, movie.name="Work_Degree_two_colors_groupby.gif", interval = 0.1, 
  ani.width = 500, ani.height = 350, ani.res = 100)
  
  saveGIF({
    df %>%
      group_by(Degree, Work) %>%
      animate_summarize_mean_sanddance(Salary, nframes = 30, output = "first")
  }, movie.name="Work_Degree_two_colors_summarizemean_step1.gif", interval = 0.1, 
  ani.width = 500, ani.height = 350,
  ani.res = 100)
  
  saveGIF({
    df %>%
      group_by(Degree, Work) %>%
      animate_summarize_mean_sanddance(Salary, nframes = 30, output = "second")
  }, movie.name="Work_Degree_two_colors_summarizemean_step2.gif", interval = 0.1, 
  ani.width = 500, ani.height = 350,
  ani.res = 100)
  
  saveGIF({
    df %>%
      group_by(Degree, Work) %>%
      animate_summarize_mean_sanddance(Salary, nframes = 30)
  }, movie.name="Work_Degree_two_colors_summarizemean.gif", interval = 0.1, 
  ani.width = 500, ani.height = 350,
  ani.res = 100)
  
  saveGIF({
    df %>%
      animate_group_by_sanddance(Degree, Work, nframes = 30) %>%
      animate_summarize_mean_sanddance(Salary, nframes = 30)
  }, movie.name="Work_Degree_two_colors.gif", interval = 0.1, 
  ani.width = 500, ani.height = 350, ani.res= 100)
  
  print("done")
  
}







#' Pad continuous x-axis to look like discrete scale
#' @references 
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