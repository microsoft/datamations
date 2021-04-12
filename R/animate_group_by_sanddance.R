#' Produces frames (plots) of transition from ungrouped to grouped icon arrays
#'
#' @param .data grouped dataframe
#' @param ... grouping variables
#' @param nframes number of frames per animation stage
#' @param is_last flag for whether this is the last stage of the pipeline. Defaults to \code{FALSE}
#' @param titles titles for animation stage
#' @return ggplot object
#' @importFrom rlang enquos sym .data :=
#' @importFrom purrr map_chr map_df walk
#' @importFrom dplyr first row_number tribble lag
#' @importFrom tidyr unite unnest
#' @importFrom ggplot2 layer_scales
#' @export
animate_group_by_sanddance <- function(.data, ..., nframes = 5, is_last = FALSE, titles = "") {

  # Map grouping variables
  group_vars <- c(...)
  # Use the first grouping variable for colour
  color_var <- first(group_vars)
  # And the second for the shape
  shape_var <- dplyr::nth(group_vars, n = 2)

  # Flag for whether there is second grouping variable
  two_group_var <- !is.null(shape_var)

  # Convert grouping variables to character
  group_vars_chr <- map_chr(group_vars, rlang::quo_name)
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
    mutate(.self = "id") %>%
    unite({{group_vars_combined}}, group_vars_chr, sep = "___", remove = FALSE)

  # Pull levels of combined grouping variable and set them
  fct_lvls <- .data %>%
    arrange({{ group_vars_combined }}) %>%
    pull({{ group_vars_combined }}) %>%
    unique()

  .data <- .data %>%
    mutate({{group_vars_combined}} := factor({{ group_vars_combined }}, levels = fct_lvls)) %>%
    arrange({{ group_vars_combined }})

  # Calculate initial coordinates of waffle chart
  init_coords <- .data %>%
    waffle_iron_groups(aes_d(group = .self))

  # Calculate final coordinates of waffle chart
  final_coords <- .data %>%
    waffle_iron_groups(
      aes_d(group = {{group_vars_combined}}, x = {{group_vars_combined}})
    )

  # Generate plots of initial and final positions - the purpose is to access the limits for some padding
  p_init <- plot_grouped_dataframe_sanddance(init_coords)
  p_final <- plot_grouped_dataframe_sanddance(final_coords)

  # Pad coordinates to give more space
  lims_init <- pad_limits(p_init)
  xlim_init <- lims_init[["xlim"]]
  ylim_init <- lims_init[["ylim"]]

  lims_final <- pad_limits(p_final)
  xlim_final <- lims_final[["xlim"]]
  ylim_final <- lims_final[["ylim"]]

  # Map group and colour aesthetics
  aes_with_group <- aes(color = {{ color_var }}, shape = {{ shape_var }})

  # Generate the data for each state, and put into a list to tween between

  coords_list <- vector("list", length = ifelse(two_group_var, 5, 3))

  # State 1: Grey, ungrouped icon array
  coords_stage1 <- init_coords
  coords_list[[1]] <- coords_stage1 %>%
    mutate(.data_stage = 1)

  # State 2: Coloured, ungrouped icon array
  # Keep the position (so use the same coords), but add a variable for the colour
  data_colour_order <- .data %>%
    arrange({{color_var}})

  coords_stage2 <- coords_stage1 %>%
    mutate({{ color_var }} := data_colour_order[[color_var]])

  coords_list[[2]] <- coords_stage2 %>%
    mutate(.data_stage = 2)

  # State 3: Coloured, grouped icon array
  # New position (grouped), so includes a variable for the colour
  coords_stage3 <- .data %>%
    waffle_iron_groups(aes_d(group = {{ color_var }}, x = {{ color_var }}))

  coords_list[[3]] <- coords_stage3 %>%
    mutate({{ color_var }} := group,
      .data_stage = 3)

  # States 4 and 5 only relevant if there are two grouping variables

  if (two_group_var) {

  # State 4: Coloured, shaped ungrouped icon array
  # Keep the current position, but add a variable for the shape
  data_color_shape_order <- .data %>%
    arrange({{ color_var }}, {{ shape_var }})

  coords_stage4 <- coords_stage3 %>%
    mutate({{ color_var }} := data_color_shape_order[[color_var]],
           {{ shape_var }} := data_color_shape_order[[shape_var]])

  coords_list[[4]] <- coords_stage4 %>%
    mutate(.data_stage = 4)

  # State 5: Coloured, shaped grouped icon array
  coords_stage5 <- final_coords %>%
    separate(group,
             into = c(rlang::as_name(color_var), rlang::as_name(shape_var)),
             sep = "___",
             remove = FALSE)

  coords_list[[5]] <- coords_stage5 %>%
    mutate(.data_stage = 5)

  }

  # Set up the states to tween between - must all have the same columns, so only keep the ones relevant for positioning - the ones for mapping are grabbed again when each frame is generated
  data_tween_states <- coords_list %>%
    map(~ select(.x, y, x, group, width, offset, .data_stage) %>%
          mutate(group = as.character(group)))

  # Tween between the data states, with nframes as each transition, then split by frame
  tweens_data_list <- generate_group_by_tween_list(data_tween_states, nframes)

  # Set up the limits into groups to tween between
  # TODO: this is not quite right / good :)
  if (two_group_var) {
    limits_tween_states <- build_limits_list(
      xlims = c(xlim_init, xlim_init, xlim_final, xlim_final, xlim_final),
      ylims = c(ylim_init, ylim_init, ylim_final, ylim_final, ylim_final),
      id_name = "lim_id"
    )
  } else {
    limits_tween_states <- build_limits_list(
      xlims = c(xlim_init, xlim_init, xlim_final),
      ylims = c(ylim_init, ylim_init, ylim_final),
      id_name = "lim_id"
    )
  }

  # Tween between the limits, with nframes as each transition, then split by frame
  tweens_limits_list <- generate_group_by_tween_list(limits_tween_states, nframes)

  total_nframes <- length(tweens_limits_list)

  # Generate the frames, one for each tween
  walk(
    1:(total_nframes),
    function(i) {

      df <- tweens_data_list[[i]]

      # Add mapping information to data
      stage <- floor(unique(df[[".data_stage"]]))

      if (stage != 1) {
        stage_df <- coords_list[[stage]]
        stage_cols <- stage_df[!names(stage_df) %in% names(df)]
        df <- df %>%
          dplyr::bind_cols(stage_cols)
      }

      lims <- tweens_limits_list[[i]]
      xlim <- lims$xlim
      ylim <- lims$ylim

      title <- titles

      p <- plot_grouped_dataframe_sanddance(
        df, xlim, ylim,
        mapping = aes_with_group,
        title = title
      )

      print(p)
    }
  )

  # Return the final coordinates, with their grouping
  df %>%
    group_by(!!!map(group_vars_chr, sym))
}

