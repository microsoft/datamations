test_that("specs from prep_specs_filter are the same as the previous frame, with transform.filter", {
  # Infogrid
  specs <- "small_salary %>% filter(Degree == 'Masters')" %>%
    datamation_sanddance() %>%
    purrr::pluck("x") %>%
    purrr::pluck("specs") %>%
    jsonlite::fromJSON(simplifyDataFrame = FALSE)

  filter_spec_id <- 2
  filter_specs <- specs[[filter_spec_id]][["transform"]][[1]]

  # Had expected fields
  expect_true("filter" %in% names(filter_specs))
  expect_true(filter_specs$filter$field == "gemini_id")
  expect_true("oneOf" %in% names(filter_specs$filter))

  # Identical to previous frame, minus filter and description
  specs[[filter_spec_id]]$transform <- NULL
  specs[[filter_spec_id - 1]]$meta$description <- NULL
  specs[[filter_spec_id]]$meta$description <- NULL
  expect_identical(specs[[filter_spec_id - 1]], specs[[filter_spec_id]])

  # Non-infogrid
  specs <- "small_salary %>% group_by(Degree, Work) %>% summarise(median = median(Salary)) %>% filter(median > 85)" %>%
    datamation_sanddance() %>%
    purrr::pluck("x") %>%
    purrr::pluck("specs") %>%
    jsonlite::fromJSON(simplifyDataFrame = FALSE)
  filter_spec_id <- 7
  filter_specs <- specs[[filter_spec_id]][["transform"]][[1]]

  # Had expected fields
  expect_true("filter" %in% names(filter_specs))
  expect_true(filter_specs$filter$field == "gemini_id")
  expect_true("oneOf" %in% names(filter_specs$filter))

  # Identical to previous frame, minus filter and description
  specs[[filter_spec_id]]$transform <- NULL
  specs[[filter_spec_id - 1]]$meta$description <- NULL
  specs[[filter_spec_id]]$meta$description <- NULL
  expect_equal(specs[[filter_spec_id - 1]], specs[[filter_spec_id]])
})

test_that("transform.filter uses oneOf if number of IDs > 1, and == if number of IDs is 1", {
  specs <- "small_salary %>% filter(row_number() == 1)" %>%
    datamation_sanddance() %>%
    purrr::pluck("x") %>%
    purrr::pluck("specs") %>%
    jsonlite::fromJSON(simplifyDataFrame = FALSE)

  expect_identical(specs[[2]]$transform[[1]]$filter, "datum.gemini_id == 1")

  specs <- "small_salary %>% filter(row_number() %in% c(1,2))" %>%
    datamation_sanddance() %>%
    purrr::pluck("x") %>%
    purrr::pluck("specs") %>%
    jsonlite::fromJSON(simplifyDataFrame = FALSE)

  expect_equal(specs[[2]]$transform[[1]]$filter, list(field = "gemini_id", oneOf = c(1, 2)))
})
