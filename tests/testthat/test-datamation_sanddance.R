test_that("datamation_sanddance returns a frame for the data, one for each group, and two for a summarise step", {
  pipeline <- "penguins %>% group_by(species)"
  specs <- datamation_sanddance(pipeline) %>%
    jsonlite::fromJSON(simplifyDataFrame = FALSE)
  expect_named(specs, c("data", "group_by"))
  expect_length(specs[["data"]], 1)
  expect_length(specs[["group_by"]], 1)

  pipeline <- "penguins %>% group_by(species, island)"
  specs <- datamation_sanddance(pipeline) %>%
    jsonlite::fromJSON(simplifyDataFrame = FALSE)
  expect_named(specs, c("data", "group_by"))
  expect_length(specs[["data"]], 1)
  expect_length(specs[["group_by"]], 2)

  pipeline <- "penguins %>% group_by(species, island, sex)"
  specs <- datamation_sanddance(pipeline) %>%
    jsonlite::fromJSON(simplifyDataFrame = FALSE)
  expect_named(specs, c("data", "group_by"))
  expect_length(specs[["data"]], 1)
  expect_length(specs[["group_by"]], 3)

  pipeline <- "penguins %>% group_by(species, island) %>% summarize(mean = mean(bill_length_mm))"
  specs <- datamation_sanddance(pipeline) %>%
    jsonlite::fromJSON(simplifyDataFrame = FALSE)
  expect_named(specs, c("data", "group_by", "summarize"))
  expect_length(specs[["data"]], 1)
  expect_length(specs[["group_by"]], 2)
  expect_length(specs[["summarize"]], 2)
})

test_that("datamation_sanddance errors when no data transformation is present", {
  expect_error(datamation_sanddance("mtcars"), "data transformation")
})

test_that("datamation_sanddance errors when an unsupported function is passed", {
  expect_error(datamation_sanddance("palmerpenguins::penguins %>% group_by(species) %>% ungroup()"), "not supported by")
})

test_that("Results are identical when data is contained in first function versus when it is piped in as first step", {
  data_piped <- datamation_sanddance("penguins %>% group_by(species, island) %>% summarize(mean = mean(bill_length_mm))")
  data_arg <- datamation_sanddance("group_by(penguins, species, island) %>% summarize(mean = mean(bill_length_mm))")

  expect_identical(data_piped, data_arg)

  data_piped <- datamation_sanddance("palmerpenguins::penguins %>% group_by(species, island) %>% summarize(mean = mean(bill_length_mm))")
  data_arg <- datamation_sanddance("group_by(palmerpenguins::penguins, species, island) %>% summarize(mean = mean(bill_length_mm))")

  expect_identical(data_piped, data_arg)
})

test_that("Results are identical regardless of whether summary operation is named or not", {
  summary_named <- datamation_sanddance("small_salary_data %>% summarize(mean = mean(Salary))")
  summary_not_named <- datamation_sanddance("small_salary_data %>% summarize(mean(Salary))")

  expect_identical(summary_named, summary_not_named)
})
