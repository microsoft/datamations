test_that("specs produced by prep_specs_count are equivalent to specs from group_by + summarize, except for title and meta.custom_animation", {
  # Grouped by one variable ----
  count_specs <- "small_salary %>% count(Degree)" %>%
    datamation_sanddance() %>%
    purrr::pluck("x") %>%
    purrr::pluck("specs") %>%
    jsonlite::fromJSON(simplifyDataFrame = FALSE)

  group_by_specs <- "small_salary %>% group_by(Degree) %>% summarize(n = n())" %>%
    datamation_sanddance() %>%
    purrr::pluck("x") %>%
    purrr::pluck("specs") %>%
    jsonlite::fromJSON(simplifyDataFrame = FALSE)

  # Check title
  expect_identical(count_specs[[length(count_specs)]][["meta"]][["description"]], "Plot count of each group")

  # Check meta field
  expect_identical(count_specs[[length(count_specs)]][["meta"]][["custom_animation"]], "count")

  # Check identical otherwise
  count_specs[[length(count_specs)]][["meta"]][["description"]] <- NULL
  count_specs[[length(count_specs)]][["meta"]][["custom_animation"]] <- NULL
  group_by_specs[[length(group_by_specs)]][["meta"]][["description"]] <- NULL
  expect_identical(count_specs, group_by_specs)

  # Count df on its own ----
  count_specs <- "small_salary %>% count()" %>%
    datamation_sanddance() %>%
    purrr::pluck("x") %>%
    purrr::pluck("specs") %>%
    jsonlite::fromJSON(simplifyDataFrame = FALSE)

  group_by_specs <- "small_salary %>% summarize(n = n())" %>%
    datamation_sanddance() %>%
    purrr::pluck("x") %>%
    purrr::pluck("specs") %>%
    jsonlite::fromJSON(simplifyDataFrame = FALSE)

  # Check title
  expect_identical(count_specs[[length(count_specs)]][["meta"]][["description"]], "Plot count")

  # Check meta field
  expect_identical(count_specs[[length(count_specs)]][["meta"]][["custom_animation"]], "count")

  # Check identical otherwise
  count_specs[[length(count_specs)]][["meta"]][["description"]] <- NULL
  count_specs[[length(count_specs)]][["meta"]][["custom_animation"]] <- NULL
  group_by_specs[[length(group_by_specs)]][["meta"]][["description"]] <- NULL
  expect_identical(count_specs, group_by_specs)
})