## ==== utils from ggwaffle ======
# Source: https://github.com/liamgilbey/ggwaffle/blob/master/R/iron.R
# NOTE: Should double check about licensing / crediting of this code
#

#' Calculates the x,y, and other aesthetics
#'
#' @param data the dataframe to be visualized
#' @param mapping includes group and x, z.B.
#' @return dataframe with x, y, plus optional aesthetics columns
waffle_iron_groups <- function(data, mapping, rows = 7, sample_size = 1, na.rm = T) {

  if (!(sample_size > 0 & sample_size <= 1)) {
    stop("Please use a sample value between 0 and 1", call. = F)
  }

  sample_rows <- sample(x = 1:nrow(data), size = (nrow(data) *
    sample_size))
  data <- data[sample_rows, ]

  group_mapping <- NULL
  # if there's x or y mapping, split up `data`
  if ("x" %in% names(mapping)) {
    x_var <- mapping$x

    # recover group type
    group_mapping <- data %>%
      group_by(!!sym(x_var)) %>%
      group_keys() %>%
      rename(real_group = !!sym(x_var)) %>%
      mutate(group = row_number())

    data <- data %>%
      group_by(!!sym(x_var), .add = TRUE) %>%
      group_split()
    # group_split(!!sym(x_var)) # assuming x_var is string
  } else {
    data <- list(data)
  }

  # list version
  data <- map(data, ~ aes_d_rename(., mapping, c("group")))
  gen_grid <- function(data) {
    data <- data[order(data$group), ]
    grid_data <- expand.grid(y = 1:rows, x = seq_len((ceiling(nrow(data) / rows))))
    grid_data$group <- c(data$group, rep(NA, nrow(grid_data) - length(data$group)))
    # grid_data$group <- data$group
    if (na.rm == T) {
      grid_data <- grid_data[!is.na(grid_data$group), ]
    }
    return(grid_data)
  }

  res <- map_df(data, gen_grid)

  if (!is.null(group_mapping)) {
    if (is.numeric(res$group)) {
      res <- res %>%
        left_join(group_mapping, by = "group") %>%
        select(-.data$group) %>%
        rename(group = .data$real_group)
    }
  }


  # find the width of each group
  offsets <- res %>%
    group_by(.data$group) %>%
    summarize(width = max(.data$x) + 1) %>%
    mutate(offset = cumsum(.data$width)) %>%
    mutate(offset = lag(.data$offset, default = 0))

  res %>%
    left_join(offsets, by = "group") %>%
    mutate(x = .data$x + .data$offset) %>%
    mutate(y = rows - .data$y + 1)
}

