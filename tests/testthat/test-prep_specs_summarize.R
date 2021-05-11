test_that("prep_specs_summarize returns a list with two elements - one for the jitter plot, one for the finally summary plot. In the first element, `meta.parse` specifies jitter. meta is empty in the second element. There is one data value for each row in the input data frame containing the grouping variables, and an X value depending on the grouping (X = 1 unless there are 3 groups, in which case X is according to the level of the third grouping variable). In the second element, all of the values are the same (the summary value). If there are no groups, mark and encoding are at the top levels, otherwise they are within `spec`. The grouping order is correct.", {
  # One group
  df <- palmerpenguins::penguins %>%
    dplyr::group_by(species)
  summary_operation <- list(rlang::parse_expr("mean(bill_length_mm)"))
  specs <- prep_specs_summarize(df, summary_operation)

  expect_length(specs, 2) # Returns a list with two elements
  expect_meta_parse_value(specs[1], "jitter") # First element meta.parse is jitter
  expect_meta_parse_value(specs[2], NULL) # Second element meta is empty
  expect_meta_axes(specs, TRUE) # Axes are set to TRUE to be shown
  expect_data_values(specs[[1]], palmerpenguins::penguins %>%
    dplyr::arrange(species) %>%
    dplyr::mutate(x = 1, gemini_id = dplyr::row_number()) %>%
    dplyr::select(gemini_id, y = bill_length_mm, species, x)) # One data value for each row in the input data frame, containing grouping variables - x value depending on the grouping - x = 1 if n_groups != 3
  expect_data_values(specs[[2]], palmerpenguins::penguins %>%
    dplyr::arrange(species) %>%
    dplyr::mutate(x = 1, gemini_id = dplyr::row_number()) %>%
    dplyr::group_by(species) %>%
    dplyr::mutate(y = mean(bill_length_mm, na.rm = TRUE)) %>%
    dplyr::select(gemini_id, y, species, x) %>%
    dplyr::ungroup()) # Second element, all of the values are the summary value
  expect_spec_contains_mark_encoding(specs) # mark and encoding are within `spec`
  expect_grouping_order_1(specs[[1]]) # The grouping order is correct
  expect_grouping_order_1(specs[[2]])

  # Three groups
  df <- palmerpenguins::penguins %>%
    dplyr::group_by(species, island, sex)
  summary_operation <- list(rlang::parse_expr("mean(bill_length_mm)"))
  specs <- prep_specs_summarize(df, summary_operation)

  expect_length(specs, 2) # Returns a list with two elements
  expect_meta_parse_value(specs[1], "jitter") # First element meta.parse is jitter
  expect_meta_parse_value(specs[2], NULL) # Second element meta is empty
  expect_meta_axes(specs, TRUE) # Axes are set to TRUE to be shown
  expect_data_values(specs[[1]], palmerpenguins::penguins %>%
    dplyr::arrange(species, island, sex) %>%
    dplyr::mutate(
      gemini_id = dplyr::row_number(),
      x_var = forcats::fct_explicit_na(sex),
      x = as.numeric(x_var)
    ) %>%
    dplyr::select(gemini_id, y = bill_length_mm, species, island, sex, x)) # One data value for each row in the input data frame, containing grouping variables - x value depending on the grouping - x = 1 if n_groups != 3
  expect_data_values(specs[[2]], palmerpenguins::penguins %>%
    dplyr::arrange(species, island, sex) %>%
    dplyr::mutate(
      gemini_id = dplyr::row_number(),
      x_var = forcats::fct_explicit_na(sex),
      x = as.numeric(x_var)
    ) %>%
    dplyr::group_by(species, island, sex) %>%
    dplyr::mutate(y = mean(bill_length_mm, na.rm = TRUE)) %>%
    dplyr::select(gemini_id, y, species, island, sex, x) %>%
    dplyr::ungroup()) # Second element, all of the values are the summary value
  expect_spec_contains_mark_encoding(specs) # mark and encoding are within `spec`
  expect_grouping_order_3(specs[[1]]) # The grouping order is correct
  expect_grouping_order_3(specs[[2]])

  # No groups

  df <- palmerpenguins::penguins
  summary_operation <- list(rlang::parse_expr("mean(bill_length_mm)"))
  specs <- prep_specs_summarize(df, summary_operation)

  expect_length(specs, 2) # Returns a list with two elements
  expect_meta_parse_value(specs[1], "jitter") # First element meta.parse is jitter
  expect_meta_parse_value(specs[2], NULL) # Second element meta is empty
  expect_meta_axes(specs, FALSE) # Additional axes are NOT shown when there's no groups
  expect_data_values(specs[[1]], palmerpenguins::penguins %>%
    dplyr::mutate(x = 1, gemini_id = dplyr::row_number()) %>%
    dplyr::select(gemini_id, y = bill_length_mm, x)) # One data value for each row in the input data frame, containing grouping variables - x value depending on the grouping - x = 1 if n_groups != 3
  expect_data_values(specs[[2]], palmerpenguins::penguins %>%
    dplyr::mutate(x = 1, gemini_id = dplyr::row_number()) %>%
    dplyr::mutate(y = mean(bill_length_mm, na.rm = TRUE)) %>%
    dplyr::select(gemini_id, y, x))
  expect_mark_encoding_top_level(specs) # mark and encoding are at the top level
  expect_no_grouping(specs) # There is no grouping
})
