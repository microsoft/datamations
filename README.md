
<!-- README.md is generated from README.Rmd. Please edit that file -->

# datamations

<!-- badges: start -->

[![R-CMD-check](https://github.com/microsoft/datamations/workflows/R-CMD-check/badge.svg)](https://github.com/microsoft/datamations/actions)
<!-- badges: end -->

datamations is a framework for the automatic generation of explanation
of the steps of an analysis pipeline. It automatically turns code into
animations, showing the state of the data at each step of an analysis.

For more information, please visit the [package
website](https://microsoft.github.io/datamations/), which includes
[additional
examples](https://microsoft.github.io/datamations/articles/Examples.html),
[defaults and
conventions](https://microsoft.github.io/datamations/articles/details.html),
and more.

## Installation

You can install datamations from GitHub with:

``` r
# install.packages("devtools")
devtools::install_github("microsoft/datamations")
```

## Usage

To get started, load datamations and dplyr:

A datamation shows a plot of what the data looks like at each step of a
tidyverse pipeline, animated by the transitions that lead to each state.
The following shows an example taking the built-in `small_salary` data
set, grouping by `Degree`, and calculating the mean `Salary`.

First, define the code for the pipeline, then generate the datamation
with `datamation_sanddance()`:

``` r
library(datamations)
library(dplyr)

"small_salary %>% 
  group_by(Degree) %>%
  summarize(mean = mean(Salary))" %>%
  datamation_sanddance()
```

<img src="man/figures/README-mean_salary_group_by_degree.gif" width="80%" />

datamations supports the following `dplyr` functions:

-   `group_by()` (up to three grouping variables)
-   `summarize()`/`summarise()` (limited to summarizing one variable)
-   `filter()`
-   `count()`
