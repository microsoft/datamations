#' @param .data
#' @param summary_operation quoted
#' @param nframes number of frames per animation "stage"
#' @param output returns the first step, the second step, or both
#' @importFrom tweenr keep_state tween_state
#' @importFrom ggbeeswarm geom_beeswarm geom_quasirandom
#' @importFrom scales label_dollar comma_format label_number
#' @importFrom stringr str_replace
#' @importFrom rlang enexpr is_empty
#' @importFrom dplyr mutate_all funs rename right_join group_keys
#' @importFrom ggplot2 layer_data geom_pointrange coord_cartesian scale_y_continuous element_rect xlab scale_x_discrete labs
#' @importFrom stats setNames
#' @importFrom tidyr separate
#' @export
animate_summarize_sanddance <- function(.data, summary_operation, nframes = 5, output = "both", titles = "") {

  # START: same as animate_group_by_sanddance

  # Map grouping variables
  group_vars <- dplyr::groups(.data)
  # Count number of groups
  n_groups <- length(group_vars)

  # Use the first grouping variable for colour
  color_var <- first(group_vars)
  # And the second for the shape
  shape_var <- dplyr::nth(group_vars, n = 2)

  # If there's no grouping variable, add one ".self" and the rest of the operations work on that :)
  if (n_groups == 0) {
    group_vars_chr <- ".self"

    .data <- .data %>%
      mutate(.self = "id")
  } else {
    # Convert grouping variables to character
    group_vars_chr <- map_chr(group_vars, rlang::quo_name)
  }

  # Collapse the variables into a single one - not using just "_" because variable names themselves could contain "_" - I figure ___ should be safe, and it's what tidytext uses for something similar: https://github.com/juliasilge/tidytext/blob/master/R/reorder_within.R
  group_vars_combined_chr <- paste(group_vars_chr, collapse = "___")
  group_vars_combined <- sym(group_vars_combined_chr)
  # Note that if there is only one grouping variable, then all this above will be the same variable

  # Keep an unaltered copy of the data to return later
  df <- .data

  # Convert grouping variables to character - useful if there are binary variables or with a small number of (numeric) options, since you can't map shape to a continuous variable
  # But we should be careful about too many categories and e.g. stop if there are too many
  .data <- .data %>%
    dplyr::mutate_at(dplyr::all_of(group_vars_chr), as.character)

  # Unite grouping variables into a single variable
  # If there's only only grouping variable, then it will be preserved
  # The original variables are kept as well
  .data <- .data %>%
    unite({{ group_vars_combined }}, group_vars_chr, sep = "___", remove = FALSE)

  # Pull levels of combined grouping variable and set them
  fct_lvls <- .data %>%
    arrange({{ group_vars_combined }}) %>%
    pull({{ group_vars_combined }}) %>%
    unique()

  .data <- .data %>%
    mutate({{ group_vars_combined }} := factor({{ group_vars_combined }}, levels = fct_lvls)) %>%
    arrange({{ group_vars_combined }})

  # Map group and colour aesthetics
  aes_with_group <- aes(color = {{ color_var }}, shape = {{ shape_var }})

  # END: same as animate_group_by_sanddance()

  summary_function <- summary_operation %>%
    purrr::pluck(1) %>%
    as.list() %>%
    dplyr::nth(1)

  summary_variable <- summary_operation %>%
    purrr::pluck(1) %>%
    as.list() %>%
    dplyr::nth(2)

  # Create data for stages

  coords_list <- vector("list", length = 2)

  # State 1: Scatter plot, coloured (and shaped)

  coords_stage1 <- .data %>%
    ungroup() %>%
    select(x = {{ group_vars_combined }}, y = {{ summary_variable }}) %>%
    filter(!is.na(y)) %>%
    mutate(group = x,
           # Convert x to a numeric variable for tweening - labels will be manually added in the plotting step
           x = as.factor(x),
           x = as.numeric(x)) %>%
    separate(group,
      into = group_vars_chr,
      sep = "___",
      remove = FALSE
    )

  stage1_quasirandom_plot <- plot_grouped_dataframe_withresponse_sanddance(coords_stage1)
  stage1_quasirandom_data <- layer_data(stage1_quasirandom_plot)

  coords_stage1$x <- stage1_quasirandom_data$x
  coords_stage1$y <- stage1_quasirandom_data$y

  coords_list[[1]] <- coords_stage1 %>%
    mutate(.data_stage = 1)

  # State 2: Summary plot, coloured (and shaped)
  # There should still be a point for each datapoint, just all overlapping
  # None should disappear, otherwise makes tweening messy

  coords_stage2 <- coords_stage1 %>%
    group_by(group) %>%
    dplyr::summarise(across(y, !!summary_function, na.rm = TRUE),
                     .group_count = n()) %>%
    mutate(x = group,
           # Convert x to a numeric variable for tweening - labels will be manually added in the plotting step
           x = as.factor(x),
           x = as.numeric(x)) %>%
    separate(group,
      into = group_vars_chr,
      sep = "___",
      remove = FALSE
    ) %>%
    tidyr::uncount(.group_count)

  coords_list[[2]] <- coords_stage2 %>%
    mutate(.data_stage = 2)

  # Set up the states to tween between - must all have the same columns, so only keep the ones relevant for positioning - the ones for mapping are grabbed again when each frame is generated

  data_tween_states <- coords_list %>%
    map(~ select(.x, y, x, group, .data_stage) %>%
      mutate(
        group = as.character(group)
      ) %>%
        as.data.frame()
    )

  map(
    1:(length(data_tween_states)), function(i) {

      df <- data_tween_states[[i]]

      # Add mapping information to data
      stage <- unique(df[[".data_stage"]])

      stage_df <- coords_list[[stage]]
      stage_cols <- stage_df[!names(stage_df) %in% names(df)]
      df <- df %>%
        dplyr::bind_cols(stage_cols)

      generate_vegalite_specs(df, aes_with_group, show_axes = TRUE)

    }
  )
}
