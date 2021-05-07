
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

First, define the code for the pipeline, then generate the datamation
with `datamation_sanddance()`:

``` r
"small_salary %>% group_by(Degree) %>% summarize(mean = mean(Salary))" %>%
  datamation_sanddance()
#> $data
#> $data[[1]]
#> {
#>   "$schema": "https://vega.github.io/schema/vega-lite/v4.json",
#>   "meta": {
#>     "parse": "grid"
#>   },
#>   "data": {
#>     "values": [
#>       {
#>         "n": 100
#>       }
#>     ]
#>   },
#>   "mark": "point",
#>   "encoding": {
#>     "x": {
#>       "field": "x",
#>       "type": "quantitative",
#>       "axis": null
#>     },
#>     "y": {
#>       "field": "y",
#>       "type": "quantitative",
#>       "axis": null
#>     }
#>   }
#> } 
#> 
#> 
#> $group_by
#> $group_by[[1]]
#> {
#>   "$schema": "https://vega.github.io/schema/vega-lite/v4.json",
#>   "meta": {
#>     "parse": "grid"
#>   },
#>   "data": {
#>     "values": [
#>       {
#>         "Degree": "Masters",
#>         "n": 72
#>       },
#>       {
#>         "Degree": "PhD",
#>         "n": 28
#>       }
#>     ]
#>   },
#>   "facet": {
#>     "column": {
#>       "field": "Degree",
#>       "type": "nominal",
#>       "title": null
#>     }
#>   },
#>   "spec": {
#>     "mark": "point",
#>     "encoding": {
#>       "x": {
#>         "field": "x",
#>         "type": "quantitative",
#>         "axis": null
#>       },
#>       "y": {
#>         "field": "y",
#>         "type": "quantitative",
#>         "axis": null
#>       }
#>     }
#>   }
#> } 
#> 
#> 
#> $summarize
#> $summarize[[1]]
#> {
#>   "$schema": "https://vega.github.io/schema/vega-lite/v4.json",
#>   "meta": {
#>     "parse": "jitter"
#>   },
#>   "data": {
#>     "values": [
#>       {
#>         "gemini_id": 1,
#>         "y": 81.9445013836958,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 2,
#>         "y": 84.4868333523627,
#>         "Degree": "PhD",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 3,
#>         "y": 82.8953005648218,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 4,
#>         "y": 83.8469139884692,
#>         "Degree": "PhD",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 5,
#>         "y": 83.7531382157467,
#>         "Degree": "PhD",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 6,
#>         "y": 85.2683244312648,
#>         "Degree": "PhD",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 7,
#>         "y": 91.4052118111867,
#>         "Degree": "PhD",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 8,
#>         "y": 85.3309176496696,
#>         "Degree": "PhD",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 9,
#>         "y": 83.2656172472052,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 10,
#>         "y": 92.3489408034366,
#>         "Degree": "PhD",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 11,
#>         "y": 82.899547266541,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 12,
#>         "y": 84.7384647994768,
#>         "Degree": "PhD",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 13,
#>         "y": 90.1877911367919,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 14,
#>         "y": 90.3138903337531,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 15,
#>         "y": 90.3365755749401,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 16,
#>         "y": 89.6885157823563,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 17,
#>         "y": 89.657391943736,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 18,
#>         "y": 89.8103184474166,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 19,
#>         "y": 85.0068552203011,
#>         "Degree": "PhD",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 20,
#>         "y": 90.1445505130105,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 21,
#>         "y": 90.2597002927214,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 22,
#>         "y": 85.1630066898651,
#>         "Degree": "PhD",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 23,
#>         "y": 89.5807276440319,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 24,
#>         "y": 85.3773716066498,
#>         "Degree": "PhD",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 25,
#>         "y": 85.0828845105134,
#>         "Degree": "PhD",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 26,
#>         "y": 91.4775695463177,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 27,
#>         "y": 90.5421400056221,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 28,
#>         "y": 90.9508253019303,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 29,
#>         "y": 84.3256172758993,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 30,
#>         "y": 90.7608228451572,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 31,
#>         "y": 91.2149588565808,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 32,
#>         "y": 91.4811559985392,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 33,
#>         "y": 91.203505871119,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 34,
#>         "y": 84.1406831252389,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 35,
#>         "y": 90.900099467719,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 36,
#>         "y": 91.3447520111222,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 37,
#>         "y": 90.6169246234931,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 38,
#>         "y": 91.1798533124384,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 39,
#>         "y": 91.2493746823166,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 40,
#>         "y": 91.4049337708857,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 41,
#>         "y": 91.1165353488177,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 42,
#>         "y": 91.1068642993923,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 43,
#>         "y": 86.0538539250847,
#>         "Degree": "PhD",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 44,
#>         "y": 90.6704280367121,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 45,
#>         "y": 91.4698466714472,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 46,
#>         "y": 91.0579056167044,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 47,
#>         "y": 93.1602621641941,
#>         "Degree": "PhD",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 48,
#>         "y": 85.9106459924951,
#>         "Degree": "PhD",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 49,
#>         "y": 93.4098555028904,
#>         "Degree": "PhD",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 50,
#>         "y": 90.9434416298755,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 51,
#>         "y": 91.1740557027515,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 52,
#>         "y": 86.0406335154548,
#>         "Degree": "PhD",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 53,
#>         "y": 93.0570627038833,
#>         "Degree": "PhD",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 54,
#>         "y": 91.2401522365399,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 55,
#>         "y": 90.5011388328858,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 56,
#>         "y": 85.3303201349918,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 57,
#>         "y": 90.6040293425322,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 58,
#>         "y": 85.4951418309938,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 59,
#>         "y": 91.4005046924576,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 60,
#>         "y": 91.1476999609731,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 61,
#>         "y": 90.7045878821518,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 62,
#>         "y": 90.6188371984754,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 63,
#>         "y": 90.5633510330226,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 64,
#>         "y": 90.5981954357121,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 65,
#>         "y": 91.1700340267271,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 66,
#>         "y": 90.7472879537381,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 67,
#>         "y": 86.4447282091714,
#>         "Degree": "PhD",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 68,
#>         "y": 92.0161147855688,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 69,
#>         "y": 92.2819435379934,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 70,
#>         "y": 91.5201518230606,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 71,
#>         "y": 92.2406232669018,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 72,
#>         "y": 92.7338204937987,
#>         "Degree": "PhD",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 73,
#>         "y": 86.3678887020797,
#>         "Degree": "PhD",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 74,
#>         "y": 84.5408536496107,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 75,
#>         "y": 91.6161431246437,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 76,
#>         "y": 92.0414693744387,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 77,
#>         "y": 92.2921498068608,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 78,
#>         "y": 91.6981512298808,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 79,
#>         "y": 91.8960476492066,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 80,
#>         "y": 92.4187721665949,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 81,
#>         "y": 87.049029128626,
#>         "Degree": "PhD",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 82,
#>         "y": 91.8766731780488,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 83,
#>         "y": 92.3804325407837,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 84,
#>         "y": 92.1729675922543,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 85,
#>         "y": 93.1600916916505,
#>         "Degree": "PhD",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 86,
#>         "y": 92.1522822889965,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 87,
#>         "y": 85.4612494898029,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 88,
#>         "y": 92.1945560907479,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 89,
#>         "y": 86.6827135430649,
#>         "Degree": "PhD",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 90,
#>         "y": 91.5597189620603,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 91,
#>         "y": 91.992212592857,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 92,
#>         "y": 92.4685412924737,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 93,
#>         "y": 93.7030599385034,
#>         "Degree": "PhD",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 94,
#>         "y": 87.4391794742551,
#>         "Degree": "PhD",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 95,
#>         "y": 91.9892992568202,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 96,
#>         "y": 91.9956347632688,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 97,
#>         "y": 92.3084856946953,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 98,
#>         "y": 91.7435715948232,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 99,
#>         "y": 93.833772216225,
#>         "Degree": "PhD",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 100,
#>         "y": 94.0215112566948,
#>         "Degree": "PhD",
#>         "x": 1
#>       }
#>     ]
#>   },
#>   "facet": {
#>     "column": {
#>       "field": "Degree",
#>       "type": "nominal",
#>       "title": null
#>     }
#>   },
#>   "spec": {
#>     "mark": "point",
#>     "encoding": {
#>       "x": {
#>         "field": "x",
#>         "type": "quantitative",
#>         "axis": null
#>       },
#>       "y": {
#>         "field": "y",
#>         "type": "quantitative",
#>         "axis": null
#>       }
#>     }
#>   }
#> } 
#> 
#> $summarize[[2]]
#> {
#>   "$schema": "https://vega.github.io/schema/vega-lite/v4.json",
#>   "meta": [],
#>   "data": {
#>     "values": [
#>       {
#>         "gemini_id": 1,
#>         "y": 90.2263340061763,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 2,
#>         "y": 88.2456061263219,
#>         "Degree": "PhD",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 3,
#>         "y": 90.2263340061763,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 4,
#>         "y": 88.2456061263219,
#>         "Degree": "PhD",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 5,
#>         "y": 88.2456061263219,
#>         "Degree": "PhD",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 6,
#>         "y": 88.2456061263219,
#>         "Degree": "PhD",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 7,
#>         "y": 88.2456061263219,
#>         "Degree": "PhD",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 8,
#>         "y": 88.2456061263219,
#>         "Degree": "PhD",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 9,
#>         "y": 90.2263340061763,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 10,
#>         "y": 88.2456061263219,
#>         "Degree": "PhD",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 11,
#>         "y": 90.2263340061763,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 12,
#>         "y": 88.2456061263219,
#>         "Degree": "PhD",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 13,
#>         "y": 90.2263340061763,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 14,
#>         "y": 90.2263340061763,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 15,
#>         "y": 90.2263340061763,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 16,
#>         "y": 90.2263340061763,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 17,
#>         "y": 90.2263340061763,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 18,
#>         "y": 90.2263340061763,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 19,
#>         "y": 88.2456061263219,
#>         "Degree": "PhD",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 20,
#>         "y": 90.2263340061763,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 21,
#>         "y": 90.2263340061763,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 22,
#>         "y": 88.2456061263219,
#>         "Degree": "PhD",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 23,
#>         "y": 90.2263340061763,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 24,
#>         "y": 88.2456061263219,
#>         "Degree": "PhD",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 25,
#>         "y": 88.2456061263219,
#>         "Degree": "PhD",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 26,
#>         "y": 90.2263340061763,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 27,
#>         "y": 90.2263340061763,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 28,
#>         "y": 90.2263340061763,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 29,
#>         "y": 90.2263340061763,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 30,
#>         "y": 90.2263340061763,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 31,
#>         "y": 90.2263340061763,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 32,
#>         "y": 90.2263340061763,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 33,
#>         "y": 90.2263340061763,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 34,
#>         "y": 90.2263340061763,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 35,
#>         "y": 90.2263340061763,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 36,
#>         "y": 90.2263340061763,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 37,
#>         "y": 90.2263340061763,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 38,
#>         "y": 90.2263340061763,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 39,
#>         "y": 90.2263340061763,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 40,
#>         "y": 90.2263340061763,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 41,
#>         "y": 90.2263340061763,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 42,
#>         "y": 90.2263340061763,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 43,
#>         "y": 88.2456061263219,
#>         "Degree": "PhD",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 44,
#>         "y": 90.2263340061763,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 45,
#>         "y": 90.2263340061763,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 46,
#>         "y": 90.2263340061763,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 47,
#>         "y": 88.2456061263219,
#>         "Degree": "PhD",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 48,
#>         "y": 88.2456061263219,
#>         "Degree": "PhD",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 49,
#>         "y": 88.2456061263219,
#>         "Degree": "PhD",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 50,
#>         "y": 90.2263340061763,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 51,
#>         "y": 90.2263340061763,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 52,
#>         "y": 88.2456061263219,
#>         "Degree": "PhD",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 53,
#>         "y": 88.2456061263219,
#>         "Degree": "PhD",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 54,
#>         "y": 90.2263340061763,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 55,
#>         "y": 90.2263340061763,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 56,
#>         "y": 90.2263340061763,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 57,
#>         "y": 90.2263340061763,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 58,
#>         "y": 90.2263340061763,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 59,
#>         "y": 90.2263340061763,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 60,
#>         "y": 90.2263340061763,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 61,
#>         "y": 90.2263340061763,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 62,
#>         "y": 90.2263340061763,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 63,
#>         "y": 90.2263340061763,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 64,
#>         "y": 90.2263340061763,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 65,
#>         "y": 90.2263340061763,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 66,
#>         "y": 90.2263340061763,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 67,
#>         "y": 88.2456061263219,
#>         "Degree": "PhD",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 68,
#>         "y": 90.2263340061763,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 69,
#>         "y": 90.2263340061763,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 70,
#>         "y": 90.2263340061763,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 71,
#>         "y": 90.2263340061763,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 72,
#>         "y": 88.2456061263219,
#>         "Degree": "PhD",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 73,
#>         "y": 88.2456061263219,
#>         "Degree": "PhD",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 74,
#>         "y": 90.2263340061763,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 75,
#>         "y": 90.2263340061763,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 76,
#>         "y": 90.2263340061763,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 77,
#>         "y": 90.2263340061763,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 78,
#>         "y": 90.2263340061763,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 79,
#>         "y": 90.2263340061763,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 80,
#>         "y": 90.2263340061763,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 81,
#>         "y": 88.2456061263219,
#>         "Degree": "PhD",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 82,
#>         "y": 90.2263340061763,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 83,
#>         "y": 90.2263340061763,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 84,
#>         "y": 90.2263340061763,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 85,
#>         "y": 88.2456061263219,
#>         "Degree": "PhD",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 86,
#>         "y": 90.2263340061763,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 87,
#>         "y": 90.2263340061763,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 88,
#>         "y": 90.2263340061763,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 89,
#>         "y": 88.2456061263219,
#>         "Degree": "PhD",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 90,
#>         "y": 90.2263340061763,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 91,
#>         "y": 90.2263340061763,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 92,
#>         "y": 90.2263340061763,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 93,
#>         "y": 88.2456061263219,
#>         "Degree": "PhD",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 94,
#>         "y": 88.2456061263219,
#>         "Degree": "PhD",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 95,
#>         "y": 90.2263340061763,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 96,
#>         "y": 90.2263340061763,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 97,
#>         "y": 90.2263340061763,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 98,
#>         "y": 90.2263340061763,
#>         "Degree": "Masters",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 99,
#>         "y": 88.2456061263219,
#>         "Degree": "PhD",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 100,
#>         "y": 88.2456061263219,
#>         "Degree": "PhD",
#>         "x": 1
#>       }
#>     ]
#>   },
#>   "facet": {
#>     "column": {
#>       "field": "Degree",
#>       "type": "nominal",
#>       "title": null
#>     }
#>   },
#>   "spec": {
#>     "mark": "point",
#>     "encoding": {
#>       "x": {
#>         "field": "x",
#>         "type": "quantitative",
#>         "axis": null
#>       },
#>       "y": {
#>         "field": "y",
#>         "type": "quantitative",
#>         "axis": null
#>       }
#>     }
#>   }
#> }
```

