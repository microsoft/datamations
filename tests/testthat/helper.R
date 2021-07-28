# Test for a specific value of meta.parse
expect_meta_parse_value <- function(specs, parse_value) {
  meta_parse <- specs %>%
    purrr::map(jsonlite::fromJSON) %>%
    purrr::transpose() %>%
    purrr::pluck("meta") %>%
    purrr::transpose() %>%
    purrr::pluck("parse") %>%
    unlist()

  expect_true(identical(unique(meta_parse), parse_value))
}

# Test that meta.axes is true or false
expect_meta_axes <- function(specs, axes_value) {
  meta_axes <- specs %>%
    purrr::map(jsonlite::fromJSON) %>%
    purrr::transpose() %>%
    purrr::pluck("meta") %>%
    purrr::transpose() %>%
    purrr::pluck("axes") %>%
    unlist()

  expect_true(identical(unique(meta_axes), axes_value))
}

# Test that the data.values are the same as the passed data frame
expect_data_values <- function(single_spec, df) {
  df <- df %>%
    dplyr::mutate_if(is.factor, as.character) %>%
    dplyr::mutate_if(is.character, dplyr::coalesce, "NA")

  if (Y_FIELD_CHR %in% names(df)) {
    df <- df %>%
      dplyr::filter(!is.na(!!Y_FIELD))
  }

  spec_data <- single_spec %>%
    jsonlite::fromJSON() %>%
    purrr::pluck("data") %>%
    purrr::pluck("values")

  expect_equal(spec_data, df, ignore_attr = TRUE)
}

# Test that "mark" and "encoding" are within `spec` - this happens when there is a facet (any grouping)
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

# Test that "mark" and "encoding" are at the top level - when there is no faceting / grouping
expect_mark_encoding_top_level <- function(specs) {
  spec_names <- specs %>%
    purrr::map(function(x) {
      jsonlite::fromJSON(x) %>%
        names()
    })

  mark_encoding_in_spec <- spec_names %>%
    purrr::map(~ all(c("mark", "encoding") %in% .x)) %>%
    unlist()

  expect_true(all(mark_encoding_in_spec))
}

# TODO: need to rework these because the groupings are different now depending on the number of grouping variables:
# 1: x
# 2: column, x/color
# 3. column, row, x/color

# Test that grouped specs are in a specific order - 1 group, 2 groups, then 3 groups
expect_grouping_order <- function(specs) {
  expect_grouping_order_1(specs[[1]])

  if (length(specs) %in% c(2, 3)) {
    expect_grouping_order_2(specs[[2]])
  }

  if (length(specs) == 3) {
    expect_grouping_order_3(specs[[3]])
  }
}

# Test 1 grouping variable case - column facet, no color encoding
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

# Test 2 grouping variable case - column and row facet, no color encoding
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

# Test 3 grouping variable case - column and row facet, color encoding
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

# Expect that there isn't any grouping - no facets, no color encoding
expect_no_grouping <- function(specs) {
  no_facets <- specs %>%
    purrr::map(function(x) {
      spec_names <- jsonlite::fromJSON(x) %>%
        names()

      !"facet" %in% spec_names
    }) %>%
    unlist()

  expect_true(all(no_facets))

  no_color_encoding <- specs %>%
    purrr::map(function(x) {
      encoding_names <- jsonlite::fromJSON(x) %>%
        purrr::pluck("encoding") %>%
        names()

      !"color" %in% encoding_names
    }) %>%
    unlist()

  expect_true(all(no_color_encoding))
}
