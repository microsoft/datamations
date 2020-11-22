library(dmpkg)
library(magrittr)
library(rlang)
library(tidyverse)
library(devtools)
library(gganimate)
library(magick)
library(ggimage)
library(scales)

# pipeline <- "small_salary_data %>% group_by(Degree)"
# pipeline <- "mtcars %>% group_by(cyl)"
# pipeline <- "small_salary_data %>% group_by(Degree, Work)"
# pipeline <- "mtcars %>% group_by(cyl, vs)"
# pipeline <- "mtcars %>% group_by(cyl, vs, am)"
#
# pipeline <- "mtcars %>% summarize(Avg_MPG = mean(mpg), Max_MPG = max(mpg))"
#
# pipeline <- "small_salary_data %>% group_by(Degree) %>% group_by(Work)"
#
# pipeline <- "small_salary_data %>% group_by(Degree) %>% group_by(Work, .add = TRUE)"
# pipeline <- "small_salary_data %>% group_by(Degree, Work) %>% summarize(Avg_Salary = mean(Salary))"
#
# pipeline <- "mtcars"
# pipeline <- "mtcars %>% ungroup()"
# pipeline <- "mtcars %>% group_by(cyl) %>% group_by(gear, .add = TRUE) %>% ungroup() %>% group_by(carb, vs)"
# pipeline <- "mtcars %>% summarize(Avg_MPG = mean(mpg), Max_MPG = max(mpg, cyl))"
# pipeline <- "Formaldehyde %>% summarize(Avg_Carb = mean(carb), Max_Carb = max(carb, optden))"
# pipeline <- "Formaldehyde %>% summarize(Avg_Carb = mean(carb))"
# pipeline <- "Formaldehyde %>% summarize(Avg_Carb = mean(carb), Max_Carb = max(carb, optden), Max_Optden = max(optden))"
# "mtcars %>% ungroup() %>% summarize(Avg_MPG = mean(mpg), Max_MPG = max(mpg, cyl))" -> pipeline

# (mt <- mtcars %>% group_by(cyl) %>% slice(1:2) %>% ungroup() %>% select(mpg, cyl, am, hp))
#
# "mt %>% group_by(cyl) %>% summarize(Avg_MPG = mean(mpg), Max_HP = max(hp))" -> pipeline
#
# "mt %>% group_by(cyl, am) %>% summarize(Avg_MPG = mean(mpg), Max_HP = max(hp))" -> pipeline

# pipeline <- "s100 %>% group_by(Degree, Work) %>% summarize(Avg_Salary = mean(Salary))"


#' @importFrom dplyr any_of arrange bind_rows filter group_by group_size group_split group_vars is_grouped_df left_join mutate n n_groups pull select summarize ungroup group_indices
#' @importFrom gganimate anim_save ease_aes transition_states view_follow
#' @importFrom ggplot2 aes element_blank geom_point ggplot ggtitle scale_color_manual theme
#' @importFrom magick image_read image_write
#' @importFrom purrr accumulate flatten map map2 map2_dbl map2_dfr map_chr map_dbl map_dfr map_if pmap_dbl pmap_dfr reduce
#' @importFrom rlang parse_expr
#' @importFrom stats median
#' @importFrom tibble as_tibble tibble
