% Generated by roxygen2: do not edit by hand
% Please edit documentation in R/datamation_tibble.R
\name{datamation_tibble}
\alias{datamation_tibble}
\title{Create a tibble datamation}
\usage{
datamation_tibble(
  pipeline,
  envir = rlang::global_env(),
  output = "output.gif",
  titles = NA,
  xlim = c(NA, NA),
  ylim = c(NA, NA)
)
}
\arguments{
\item{pipeline}{A tidyverse pipeline.}

\item{envir}{An environment.}

\item{output}{Path to where gif will be saved.}

\item{titles}{Optional titles for the datamation frames}

\item{xlim}{Optional x limits}

\item{ylim}{Optional y limits}
}
\description{
Create a tibble datamation
}
