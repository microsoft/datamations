## Constants

<dl>
<dt><a href="#getCountStep">getCountStep</a> ⇒</dt>
<dd><p>Generates a spec for count animation</p>
</dd>
<dt><a href="#getMedianStep">getMedianStep</a> ⇒</dt>
<dd><p>Generates a spec for median and quantile animations</p>
</dd>
<dt><a href="#getMeanStep">getMeanStep</a> ⇒</dt>
<dd><p>Generates a spec for mean animation</p>
</dd>
<dt><a href="#getMinMaxStep">getMinMaxStep</a> ⇒</dt>
<dd><p>Generates a spec for min and max animations</p>
</dd>
<dt><a href="#CustomAnimations">CustomAnimations</a></dt>
<dd><p>Configuration for custom animations.
When meta.custom_animation is present, 
it looks up a function here and generates custom animation specifications</p>
</dd>
</dl>

<a name="getCountStep"></a>

## getCountStep ⇒
Generates a spec for count animation

**Kind**: global constant  
**Returns**: a vega lite spec  

| Param | Type | Description |
| --- | --- | --- |
| source | <code>Object</code> | source spec |
| target | <code>Object</code> | target spec |
| shrink | <code>Object</code> | if truthy, circles will be pulled up |

<a name="getMedianStep"></a>

## getMedianStep ⇒
Generates a spec for median and quantile animations

**Kind**: global constant  
**Returns**: a vega lite spec  

| Param | Type | Description |
| --- | --- | --- |
| source | <code>Object</code> | source spec |
| target | <code>Object</code> | target spec |
| step | <code>Number</code> | step counter. null is the last step |
| p | <code>Number</code> | a percentile |

<a name="getMeanStep"></a>

## getMeanStep ⇒
Generates a spec for mean animation

**Kind**: global constant  
**Returns**: a vega lite spec  

| Param | Type | Description |
| --- | --- | --- |
| source | <code>Object</code> | source spec |
| target | <code>Object</code> | target spec |

<a name="getMinMaxStep"></a>

## getMinMaxStep ⇒
Generates a spec for min and max animations

**Kind**: global constant  
**Returns**: a vega lite spec  

| Param | Type | Description |
| --- | --- | --- |
| source | <code>Object</code> | source spec |
| target | <code>Object</code> | target spec |
| minOrMax | <code>String</code> | "min" or "max" |

<a name="CustomAnimations"></a>

## CustomAnimations
Configuration for custom animations.
When meta.custom_animation is present, 
it looks up a function here and generates custom animation specifications

**Kind**: global constant  

- [Constants](#constants)
- [getCountStep ⇒](#getcountstep-)
- [getMedianStep ⇒](#getmedianstep-)
- [getMeanStep ⇒](#getmeanstep-)
- [getMinMaxStep ⇒](#getminmaxstep-)
- [CustomAnimations](#customanimations)
  - [CustomAnimations.count(rawSource, target) ⇒](#customanimationscountrawsource-target-)
  - [CustomAnimations.min(rawSource, target) ⇒](#customanimationsminrawsource-target-)
  - [CustomAnimations.max(rawSource, target) ⇒](#customanimationsmaxrawsource-target-)
  - [CustomAnimations.mean(rawSource, target) ⇒](#customanimationsmeanrawsource-target-)
  - [CustomAnimations.median(rawSource, target) ⇒](#customanimationsmedianrawsource-target-)

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

