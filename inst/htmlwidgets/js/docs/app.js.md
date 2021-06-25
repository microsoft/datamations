## Members

<dl>
<dt><a href="#rawSpecs">rawSpecs</a></dt>
<dd><p>Entry point of Datamations JavaScript code
Reads vega-lite specifications, converts to vega specs and animates using gemini</p>
<h3 id="dependencies">Dependencies:</h3>
<ul>
<li>gemini: <a href="https://github.com/uwdata/gemini">https://github.com/uwdata/gemini</a></li>
<li>vega-lite: <a href="https://vega.github.io/vega-lite/">https://vega.github.io/vega-lite/</a></li>
<li>vega: <a href="https://vega.github.io/vega/">https://vega.github.io/vega/</a></li>
<li>vega-embed: <a href="https://github.com/vega/vega-embed">https://github.com/vega/vega-embed</a></li>
</ul>
</dd>
</dl>

## Functions

<dl>
<dt><a href="#reset">reset()</a></dt>
<dd><p>Resets all the instance variables to be able to re-run animation</p>
</dd>
<dt><a href="#init">init(id, param1)</a></dt>
<dd><p>Initializes datamation app</p>
</dd>
<dt><a href="#play">play(id)</a></dt>
<dd><p>Plays animation</p>
</dd>
<dt><a href="#drawSpec">drawSpec(index, id, vegaSpec)</a> ⇒</dt>
<dd><p>Draws vega lite spec statically (without transition), also updates slider, description, show/hides some layers</p>
</dd>
<dt><a href="#drawChart">drawChart(spec, id, vegaSpec)</a> ⇒</dt>
<dd><p>Draws a chart
Supports single view as well as multiple view chart</p>
</dd>
<dt><a href="#drawAxis">drawAxis(index, id)</a> ⇒</dt>
<dd><p>Draws an axis layer. This is called when meta.axes = true.</p>
</dd>
<dt><a href="#animateFrame">animateFrame(index, id)</a> ⇒</dt>
<dd><p>Animates a frame, from source to target vega specification using gemini</p>
</dd>
<dt><a href="#loadData">loadData(specUrls)</a> ⇒</dt>
<dd><p>Loads specifications using d3.json</p>
</dd>
<dt><a href="#transformSpecs">transformSpecs()</a></dt>
<dd><p>Transforms specifications into proper format:</p>
<ul>
<li>meta.grid = generates infogrid</li>
<li>meta.jitter = jitters data using d3.forceCollide</li>
<li>spec.layer = splits layers to stack on top on each other</li>
</ul>
</dd>
<dt><a href="#toVegaSpecs">toVegaSpecs()</a></dt>
<dd><p>Converts vega-lite specs to vega specs using vl2vg4gemini (<a href="https://github.com/uwdata/gemini#vl2vg4gemini">https://github.com/uwdata/gemini#vl2vg4gemini</a>)</p>
</dd>
<dt><a href="#makeFrames">makeFrames()</a></dt>
<dd><p>Generates animation frames</p>
</dd>
<dt><a href="#onSlide">onSlide(id)</a></dt>
<dd><p>Slider on change callback</p>
</dd>
</dl>

<a name="rawSpecs"></a>

## rawSpecs
Entry point of Datamations JavaScript code
Reads vega-lite specifications, converts to vega specs and animates using gemini

### Dependencies: 
- gemini: https://github.com/uwdata/gemini
- vega-lite: https://vega.github.io/vega-lite/
- vega: https://vega.github.io/vega/
- vega-embed: https://github.com/vega/vega-embed

**Kind**: global variable  
<a name="reset"></a>

## reset()
Resets all the instance variables to be able to re-run animation

**Kind**: global function  
<a name="init"></a>

## init(id, param1)
Initializes datamation app

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>String</code> | root div id where vega visualizations are rendered |
| param1 | <code>Object</code> | configuration object |
| param1.specUrls | <code>Array</code> | list of urls |
| param1.specs | <code>Array</code> | list of vega-lite specifications |
| param1.autoPlay | <code>Boolean</code> | autoPlay yes | no |

<a name="play"></a>

## play(id)
Plays animation

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>String</code> | root container id where vega visualizations are mounted |

<a name="drawSpec"></a>

## drawSpec(index, id, vegaSpec) ⇒
Draws vega lite spec statically (without transition), also updates slider, description, show/hides some layers

**Kind**: global function  
**Returns**: a promise of vegaEmbed  

| Param | Type | Description |
| --- | --- | --- |
| index | <code>Number</code> | specification index in vegaLiteSpecs |
| id | <code>String</code> | root container id where vega visualizations are mounted |
| vegaSpec | <code>Object</code> | source vega spec of current frame |

<a name="drawChart"></a>

## drawChart(spec, id, vegaSpec) ⇒
Draws a chart
Supports single view as well as multiple view chart

**Kind**: global function  
**Returns**: a promise of vegaEmbed  

| Param | Type | Description |
| --- | --- | --- |
| spec | <code>Object</code> | vega-lite spec |
| id | <code>String</code> | root container id where vega visualizations are rendered |
| vegaSpec | <code>Object</code> | source vega spec of current frame |

<a name="drawAxis"></a>

## drawAxis(index, id) ⇒
Draws an axis layer. This is called when meta.axes = true.

**Kind**: global function  
**Returns**: a promise of vegaEmbed  

| Param | Type | Description |
| --- | --- | --- |
| index | <code>Number</code> | specification index in vegaLiteSpecs |
| id | <code>String</code> | root container id where vega visualizations are mounted |

<a name="animateFrame"></a>

## animateFrame(index, id) ⇒
Animates a frame, from source to target vega specification using gemini

**Kind**: global function  
**Returns**: a promise of gemini.animate  

| Param | Type | Description |
| --- | --- | --- |
| index | <code>Number</code> | specification index in vegaLiteSpecs |
| id | <code>String</code> | root container id where vega visualizations are mounted |

<a name="loadData"></a>

## loadData(specUrls) ⇒
Loads specifications using d3.json

**Kind**: global function  
**Returns**: a promise of Promise.all  

| Param | Type | Description |
| --- | --- | --- |
| specUrls | <code>Array</code> | list of urls |

<a name="transformSpecs"></a>

## transformSpecs()
Transforms specifications into proper format:
- meta.grid = generates infogrid
- meta.jitter = jitters data using d3.forceCollide
- spec.layer = splits layers to stack on top on each other

**Kind**: global function  
<a name="toVegaSpecs"></a>

## toVegaSpecs()
Converts vega-lite specs to vega specs using vl2vg4gemini (https://github.com/uwdata/gemini#vl2vg4gemini)

**Kind**: global function  
<a name="makeFrames"></a>

## makeFrames()
Generates animation frames

**Kind**: global function  
<a name="onSlide"></a>

## onSlide(id)
Slider on change callback

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>String</code> | root container id where vega visualizations are mounted |