<img src="man/figures/README-mean_salary_group_by_degree.gif" width="80%" />

You can group by multiple variables, as in this example, grouping by
`Degree` and `Work` before calculating the mean `Salary`:

``` r
"small_salary %>% group_by(Degree, Work) %>% summarize(mean = mean(Salary))" %>%
  datamation_sanddance()
#> $data
#> $data[[1]]
#> {
#>   "$schema": "https://vega.github.io/schema/vega-lite/v4.json",
#>   "meta": {
#>     "parse": "grid"
#>   },
#>   "data": {
#>     "values": [
#>       {
#>         "n": 100
#>       }
#>     ]
#>   },
#>   "mark": "point",
#>   "encoding": {
#>     "x": {
#>       "field": "x",
#>       "type": "quantitative",
#>       "axis": null
#>     },
#>     "y": {
#>       "field": "y",
#>       "type": "quantitative",
#>       "axis": null
#>     }
#>   }
#> } 
#> 
#> 
#> $group_by
#> $group_by[[1]]
#> {
#>   "$schema": "https://vega.github.io/schema/vega-lite/v4.json",
#>   "meta": {
#>     "parse": "grid"
#>   },
#>   "data": {
#>     "values": [
#>       {
#>         "Degree": "Masters",
#>         "n": 72
#>       },
#>       {
#>         "Degree": "PhD",
#>         "n": 28
#>       }
#>     ]
#>   },
#>   "facet": {
#>     "column": {
#>       "field": "Degree",
#>       "type": "nominal",
#>       "title": null
#>     }
#>   },
#>   "spec": {
#>     "mark": "point",
#>     "encoding": {
#>       "x": {
#>         "field": "x",
#>         "type": "quantitative",
#>         "axis": null
#>       },
#>       "y": {
#>         "field": "y",
#>         "type": "quantitative",
#>         "axis": null
#>       }
#>     }
#>   }
#> } 
#> 
#> $group_by[[2]]
#> {
#>   "$schema": "https://vega.github.io/schema/vega-lite/v4.json",
#>   "meta": {
#>     "parse": "grid"
#>   },
#>   "data": {
#>     "values": [
#>       {
#>         "Degree": "Masters",
#>         "Work": "Academia",
#>         "n": 10
#>       },
#>       {
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "n": 62
#>       },
#>       {
#>         "Degree": "PhD",
#>         "Work": "Academia",
#>         "n": 18
#>       },
#>       {
#>         "Degree": "PhD",
#>         "Work": "Industry",
#>         "n": 10
#>       }
#>     ]
#>   },
#>   "facet": {
#>     "column": {
#>       "field": "Degree",
#>       "type": "nominal",
#>       "title": null
#>     },
#>     "row": {
#>       "field": "Work",
#>       "type": "nominal",
#>       "title": null
#>     }
#>   },
#>   "spec": {
#>     "mark": "point",
#>     "encoding": {
#>       "x": {
#>         "field": "x",
#>         "type": "quantitative",
#>         "axis": null
#>       },
#>       "y": {
#>         "field": "y",
#>         "type": "quantitative",
#>         "axis": null
#>       }
#>     }
#>   }
#> } 
#> 
#> 
#> $summarize
#> $summarize[[1]]
#> {
#>   "$schema": "https://vega.github.io/schema/vega-lite/v4.json",
#>   "meta": {
#>     "parse": "jitter"
#>   },
#>   "data": {
#>     "values": [
#>       {
#>         "gemini_id": 1,
#>         "y": 81.9445013836958,
#>         "Degree": "Masters",
#>         "Work": "Academia",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 2,
#>         "y": 84.4868333523627,
#>         "Degree": "PhD",
#>         "Work": "Academia",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 3,
#>         "y": 82.8953005648218,
#>         "Degree": "Masters",
#>         "Work": "Academia",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 4,
#>         "y": 83.8469139884692,
#>         "Degree": "PhD",
#>         "Work": "Academia",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 5,
#>         "y": 83.7531382157467,
#>         "Degree": "PhD",
#>         "Work": "Academia",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 6,
#>         "y": 85.2683244312648,
#>         "Degree": "PhD",
#>         "Work": "Academia",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 7,
#>         "y": 91.4052118111867,
#>         "Degree": "PhD",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 8,
#>         "y": 85.3309176496696,
#>         "Degree": "PhD",
#>         "Work": "Academia",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 9,
#>         "y": 83.2656172472052,
#>         "Degree": "Masters",
#>         "Work": "Academia",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 10,
#>         "y": 92.3489408034366,
#>         "Degree": "PhD",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 11,
#>         "y": 82.899547266541,
#>         "Degree": "Masters",
#>         "Work": "Academia",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 12,
#>         "y": 84.7384647994768,
#>         "Degree": "PhD",
#>         "Work": "Academia",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 13,
#>         "y": 90.1877911367919,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 14,
#>         "y": 90.3138903337531,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 15,
#>         "y": 90.3365755749401,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 16,
#>         "y": 89.6885157823563,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 17,
#>         "y": 89.657391943736,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 18,
#>         "y": 89.8103184474166,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 19,
#>         "y": 85.0068552203011,
#>         "Degree": "PhD",
#>         "Work": "Academia",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 20,
#>         "y": 90.1445505130105,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 21,
#>         "y": 90.2597002927214,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 22,
#>         "y": 85.1630066898651,
#>         "Degree": "PhD",
#>         "Work": "Academia",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 23,
#>         "y": 89.5807276440319,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 24,
#>         "y": 85.3773716066498,
#>         "Degree": "PhD",
#>         "Work": "Academia",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 25,
#>         "y": 85.0828845105134,
#>         "Degree": "PhD",
#>         "Work": "Academia",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 26,
#>         "y": 91.4775695463177,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 27,
#>         "y": 90.5421400056221,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 28,
#>         "y": 90.9508253019303,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 29,
#>         "y": 84.3256172758993,
#>         "Degree": "Masters",
#>         "Work": "Academia",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 30,
#>         "y": 90.7608228451572,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 31,
#>         "y": 91.2149588565808,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 32,
#>         "y": 91.4811559985392,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 33,
#>         "y": 91.203505871119,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 34,
#>         "y": 84.1406831252389,
#>         "Degree": "Masters",
#>         "Work": "Academia",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 35,
#>         "y": 90.900099467719,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 36,
#>         "y": 91.3447520111222,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 37,
#>         "y": 90.6169246234931,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 38,
#>         "y": 91.1798533124384,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 39,
#>         "y": 91.2493746823166,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 40,
#>         "y": 91.4049337708857,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 41,
#>         "y": 91.1165353488177,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 42,
#>         "y": 91.1068642993923,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 43,
#>         "y": 86.0538539250847,
#>         "Degree": "PhD",
#>         "Work": "Academia",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 44,
#>         "y": 90.6704280367121,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 45,
#>         "y": 91.4698466714472,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 46,
#>         "y": 91.0579056167044,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 47,
#>         "y": 93.1602621641941,
#>         "Degree": "PhD",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 48,
#>         "y": 85.9106459924951,
#>         "Degree": "PhD",
#>         "Work": "Academia",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 49,
#>         "y": 93.4098555028904,
#>         "Degree": "PhD",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 50,
#>         "y": 90.9434416298755,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 51,
#>         "y": 91.1740557027515,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 52,
#>         "y": 86.0406335154548,
#>         "Degree": "PhD",
#>         "Work": "Academia",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 53,
#>         "y": 93.0570627038833,
#>         "Degree": "PhD",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 54,
#>         "y": 91.2401522365399,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 55,
#>         "y": 90.5011388328858,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 56,
#>         "y": 85.3303201349918,
#>         "Degree": "Masters",
#>         "Work": "Academia",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 57,
#>         "y": 90.6040293425322,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 58,
#>         "y": 85.4951418309938,
#>         "Degree": "Masters",
#>         "Work": "Academia",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 59,
#>         "y": 91.4005046924576,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 60,
#>         "y": 91.1476999609731,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 61,
#>         "y": 90.7045878821518,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 62,
#>         "y": 90.6188371984754,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 63,
#>         "y": 90.5633510330226,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 64,
#>         "y": 90.5981954357121,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 65,
#>         "y": 91.1700340267271,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 66,
#>         "y": 90.7472879537381,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 67,
#>         "y": 86.4447282091714,
#>         "Degree": "PhD",
#>         "Work": "Academia",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 68,
#>         "y": 92.0161147855688,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 69,
#>         "y": 92.2819435379934,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 70,
#>         "y": 91.5201518230606,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 71,
#>         "y": 92.2406232669018,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 72,
#>         "y": 92.7338204937987,
#>         "Degree": "PhD",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 73,
#>         "y": 86.3678887020797,
#>         "Degree": "PhD",
#>         "Work": "Academia",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 74,
#>         "y": 84.5408536496107,
#>         "Degree": "Masters",
#>         "Work": "Academia",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 75,
#>         "y": 91.6161431246437,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 76,
#>         "y": 92.0414693744387,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 77,
#>         "y": 92.2921498068608,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 78,
#>         "y": 91.6981512298808,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 79,
#>         "y": 91.8960476492066,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 80,
#>         "y": 92.4187721665949,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 81,
#>         "y": 87.049029128626,
#>         "Degree": "PhD",
#>         "Work": "Academia",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 82,
#>         "y": 91.8766731780488,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 83,
#>         "y": 92.3804325407837,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 84,
#>         "y": 92.1729675922543,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 85,
#>         "y": 93.1600916916505,
#>         "Degree": "PhD",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 86,
#>         "y": 92.1522822889965,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 87,
#>         "y": 85.4612494898029,
#>         "Degree": "Masters",
#>         "Work": "Academia",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 88,
#>         "y": 92.1945560907479,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 89,
#>         "y": 86.6827135430649,
#>         "Degree": "PhD",
#>         "Work": "Academia",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 90,
#>         "y": 91.5597189620603,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 91,
#>         "y": 91.992212592857,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 92,
#>         "y": 92.4685412924737,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 93,
#>         "y": 93.7030599385034,
#>         "Degree": "PhD",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 94,
#>         "y": 87.4391794742551,
#>         "Degree": "PhD",
#>         "Work": "Academia",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 95,
#>         "y": 91.9892992568202,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 96,
#>         "y": 91.9956347632688,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 97,
#>         "y": 92.3084856946953,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 98,
#>         "y": 91.7435715948232,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 99,
#>         "y": 93.833772216225,
#>         "Degree": "PhD",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 100,
#>         "y": 94.0215112566948,
#>         "Degree": "PhD",
#>         "Work": "Industry",
#>         "x": 1
#>       }
#>     ]
#>   },
#>   "facet": {
#>     "column": {
#>       "field": "Degree",
#>       "type": "nominal",
#>       "title": null
#>     },
#>     "row": {
#>       "field": "Work",
#>       "type": "nominal",
#>       "title": null
#>     }
#>   },
#>   "spec": {
#>     "mark": "point",
#>     "encoding": {
#>       "x": {
#>         "field": "x",
#>         "type": "quantitative",
#>         "axis": null
#>       },
#>       "y": {
#>         "field": "y",
#>         "type": "quantitative",
#>         "axis": null
#>       }
#>     }
#>   }
#> } 
#> 
#> $summarize[[2]]
#> {
#>   "$schema": "https://vega.github.io/schema/vega-lite/v4.json",
#>   "meta": [],
#>   "data": {
#>     "values": [
#>       {
#>         "gemini_id": 1,
#>         "y": 84.0298831968801,
#>         "Degree": "Masters",
#>         "Work": "Academia",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 2,
#>         "y": 85.5579657196973,
#>         "Degree": "PhD",
#>         "Work": "Academia",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 3,
#>         "y": 84.0298831968801,
#>         "Degree": "Masters",
#>         "Work": "Academia",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 4,
#>         "y": 85.5579657196973,
#>         "Degree": "PhD",
#>         "Work": "Academia",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 5,
#>         "y": 85.5579657196973,
#>         "Degree": "PhD",
#>         "Work": "Academia",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 6,
#>         "y": 85.5579657196973,
#>         "Degree": "PhD",
#>         "Work": "Academia",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 7,
#>         "y": 93.0833588582464,
#>         "Degree": "PhD",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 8,
#>         "y": 85.5579657196973,
#>         "Degree": "PhD",
#>         "Work": "Academia",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 9,
#>         "y": 84.0298831968801,
#>         "Degree": "Masters",
#>         "Work": "Academia",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 10,
#>         "y": 93.0833588582464,
#>         "Degree": "PhD",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 11,
#>         "y": 84.0298831968801,
#>         "Degree": "Masters",
#>         "Work": "Academia",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 12,
#>         "y": 85.5579657196973,
#>         "Degree": "PhD",
#>         "Work": "Academia",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 13,
#>         "y": 91.2257615560628,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 14,
#>         "y": 91.2257615560628,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 15,
#>         "y": 91.2257615560628,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 16,
#>         "y": 91.2257615560628,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 17,
#>         "y": 91.2257615560628,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 18,
#>         "y": 91.2257615560628,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 19,
#>         "y": 85.5579657196973,
#>         "Degree": "PhD",
#>         "Work": "Academia",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 20,
#>         "y": 91.2257615560628,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 21,
#>         "y": 91.2257615560628,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 22,
#>         "y": 85.5579657196973,
#>         "Degree": "PhD",
#>         "Work": "Academia",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 23,
#>         "y": 91.2257615560628,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 24,
#>         "y": 85.5579657196973,
#>         "Degree": "PhD",
#>         "Work": "Academia",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 25,
#>         "y": 85.5579657196973,
#>         "Degree": "PhD",
#>         "Work": "Academia",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 26,
#>         "y": 91.2257615560628,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 27,
#>         "y": 91.2257615560628,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 28,
#>         "y": 91.2257615560628,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 29,
#>         "y": 84.0298831968801,
#>         "Degree": "Masters",
#>         "Work": "Academia",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 30,
#>         "y": 91.2257615560628,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 31,
#>         "y": 91.2257615560628,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 32,
#>         "y": 91.2257615560628,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 33,
#>         "y": 91.2257615560628,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 34,
#>         "y": 84.0298831968801,
#>         "Degree": "Masters",
#>         "Work": "Academia",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 35,
#>         "y": 91.2257615560628,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 36,
#>         "y": 91.2257615560628,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 37,
#>         "y": 91.2257615560628,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 38,
#>         "y": 91.2257615560628,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 39,
#>         "y": 91.2257615560628,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 40,
#>         "y": 91.2257615560628,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 41,
#>         "y": 91.2257615560628,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 42,
#>         "y": 91.2257615560628,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 43,
#>         "y": 85.5579657196973,
#>         "Degree": "PhD",
#>         "Work": "Academia",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 44,
#>         "y": 91.2257615560628,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 45,
#>         "y": 91.2257615560628,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 46,
#>         "y": 91.2257615560628,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 47,
#>         "y": 93.0833588582464,
#>         "Degree": "PhD",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 48,
#>         "y": 85.5579657196973,
#>         "Degree": "PhD",
#>         "Work": "Academia",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 49,
#>         "y": 93.0833588582464,
#>         "Degree": "PhD",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 50,
#>         "y": 91.2257615560628,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 51,
#>         "y": 91.2257615560628,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 52,
#>         "y": 85.5579657196973,
#>         "Degree": "PhD",
#>         "Work": "Academia",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 53,
#>         "y": 93.0833588582464,
#>         "Degree": "PhD",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 54,
#>         "y": 91.2257615560628,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 55,
#>         "y": 91.2257615560628,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 56,
#>         "y": 84.0298831968801,
#>         "Degree": "Masters",
#>         "Work": "Academia",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 57,
#>         "y": 91.2257615560628,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 58,
#>         "y": 84.0298831968801,
#>         "Degree": "Masters",
#>         "Work": "Academia",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 59,
#>         "y": 91.2257615560628,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 60,
#>         "y": 91.2257615560628,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 61,
#>         "y": 91.2257615560628,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 62,
#>         "y": 91.2257615560628,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 63,
#>         "y": 91.2257615560628,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 64,
#>         "y": 91.2257615560628,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 65,
#>         "y": 91.2257615560628,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 66,
#>         "y": 91.2257615560628,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 67,
#>         "y": 85.5579657196973,
#>         "Degree": "PhD",
#>         "Work": "Academia",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 68,
#>         "y": 91.2257615560628,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 69,
#>         "y": 91.2257615560628,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 70,
#>         "y": 91.2257615560628,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 71,
#>         "y": 91.2257615560628,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 72,
#>         "y": 93.0833588582464,
#>         "Degree": "PhD",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 73,
#>         "y": 85.5579657196973,
#>         "Degree": "PhD",
#>         "Work": "Academia",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 74,
#>         "y": 84.0298831968801,
#>         "Degree": "Masters",
#>         "Work": "Academia",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 75,
#>         "y": 91.2257615560628,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 76,
#>         "y": 91.2257615560628,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 77,
#>         "y": 91.2257615560628,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 78,
#>         "y": 91.2257615560628,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 79,
#>         "y": 91.2257615560628,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 80,
#>         "y": 91.2257615560628,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 81,
#>         "y": 85.5579657196973,
#>         "Degree": "PhD",
#>         "Work": "Academia",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 82,
#>         "y": 91.2257615560628,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 83,
#>         "y": 91.2257615560628,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 84,
#>         "y": 91.2257615560628,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 85,
#>         "y": 93.0833588582464,
#>         "Degree": "PhD",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 86,
#>         "y": 91.2257615560628,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 87,
#>         "y": 84.0298831968801,
#>         "Degree": "Masters",
#>         "Work": "Academia",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 88,
#>         "y": 91.2257615560628,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 89,
#>         "y": 85.5579657196973,
#>         "Degree": "PhD",
#>         "Work": "Academia",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 90,
#>         "y": 91.2257615560628,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 91,
#>         "y": 91.2257615560628,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 92,
#>         "y": 91.2257615560628,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 93,
#>         "y": 93.0833588582464,
#>         "Degree": "PhD",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 94,
#>         "y": 85.5579657196973,
#>         "Degree": "PhD",
#>         "Work": "Academia",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 95,
#>         "y": 91.2257615560628,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 96,
#>         "y": 91.2257615560628,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 97,
#>         "y": 91.2257615560628,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 98,
#>         "y": 91.2257615560628,
#>         "Degree": "Masters",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 99,
#>         "y": 93.0833588582464,
#>         "Degree": "PhD",
#>         "Work": "Industry",
#>         "x": 1
#>       },
#>       {
#>         "gemini_id": 100,
#>         "y": 93.0833588582464,
#>         "Degree": "PhD",
#>         "Work": "Industry",
#>         "x": 1
#>       }
#>     ]
#>   },
#>   "facet": {
#>     "column": {
#>       "field": "Degree",
#>       "type": "nominal",
#>       "title": null
#>     },
#>     "row": {
#>       "field": "Work",
#>       "type": "nominal",
#>       "title": null
#>     }
#>   },
#>   "spec": {
#>     "mark": "point",
#>     "encoding": {
#>       "x": {
#>         "field": "x",
#>         "type": "quantitative",
#>         "axis": null
#>       },
#>       "y": {
#>         "field": "y",
#>         "type": "quantitative",
#>         "axis": null
#>       }
#>     }
#>   }
#> }
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

<img src="man/figures/README-mtcars_group_cyl.gif" width="80%" />
