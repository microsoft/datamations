devtools::load_all()
library(palmerpenguins)
library(purrr)

specs <- datamation_sanddance("penguins %>% group_by(island, species, sex)")

group_by_specs <- specs[["group_by"]]

# Write the specs from each stage

stage_names <- c("01-ungrouped.json", "02-column-facet.json", "03-column-row-facet.json", "04-column-row-facet-color.json")

walk2(
  group_by_specs, stage_names,
  function(x, y) {
    write(x, here::here("sandbox", "specs-for-infogrid", y))
  }
)
