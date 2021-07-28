test_that("snake properly evaluates the pipeline at each stage", {
  pipeline <- "small_salary %>% group_by(Degree) %>% summarise(mean = mean(Salary))"

  supported_tidy_functions <- c("group_by", "summarize")

  fittings <- pipeline %>%
    parse_pipeline(supported_tidy_functions)

  states <- fittings %>%
    snake()

  expect_equal(states[[1]], small_salary, ignore_attr = TRUE)
  expect_equal(states[[2]], small_salary %>%
    group_by(Degree), ignore_attr = TRUE)
  expect_equal(states[[3]], small_salary %>%
    group_by(Degree) %>%
    summarise(mean = mean(Salary)), ignore_attr = TRUE)
})
