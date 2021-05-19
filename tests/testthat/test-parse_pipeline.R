test_that("split_pipeline can handle namespaced data", {
  sp <- split_pipeline("palmerpenguins::penguins %>% group_by(species, sex)")
  expect_identical(sp, c("palmerpenguins::penguins", "group_by(species, sex)"))

  sp <- split_pipeline("palmerpenguins::penguins %>% group_by(species, sex) %>% summarize(mean = mean(bill_length_mm))")
  expect_identical(sp, c("palmerpenguins::penguins", "group_by(species, sex)", "summarize(mean = mean(bill_length_mm))"))
})

test_that("split_pipeline splits by the pipe", {
  sp <- split_pipeline("mtcars %>% group_by(vs, am)")
  expect_identical(sp, c("mtcars", "group_by(vs, am)"))
})

test_that("split_pipeline can split code across multiple lines", {
  sp <- split_pipeline("
                       mtcars %>%
                       group_by(vs, am)
                       ")
  expect_identical(sp, c("mtcars", "group_by(vs, am)"))
})

test_that("split_pipeline can handle the data being contained in the first function, and splits it out properly into its own step", {
  sp <- split_pipeline("group_by(small_salary, Degree, Work)")
  expect_identical(sp, c("small_salary", "group_by( Degree, Work)"))

  sp <- split_pipeline("group_by(small_salary, Degree) %>% summarize(mean = mean(x))")
  expect_identical(sp, c("small_salary", "group_by( Degree)", "summarize(mean = mean(x))"))

  sp <- split_pipeline("summarize(small_salary, mean = mean(x))")
  expect_identical(sp, c("small_salary", "summarize( mean = mean(x))"))
})

test_that("split_pipeline can handle data in first function, when data is namespaced from package", {
  sp <- split_pipeline("summarize(palmerpenguins::penguins, mean = mean(x))")
  expect_identical(sp, c("palmerpenguins::penguins", "summarize( mean = mean(x))"))
})

test_that("split_pipeline errors if first element is function, but there is no data", {
  expect_error(split_pipeline("group_by(species)"), "No data detected")
  expect_error(split_pipeline("group_by(species, island)"), "No data detected")
})

test_that("split_pipeline errors if first element is a function containing data, but it is not a data frame", {
  df <- list(palmerpenguins::penguins)
  expect_error(split_pipeline("group_by(df, species)"), "not a data frame")
})

test_that("split_pipeline converts summarise to summarize", {
  sp <- split_pipeline("mtcars %>% summarise(mean = mean(gear))")
  expect_identical(sp, c("mtcars", "summarize(mean = mean(gear))"))
})
