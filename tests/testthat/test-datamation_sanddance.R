library(ggplot2)

test_that("datamation_sanddance returns a frame for the data, one for each group, and three or four for summarize (three if the summary function is not mean, and four if it is - includes an errorbar frame too)", {
  pipeline <- "penguins %>% group_by(species)"
  specs <- datamation_sanddance(pipeline) %>%
    purrr::pluck("x") %>%
    purrr::pluck("specs") %>%
    jsonlite::fromJSON(simplifyDataFrame = FALSE)
  expect_length(specs, 2)

  pipeline <- "penguins %>% group_by(species, island)"
  specs <- datamation_sanddance(pipeline) %>%
    purrr::pluck("x") %>%
    purrr::pluck("specs") %>%
    jsonlite::fromJSON(simplifyDataFrame = FALSE)
  expect_length(specs, 3)

  pipeline <- "penguins %>% group_by(species, island, sex)"
  specs <- datamation_sanddance(pipeline) %>%
    purrr::pluck("x") %>%
    purrr::pluck("specs") %>%
    jsonlite::fromJSON(simplifyDataFrame = FALSE)
  expect_length(specs, 4)

  pipeline <- "penguins %>% group_by(species, island) %>% summarize(median = median(bill_length_mm))"
  specs <- datamation_sanddance(pipeline) %>%
    purrr::pluck("x") %>%
    purrr::pluck("specs") %>%
    jsonlite::fromJSON(simplifyDataFrame = FALSE)
  expect_length(specs, 6)

  pipeline <- "penguins %>% group_by(species, island) %>% summarize(mean = mean(bill_length_mm))"
  specs <- datamation_sanddance(pipeline) %>%
    purrr::pluck("x") %>%
    purrr::pluck("specs") %>%
    jsonlite::fromJSON(simplifyDataFrame = FALSE)
  expect_length(specs, 7)
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

  # data_piped <- datamation_sanddance("palmerpenguins::penguins %>% group_by(species, island) %>% summarize(mean = mean(bill_length_mm))")
  # data_arg <- datamation_sanddance("group_by(palmerpenguins::penguins, species, island) %>% summarize(mean = mean(bill_length_mm))")

  # expect_identical(data_piped, data_arg)
})

test_that("Results are identical regardless of whether summary operation is named or not", {
  summary_named <- datamation_sanddance("small_salary %>% summarize(mean = mean(Salary))")
  summary_not_named <- datamation_sanddance("small_salary %>% summarize(mean(Salary))")

  expect_identical(summary_named, summary_not_named)
})

test_that("datamation_sanddance returns an htmlwidget", {
  widget <- datamation_sanddance("penguins %>% group_by(species, island) %>% summarize(mean = mean(bill_length_mm))")
  expect_s3_class(widget, "htmlwidget")
})

test_that("datamation_sanddance errors if facet_wrap is used", {
  expect_error(
    "small_salary %>%
  group_by(Work, Degree) %>%
  summarize(mean_salary = median(Salary)) %>%
  ggplot() +
  geom_point(aes(x = Work, y = mean_salary, color = Degree)) +
facet_wrap(vars(Degree))" %>%
      datamation_sanddance(),
    "does not support `facet_wrap"
  )
})

test_that("datamation_sanddance errors on non-geom_point", {
  expect_error(
    "small_salary %>%
  group_by(Work) %>%
  summarize(mean_salary = median(Salary)) %>%
  ggplot() +
  geom_col(aes(x = Work, y = mean_salary))" %>%
      datamation_sanddance(),
    "only supports `geom_point"
  )
})

test_that("datamation_sanddance requires a call to geom_point", {
  expect_error("small_salary %>%
    group_by(Work) %>%
    summarize(mean_salary = median(Salary)) %>%
    ggplot(aes(x = Work, y = mean_salary))" %>% datamation_sanddance(), "requires a call to `geom_point")
})

# Python specs ----

test_that("python specs are identical to R specs", {

  # One grouping variable ----

  python_specs <- jsonlite::fromJSON(system.file("specs/groupby_work.json", package = "datamations"), simplifyDataFrame = FALSE)

  r_specs <- "small_salary %>% group_by(Work) %>% summarise(mean = mean(Salary))" %>%
    datamation_sanddance() %>%
    purrr::pluck("x") %>%
    purrr::pluck("specs") %>%
    jsonlite::fromJSON(simplifyDataFrame = FALSE)

  expect_python_identical_to_r(python_specs, r_specs)

  # Two grouping variables ----

  python_specs <- jsonlite::fromJSON(system.file("specs/groupby_work_degree.json", package = "datamations"), simplifyDataFrame = FALSE)

  r_specs <- "small_salary %>% group_by(Work, Degree) %>% summarise(mean = mean(Salary))" %>%
    datamation_sanddance() %>%
    purrr::pluck("x") %>%
    purrr::pluck("specs") %>%
    jsonlite::fromJSON(simplifyDataFrame = FALSE)

  expect_python_identical_to_r(python_specs, r_specs)

  python_specs <- jsonlite::fromJSON(system.file("specs/groupby_degree_work.json", package = "datamations"), simplifyDataFrame = FALSE)

  r_specs <- "small_salary %>% group_by(Degree, Work) %>% summarise(mean = mean(Salary))" %>%
    datamation_sanddance() %>%
    purrr::pluck("x") %>%
    purrr::pluck("specs") %>%
    jsonlite::fromJSON(simplifyDataFrame = FALSE)

  expect_python_identical_to_r(python_specs, r_specs)
})
