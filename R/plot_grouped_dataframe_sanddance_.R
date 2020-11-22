#' Plot grouped dataframe, in sanddance style (icon array). Should look like a bunch of icon
#' arrays spaced out along x axis. 
#'
#' @param coords with x, y, plus optional aesthetics columns
#' @import ggplot2
#' @importFrom stringr str_split
#' @return ggplot object
plot_grouped_dataframe_sanddance <- function(
  coords, xlim = NULL, ylim = NULL, is_coord_equal = TRUE, 
  mapping = NULL, in_flight = FALSE, title = ""
) {
  
  # init ggplot obj
    p <- NULL
    
    group_var <- attributes(coords)$groups %>% 
        names() %>% 
        first() # chr, 
    
    
    # recover the 
    if (! is.null(group_var)) {
      if (length(str_split(mapping$group, "_")) == 1){
        coords <- coords %>% 
          separate(
            group, 
            into = str_split(mapping$group, "_")[[1]], 
            remove = FALSE
        )
      } else if (length(str_split(mapping$group, "_")) > 1) {
        stop("Too many grouping vars for icon array")
      }
    }
    
    
    
    modded_waffle_theme <- theme(
        line = element_line(color = "white"),
        text = element_text(color = "white"),
        rect = element_rect(color = "white"),
        title = element_text(color = "white"),
        panel.grid = element_blank(),
        panel.border = element_blank(),
        panel.background = element_blank(),
        axis.text = element_text(color = "white"),
        axis.title = element_text(color = "white"),
        axis.ticks = element_blank(),
        # axis.line = element_blank(),
        legend.text=element_text(color = "black"),
        legend.key = element_rect(fill = "white"),
        legend.title=element_text(color = "black"),
        # axis.ticks.length = unit(0, "null"),
        # plot.title = element_text(size = 18),
        plot.background = element_blank(),
        # panel.spacing = unit(c(0, 0, 0, 0), "null")
        legend.position = "bottom"
    )
    
    # modded_waffle_theme <- theme(panel.background = element_rect(fill = "white", colour = "grey50")) 
      
    # if ungrouped
    if (is.null(group_var)) {
        p <- ggplot(coords) +
            # geom_point(aes(x, y), color = "grey", shape = 15, size = 3) +
            geom_point(aes(x, y), color = "grey") +
            modded_waffle_theme 
    } else {
      # if grouped
      
      # generate annotations for grouped icon arrays
      # assuming two grouping vars: one is color, the other one goes onto the x axis
      
      grouping_vars <- str_split(mapping$group, "_")[[1]] #$x?
      color <- mapping$colour
      
      if ("quosure" %in% class(color)) {
        color <- as_label(color)
      }
      
      x_group <-  setdiff(grouping_vars, color)
      
      xlab_df <- NULL
      
      if ( length(x_group) == 1) {
        xlab_df <- coords %>% 
          group_by(!!sym(x_group)) %>% 
          summarize(midpoint = mean(x), left = min(x), right = max(x))
      } else if (length(x_group) > 1) {
        stop("Too many grouping vars for grouped icon arrays")
      }
      
      # arg passing madness: sometimes it's not a char
      if (is.character(color)) {
        color <- sym(color)
      }
      
      p <- ggplot(coords) +
        geom_point(aes(x, y, color = {{ color }})) +
        modded_waffle_theme +
        labs(color = `$`(mapping, colour))
      
      if ( (! is.null(xlab_df)) & (! in_flight)) {
        xbreaks <- xlab_df$midpoint
        
        xlabels <- xlab_df %>% 
          pull(!!sym(x_group)) 
        
        xlab_df <-  xlab_df %>% 
          mutate(y = 0) %>% 
          pivot_longer(cols = c("left", "right"), names_to = NULL, values_to = "x")
        
        p <- p + 
          geom_line(
            data = xlab_df, 
            mapping = aes(x,y,group = !!sym(x_group)),
            color = "grey",
            size = 1
          ) + 
          scale_x_continuous(breaks = xbreaks, labels = xlabels) + 
          theme(axis.text.x = element_text(color = "black")) 
      }
    }
    
    p <- p + 
      labs(title = title) +
      theme(plot.title = element_text(color = "Black"))
    
    if (is_coord_equal){
        p + coord_equal(xlim = xlim, ylim = ylim)
    } else {
        p + coord_cartesian(xlim = xlim, ylim = ylim)
    }
}

