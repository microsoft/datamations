test_that("specs produced by prep_specs_count are equivalent to specs from group_by + summarize", {
  count_specs <- "small_salary %>% count(Degree)" %>%
    datamation_sanddance()
  group_by_specs <- "small_salary %>% group_by(Degree) %>% summarize(n = n())" %>%
    datamation_sanddance()

  expect_identical(count_specs, group_by_specs)
})
