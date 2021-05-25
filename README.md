
<!-- README.md is generated from README.Rmd. Please edit that file -->

# datamations

<!-- badges: start -->

[![R-CMD-check](https://github.com/jhofman/datamations/workflows/R-CMD-check/badge.svg)](https://github.com/jhofman/datamations/actions)
<!-- badges: end -->

datamations is a framework for automatic generation of explanation of
plots and tables from analysis code. It automatically turns code into
animations, showing the steps that led to a plot or a table.

## Installation

You can install datamations from GitHub with:

``` r
# install.packages("devtools")
devtools::install_github("jhofman/datamations")
```

## Usage

To get started, load datamations and dplyr:

``` r
library(datamations)
library(dplyr)
```

### Plot-based datamations

A plot-based datamation shows a plot of what the data looks like at each
step of a pipeline, animated by the transitions that lead to each state.
The following shows an example taking the built-in `small_salary` data
set, grouping by `Degree`, and calculating the mean `Salary`.

First, define the code for the pipeline, then generate the datamation
with `datamation_sanddance()`:

``` r
"small_salary %>% group_by(Degree) %>% summarize(mean = mean(Salary))" %>%
  datamation_sanddance()
```

<img src="man/figures/README-mean_salary_group_by_degree.gif" width="80%" />

You can group by multiple variables, as in this example, grouping by
`Degree` and `Work` before calculating the mean `Salary`:

``` r
"small_salary %>% group_by(Degree, Work) %>% summarize(mean = mean(Salary))" %>%
  datamation_sanddance()
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
  pipeline = "small_salary %>% group_by(Degree) %>% summarize(mean = mean(Salary))",
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

<img src="man/figures/README-mtcars_group_cyl.gif" width="80%" />
