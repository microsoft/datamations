test_that("prep_specs_data returns a vega lite spec of length 1, with one data value containing n, meta.parse that specifies 'grid', no facets, with mark and encoding at the top level", {
  specs <- prep_specs_data(mtcars)
  expect_length(specs, 1)

  expect_data_values(specs[[1]], mtcars %>% dplyr::count())
  expect_meta_parse_value(specs, "grid")
  expect_meta_axes(specs, NULL) # Axes are not shown
  expect_no_grouping(specs)
  expect_mark_encoding_top_level(specs)
})
