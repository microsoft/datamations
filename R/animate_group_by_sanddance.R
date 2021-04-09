#' Produces frames (plots) of transition from ungrouped to grouped icon arrays
#'
#' @param .data the grouped dataframe TODO: or coords??????
#' @param ... the grouping variables
#' @return ggplot object
#' @importFrom rlang enquos sym .data :=
#' @importFrom purrr map_chr map_df walk
#' @importFrom dplyr first row_number tribble lag
#' @importFrom tidyr unite unnest
#' @importFrom ggplot2 layer_scales
#' @export
animate_group_by_sanddance <- function(.data, ..., nframes = 5, is_last = FALSE, titles = "") {

  # prep some mapping
  dots <- enquos(...)
  group_vars_chr <- map_chr(dots, rlang::quo_name)
  color_var_chr <- first(dots)
  grouped_facet_var <- paste(group_vars_chr, collapse = "_")
  grouped_facet_sym <- sym(grouped_facet_var)

  df <- .data

  # preprocess data
  .data <- .data %>%
    mutate(self = "id") %>%
    unite(!!grouped_facet_var, !!group_vars_chr, remove = FALSE)

  fct_lvls <- .data %>%
    mutate(!!grouped_facet_var := factor({{ grouped_facet_sym }})) %>%
    pull(!!grouped_facet_var) %>%
    levels()

  # TODO: I assume this is happening due to a preferred ordering of the degree/work example - check what happens without it
  if (length(fct_lvls) == 4) {
    fct_lvls <- fct_lvls[c(1, 3, 2, 4)]
  }

  .data <- .data %>%
    mutate(!!grouped_facet_var := factor(
      {{ grouped_facet_sym }},
      levels = fct_lvls
    )) %>%
    arrange(!!sym(grouped_facet_var))

  # initial frame
  #   with no color mapping
  init_coords <- .data %>%
    waffle_iron_groups(aes_d(group = self))

  # p_init <- plot_grouped_dataframe_sanddance(init_coords)
  # print(p_init)


  # final frame
  final_coords <- .data %>%
    waffle_iron_groups(
      aes_d(group = !!grouped_facet_var, x = !!grouped_facet_var)
    ) %>%
    ungroup() %>%
    mutate(id = row_number(), time = 2)

  # p_final <- plot_grouped_dataframe_sanddance(final_coords)
  # print(p_final)

  #  offset the prev step

  init_coords_offset <-
    init_coords %>%
    # mutate(y = y + max(final_coords$y) + 5) %>%
    ungroup() %>%
    mutate(id = row_number(), time = 1)


  p_init_offset <- plot_grouped_dataframe_sanddance(init_coords_offset)
  p_final <- plot_grouped_dataframe_sanddance(final_coords)
  # print(p_init_offset)

  # limits
  # xlim <- c(0, max(final_coords$x) + 1)
  # ylim <- c(0, max(init_coords_offset$y) + 1)
  xlim_init <- layer_scales(p_init_offset)$x$range$range
  ylim_init <- layer_scales(p_init_offset)$y$range$range
  xlim_init[1] <- xlim_init[1] - (xlim_init[2] - xlim_init[1]) / 4
  xlim_init[2] <- xlim_init[2] + (xlim_init[2] - xlim_init[1]) / 4
  ylim_init[1] <- ylim_init[1] - (ylim_init[2] - ylim_init[1]) / 4
  ylim_init[2] <- ylim_init[2] + (ylim_init[2] - ylim_init[1]) / 4

  xlim_final <- layer_scales(p_final)$x$range$range
  ylim_final <- layer_scales(p_final)$y$range$range
  xlim_final[1] <- xlim_final[1] - (xlim_final[2] - xlim_final[1]) / 4
  xlim_final[2] <- xlim_final[2] + (xlim_final[2] - xlim_final[1]) / 4
  ylim_final[1] <- ylim_final[1] - (ylim_final[2] - ylim_final[1]) / 4
  ylim_final[2] <- ylim_final[2] + (ylim_final[2] - ylim_final[1]) / 4


  # aesthetics mapping
  aes_with_group <- aes(group = !!grouped_facet_var, color = !!color_var_chr)

  # tweening between states ->
  # states:
  # 1 grey, ungrouped icon array layout
  # 2 colored, ungrouped icon array layout (keep state, but color 'em)
  # 3 colored, grouped icon array layout
  # tweens <- rbind(init_coords_offset, final_coords) %>%
  total_nframes <- 4 * nframes
  if (is_last) {
    total_nframes <- 5 * nframes
  }

  tweens <- init_coords_offset %>%
    ungroup() %>%
    bind_rows(init_coords_offset %>% mutate(time = 2, group = final_coords$group)) %>%
    bind_rows(final_coords %>% mutate(time = 3)) %>%
    split(.$time)

  tweens_df <- tweens$`1` %>%
    keep_state(nframes) %>%
    tween_state(tweens$`2`, nframes = 1, ease = "linear") %>%
    keep_state(nframes - 1) %>%
    tween_state(tweens$`3`, nframes = nframes, ease = "linear") %>%
    keep_state(ifelse(is_last, nframes * 2, nframes)) %>% # keep the icon array up for a bit
    split(.$.frame)

  tween_lims_list <- build_limits_list(
    xlims = c(xlim_init, xlim_init, xlim_final),
    ylims = c(ylim_init, ylim_init, ylim_final),
    id_name = "lim_id"
  )

  tween_lims <- tween_lims_list[[1]] %>%
    keep_state(nframes) %>%
    tween_state(tween_lims_list[[2]], nframes = nframes, ease = "linear") %>%
    tween_state(tween_lims_list[[3]], nframes = nframes, ease = "linear") %>%
    keep_state(ifelse(is_last, nframes * 2, nframes)) %>%
    # tweenr::tween_components(
    #   ease = "linear", nframes = total_nframes,
    #   id = lim_id, time = time
    # ) %>%
    split(.$.frame)

  walk(
    1:(total_nframes), function(i) {
      df <- tweens_df[[i]]
      lims <- tween_lims[[i]]
      xlim <- lims$xlim
      ylim <- lims$ylim

      if (!(i %in% 1:nframes)) {
        df <- df %>%
          group_by(.data$group)
      }

      # BEGIN ACHTUNG: hard-coding stuff for the experiment
      title <- titles
      # if (length(group_vars_chr) == 1){
      #   title <- "Step 1: Each dot shows one person\n            and each group shows degree type"
      # } else if (length(group_vars_chr) == 2) {
      #   title <- "Step 1: Each dot shows one person and each group\n            shows degree type AND work setting"
      # } else {
      #   stop("animate_group_by() was hard-coded for salary dataset")
      # }
      # END


      # natural_group_var_chr <- paste(group_vars_chr, collapse = " AND ")
      # title <- paste0("Step 1: Each dot shows one person\n            and each group shows ", natural_group_var_chr)


      print(plot_grouped_dataframe_sanddance(
        df, xlim, ylim,
        mapping = aes_with_group,
        title = title
      ))
    }
  )

  # return the final coordinates
  # final_coords
  df %>%
    group_by(!!!map(group_vars_chr, sym))
}

## ==== utils from ggwaffle ======

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
