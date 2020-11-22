
<!-- README.md is generated from README.Rmd. Please edit that file -->

# dmpkg

## Example

``` r
library(dmpkg)
library(tidyverse)

pipeline <- "small_salary_data %>% group_by(Degree)"
dmpkg::datamation_tibble(pipeline, output = "salary_group_degree.gif")

pipeline <- "mtcars %>% group_by(cyl)"
dmpkg::datamation_tibble(pipeline, output = "mtcars_group_cyl.gif")

pipeline <- "small_salary_data %>% group_by(Degree, Work) %>% summarize(Avg_Salary = mean(Salary))"
dmpkg::datamation_tibble(pipeline, output = "salary_group2_summarize_mean.gif")
```
