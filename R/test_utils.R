expect_meta_parse_value <- function(specs, parse_value) {
  meta_parse <- specs %>%
    purrr::map(jsonlite::fromJSON) %>%
    purrr::transpose() %>%
    purrr::pluck("meta") %>%
    purrr::transpose() %>%
    purrr::pluck("parse") %>%
    unlist()

  expect_true(all(meta_parse == parse_value))
}

expect_data_values_n <- function(single_spec, df_n) {
  df_n <- df_n %>%
    dplyr::mutate_if(is.factor, as.character)

  spec_count <- single_spec %>%
    jsonlite::fromJSON() %>%
    purrr::pluck("data") %>%
    purrr::pluck("values")

  expect_equivalent(spec_count, df_n)
}

expect_spec_contains_mark_encoding <- function(specs) {
  spec_names <- specs %>%
    purrr::map(function(x) {
      jsonlite::fromJSON(x) %>%
        purrr::pluck("spec") %>%
        names()
    })

  mark_encoding_in_spec <- spec_names %>%
    purrr::map(~ all(c("mark", "encoding") %in% .x)) %>%
    unlist()

  expect_true(all(mark_encoding_in_spec))
}

expect_grouping_order <- function(specs){

  expect_grouping_order_1(specs[[1]])

  if (length(specs) %in% c(2, 3)) {
    expect_grouping_order_2(specs[[2]])
  }

  if (length(specs) == 3) {
    expect_grouping_order_3(specs[[3]])
  }
}

expect_grouping_order_1 <- function(first_spec) {
  # Expect column facet only
  facet <- first_spec %>%
    jsonlite::fromJSON() %>%
    purrr::pluck("facet")

  expect_named(facet, "column")

  # No color in encoding
  encoding <- first_spec %>%
    jsonlite::fromJSON() %>%
    purrr::pluck("spec") %>%
    purrr::pluck("encoding")

  expect_false("color" %in% names(encoding))
}

expect_grouping_order_2 <- function(second_spec) {
  # Expect column and row facet
  facet <- second_spec %>%
    jsonlite::fromJSON() %>%
    purrr::pluck("facet")

  expect_named(facet, c("column", "row"))

  # No color in encoding
  encoding <- second_spec %>%
    jsonlite::fromJSON() %>%
    purrr::pluck("spec") %>%
    purrr::pluck("encoding")

  expect_false("color" %in% names(encoding))
}

expect_grouping_order_3 <- function(third_spec) {
  # Expect column and row facet
  facet <- third_spec %>%
    jsonlite::fromJSON() %>%
    purrr::pluck("facet")

  expect_named(facet, c("column", "row"))

  # Expect color in encoding
  encoding <- third_spec %>%
    jsonlite::fromJSON() %>%
    purrr::pluck("spec") %>%
    purrr::pluck("encoding")

  expect_true("color" %in% names(encoding))
}
