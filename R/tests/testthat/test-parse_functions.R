test_that("parse_functions identifies functions used in a pipeline", {
  pipeline <- "small_salary %>% group_by(Degree) %>% summarise(mean = mean(Salary))"

  fittings <- pipeline %>%
    parse_pipeline()

  functions <- parse_functions(fittings)

  expect_equal(functions, c("data", "group_by", "summarize"))
})

test_that("parse_functions properly identifies when the first pipe in a pipeline contains the data, and still grabs the function", {
  pipeline <- "group_by(small_salary, Degree) %>% summarise(mean = mean(Salary))"

  fittings <- pipeline %>%
    parse_pipeline()

  functions <- parse_functions(fittings)

  expect_equal(functions, c("data", "group_by", "summarize"))
})
