test_that("prep_specs_summarize returns a list with four elements - one for the jitter plot, one for the final summary plot, one for error bars, and one for zoom. In the first element, `meta.parse` specifies jitter. meta is empty in the second element. There is one data value for each row in the input data frame containing the grouping variables, and an X value depending on the grouping (X = 1 unless there are 3 groups, in which case X is according to the level of the third grouping variable). In the second element, all of the values are the same (the summary value). If there are no groups, mark and encoding are at the top levels, otherwise they are within `spec`. The grouping order is correct.", {
  # One group
  df <- palmerpenguins::penguins %>%
    dplyr::group_by(species)
  specs <- prep_specs_summarize(df, list(x = 1, y = "bill_length_mm", summary_function = "mean", column = "species", groups = "species"))

  expect_length(specs, 4) # Returns a list with two elements
  expect_meta_parse_value(specs[1], "jitter") # First element meta.parse is jitter
  expect_meta_parse_value(specs[2], NULL) # Second element meta is empty
  expect_meta_parse_value(specs[3], NULL)
  expect_meta_parse_value(specs[4], NULL)
  expect_meta_axes(specs, TRUE) # Axes are set to TRUE to be shown
  expect_data_values(specs[[1]], palmerpenguins::penguins %>%
    dplyr::arrange(species) %>%
    dplyr::mutate(!!X_FIELD := 1, gemini_id = dplyr::row_number()) %>%
    dplyr::select(gemini_id, species, !!X_FIELD, !!Y_FIELD := bill_length_mm, !!Y_TOOLTIP_FIELD := bill_length_mm)) # One data value for each row in the input data frame, containing grouping variables - x value depending on the grouping - x = 1 if n_groups != 3
  expect_data_values(specs[[2]], palmerpenguins::penguins %>%
    dplyr::arrange(species) %>%
    dplyr::mutate(!!X_FIELD := 1, gemini_id = dplyr::row_number()) %>%
    dplyr::group_by(species) %>%
    dplyr::mutate(
      !!Y_FIELD := mean(bill_length_mm, na.rm = TRUE),
      !!Y_TOOLTIP_FIELD := !!Y_FIELD
    ) %>%
    dplyr::select(gemini_id, species, !!X_FIELD, !!Y_FIELD, !!Y_TOOLTIP_FIELD) %>%
    dplyr::ungroup()) # Second element, all of the values are the summary value
  expect_spec_contains_mark_encoding(specs[1:2]) # mark and encoding are within `spec` for the first two specs - it works differently for the error bars, since they are layered
  expect_grouping_order_1(specs[[1]]) # The grouping order is correct
  expect_grouping_order_1(specs[[2]])
  expect_grouping_order_1(specs[[3]])
  expect_grouping_order_1(specs[[4]])

  # Three groups
  df <- palmerpenguins::penguins %>%
    dplyr::group_by(species, island, sex)
  specs <- prep_specs_summarize(df, mapping = list(x = 1, y = "bill_length_mm", summary_function = "mean", column = "species", row = "island", color = "sex", groups = c("species", "island", "sex")))

  expect_length(specs, 4) # Returns a list with two elements
  expect_meta_parse_value(specs[1], "jitter") # First element meta.parse is jitter
  expect_meta_parse_value(specs[2], NULL) # Second element meta is empty
  expect_meta_axes(specs, TRUE) # Axes are set to TRUE to be shown
  expect_data_values(specs[[1]], palmerpenguins::penguins %>%
    dplyr::arrange(species, island, sex) %>%
    dplyr::mutate(
      gemini_id = dplyr::row_number(),
      !!X_FIELD := 1,
    ) %>%
    dplyr::select(gemini_id, species, island, sex, !!X_FIELD, !!Y_FIELD := bill_length_mm, !!Y_TOOLTIP_FIELD := bill_length_mm)) # One data value for each row in the input data frame, containing grouping variables - x value depending on the grouping - x = 1 if n_groups != 3
  expect_data_values(specs[[2]], palmerpenguins::penguins %>%
    dplyr::arrange(species, island, sex) %>%
    dplyr::mutate(
      gemini_id = dplyr::row_number(),
      !!X_FIELD := 1
    ) %>%
    dplyr::group_by(species, island, sex) %>%
    dplyr::mutate(
      !!Y_FIELD := mean(bill_length_mm, na.rm = TRUE),
      !!Y_TOOLTIP_FIELD := !!Y_FIELD
    ) %>%
    dplyr::select(gemini_id, species, island, sex, !!X_FIELD, !!Y_FIELD, !!Y_TOOLTIP_FIELD) %>%
    dplyr::ungroup()) # Second element, all of the values are the summary value
  expect_spec_contains_mark_encoding(specs[1:2]) # mark and encoding are within `spec`
  expect_grouping_order_3(specs[[1]]) # The grouping order is correct
  expect_grouping_order_3(specs[[2]])
  # TODO
  # TODO grouping order is different now depending on total number of groups
  # expect_grouping_order_3(specs[[3]])
  # expect_grouping_order_3(specs[[4]])

  # No groups
  df <- palmerpenguins::penguins
  specs <- prep_specs_summarize(df, mapping = list(x = 1, y = "bill_length_mm", summary_function = "mean"))

  expect_length(specs, 4) # Returns a list with two elements
  expect_meta_parse_value(specs[1], "jitter") # First element meta.parse is jitter
  expect_meta_parse_value(specs[2], NULL) # Second element meta is empty
  expect_meta_axes(specs, FALSE) # Additional axes are NOT shown when there's no groups
  expect_data_values(specs[[1]], palmerpenguins::penguins %>%
    dplyr::mutate(!!X_FIELD := 1, gemini_id = dplyr::row_number()) %>%
    dplyr::select(gemini_id, !!X_FIELD, !!Y_FIELD := bill_length_mm, !!Y_TOOLTIP_FIELD := bill_length_mm)) # One data value for each row in the input data frame, containing grouping variables - x value depending on the grouping - x = 1 if n_groups != 3
  expect_data_values(specs[[2]], palmerpenguins::penguins %>%
    dplyr::mutate(!!X_FIELD := 1, gemini_id = dplyr::row_number()) %>%
    dplyr::mutate(
      !!Y_FIELD := mean(bill_length_mm, na.rm = TRUE),
      !!Y_TOOLTIP_FIELD := !!Y_FIELD
    ) %>%
    dplyr::select(gemini_id, !!X_FIELD, !!Y_FIELD, !!Y_TOOLTIP_FIELD))
  expect_mark_encoding_top_level(specs[1:2]) # mark and encoding are at the top level
  expect_no_grouping(specs) # There is no grouping
})

test_that("prep_specs_summarize has meta.custom_animation if the summary function is mean or median, but not otherwise", {
  specs <- "small_salary %>%  group_by(Degree) %>% summarize(mean = mean(Salary))" %>%
    datamation_sanddance() %>%
    purrr::pluck("x") %>%
    purrr::pluck("specs") %>%
    jsonlite::fromJSON(simplifyDataFrame = FALSE)

  expect_equal(specs[[4]][["meta"]][["custom_animation"]], "mean")

  specs <- "small_salary %>%  group_by(Degree) %>% summarize(median = median(Salary))" %>%
    datamation_sanddance() %>%
    purrr::pluck("x") %>%
    purrr::pluck("specs") %>%
    jsonlite::fromJSON(simplifyDataFrame = FALSE)

  expect_equal(specs[[4]][["meta"]][["custom_animation"]], "median")

  specs <- "small_salary %>%  group_by(Degree) %>% summarize(sd = sd(Salary))" %>%
    datamation_sanddance() %>%
    purrr::pluck("x") %>%
    purrr::pluck("specs") %>%
    jsonlite::fromJSON(simplifyDataFrame = FALSE)

  expect_null(specs[[4]][["meta"]][["custom_animation"]])
})
