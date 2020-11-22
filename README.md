
<!-- README.md is generated from README.Rmd. Please edit that file -->

dmpkg
=====

    library(dmpkg)
    library(tidyverse)

Examples for Plot-based Datamations
-----------------------------------

    saveGIF({
      small_salary %>%
        animate_group_by_sanddance(Degree, nframes = 30) %>%
        animate_summarize_mean_sanddance(Salary, nframes = 30)
    }, movie.name="Degree_two_colors.gif", interval = 0.1, ani.width = 500, ani.height = 350, ani.res = 100)


    saveGIF({
      small_salary %>%
        animate_group_by_sanddance(Degree, Work, nframes = 30) %>%
        animate_summarize_mean_sanddance(Salary, nframes = 30)
    }, movie.name="Work_Degree_two_colors.gif", interval = 0.1, ani.width = 500, ani.height = 350, ani.res= 100)

Examples for Table-based Datamations
------------------------------------

    pipeline <- "small_salary_data %>% group_by(Degree)"
    dmpkg::datamation_tibble(pipeline, output = "salary_group_degree.gif")

    pipeline <- "mtcars %>% group_by(cyl)"
    dmpkg::datamation_tibble(pipeline, output = "mtcars_group_cyl.gif")

    pipeline <- "small_salary_data %>% group_by(Degree, Work) %>% summarize(Avg_Salary = mean(Salary))"
    dmpkg::datamation_tibble(pipeline, output = "salary_group2_summarize_mean.gif")
