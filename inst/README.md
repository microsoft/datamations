# Datamations

Datamations Javascript code relies on [vega](https://vega.github.io/vega/), [vega-lite](https://vega.github.io/vega-lite/) for rendering and [gemini](https://github.com/uwdata/gemini) for animations. An animation is a collection of vega-lite specs with a datamations specific fields.

A `datamations spec` is a superset of vega-lite spec, meaning it has some more fields on top on the vega-lite spec. 

* meta - a configuration metafields used to instruct vega-lite spec processing
* data.values are handled differently when `meta.parse = grid`. More on that, below. 

```
{
  
  "meta": {
    "parse": "grid" | "jitter",
    "description": "Plot Salary within each group",
    "custom_animation: "min" | "max" | "median" | "mean" | "quantile" | "count",
    "splitField": "Degree",
    "axes": true,
    "xAxisLabels": [
      "Masters",
      "PhD"
    ]
  },
  "data": {
    "values: []
  },
  "mark": {
    "type": "point",
    "filled": true,
    "strokeWidth": 1
  },
  "encoding": {
    "x": {
      "field": "datamations_x",
      "type": "quantitative",
      "axis": null
    },
    "y": {
      "field": "datamations_y",
      "type": "quantitative",
      "axis": null
    }
  }
}
```

Meta fields explanation:


| Field                 | Description                                                            |
|-----------------------|------------------------------------------------------------------------|
| meta.parse            | Generating grid or jittered spec.                                      |
| meta.description      | Spec description shown above the chart.                                |
| meta.custom_animation | Custom animation types.                                                |
| meta.splitField       | If specified, splits points on x axis and forms inner groups.          |
| meta.axes             | If true, renders a spec as a separate layout under the the main chart. |
| meta.xAxisLabels      | Labels for x axis. Used when splitField is specified.                  |

Data format:

* `data.values` is an array of objects with `gemini_id`, which is used to keep track of circle during animation
* If `meta.parse = "grid"`, `data.values` should be: 

```
[
  { n: [group size], gemini_ids: [1, 2, ...n], ...[any other fields] }
]
```


### Usage

<a name="app" href="#app">#</a> <b>App</b>() · [Source](https://github.com/microsoft/datamations/blob/main/inst/htmlwidgets/js/app.js)

```html
<link rel="stylesheet" href="../css/fa-all.min.css">
<link rel="stylesheet" href="../css/datamationSandDance.css" />
<div class="flex-wrap">
  <div id="app">
    <div class="controls-wrapper">
      <div class="control-bar">
        <div class="button-wrapper">
          <button class="replay-btn" onclick="app.play()">Replay</button>
        </div>
        <div class="slider-wrapper">
          <input
            class="slider"
            type="range"
            min="0"
            value="0"
            onchange="app.onSlide()"
          />
        </div>
        <div class="button-wrap">
          <button class="export-btn" onclick="app.exportGif(true)">
            <i class="fas fa-download"></i>
          </button>
        </div>
      </div>
    </div>

    <div class="export-wrapper">
      <div class="description"></div>
      <div class="vega-vis-wrapper">
        <div class="vega-for-axis"></div>
        <div class="vega-other-layers"></div>
        <div class="vega-vis"></div>
      </div>
    </div>
  </div>
</div>
```

```javascript
<script src="https://cdn.jsdelivr.net/npm/d3@6"></script>
<script src="https://cdn.jsdelivr.net/npm/vega@5/build/vega-core.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/vega-lite@5.0.0"></script>
<script src="https://cdn.jsdelivr.net/npm/vega-embed@6.15.1"></script>
<script src="../gemini/gemini.web.js"></script>
<script src="../js/html2canvas.min.js"></script>
<script src="../js/gifshot.min.js"></script>
<script src="../js/download2.js"></script>

<script src="../js/config.js"></script>
<script src="../js/utils.js"></script>
<script src="../js/layout.js"></script>
<script src="../js/hack-facet-view.js"></script>
<script src="../js/custom-animations.js"></script>
<script src="../js/app.js"></script>

<script>
  const app = App("app", { 
    specs: [], // pass array of vega-lite specs
    frameDur: 3000, 
    autoPlay: false,  
   });
</script>
```

Methods:

#### app.onSlide - Slider callback. Draws a frame when slider value changes.
#### app.play - play the animation.
#### app.exportPNG - export array of png images.
#### app.exportGif - export gif.
#### app.animateFrame - animates a single frame
#### app.getFrames - returns frames.

For more detailed code documentation, see README [here](./htmlwidgets/js/)







