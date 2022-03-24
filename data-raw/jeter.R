jeter_1995 <- data.frame(
  player = "Derek Jeter",
  year = 1995,
  is_hit = c(rep(1, 12), rep(0, 48-12))
)

jeter_1996 <- data.frame(
  player = "Derek Jeter",
  year = 1996,
  is_hit = c(rep(1, 183), rep(0, 582-183))
)

justice_1995 <- data.frame(
  player = "David Justice",
  year = 1995,
  is_hit = c(rep(1, 104), rep(0, 411-104))
)

justice_1996 <- data.frame(
  player = "David Justice",
  year = 1996,
  is_hit = c(rep(1, 45), rep(0, 140-45))
)

jeter_justice <- bind_rows(jeter_1995,
                jeter_1996,
                justice_1995,
                justice_1996)

usethis::use_data(jeter_justice, overwrite = TRUE)