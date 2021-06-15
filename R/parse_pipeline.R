#' Parse a tidyverse pipeline
#'
#' Parses a tidyverse pipeline, input as a string, into a list of its components as expressions for parsing later on in the datamations process.
#'
#' @param pipeline Input pipeline, as a string.
#' @param supported_tidy_functions Functions that are supported by datamations: \code{group_by} and \code{summarize}/\code{summarise}.
#' @noRd
#'
#' @examples
#' "small_salary %>% group_by(Degree) %>% summarize(mean = mean(Salary))" %>%
#'   datamations:::parse_pipeline()
#'
#' "group_by(small_salary, Degree) %>% summarize(mean = mean(Salary))" %>%
#'   datamations:::parse_pipeline()
parse_pipeline <- function(pipeline, supported_tidy_functions = c("group_by", "summarize")) {
  pipeline %>%
    split_pipeline(supported_tidy_functions = supported_tidy_functions) %>%
    purrr::map(rlang::parse_expr)
}

#' Split pipeline into components
#' @noRd
split_pipeline <- function(pipeline, supported_tidy_functions = c("group_by", "summarize")) {
  pipeline <- pipeline %>%
    stringr::str_split("%>%") %>%
    purrr::pluck(1) %>%
    stringr::str_trim()

  # Convert summarise to summarize
  pipeline <- stringr::str_replace(pipeline, "summarise", "summarize")

  # Extract out data if it's the first argument of the first function
  pipeline <- parse_data_from_first_function(pipeline, supported_tidy_functions = supported_tidy_functions)

  pipeline
}

#' Parse out data from the first function in a pipeline
#' @noRd
parse_data_from_first_function <- function(pipeline, supported_tidy_functions = c("group_by", "summarize")) {
  # If the first element of the pipeline is a supported function, the data is probably embedded in it
  if (any(stringr::str_detect(pipeline[[1]], supported_tidy_functions))) {
    # Extract the data and check that it is a valid data frame
    first_function_data <- stringr::str_extract(pipeline[[1]], pattern = "(?<=\\()(.*?)(?=,)") # Regex is everything between ( and ,
    first_function_data_expr <- rlang::parse_expr(first_function_data)

    if (is.na(first_function_data)) {
      stop("No data detected in pipeline.", call. = FALSE)
    }

    # Check that the data exists
    data_exists <- try(eval(first_function_data_expr), silent = TRUE)
    data_exists <- all(class(data_exists) != "try-error")

    if (!data_exists) {
      stop("No data detected in pipeline.", call. = FALSE)
    }

    # Check that the data is a data frame
    data <- eval(first_function_data_expr)
    data_is_df <- is.data.frame(data)

    if (!data_is_df) {
      stop("Passed data is not a data frame or tibble.", call. = FALSE)
    }

    # Remove data call from first function
    pipeline[[1]] <- stringr::str_remove(pipeline[[1]], first_function_data)
    # And the first comma (done separately because there can be any amount of spacing)
    pipeline[[1]] <- stringr::str_remove(pipeline[[1]], ",")

    # Make the data the first element of the pipeline
    pipeline <- append(first_function_data, pipeline)
  }

  pipeline
}
