#'
#'
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

  # find the grouping variable
  group_vars <- attributes(.data)$groups %>%
    select(-.data$.rows) %>%
    names() # chr vector
  # names() %>%
  # first() # chr, assuming only one grouping variable
  color_var_chr <- first(group_vars) # ACHTUNG: actually there could be more

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
    arrange(!!sym(grouped_facet_var)) %>% # ACHTUNG
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
    select(.data$x, .data$y, .data$group, .data$id, .data$time) # ACHTUNG: there might be other aesthetics
  # waffle_iron output: "y"      "x"      "group"  "width"  "offset" "id"     "time"

  # save types before casting them all to integers
  # also order the factors
  # fct_lvls <- coord_init %>%
  #   mutate(group = as.factor(group)) %>%
  #   pull(group) %>%
  #   levels()
  #
  # if (length(fct_lvls) == 4) {
  #   fct_lvls <- fct_lvls[c(1,3,2,4)]
  #   coord_init <- coord_init %>%
  #     mutate(group = factor(group, levels = fct_lvls, ordered = TRUE)) %>%
  #     arrange(group)
  # }



  p_init <- plot_grouped_dataframe_sanddance(coord_init)

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
    select(tidyselect:::where(~ !is.numeric(.))) %>%
    mutate_all(~ as.factor(.)) %>%
    mutate_all(funs(num = as.numeric(.)))

  if (is_empty(categorical_vars)) {
    var_levels <- NULL
  } else {
    var_levels <- categorical_vars %>%
      unique()
  }


  p_inter <- ggplot(coord_inter) +
    # geom_beeswarm(aes(x, y))
    geom_quasirandom(aes(.data$x, .data$y))


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
      .lower = mean - (mean - .data$.lower),
      .upper = (.data$.upper - mean) + mean
    ) %>%
    rename(!!new_name)


  coord_final <- .data %>%
    summarize(mean = mean(!!res_var)) %>% # TODO: update to bootstrapped mean
    right_join(.data, by = grouped_facet_var) %>%
    select(-!!res_var) %>%
    dplyr::rename(!!new_name) %>% # works for dplyr v1.0.0
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
    mutate(x = as.factor(.data$x)) %>%
    mutate(x = as.numeric(.data$x))

  # p_final <- plot_grouped_dataframe_withresponse_sanddance(
  #   coord_final, response_var = res_var
  # )

  p_final <- ggplot(ci_df) +
    geom_pointrange(aes(!!sym(grouped_facet_var), !!sym(res_var_chr),
      ymin = .data$.lower, ymax = .data$.upper,
      color = !!sym(grouped_facet_var)
    ))

  xlim_final <- layer_scales(p_final)$x$range_c$range
  ylim_final <- layer_scales(p_final)$y$range$range

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


  # combine the jitter plot df with mean df
  tween_list <- coord_init %>%
    bind_rows(coord_inter) %>%
    # tweens <- coord_inter %>%
    bind_rows(coord_final) %>%
    # select the relevant columns?
    select(.data$id, .data$time, .data$x, .data$y, .data$group) %>% # ACHTUNG
    split(.$time)

  tweens <- tween_list$`1` %>%
    # 1. icon array, still
    tween_state(
      tween_list$`1`,
      ease = "linear", nframes = 1
    ) %>%
    keep_state(nframes = nframes - 1) %>%
    # 2. transition to scatter plot
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
    group_by(.data$time) %>%
    mutate(id = row_number()) %>%
    ungroup() %>%
    split(.$time)


  tween_lims <- tween_lims_list$`1` %>%
    tween_state( # 1. icon array, still
      tween_lims_list$`1`,
      ease = "linear", nframes = nframes
    ) %>% # 2. transition to scatter plot, zoom
    tween_state(tween_lims_list$`2`,
      ease = "linear", nframes = nframes
    ) %>%
    keep_state(nframes) %>% # 3. keep scatter plot,
    keep_state(nframes) %>% # 4. transition to summary plot
    tween_state(tween_lims_list$`3`, # 5. transition to zoomed in summary plot
      ease = "exponential-in-out", nframes = nframes
    ) %>%
    keep_state(nframes) %>% # 6. keep summary up
    split(.$.frame)


  # decide what indices to walk with `output`
  walk_indices <- switch(output,
    both = 1:total_nframes,
    first = c(1:(nframes * 3), rep(nframes * 3, nframes)), # keep the last frame up for longer
    second = (nframes * 2 + 1):(nframes * 6)
  )


  walk(
    walk_indices, function(i) {
      grouped_tweens <- tweens[[i]] %>%
        group_by(.data$group)
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
        print(plot_grouped_dataframe_sanddance(
          grouped_tweens, xlim, ylim,
          is_coord_equal = ifelse(i <= nframes, TRUE, FALSE),
          mapping = aes_scatter,
          in_flight = (i - 1) %/% nframes == 1,
          title = title
        ))
      } else if ((i - 1) %/% nframes %in% 2:3) {
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


        if ((i - 1) %/% nframes == 4) {
          p <- ggplot(ci_df) +
            geom_pointrange(aes(!!sym(grouped_facet_var), !!sym(res_var_chr),
              ymin = .data$.lower, ymax = .data$.upper,
              color = !!sym(color_var_chr)
            )) +
            theme_inflight(TRUE) +
            coord_cartesian(xlim = xlim, ylim = ylim) +
            scale_y_continuous(labels = label_dollar(prefix = "$", suffix = "k"))
        } else {
          p <- ggplot(ci_df) +
            geom_pointrange(aes(!!sym(grouped_facet_var), !!sym(res_var_chr),
              ymin = .data$.lower, ymax = .data$.upper,
              color = !!sym(color_var_chr)
            )) +
            theme(
              panel.background = element_rect(fill = "white", colour = "grey50"),
              legend.key = element_rect(fill = "white"),
              legend.position = "bottom"
            ) +
            coord_cartesian(xlim = xlim, ylim = ylim) +
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
