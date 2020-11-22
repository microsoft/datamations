library(dmpkg)
library(tibble)
library(readr)
library(here)

set.seed(2020-05-28)

sample_size <- 3000

(salary_data <- tibble(
  ID = 1:sample_size,
  Degree = c(rep("Masters", 0.7 * sample_size), rep("PhD", 0.3 * sample_size)),
  Work = c(rep("Industry", 0.6 * sample_size), rep("Academia", 0.1 * sample_size),
           rep("Industry", 0.1 * sample_size), rep("Academia", 0.2 * sample_size)),
  Salary = c(round(runif(0.65 * sample_size, 80, 100)),
             round(runif(0.05 * sample_size, 60, 80)),
             round(runif(0.05 * sample_size, 90, 110)),
             round(runif(0.25 * sample_size, 70, 100)))
) %>% shuffle_tbl())

salary_data %>%
  write_csv(here::here("data-raw", "salary-data.csv"))

usethis::use_data(salary_data, overwrite = TRUE)

sample_size <- 30

(small_salary_data <- tibble(
  Degree = c(rep("Masters", 0.7 * sample_size), rep("PhD", 0.3 * sample_size)),
  Work = c(rep("Industry", 0.6 * sample_size), rep("Academia", 0.1 * sample_size),
           rep("Industry", 0.1 * sample_size), rep("Academia", 0.2 * sample_size)),
  Salary = c(round(runif((20/30) * sample_size, 80, 100)),
             round(runif((2/30) * sample_size, 60, 80)),
             round(runif((3/30) * sample_size, 90, 110)),
             round(runif((5/30) * sample_size, 70, 100)))
) %>% shuffle_tbl())

small_salary_data %>%
  write_csv(here::here("data-raw", "small-salary-data.csv"))

usethis::use_data(small_salary_data, overwrite = TRUE)

s100 <- read_csv("data-raw/small_salary_100.csv") %>%
  select(Degree, Work, Salary)

use_data(s100, overwrite = TRUE)
