library(dplyr)
devtools::load_all()

jeter_1995 <- data.frame(
  player = "Derek Jeter",
  year = 1995,
  is_hit = c(rep(1, 12), rep(0, 48 - 12))
)

jeter_1996 <- data.frame(
  player = "Derek Jeter",
  year = 1996,
  is_hit = c(rep(1, 183), rep(0, 582 - 183))
)

justice_1995 <- data.frame(
  player = "David Justice",
  year = 1995,
  is_hit = c(rep(1, 104), rep(0, 411 - 104))
)

justice_1996 <- data.frame(
  player = "David Justice",
  year = 1996,
  is_hit = c(rep(1, 45), rep(0, 140 - 45))
)

df <- bind_rows(
  jeter_1995,
  jeter_1996,
  justice_1995,
  justice_1996
) %>%
  sample_frac(0.3)

# datamation #1:
# jeter has a higher batting average than justice overall
x <- "df %>%
  group_by(player) %>%
  summarize(
    batting_average = mean(is_hit)
  )" %>%
  datamation_sanddance()

x

write(x$x$specs, here::here("sandbox", "simpsons_paradox", "group_by_player.json"))

# datamation #2:
# but justice has a higher batting average than jeter within each year
x <- "df %>%
  group_by(player, year) %>%
  summarize(
    batting_average = mean(is_hit)
  )" %>%
  datamation_sanddance()

x

write(x$x$specs, here::here("sandbox", "simpsons_paradox", "group_by_player_year.json"))
