test_that("generate_mapping_from_plot can extract x mapping from ggplot", {
  p <- ggplot2::ggplot(mtcars, ggplot2::aes(x = mpg, y = cyl)) +
    ggplot2::geom_point()
  mapping <- generate_mapping_from_plot(p)
  expect_identical(mapping, list(x = "mpg"))
})

test_that("generate_mapping_from_plot can extract x mapping from geo_point", {
  p <- ggplot2::ggplot(mtcars) +
    ggplot2::geom_point(ggplot2::aes(x = mpg, y = cyl))
  mapping <- generate_mapping_from_plot(p)
  expect_identical(mapping, list(x = "mpg"))
})

test_that("generate_mapping_from_plot extracts facets", {
  p <- ggplot2::ggplot(mtcars) +
    ggplot2::geom_point(ggplot2::aes(x = mpg, y = cyl)) +
    ggplot2::facet_grid(dplyr::vars(vs), dplyr::vars(am))
  mapping <- generate_mapping_from_plot(p)
  expect_identical(mapping, list(x = "mpg", row = "vs", column = "am"))

  p <- ggplot2::ggplot(mtcars) +
    ggplot2::geom_point(ggplot2::aes(x = mpg, y = cyl)) +
    ggplot2::facet_grid(dplyr::vars(vs))
  mapping <- generate_mapping_from_plot(p)
  expect_identical(mapping, list(x = "mpg", row = "vs"))

  p <- ggplot2::ggplot(mtcars) +
    ggplot2::geom_point(ggplot2::aes(x = mpg, y = cyl)) +
    ggplot2::facet_grid(am ~ vs)
  mapping <- generate_mapping_from_plot(p)
  expect_identical(mapping, list(x = "mpg", row = "am", column = "vs"))
})
