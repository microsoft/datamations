test_that("split_pipeline can handle namespaced data", {
  sp <- split_pipeline("palmerpenguins::penguins %>% group_by(species, sex)")
  expect_identical(sp, c("palmerpenguins::penguins", "group_by(species, sex)"))

  sp <- split_pipeline("palmerpenguins::penguins %>% group_by(species, sex) %>% summarise(mean = mean(bill_length_mm))")
  expect_identical(sp, c("palmerpenguins::penguins", "group_by(species, sex)", "summarise(mean = mean(bill_length_mm))"))
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
