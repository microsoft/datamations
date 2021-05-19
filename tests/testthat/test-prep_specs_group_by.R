test_that("prep_specs_group_by returns a list, with one element for each grouping variable. There is one data value for each group combination containing the group levels and n, mark and encoding are within `spec`, meta.parse specifies 'grid', and the order of grouping is: column facet, row facet, colour encoding. If there is an NA group value, that variable will not appear in the data.", {

  # one group ----
  specs <- prep_specs_group_by(palmerpenguins::penguins, mapping = list(x = 1, y = NULL, summary_function = NULL, column = "species", groups = "species"))

  expect_length(specs, length(groups)) # one element for each grouping variable
  expect_data_values(specs[[1]], dplyr::count(palmerpenguins::penguins, species)) # one data value for each group combination,  containing group levels and n
  expect_spec_contains_mark_encoding(specs) # mark and encoding within spec
  expect_meta_parse_value(specs, "grid") # meta.parse specifies grid
  expect_meta_axes(specs, NULL) # Axes are not shown
  expect_grouping_order(specs) # order of grouping is column, row, colour

  # two groups ----
  specs <- prep_specs_group_by(palmerpenguins::penguins, mapping = list(x = 1, y = NULL, summary_function = NULL, column = "species", row = "island", groups = c("species", "island")))

  expect_length(specs, 2) # one element for each grouping variable
  expect_data_values(specs[[1]], dplyr::count(palmerpenguins::penguins, species)) # one data value for each group combination,  containing group levels and n
  expect_data_values(specs[[2]], dplyr::count(palmerpenguins::penguins, species, island))
  expect_spec_contains_mark_encoding(specs) # mark and encoding within spec
  expect_meta_parse_value(specs, "grid") # meta.parse specifies grid
  expect_meta_axes(specs, NULL) # Axes are not shown
  expect_grouping_order(specs) # order of grouping is column, row, colour

  # three groups
  specs <- prep_specs_group_by(palmerpenguins::penguins, list(x = 1, y = NULL, summary_function = NULL, column = "species", row = "island", color = "sex", groups = c("species", "island", "sex")))

  expect_length(specs, 3) # one element for each grouping variable
  expect_data_values(specs[[1]], dplyr::count(palmerpenguins::penguins, species)) # one data value for each group combination,  containing group levels and n
  expect_data_values(specs[[2]], dplyr::count(palmerpenguins::penguins, species, island))
  expect_data_values(specs[[3]], dplyr::count(palmerpenguins::penguins, species, island, sex))
  expect_spec_contains_mark_encoding(specs) # mark and encoding within spec
  expect_meta_parse_value(specs, "grid") # meta.parse specifies grid
  expect_meta_axes(specs, NULL) # Axes are not shown
  expect_grouping_order(specs) # order of grouping is column, row, colour
})

# TODO: need to test
# if NA group value, variable not in data
