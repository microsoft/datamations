test_that("prep_specs_data returns a vega lite spec of length 1, with one data value containing n, meta.parse that specifies 'grid', no facets, with mark and encoding at the top level", {
  spec <- prep_specs_data(mtcars)
  expect_length(spec, 1)

  spec <- spec[[1]]
  spec_list <- jsonlite::fromJSON(spec)

  expect_identical(spec_list$data$values$n, nrow(mtcars))
  expect_identical(spec_list$meta$parse, "grid")
  expect_null(spec_list$facet)
  expect_true("mark" %in% names(spec_list))
  expect_true("encoding" %in% names(spec_list))
  })
