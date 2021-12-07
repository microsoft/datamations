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

test_that("filtered specs have an updated x axis, defaulting to dropping x-axis values that no longer exist", {
  # One X filtered out -----
  specs <- "small_salary %>% group_by(Degree) %>% summarise(median = median(Salary)) %>% filter(median > 90)" %>%
    datamation_sanddance() %>%
    purrr::pluck("x") %>%
    purrr::pluck("specs") %>%
    jsonlite::fromJSON(simplifyDataFrame = FALSE)

  filter_spec_id <- 6
  filter_frame_specs <- specs[[filter_spec_id]]
  previous_frame_specs <- specs[[filter_spec_id - 1]]

  # X domain is different
  expect_equal(previous_frame_specs$encoding$x$axis$values, c(1, 2))
  expect_equal(filter_frame_specs$encoding$x$axis$values, 1)

  # All X filtered out ----
  specs <- "small_salary %>% group_by(Degree) %>% summarise(median = median(Salary)) %>% filter(median > 100)" %>%
    datamation_sanddance() %>%
    purrr::pluck("x") %>%
    purrr::pluck("specs") %>%
    jsonlite::fromJSON(simplifyDataFrame = FALSE)

  filter_spec_id <- 6
  filter_frame_specs <- specs[[filter_spec_id]]
  previous_frame_specs <- specs[[filter_spec_id - 1]]

  # X domain is different
  expect_equal(previous_frame_specs$encoding$x$axis$values, c(1, 2))
  expect_equal(filter_frame_specs$encoding$x$axis$values, list())
})

test_that("specs from prep_specs_filter have color.scale.domain explicitly set, so color remains the same even if values are filtered out", {
  specs <- "small_salary %>% group_by(Degree, Work) %>% filter(Work == 'Industry')" %>%
    datamation_sanddance() %>%
    purrr::pluck("x") %>%
    purrr::pluck("specs") %>%
    jsonlite::fromJSON(simplifyDataFrame = FALSE)

  filter_spec <- specs[[length(specs)]]

  expect_identical(filter_spec$spec$encoding$color$scale$domain, filter_spec$spec$encoding$color$legend$values)
  expect_identical(filter_spec$spec$encoding$color$scale$domain, c("Academia", "Industry"))
})

test_that("setting color.domain when there is no color variables doesn't cause an issue, since value being set is NULL", {
  specs <- "small_salary %>% group_by(Work) %>% filter(Work == 'Industry')" %>%
    datamation_sanddance() %>%
    purrr::pluck("x") %>%
    purrr::pluck("specs") %>%
    jsonlite::fromJSON(simplifyDataFrame = FALSE)

  filter_spec <- specs[[length(specs)]]

  expect_null(filter_spec$spec$encoding$color$scale$domain)
})
