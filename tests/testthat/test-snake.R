test_that("snake properly evaluates the pipeline at each stage", {
  pipeline <- "small_salary %>% group_by(Degree) %>% summarise(mean = mean(Salary))"

  fittings <- pipeline %>%
    parse_expr() %>%
    dismantle()

  states <- fittings %>%
    snake()

  expect_equivalent(states[[1]], small_salary)
  expect_equivalent(states[[2]], small_salary %>%
    group_by(Degree))
  expect_equivalent(states[[3]], small_salary %>%
    group_by(Degree) %>%
    summarise(mean = mean(Salary)))
})
