test_that("datamation_sanddance returns a frame for the data, one for each group, and two for a summarise step", {
  library(palmerpenguins)
  library(dplyr)

  pipeline <- "penguins %>% group_by(species)"
  specs <- datamation_sanddance(pipeline)
  expect_named(specs, c("data", "group_by"))
  expect_length(specs[["data"]], 1)
  expect_length(specs[["group_by"]], 1)

  pipeline <- "penguins %>% group_by(species, island)"
  specs <- datamation_sanddance(pipeline)
  expect_named(specs, c("data", "group_by"))
  expect_length(specs[["data"]], 1)
  expect_length(specs[["group_by"]], 2)

  pipeline <- "penguins %>% group_by(species, island, sex)"
  specs <- datamation_sanddance(pipeline)
  expect_named(specs, c("data", "group_by"))
  expect_length(specs[["data"]], 1)
  expect_length(specs[["group_by"]], 3)

  pipeline <- "penguins %>% group_by(species, island) %>% summarize(mean = mean(bill_length_mm))"
  specs <- datamation_sanddance(pipeline)
  expect_named(specs, c("data", "group_by", "summarize"))
  expect_length(specs[["data"]], 1)
  expect_length(specs[["group_by"]], 2)
  expect_length(specs[["summarize"]], 2)
})

test_that("datamation_sanddance errors when no data transformation is present", {
  expect_error(datamation_sanddance("mtcars"), "data transformation")
})

test_that("datamation_sanddance errors when an unsupported function is passed", {
  expect_error(datamation_sanddance("palmerpenguins::penguins %>% group_by(species) %>% ungroup()", "not supported by"))
})
