devtools::load_all()
library(palmerpenguins)
library(purrr)

specs <- datamation_sanddance("penguins %>% group_by(island, species, sex) %>% summarize(mean = mean(bill_length_mm))")
specs <- unlist(specs, recursive = FALSE)

# Write the specs from each stage

stage_names <- c("01-ungrouped.json", "02-column-facet.json", "03-column-row-facet.json", "04-column-row-facet-color.json", "05-jitter.json", "06-summary.json")

walk2(
  specs, stage_names,
  function(x, y) {
    write(x, here::here("sandbox", "specs-for-infogrid", y))
  }
)
