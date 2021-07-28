# Generate specs with final frame for errorbar
library(datamations)
library(dplyr)

# With facets
specs <- "small_salary %>% group_by(Degree) %>% summarize(mean = mean(Salary))" %>%
  datamation_sanddance()

specs <- specs$x$specs

write(specs, here::here("sandbox", "errorbar", "specs_with_facet.json"))

# Without facets
specs <- "small_salary %>% summarize(mean = mean(Salary))" %>%
  datamation_sanddance()

specs <- specs$x$specs

write(specs, here::here("sandbox", "errorbar", "specs_no_facet.json"))
