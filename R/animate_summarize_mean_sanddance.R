#' @param .data
#' @param response_var quoted
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
animate_summarize_mean_sanddance <- function(.data, response_var, nframes = 5, output = "both", titles = "") {

  # START: same as animate_group_by_sanddance

  # Map grouping variables
  group_vars <- dplyr::groups(.data)
  # Count number of groups
  n_groups <- length(group_vars)

  # Use the first grouping variable for colour
  color_var <- first(group_vars)
  # And the second for the shape
  shape_var <- dplyr::nth(group_vars, n = 2)

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
    unite({{ group_vars_combined }}, group_vars_chr, sep = "___", remove = FALSE)

  # Pull levels of combined grouping variable and set them
  fct_lvls <- .data %>%
    arrange({{ group_vars_combined }}) %>%
    pull({{ group_vars_combined }}) %>%
    unique()

  .data <- .data %>%
    mutate({{ group_vars_combined }} := factor({{ group_vars_combined }}, levels = fct_lvls)) %>%
    arrange({{ group_vars_combined }})

  # END: same as animate_group_by_sanddance()

  # Create data for stages

  coords_list <- vector("list", length = 3)

  # State 1: Coloured (and shaped if 2 groups), grouped icon array

  coords_stage1 <- .data %>%
      waffle_iron_groups(
        aes_d(group = {{group_vars_combined}}, x = {{group_vars_combined}})
      ) %>%
      separate(group,
               into = group_vars_chr,
               sep = "___",
               remove = FALSE)

  coords_list[[1]] <- coords_stage1 %>%
    select(-width, -offset) %>%
    mutate(.data_stage = 1)

  # State 2: Scatter plot, coloured (and shaped)

  coords_stage2 <- .data %>%
    select(x = {{ group_vars_combined }}, y = {{ response_var }}) %>%
    mutate(group = x) %>%
    separate(group,
             into = group_vars_chr,
             sep = "___",
             remove = FALSE)

  coords_list[[2]] <- coords_stage2 %>%
    mutate(.data_stage = 2)

  # State 3: Summary plot, coloured (and shaped)
  coords_stage3 <- coords_stage2 %>%
    group_by(group) %>%
    dplyr::summarise(y = mean(y)) %>%
    mutate(x = group) %>%
    separate(group,
             into = group_vars_chr,
             sep = "___",
             remove = FALSE)

  coords_list[[3]] <- coords_stage3 %>%
    mutate(.data_stage = 3)

  # Set up the states to tween between - must all have the same columns, so only keep the ones relevant for positioning - the ones for mapping are grabbed again when each frame is generated

  data_tween_states <- coords_list %>%
    map(~ select(.x, y, x, group, .data_stage) %>%
          mutate(group = as.character(group),
                 x = as.character(x)))

  # Tween between the data states, with nframes as each transition, then split by frame
  tweens_data_list <- generate_summarise_tween_list(data_tween_states, nframes)

  # TODO: ACTUAL PLOTS!
  # Generate plots of each stage to grab limits for tweening
  browser()
  p_init <- plot_grouped_dataframe_sanddance(coords_list[[1]])
  p_intermediate <- plot_grouped_dataframe_sanddance(coords_list[[2]])
  p_final <- plot_grouped_dataframe_sanddance(coords_list[[3]])

  # Pad coordinates to give more space
  lims_init <- pad_limits(p_init)
  xlim_init <- lims_init[["xlim"]]
  ylim_init <- lims_init[["ylim"]]

  lims_intermediate <- pad_limits(p_intermediate)
  xlim_intermediate <- lims_intermediate[["xlim"]]
  ylim_intermediate <- lims_intermediate[["ylim"]]

  lims_final <- pad_limits(p_final)
  xlim_final <- lims_final[["xlim"]]
  ylim_final <- lims_final[["ylim"]]

  # Set up the limits into groups to tween between
    limits_tween_states <- build_limits_list(
      xlims = c(xlim_init, xlim_intermediate, xlim_final),
      ylims = c(ylim_init, ylim_intermediate, ylim_final),
      id_name = "lim_id"
    )

    # Tween between the limits, with nframes as each transition, then split by frame
    tweens_limits_list <- generate_summarise_tween_list(limits_tween_states, nframes)

    total_nframes <- length(tweens_limits_list)

  # sharla NOTE: at the same time the data is tweened, the axes are too
  # which is why you don't see any big jumps - it's happening at the same time the data is being tweened
  # there definitely is some magic going on here to make sure that the number of frames line up between the data tweening and the axis tweening
  # also, the axes are only being SHOWN at a certain point so that the tweening is not so obvious
  # between the waffle chart and scatter plot it's not shown, likely controlled by the different plotting options below
  # and likely the calculations on which plotting function to use corresponds to here, i.e. changing once a tweening state is no longest held
  # just to solidify the numbers/stages below:
  # 1. icon array, nframes
  # 2. transition to scatter plot, nframes (total = 2 * n)
  # 3. hold scatter, nframes (total = 3 * n)
  # 4. transition to summary plot, nframes (total = 4 * n) TODO: what is this stage?
  # 5. transition to zoomed summary, nframes (total = 5 * n)
  # 6. hold zoomed summary, nframes (total = 6 * n)

  # I had set nframes = 2 here, and the total number of frames from the tweening pipelines is 12 so the math adds up - good!
  # I would rather have the logic of which plotting function to use be based on stages than the frame count, I think, because something like `(i - 1) %/% nframes %in% 2:3` is hard to understand (I don't yet!) but now I at least know why those different logical bits are coming in -- ^^^ each of these stages likely has a different plotting function controlling it!

  walk(
    1:(total_nframes), function(i) {

      browser()

      df <- tweens_data_list[[i]]

      # Add mapping information to data
      stage <- floor(unique(df[[".data_stage"]]))

      stage_df <- coords_list[[stage]]
      stage_cols <- stage_df[!names(stage_df) %in% names(df)]
      df <- df %>%
        dplyr::bind_cols(stage_cols)

      lims <- tweens_limits_list[[i]]
      xlim <- lims$xlim
      ylim <- lims$ylim

      title <- titles

      if (i <= nframes * 2) {
        # sharla NOTE: stages 1 and 2
        # nframes <- 2
        # (i <- 1:(nframes*6))
        # #>  [1]  1  2  3  4  5  6  7  8  9 10 11 12
        # i <= nframes*2
        # #>  [1]  TRUE  TRUE  TRUE  TRUE FALSE FALSE FALSE FALSE FALSE FALSE FALSE FALSE

        print(plot_grouped_dataframe_sanddance(
          grouped_tweens, xlim, ylim,
          is_coord_equal = ifelse(i <= nframes, TRUE, FALSE),
          mapping = aes_scatter,
          in_flight = (i - 1) %/% nframes == 1,
          title = title
        ))
      } else if ((i - 1) %/% nframes %in% 2:3) {
        # sharla NOTE: stages 3 and 4
        # nframes <- 2
        # (i <- 1:(nframes*6))
        # #>  [1]  1  2  3  4  5  6  7  8  9 10 11 12
        # (i - 1) %/% nframes
        # #>  [1] 0 0 1 1 2 2 3 3 4 4 5 5
        # (i - 1) %/% nframes %in% 2:3
        # #>  [1] FALSE FALSE FALSE FALSE  TRUE  TRUE  TRUE  TRUE FALSE FALSE FALSE FALSE
        print(plot_grouped_dataframe_withresponse_sanddance(
          grouped_tweens,
          response_var = res_var,
          xlim = xlim, ylim = ylim,
          mapping = aes_scatter,
          var_levels = var_levels,
          in_flight = FALSE,
          title = title
        ))
      } else {
        ci_df <- ci_df %>%
          separate(!!sym(grouped_facet_var), into = group_vars, remove = FALSE) %>%
          mutate(!!grouped_facet_var := factor({{ grouped_facet_sym }}, levels = fct_lvls))

        xlabels <- ci_df %>%
          group_by(!!grouped_facet_sym) %>%
          group_keys() %>%
          pull(!!grouped_facet_sym) %>%
          str_replace("_", " in\n")
        # TODO - probably not desirable in the long run, hard coded for specific example
        # Might make more sense to actually have the variables, e.g. "Degree: Masters \n Work: Industry"


        if ((i - 1) %/% nframes == 4) {
          # sharla NOTE: 5th stage

          p <- ggplot(ci_df) +
            geom_pointrange(aes(!!sym(grouped_facet_var), !!sym(res_var_chr),
              ymin = .lower, ymax = .upper,
              color = !!sym(color_var_chr)
            )) +
            theme_inflight(TRUE) + # sharla NOTE: a more minimal theme, but doesn't seem much different than what's used in the sixth phase
            coord_cartesian(x = xlim, ylim = ylim) +
            scale_y_continuous(labels = label_dollar(prefix = "$", suffix = "k"))
        } else {
          # sharla NOTE: 6th stage
          p <- ggplot(ci_df) +
            geom_pointrange(aes(!!sym(grouped_facet_var), !!sym(res_var_chr),
              ymin = .lower, ymax = .upper,
              color = !!sym(color_var_chr)
            )) +
            theme(
              panel.background = element_rect(fill = "white", colour = "grey50"),
              legend.key = element_rect(fill = "white"),
              legend.position = "bottom"
            ) +
            coord_cartesian(x = xlim, ylim = ylim) +
            scale_y_continuous(labels = label_dollar(prefix = "$", suffix = "k"))
        }

        p <- p +
          xlab(str_replace(grouped_facet_var, "_", " and ")) +
          scale_x_discrete(labels = xlabels) + # don't need `breaks` apparently
          labs(title = title)

        print(p)
      }
    }
  )
}


