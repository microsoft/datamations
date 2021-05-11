test_that("parse_functions identifies functions used in a pipeline", {
  pipeline <- "small_salary %>% group_by(Degree) %>% summarise(mean = mean(Salary))"

  fittings <- pipeline %>%
    parse_pipeline()

  functions <- parse_functions(fittings)

  expect_equal(functions, c("group_by", "summarise"))
})

# This doesn't work yet - creating the test for when it does

# test_that("parse_functions properly identifies when the first pipe in a pipeline contains the data, and still grabs the function", {
#   fittings <- "group_by(small_sallary, Degree)" %>%
#     parse_expr() %>%
#     c(list()) # Can't use dismantle() because it doesn't handle this case yet either
#
#   functions <- parse_functions(fittings)
#
#   expect_equal(functions, "group_by")
# })
