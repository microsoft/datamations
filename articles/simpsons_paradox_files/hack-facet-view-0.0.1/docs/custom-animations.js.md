## Constants

<dl>
<dt><a href="#CustomAnimations">CustomAnimations</a></dt>
<dd><p>Configuration for custom animations.
When meta.custom_animation is present, 
it looks up a function here and generates custom animation specifications</p>
</dd>
</dl>

## Functions

<dl>
<dt><a href="#getCountStep">getCountStep(source, target, shrink)</a> ⇒</dt>
<dd><p>Generates a spec for count animation</p>
</dd>
<dt><a href="#getMedianStep">getMedianStep(source, target, step, p)</a> ⇒</dt>
<dd><p>Generates a spec for median and quantile animations</p>
</dd>
<dt><a href="#getMeanStep">getMeanStep(source, target)</a> ⇒</dt>
<dd><p>Generates a spec for mean animation</p>
</dd>
<dt><a href="#getMinMaxStep">getMinMaxStep(source, target, minOrMax)</a> ⇒</dt>
<dd><p>Generates a spec for min and max animations</p>
</dd>
</dl>

<a name="CustomAnimations"></a>

## CustomAnimations
Configuration for custom animations.
When meta.custom_animation is present, 
it looks up a function here and generates custom animation specifications

**Kind**: global constant  

* [CustomAnimations](#CustomAnimations)
    * [.count(rawSource, target)](#CustomAnimations.count) ⇒
    * [.min(rawSource, target)](#CustomAnimations.min) ⇒
    * [.max(rawSource, target)](#CustomAnimations.max) ⇒
    * [.mean(rawSource, target)](#CustomAnimations.mean) ⇒
    * [.median(rawSource, target)](#CustomAnimations.median) ⇒

<a name="CustomAnimations.count"></a>

### CustomAnimations.count(rawSource, target) ⇒
steps:
1) stack sets
2) put rules (lines) using aggregate count
3) replace with count bubbles (aggregate count) (basically target spec)

**Kind**: static method of [<code>CustomAnimations</code>](#CustomAnimations)  
**Returns**: an array of vega-lite specs  

| Param | Type | Description |
| --- | --- | --- |
| rawSource | <code>Object</code> | source spec |
| target | <code>Object</code> | target spec |

<a name="CustomAnimations.min"></a>

### CustomAnimations.min(rawSource, target) ⇒
min animation steps:
1) source spec
2) stack sets, with a rule line at min circle
3) pull circles down
4) target spec

**Kind**: static method of [<code>CustomAnimations</code>](#CustomAnimations)  
**Returns**: an array of vega-lite specs  

| Param | Type | Description |
| --- | --- | --- |
| rawSource | <code>Object</code> | source spec |
| target | <code>Object</code> | target spec |

<a name="CustomAnimations.max"></a>

### CustomAnimations.max(rawSource, target) ⇒
max animation steps:
1) source spec
2) stack sets, with a rule line at max circle
3) pull circles up
4) target spec

**Kind**: static method of [<code>CustomAnimations</code>](#CustomAnimations)  
**Returns**: an array of vega-lite specs  

| Param | Type | Description |
| --- | --- | --- |
| rawSource | <code>Object</code> | source spec |
| target | <code>Object</code> | target spec |

<a name="CustomAnimations.mean"></a>

### CustomAnimations.mean(rawSource, target) ⇒
mean animation steps:
1) source spec
2) intermediate: circles will be placed diagonally "/" 
3) add lines (rules) at mean level
4) convert circles to small ticks
5) show vertical lines
6) collapse the lines to mean level
7) target spec

**Kind**: static method of [<code>CustomAnimations</code>](#CustomAnimations)  
**Returns**: an array of vega-lite specs  

| Param | Type | Description |
| --- | --- | --- |
| rawSource | <code>Object</code> | source spec |
| target | <code>Object</code> | target spec |

<a name="CustomAnimations.median"></a>

### CustomAnimations.median(rawSource, target) ⇒
median and quantile animation steps:
1) source spec
2) show rules at the top and bottom
3) split circles by median and move to the right and left and move rules to median level
4) target spec

**Kind**: static method of [<code>CustomAnimations</code>](#CustomAnimations)  
**Returns**: an array of vega-lite specs  

| Param | Type | Description |
| --- | --- | --- |
| rawSource | <code>Object</code> | source spec |
| target | <code>Object</code> | target spec |

<a name="getCountStep"></a>

## getCountStep(source, target, shrink) ⇒
Generates a spec for count animation

**Kind**: global function  
**Returns**: a vega lite spec  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| source | <code>Object</code> |  | source spec |
| target | <code>Object</code> |  | target spec |
| shrink | <code>Object</code> | <code>false</code> | if truthy, circles will be pulled up |

<a name="getMedianStep"></a>

## getMedianStep(source, target, step, p) ⇒
Generates a spec for median and quantile animations

**Kind**: global function  
**Returns**: a vega lite spec  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| source | <code>Object</code> |  | source spec |
| target | <code>Object</code> |  | target spec |
| step | <code>Number</code> | <code>0</code> | step counter. null is the last step |
| p | <code>Number</code> | <code>0.5</code> | a percentile |

<a name="getMeanStep"></a>

## getMeanStep(source, target) ⇒
Generates a spec for mean animation

**Kind**: global function  
**Returns**: a vega lite spec  

| Param | Type | Description |
| --- | --- | --- |
| source | <code>Object</code> | source spec |
| target | <code>Object</code> | target spec |

<a name="getMinMaxStep"></a>

## getMinMaxStep(source, target, minOrMax) ⇒
Generates a spec for min and max animations

**Kind**: global function  
**Returns**: a vega lite spec  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| source | <code>Object</code> |  | source spec |
| target | <code>Object</code> |  | target spec |
| minOrMax | <code>String</code> | <code>min</code> | "min" or "max" |

