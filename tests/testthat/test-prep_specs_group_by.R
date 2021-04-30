test_that("prep_specs_group_by returns a list, with one element for each grouping variable. There is one data value for each group combination containing the group levels and n, mark and encoding are within `spec`, meta.parse specifies 'grid', and the order of grouping is: column facet, row facet, colour encoding. If there is an NA group value, that variable will not appear in the data.", {

  # one group ----
  groups <- list(rlang::parse_expr("species"))
  specs <- prep_specs_group_by(palmerpenguins::penguins, groups)

  expect_length(specs, length(groups)) # one element for each grouping variable
  expect_data_values_n(specs[[1]], dplyr::count(palmerpenguins::penguins, species)) # one data value for each group combination,  containing group levels and n
  expect_spec_contains_mark_encoding(specs) # mark and encoding within spec
  expect_meta_parse_value(specs, "grid") # meta.parse specifies grid
  expect_grouping_order(specs) # order of grouping is column, row, colour

  # two groups ----
  groups <- list(rlang::parse_expr("species"), rlang::parse_expr("island"))
  specs <- prep_specs_group_by(palmerpenguins::penguins, groups)

  expect_length(specs, length(groups)) # one element for each grouping variable
  expect_data_values_n(specs[[1]], dplyr::count(palmerpenguins::penguins, species)) # one data value for each group combination,  containing group levels and n
  expect_data_values_n(specs[[2]], dplyr::count(palmerpenguins::penguins, species, island))
  expect_spec_contains_mark_encoding(specs) # mark and encoding within spec
  expect_meta_parse_value(specs, "grid") # meta.parse specifies grid
  expect_grouping_order(specs) # order of grouping is column, row, colour

  # three groups
  groups <- list(rlang::parse_expr("species"), rlang::parse_expr("island"), rlang::parse_expr("sex"))
  specs <- prep_specs_group_by(palmerpenguins::penguins, groups)

  expect_length(specs, length(groups)) # one element for each grouping variable
  expect_data_values_n(specs[[1]], dplyr::count(palmerpenguins::penguins, species)) # one data value for each group combination,  containing group levels and n
  expect_data_values_n(specs[[2]], dplyr::count(palmerpenguins::penguins, species, island))
  expect_data_values_n(specs[[3]], dplyr::count(palmerpenguins::penguins, species, island, sex))
  expect_spec_contains_mark_encoding(specs) # mark and encoding within spec
  expect_meta_parse_value(specs, "grid") # meta.parse specifies grid
  expect_grouping_order(specs) # order of grouping is column, row, colour
})

# TODO: need to test
# if NA group value, variable not in data
