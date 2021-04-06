dm_color_pal <- function(x) {
  if (x == 4) {
    (scales::hue_pal()(4))[c(1, 3, 2, 4)]
  } else {
    scales::hue_pal()(x)
  }
}
