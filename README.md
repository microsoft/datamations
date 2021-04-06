
<!-- README.md is generated from README.Rmd. Please edit that file -->

# datamations

datamations is a framework for automatic generation of explanation of
plots and tables from analysis code. It automatically turns code into
animations, showing the steps that led to a plot or a table.

## Installation

You can install datamations from GitHub with:

``` r
# install.packages("devtools")
devtools::install_github("jhofman/datamations)
```

## Usage

To get started, load datamations and the tidyverse:

``` r
library(datamations)
library(tidyverse)
```

### Plot-based datamations

A plot-based datamation shows a plot of what the data looks like at each
step of a pipeline, animated by the transitions that lead to each state.
The following shows an example taking the built-in `small_salary` data
set, grouping by `Degree`, and calculating the mean `Salary`.

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
at each step of pipeline, again animated by the transitions that lead to
each state. The following shows our same first example: taking the
built-in `small_salary` data set, grouping by `Degree`, and calculating
the mean `Salary`, using the same pipeline.

You can generate a table-based datamation with `datamation_tibble()`:

``` r
datamation_tibble(
  pipeline = mean_salary_by_degree_pipe,
  output = "mean_salary_group_by_degree.gif"
)
```

<img src="man/figures/README-mean_salary_group_by_degree-table.gif" width="80%" />

Datamations work on any dataset provided, as in this example taking
`mtcars` and grouping by `cyl`:

``` r
mtcars_group_cyl <- "mtcars %>% group_by(cyl)"
datamation_tibble(mtcars_group_cyl, output = "mtcars_group_cyl.gif")
```

<img src="/Users/sharla/Documents/Consulting/Microsoft/datamations/man/figures/README-mtcars_group_cyl.gif" width="80%" />
