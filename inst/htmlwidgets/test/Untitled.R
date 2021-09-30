library(tidyverse)

theme_set(theme_minimal())

# data from https://en.wikipedia.org/wiki/Simpson's_paradox#Batting_averages
# Year
# Batter
#                     1995	1996	Combined
# Derek Jeter	12/48	.250	183/582	.314	195/630	.310
# David Justice	104/411	.253	45/140	.321	149/551	.27

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

df <- bind_rows(jeter_1995,
                jeter_1996,
                justice_1995,
                justice_1996)

# datamation #1:
# jeter has a higher batting average than justice overall
df %>%
  group_by(player) %>%
  summarize(batting_average = mean(is_hit),
            se = sqrt(batting_average * (1 - batting_average) / n()))  %>%
  ggplot(aes(x = player, y = batting_average, color = player)) +
  geom_pointrange(aes(ymin = batting_average - se,
                      ymax = batting_average + se)) +
  labs(x = "",
       y = "Batting average")
#geom_bar(stat = "identity")

# datamation #2:
# but justice has a higher batting average than jeter within each year
df %>%
  group_by(player, year) %>%
  summarize(batting_average = mean(is_hit),
            se = sqrt(batting_average * (1 - batting_average) / n()) ) %>%
  ggplot(aes(x = as.factor(year), y = batting_average, color = player)) +
  geom_pointrange(aes(ymin = batting_average - se,
                      ymax = batting_average + se),
                  position = position_dodge(width = 0.25)) +
  labs(x = "",
       y = "Batting average")
#geom_bar(stat = "identity", position = "dodge")


