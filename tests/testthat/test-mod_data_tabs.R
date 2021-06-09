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

test_that("determine_tab_from_slider returns 1 for the first slider position", {
  expect_equal(determine_tab_from_slider(0, NULL), 1)
  expect_equal(determine_tab_from_slider(0, "island"), 1)
  expect_equal(determine_tab_from_slider(0, c("island", "species")), 1)
})

test_that("determine_tab_from_slider returns 2 for the second through 2 + n_groups (-1 bc indexing) slider positions, when there are groups", {
  expect_equal(determine_tab_from_slider(1, "island"), 2)
  expect_equal(determine_tab_from_slider(2, "island"), 2)
  expect_equal(determine_tab_from_slider(1, c("island", "species")), 2)
  expect_equal(determine_tab_from_slider(2, c("island", "species")), 2)
  expect_equal(determine_tab_from_slider(3, c("island", "species")), 2)
  expect_equal(determine_tab_from_slider(3, c("island", "species", "sex")), 2)
  expect_equal(determine_tab_from_slider(4, c("island", "species", "sex")), 2)
})

test_that("determine_tab_from_slider returns 3 for any slider after the grouping (1 + 1 + 1 + n_groups - 1) if there are group", {
  expect_equal(determine_tab_from_slider(3, "island"), 3)
  expect_equal(determine_tab_from_slider(4, c("island", "species")), 3)
  expect_equal(determine_tab_from_slider(5, c("island", "species", "sex")), 3)
})

test_that("determine_tab_from_slider returns 1 on the second slider position if there are no groups, because it's the distribution", {
  expect_equal(determine_tab_from_slider(1, NULL), 1)
})

test_that("determine_tab_from_slider returns 2 for any slider position after the first 2, if there are no groups", {
  expect_equal(determine_tab_from_slider(2, NULL), 2)
  expect_equal(determine_tab_from_slider(3, NULL), 2)
  expect_equal(determine_tab_from_slider(4, NULL), 2)
  expect_equal(determine_tab_from_slider(5, NULL), 2)
})
