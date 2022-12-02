# Launch the ShinyApp (Do not remove this comment)
# To deploy, run: rsconnect::deployApp()
# Or use the blue button on top of this file

pkgload::load_all(export_all = FALSE,helpers = FALSE,attach_testthat = FALSE)
options( "golem.app.prod" = TRUE)
datamations::run_app() # add parameters here (if any)

library(datamations)
library(dplyr)

"small_salary %>%   group_by(Degree) %>%  summarize(sum = sum(Salary))"%>%
  datamation_sanddance()

# applications_over_months = read.csv('./data-raw/applications.csv')

# applications_over_months %>%
#   group_by(Account.Name, Billing.Month) %>%
#   summarise(sum_taff = sum(Total.Cost))

# "applications_over_months %>%
#   group_by(Billing.Month) %>%
#   summarise(sum_taff = sum(Total.Cost))" %>%
#   datamation_sanddance()
