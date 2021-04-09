parse_functions <- function(fittings) {
  fittings %>%
    # Splits expressions into the functions and arguments
    map(as.list) %>%
    # Keeping the functions only
    map(~ .x[[1]]) %>%
    map_chr(as.character) %>%
    # Assumes the first element is the data - NOT always the case
    {
      .[-1]
    }
}