#' Helper fn to update df colnames with mapping information
#' Similar to waffle_iron_*
#' @param data
#' @param mapping created by aes_d
iron_groups <- function(.data, mapping, geom) { # ACHTUNG: decide about geom

  # this function doesn't consider color aes
  if ("colour" %in% names(mapping)) {
    mapping$colour <- NULL
  }

  m_chr <- map_chr(mapping, as.character)

  # ACHTUNG: not generalizable
  x_mapping <- m_chr[match("x", names(m_chr))]
  group_mapping <- m_chr[-match(c("x"), names(m_chr))]
  # group_mapping <- m_chr[match("group", names(m_chr))]

  # END
  var_idx <- match(m_chr, names(.data))
  # col_idx <- match(c("x", "y", "group", "id", "time"), names(m_chr))
  var_idx <- var_idx[!is.na(var_idx)]
  col_idx <- c(var_idx, match(c("id", "time"), names(.data)))

  # select only the relevant cols and create dupes for x, group, zB
  sub_df <- .data[, col_idx]
  sub_df %>%
    rename(x_mapping) %>%
    rename(group_mapping)
}

generate_summarise_tween_list <- function(states, nframes) {

    for(i in 1:length(states)) {

    if (i == 1) {
      tweens_df <- states[[i]] %>%
        keep_state(nframes) %>%
        tween_state(states[[i + 1]], nframes = nframes, ease = "linear")
    } else if (i == 2) {
      tweens_df <- tweens_df %>%
        keep_state(nframes) %>%
        tween_state(states[[i + 1]], nframes = nframes, ease = "exponential-in-out")
    } else if (i == 3) {
      tweens_df <- tweens_df %>%
        keep_state(nframes)
    }

  }

  split(tweens_df, tweens_df$.frame)
}
