devtools::load_all()
library(palmerpenguins)
library(purrr)

specs <- datamation_sanddance("penguins %>% group_by(species, island, sex) %>% summarize(mean = mean(bill_length_mm))")

specs <- specs$x$specs

# Write full specs

write(specs, here::here("sandbox", "specs-for-infogrid", "00-full-specs.json"))

# Transform so specs at each stage can be written

specs <- jsonlite::fromJSON(specs, simplifyDataFrame = FALSE)
specs <- specs %>%
  purrr::map(vegawidget::vw_as_json)
specs <- unlist(specs, recursive = FALSE)

# Write the specs from each stage

stage_names <- c("01-ungrouped.json", "02-column-facet.json", "03-column-row-facet.json", "04-column-row-facet-color.json", "05-jitter.json", "06-summary.json")

walk2(
  specs, stage_names,
  function(x, y) {
    write(x, here::here("sandbox", "specs-for-infogrid", y))
  }
)

