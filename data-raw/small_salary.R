library(readr)

small_salary <- read_csv(here::here("data-raw", "small_salary.csv"))

usethis::use_data(small_salary, overwrite = TRUE)
