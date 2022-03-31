<a name="App"></a>

## App(id, param1) ⇒
**Kind**: global function  
**Returns**: an object of exposed functions  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>String</code> | conteiner id |
| param1 | <code>Object</code> | configuration object |
| param1.specs | <code>Array</code> | list of vega-lite specifications |
| param1.autoPlay | <code>Boolean</code> | autoPlay |
| param1.frameDel | <code>Number</code> | frame duration (in ms.) |
| param1.frameDel | <code>Number</code> | delay between frames (in ms.) |


* [App(id, param1)](#App) ⇒
    * [~reset()](#App..reset)
    * [~init()](#App..init)
    * [~play()](#App..play)
    * [~drawSpec(index, vegaSpec)](#App..drawSpec) ⇒
    * [~drawChart(spec, vegaSpec)](#App..drawChart) ⇒
    * [~adjustAxisAndErrorbars()](#App..adjustAxisAndErrorbars)
    * [~drawAxis(index)](#App..drawAxis) ⇒
    * [~animateFrame(index, cb)](#App..animateFrame) ⇒
    * [~transformSpecs()](#App..transformSpecs)
    * [~toVegaSpecs()](#App..toVegaSpecs)
    * [~makeFrames()](#App..makeFrames) ⇒
    * [~onSlide()](#App..onSlide)
    * [~exportPNG()](#App..exportPNG)
    * [~exportGif(fromWeb)](#App..exportGif) ⇒
    * [~disableEnable(cmd, components)](#App..disableEnable)
    * [~loaderOnOff(loading)](#App..loaderOnOff)

<a name="App..reset"></a>

### App~reset()
Resets all the instance variables to be able to re-run animation

**Kind**: inner method of [<code>App</code>](#App)  
<a name="App..init"></a>

### App~init()
Initializes datamation app

**Kind**: inner method of [<code>App</code>](#App)  
<a name="App..play"></a>

### App~play()
Plays animation

**Kind**: inner method of [<code>App</code>](#App)  
<a name="App..drawSpec"></a>

### App~drawSpec(index, vegaSpec) ⇒
Draws vega lite spec statically (without transition), also updates slider, description, show/hides some layers

**Kind**: inner method of [<code>App</code>](#App)  
**Returns**: a promise of vegaEmbed  

| Param | Type | Description |
| --- | --- | --- |
| index | <code>Number</code> | specification index in vegaLiteSpecs |
| vegaSpec | <code>Object</code> | source vega spec of current frame |

<a name="App..drawChart"></a>

### App~drawChart(spec, vegaSpec) ⇒
Draws a chart, either spec or vegaSpec (which is passed from animate function)
Supports single view as well as multiple view chart

**Kind**: inner method of [<code>App</code>](#App)  
**Returns**: a promise of vegaEmbed  

| Param | Type | Description |
| --- | --- | --- |
| spec | <code>Object</code> | vega-lite spec |
| vegaSpec | <code>Object</code> | source vega spec of current frame |

<a name="App..adjustAxisAndErrorbars"></a>

### App~adjustAxisAndErrorbars()
Fixes hacked axis spec and error bar alignment

**Kind**: inner method of [<code>App</code>](#App)  
<a name="App..drawAxis"></a>

### App~drawAxis(index) ⇒
Draws an axis layer. This is called when meta.axes = true.

**Kind**: inner method of [<code>App</code>](#App)  
**Returns**: a promise of vegaEmbed  

| Param | Type | Description |
| --- | --- | --- |
| index | <code>Number</code> | specification index in vegaLiteSpecs |

<a name="App..animateFrame"></a>

### App~animateFrame(index, cb) ⇒
Animates a frame, from source to target vega specification using gemini

**Kind**: inner method of [<code>App</code>](#App)  
**Returns**: a promise of gemini.animate  

| Param | Type | Description |
| --- | --- | --- |
| index | <code>Number</code> | specification index in vegaLiteSpecs |
| cb | <code>function</code> | callback function of each frame drawal |

<a name="App..transformSpecs"></a>

### App~transformSpecs()
Transforms specifications into proper format:
- meta.grid = generates infogrid
- meta.jitter = jitters data using d3.forceCollide
- meta.custom_animation = handles custom animation type
- spec.layer = splits layers to stack on top on each other

**Kind**: inner method of [<code>App</code>](#App)  
<a name="App..toVegaSpecs"></a>

### App~toVegaSpecs()
Converts vega-lite specs to vega specs using vl2vg4gemini (https://github.com/uwdata/gemini#vl2vg4gemini)

**Kind**: inner method of [<code>App</code>](#App)  
<a name="App..makeFrames"></a>

### App~makeFrames() ⇒
Generates animation frames

**Kind**: inner method of [<code>App</code>](#App)  
**Returns**: array of objects of \{ source, target, gemSpec, prevMeta, currMeta \}  
<a name="App..onSlide"></a>

### App~onSlide()
Slider on change callback

**Kind**: inner method of [<code>App</code>](#App)  
<a name="App..exportPNG"></a>

### App~exportPNG()
Exports png files for each frame

**Kind**: inner method of [<code>App</code>](#App)  
<a name="App..exportGif"></a>

### App~exportGif(fromWeb) ⇒
Exports datamation as gif.

**Kind**: inner method of [<code>App</code>](#App)  
**Returns**: either base64 string, or downloads .gif file  

| Param | Type | Description |
| --- | --- | --- |
| fromWeb | <code>Boolean</code> | truthy if it is called from webpage, falsy from command line tool |

<a name="App..disableEnable"></a>

### App~disableEnable(cmd, components)
Disables or enables some components

**Kind**: inner method of [<code>App</code>](#App)  

| Param | Type | Description |
| --- | --- | --- |
| cmd | <code>String</code> | "disable" or "enable" |
| components | <code>Array</code> | array of components |

<a name="App..loaderOnOff"></a>

### App~loaderOnOff(loading)
Download button icon adjustment

**Kind**: inner method of [<code>App</code>](#App)  

| Param | Type |
| --- | --- |
| loading | <code>Boolean</code> | 

