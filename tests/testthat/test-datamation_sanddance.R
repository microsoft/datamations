test_that("datamation_sanddance produces a gif as expected", {
  local_edition(3)

  save_gif <- function() {
    path <- tempfile(fileext = ".gif")
    datamation_sanddance("small_salary %>% group_by(Degree) %>% summarize(mean = mean(Salary))", output = path, nframes = 5)
    return(path)
  }
  expect_snapshot_file(save_gif(), "group_degree_mean_salary.gif")
})
