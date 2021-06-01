test_that("dismantle splits a chain of pipes into its components", {
  output <- "mtcars %>% filter(cyl == 5)" %>%
    parse_expr() %>%
    dismantle()

  expect_true(
    lapply(output, rlang::is_expression) %>%
      unlist() %>%
      all()
  )

  expect_identical(lapply(output, deparse), list("mtcars", "filter(cyl == 5)"))
})
