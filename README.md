
<!-- README.md is generated from README.Rmd. Please edit that file -->

# datamations

## Installation

You can install datamations from GitHub with:

``` r
# install.packages("devtools")
devtools::install_github("jhofman/datamations)
```

## Usage

To get started, load datamations and the tidyverse (for its operations
to animate):

``` r
library(datamations)
library(tidyverse)
```

### Plot-based datamations

In plot-based datamations, the datamation shows a plot of what the data
looks like at each step of a pipeline. The following shows an example
taking the built-in `small_salary` data set, grouping by `Degree`, and
calculating the mean `Salary`.

First, define the code for the pipeline, and titles for each of the
steps:

``` r
mean_salary_by_degree_pipe <- "small_salary %>% group_by(Degree) %>% summarize(mean = mean(Salary))"

degree_title_step1 <- "Step 1: Each dot shows one person\n and each group shows degree type"
degree_title_step2 <- "Step 2: Next you plot the salary of each person\n within each group"
degree_title_step3 <- "Step 3: Lastly you plot the average salary \n of each group and zoom in"
```

And generate the datamation with `datamation_sanddance()`:

``` r
datamation_sanddance(
  pipeline = mean_salary_by_degree_pipe,
  output = "mean_salary_group_by_degree.gif",
  titles = c(degree_title_step1, degree_title_step2, degree_title_step3),
  nframes = 30
)
```

<img src="man/figures/README-mean_salary_group_by_degree.gif" width="80%" />

You can group by multiple variables, as in this example, grouping by
`Degree` and `Work` before calculating the mean `Salary`:

``` r
mean_salary_by_degree_work <- "small_salary %>% group_by(Degree, Work) %>% summarize(mean = mean(Salary))"
work_degree_title_step1 <- "Step 1: Each dot shows one person and each group\n shows degree type AND work setting"
```

``` r
datamation_sanddance(
  pipeline = mean_salary_by_degree_work,
  output = "mean_salary_group_by_degree_work.gif",
  titles = c(work_degree_title_step1, degree_title_step2, degree_title_step3),
  nframes = 30
)
```

<img src="man/figures/README-mean_salary_group_by_degree_work.gif" width="80%" />

### Table-based datamations

A table-based datamation shows a mock table of what the data looks like
at each step of pipeline. The following shows our same first example:
taking the built-in `small_salary` data set, grouping by `Degree`, and
calculating the mean `Salary`, using the same pipeline and titles.

You can generate a table-based datamation with `datamation_tibble()`:

``` r
datamation_tibble(
  pipeline = mean_salary_by_degree_pipe,
  output = "mean_salary_group_by_degree.gif"
)
```

<img src="man/figures/README-mean_salary_group_by_degree-table.gif" width="80%" />

``` r
# The command below takes 20 seconds to execute on my machine
pipeline <- "small_salary_data %>% group_by(Degree)"
dmpkg::datamation_tibble(pipeline, output = "salary_group_degree.gif")

# The command below takes 40 seconds to execute on my machine
pipeline <- "mtcars %>% group_by(cyl)"
dmpkg::datamation_tibble(pipeline, output = "mtcars_group_cyl.gif")

# The command below takes 50 seconds to execute on my machine
pipeline <- "small_salary_data %>% group_by(Degree, Work) %>% summarize(Avg_Salary = mean(Salary))"
dmpkg::datamation_tibble(pipeline, output = "salary_group2_summarize_mean.gif")

# The command below takes 50 seconds to execute on my machine
pipeline <- "small_salary_data %>% group_by(Degree, Work) %>% summarize(Avg_Salary = mean(Salary))"
dmpkg::datamation_tibble(pipeline,
  output = "salary_group2_summarize_mean.gif",
  titles = c(
    "Grouping by Degree and Work",
    "Calculating the Mean of Each Group"
  )
)
```
