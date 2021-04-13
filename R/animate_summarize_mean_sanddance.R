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
  group_vars <- groups(.data)
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

  browser()

  # find the grouping variable
  group_vars <- attributes(.data)$groups %>%
    select(-.data$.rows) %>%
    names() # chr vector
  # names() %>%
  # first() # chr, assuming only one grouping variable
  color_var_chr <- first(group_vars) # ACHTUNG: actually there could be more

  # sharla NOTE: this is where multiple grouping variables are collapsed into one - so it's an issue if there's one where the values are separated by "_"
  grouped_facet_var <- paste(group_vars, collapse = "_")
  grouped_facet_sym <- sym(grouped_facet_var)

  .data <- .data %>%
    unite(!!grouped_facet_var, !!group_vars) # TODO: change factor levels here?

  fct_lvls <- .data %>%
    mutate(!!grouped_facet_var := factor({{ grouped_facet_sym }})) %>%
    pull(!!grouped_facet_var) %>%
    levels()
  if (length(fct_lvls) == 4) {
    fct_lvls <- fct_lvls[c(1, 3, 2, 4)]
  }

  .data <- .data %>%
    mutate(!!grouped_facet_var := factor({{ grouped_facet_sym }}, levels = fct_lvls)) %>%
    arrange(!!sym(grouped_facet_var)) %>%
    # ACHTUNG
    group_by(!!sym(grouped_facet_var))


  # quote the "response_var" -- Adv R 19.3
  res_var <- enexpr(response_var)
  res_var_chr <- as.character(res_var)


  # ===== first state: waffles ======
  waffle_aes <- aes_d(group = !!grouped_facet_var, x = !!grouped_facet_var)
  # x, y cols as integers
  coord_init <- .data %>%
    waffle_iron_groups(
      waffle_aes
    ) %>%
    ungroup() %>%
    mutate(id = row_number(), time = 1) %>%
    select(x, y, group, id, time) # ACHTUNG: there might be other aesthetics

  # Initial state is already grouped in this case - because that's the data from this stage

  # sharla NOTE: first step is waffles and limits are x: -2.75, 20.7 y: -5, 8.87 so not actually scaled to the data
  p_init <- plot_grouped_dataframe_sanddance(coord_init)
  # Saved at summary-init.png

  # add padding
  xlim_init <- layer_scales(p_init)$x$range$range
  xlim_init[1] <- xlim_init[1] - (xlim_init[2] - xlim_init[1]) / 4
  xlim_init[2] <- xlim_init[2] + (xlim_init[2] - xlim_init[1]) / 4
  ylim_init <- layer_scales(p_init)$y$range$range
  ylim_init[1] <- ylim_init[1] - (ylim_init[2] - ylim_init[1]) / 4
  ylim_init[2] <- ylim_init[2] + (ylim_init[2] - ylim_init[1]) / 4

  # ======= second state: scatter plot (?) ========
  # add id and time col for animation
  coord_inter <- .data %>%
    ungroup() %>%
    mutate(id = row_number(), time = 2) %>%
    group_by(!!sym(grouped_facet_var))

  # save the aesthetics for later
  aes_scatter <- aes(
    x = !!grouped_facet_var,
    y = !!res_var_chr,
    group = !!grouped_facet_var,
    color = !!color_var_chr
    # command = paste0("summarize(mean(", !!group_var, ")")
  )

  coord_inter <- iron_groups(
    coord_inter,
    aes_scatter,
    geom_point
  )

  categorical_vars <- coord_inter %>%
    ungroup() %>%
    select(where(~ !is.numeric(.))) %>%
    mutate_all(~ as.factor(.)) %>%
    mutate_all(funs(num = as.numeric(.)))

  if (is_empty(categorical_vars)) {
    var_levels <- NULL
  } else {
    var_levels <- categorical_vars %>%
      unique()
  }

  # Intermediate plot - starting to cluster the pints more
  p_inter <- ggplot(coord_inter) +
    # geom_beeswarm(aes(x, y))
    geom_quasirandom(aes(x, y))
  # sharla NOTE: clustered points here, with actual value scales
  # saved at summary-int.png

  p_inter_data <- layer_data(p_inter)
  # TODO: update coord_inter to beeswarm coords
  coord_inter$x <- p_inter_data$x
  class(coord_inter$x) <- c("numeric")
  coord_inter$y <- p_inter_data$y

  # get default x,y axis ranges while x is still a factor
  # p_inter <- plot_grouped_dataframe_withresponse_sanddance(
  # coord_inter, response_var = res_var
  # )

  xlim_inter <- layer_scales(p_inter)$x$range_c$range # continuous
  xlim_inter <- adjust_scale(xlim_inter)

  # xlim_inter[1] <- xlim_inter[1] - 0.5 # ACHTUNG
  # xlim_inter[2] <- xlim_inter[2] + 0.5
  ylim_inter <- layer_scales(p_inter)$y$range$range


  # if not numeric, cast x to numeric
  # coord_inter <- coord_inter %>%
  #   mutate(x = as.factor(x)) %>%
  #   mutate(x = as.numeric(x))
  # mutate_if(~ !is.numeric(.), as.numeric) %>%

  new_name <- c("mean")
  new_name <- setNames(new_name, as.character(res_var))

  ci_df <- boots_wrapper(.data, !!sym(grouped_facet_var), res_var_chr) %>%
    mutate(
      .lower = mean - (mean - .lower),
      .upper = (.upper - mean) + mean
    ) %>%
    rename(!!new_name)


  coord_final <- .data %>%
    summarize(mean = mean(!!res_var)) %>%
    # TODO: update to bootstrapped mean
    right_join(.data, by = grouped_facet_var) %>%
    select(-!!res_var) %>%
    dplyr::rename(!!new_name) %>%
    # works for dplyr v1.0.0
    ungroup() %>%
    mutate(id = row_number(), time = 3) %>%
    group_by(!!sym(grouped_facet_var))

  coord_final <- iron_groups(
    coord_final,
    aes(
      x = !!grouped_facet_var,
      y = !!res_var_chr,
      group = !!grouped_facet_var,
      color = !!color_var_chr
    ),
    geom_point
  )

  coord_final <- coord_final %>%
    # mutate(x = factor(x, levels = fct_lvls, ordered = TRUE)) %>%
    mutate(x = as.factor(x)) %>%
    mutate(x = as.numeric(x))

  # p_final <- plot_grouped_dataframe_withresponse_sanddance(
  #   coord_final, response_var = res_var
  # )

  # TODO: Is the goal of this to still show the range of the data?
  p_final <- ggplot(ci_df) +
    geom_pointrange(aes(!!sym(grouped_facet_var), !!sym(res_var_chr),
      ymin = .lower, ymax = .upper,
      color = !!sym(grouped_facet_var)
    ))
  # sharla NOTE: final plot is in summary-final.png

  xlim_final <- layer_scales(p_final)$x$range_c$range
  ylim_final <- layer_scales(p_final)$y$range$range
  # sharla NOTE: seems like final coordinates will be used somewhere

  ## ----- calculate offset ------
  # offset <- (ylim[2] - ylim[1]) * 1.2 + ylim[2]


  # coord_init <- coord_init %>%
  # mutate(y = offset  + y)

  # update ylim
  # xlim <- c(min(coord_init$x) - 1, max(coord_init$x) + 1)
  # ylim <- c(min(min(coord_inter$y), min(coord_init$y)) - 1, max(max(coord_init$y), max(coord_inter$y)) + 1)
  xlim <- NULL
  ylim <- NULL


  ## ------- walk the tweens -------

  total_nframes <- nframes * 6

  # sharla NOTE: these tweens are using the coordinates in the actual plots - so the first one is e.g. 1-20 and the second and third are the actual values (in the 85 - 90 range) - how is the difference rectified by the tweening?
  # # A tibble: 3 x 3
  # time mean_x mean_y
  # <dbl>  <dbl>  <dbl>
  # 1     1   8.13   4.05
  # 2     2   1.27  89.7
  # 3     3   1.28  89.7

  # combine the jitter plot df with mean df
  tween_list <- coord_init %>%
    bind_rows(coord_inter) %>%
    # tweens <- coord_inter %>%
    bind_rows(coord_final) %>%
    # select the relevant columns?
    select(id, time, x, y, group) %>% # ACHTUNG
    split(.$time)

  tweens <- tween_list$`1` %>%
    # 1. icon array, still
    tween_state(
      tween_list$`1`,
      ease = "linear", nframes = 1
    ) %>%
    keep_state(nframes = nframes - 1) %>%
    # 2. transition to scatter plot
    # sharla NOTE: this actually tweens right from the values of e.g. 7 to 80 - how comes it looks so smooth in the plot? i think because the axes aren't added until the end, but TODO to look at this!
    #   id time x        y   group .id     .phase .frame
    # 1  1  1.0 1  7.00000 Masters   1     static      1
    # 2  1  1.0 1  7.00000 Masters   1        raw      2
    # 3  1  1.5 1 44.47225 Masters   1 transition      3
    # 4  1  2.0 1 81.94450 Masters   1     static      4
    # 5  1  2.0 1 81.94450 Masters   1     static      5
    # 6  1  2.0 1 81.94450 Masters   1        raw      6
    tween_state(
      tween_list$`2`,
      ease = "linear", nframes = nframes
    ) %>%
    # 3. keep scatter plot
    keep_state(nframes) %>%
    # 4. transition to summary plot
    tween_state(
      tween_list$`3`,
      ease = "exponential-in-out", nframes = nframes # ACHTUNG
    ) %>%
    # 5, 6. keep summary up
    keep_state(nframes * 2) %>%
    split(.$.frame)

  tween_lims_list <- tribble(
    ~xlim, ~ylim, ~time,
    xlim_init, ylim_init, 1,
    xlim_inter, ylim_inter, 2,
    xlim_final, ylim_final, 3, # the final state, should have the same y range?
  ) %>%
    unnest(c(xlim, ylim)) %>%
    group_by(time) %>%
    mutate(id = row_number()) %>%
    ungroup() %>%
    split(.$time)


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

  tween_lims <- tween_lims_list$`1` %>%
    tween_state( # 1. icon array, still
      tween_lims_list$`1`,
      ease = "linear", nframes = nframes
    ) %>%
    # 2. transition to scatter plot, zoom
    tween_state(tween_lims_list$`2`,
      ease = "linear", nframes = nframes
    ) %>%
    keep_state(nframes) %>%
    # 3. keep scatter plot,
    keep_state(nframes) %>%
    # 4. transition to summary plot
    tween_state(tween_lims_list$`3`, # 5. transition to zoomed in summary plot
      ease = "exponential-in-out", nframes = nframes
    ) %>%
    keep_state(nframes) %>%
    # 6. keep summary up
    split(.$.frame)

  # decide what indices to walk with `output`
  # sharla NOTE: likely relevant from paper examples - I think we'll want to render all the frames, so not worrying about this
  walk_indices <- switch(output,
    both = 1:total_nframes,
    first = c(1:(nframes * 3), rep(nframes * 3, nframes)), # keep the last frame up for longer
    second = (nframes * 2 + 1):(nframes * 6)
  )


  walk(
    walk_indices, function(i) {
      grouped_tweens <- tweens[[i]] %>%
        group_by(group)
      # group_by(!!sym(group_var))


      lims <- tween_lims[[i]]
      xlim <- lims$xlim
      ylim <- lims$ylim

      # set up plot titles
      natural_group_vars <- paste(group_vars, collapse = " AND ")
      # BEGIN
      # title <- ""
      if ((i - 1) %/% nframes %in% c(0, 1, 2)) {
        # title <- paste0("Step 2: Next you plot the salary of each person\n            within each group")
        title <- titles[1]
        if (output == "second") {
          # title <- paste0("Step 3: Lastly you plot the average salary \n            of each group and zoom in")
          title <- titles[2]
        }
      } else {
        # title <- paste0("Step 3: Lastly you plot the average salary \n            of each group and zoom in")
        title <- titles[2]
      }
      # END

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
