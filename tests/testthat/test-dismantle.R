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


# This doesn't work yet - creating the test for when it does

# test_that("dismantle properly splits a chain whose first component is a verb calling the data directly", {
#   output <- "filter(mtcars, cyl == 5)" %>%
#     parse_expr() %>%
#     dismantle()
#
#   expect_true(
#     lapply(output, rlang::is_expression) %>%
#       unlist() %>%
#       all()
#   )
#
#   expect_identical(lapply(output, deparse), list("mtcars", "filter(cyl == 5)"))
# })
