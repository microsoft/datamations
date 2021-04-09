xlim_init <- c(-2.75, 20)
xlim_final <- c(1, 2)
ylim_init <- c(-0.5, 8.75)
ylim_final <- c(85, 90)

output_1 <- build_limits_list(xlims = c(xlim_init, xlim_init, xlim_final), ylims = c(ylim_init, ylim_init, ylim_final), id_name = "lim_id")

expected_1 <- tribble(
  ~xlim, ~ylim, ~time,
  xlim_init, ylim_init, 1,
  xlim_init, ylim_init, 2,
  xlim_final, ylim_final, 3, # the final state, should have the same y range?
) %>%
  unnest(c(.data$xlim, .data$ylim)) %>%
  group_by(.data$time) %>%
  mutate(lim_id = row_number()) %>%
  group_split()

xlim_inter <- c(0, 10)
ylim_inter <- c(40, 40)

output_2 <- build_limits_list(xlims = c(xlim_init, xlim_inter, xlim_final), ylims = c(ylim_init, ylim_inter, ylim_final), id_name = "id")

expected_2 <- tribble(
  ~xlim, ~ylim, ~time,
  xlim_init, ylim_init, 1,
  xlim_inter, ylim_inter, 2,
  xlim_final, ylim_final, 3, # the final state, should have the same y range?
) %>%
  unnest(c(xlim, ylim)) %>%
  group_by(.data$time) %>%
  mutate(id = row_number()) %>%
  ungroup() %>%
  split(.$time)

test_that("build_limits_list produces results that are equivalent to the previously manually constructed value", {

  # Checks that all the values are the same, but doesn't worry about tibble vs df or row numbers
  expect_equivalent(output_1, expected_1)
  expect_equivalent(output_2, expected_2)
})

test_that("tweening with the results from build_limits_list does not produce warnings, since the elements are data frames instead of tibbles", {
  expect_warning(expected_1[[1]] %>%
    keep_state(1))

  expect_silent(output_1[[1]] %>%
    keep_state(1))

  expect_warning(
    expected_2$`1` %>%
      tween_state(
        expected_2$`1`,
        ease = "linear", nframes = 1
      )
  )

  expect_silent(
    output_2$`1` %>%
      tween_state(
        output_2$`1`,
        ease = "linear", nframes = 1
      )
  )
})
