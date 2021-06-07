test_that("determine_slider_from_tab returns 0 for the first tab", {
  expect_equal(determine_slider_from_tab(1, NULL), 0)
  expect_equal(determine_slider_from_tab(1, "salary"), 0)
  expect_equal(determine_slider_from_tab(1, c("salary", "work")), 0)
})

test_that("determine_slider_from_tab returns 1 for the second tab (group by) if there are groups", {
  expect_equal(determine_slider_from_tab(2, "salary"), 1)
  expect_equal(determine_slider_from_tab(2, c("salary", "work")), 1)
})

test_that("determine_slider_from_tab returns 3 + n_groups for the third tab (summarize) when there are groups. 3 is initial frame + distribution frame + 1 more to place after - minus 1 because of javascript indexing of course!", {
  expect_equal(determine_slider_from_tab(3, "salary"), 3)
  expect_equal(determine_slider_from_tab(3, c("salary", "work")), 4)
  expect_equal(determine_slider_from_tab(3, c("salary", "work", "x")), 5)
})

test_that("determine_slider_from_tab returns 2 when the tab is 2 and there is no group by - 1 for the initial, 1 for the distribution, 1 after, then minus 1 because of indexing", {
  expect_equal(determine_slider_from_tab(2, NULL), 2)
})