# Rename columns in a dataset
#
# This function is designed to take a dataset and a data aesthetic mapping and rename the columns.
aes_d_rename <- function(data, mapping, compulsory_cols) {
  mapping <- aes_d_validate(mapping, compulsory_cols, names(data))
  # TODO: this doesn't consider duplicate mapping like `group` and `x`
  for (i in 1:length(mapping)) {
    names(data)[names(data) == mapping[i]] <- names(mapping)[i]
  }
  data
}

# Validate an \code{aes_d} mapping
#
# Don't just trust the user to provide the mappings we need
aes_d_validate <- function(mapping, compulsory_cols, data_names) {
  # missing columns
  missing_cols <- compulsory_cols[!compulsory_cols %in% names(mapping)]
  if (length(missing_cols) > 0) {
    example <- paste(paste(missing_cols, "= your_column"), collapse = ", ")
    error_message <- paste0("Please provide a mapping for the following columns: ", paste(missing_cols, collapse = ", "), "\n    For example:\n      aes_d(", example, ")")
    stop(error_message, call. = F)
  }
  # additional columns
  # can be x, y coord mappings
  additional_cols <- names(mapping)[!names(mapping) %in% c(compulsory_cols, "x")]
  if (length(additional_cols > 0)) {
    # ACHTUNG: removes "extra" aes; may need to expand to color, alpha, etc
    mapping <- mapping[names(mapping) %in% compulsory_cols]
    warning_message <- paste0("Columns have been supplied to aes_d but are not required:\n    ", paste(additional_cols, collapse = ", "))
    warning(warning_message, call. = F)
  }
  # incorrect columns
  incorrect_cols <- mapping[!mapping %in% data_names]
  if (length(incorrect_cols) > 0) {
    error_message <- paste0("Columns are not present in your dataset:\n    ", paste(incorrect_cols, collapse = ", "))
    stop(error_message, call. = F)
  }
  return(mapping)
}

#' Aesthetic mappings for datasets
#' Some sourcing, but not exact: https://github.com/liamgilbey/ggwaffle/blob/master/R/aes_d.R
#'
#' The idea comes straight from \code{aes} in ggplot2. That provides a way to map columns of a dataset to features of graphic.
#' Here we are mapping columns into a function so we can use standard names inside that function.
#'
#' A mapping looks like: <column_to_be_created> = <existing column>
#' @param ... Unquoted, comma-seperated column mappings
#' @examples
#' \dontrun{
#' aes_d(group = class)
#' }
aes_d <- function(...) {
  dots <- enquos(...)
  aes_cols <- map(dots, rlang::quo_get_expr)
  as.list(aes_cols)
  # as.list(match.call()[-1])
}

generate_group_by_tween_list <- function(states, nframes) {

  for(i in 1:length(states)) {

    if (i == 1) {
      tweens_df <- states[[i]] %>%
        keep_state(nframes) %>%
        tween_state(states[[i + 1]], nframes = nframes, ease = "linear")
    } else if (i < length(states)) {
      tweens_df <- tweens_df %>%
        keep_state(nframes) %>%
        tween_state(states[[i + 1]], nframes = nframes, ease = "linear")
    } else {
      tweens_df <- tweens_df %>%
        keep_state(nframes)
    }

  }

  split(tweens_df, tweens_df$.frame)
}
