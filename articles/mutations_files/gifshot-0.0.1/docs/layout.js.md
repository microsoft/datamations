## Functions

<dl>
<dt><a href="#generateGrid">generateGrid(spec, rows, stacked)</a> ⇒</dt>
<dd><p>Generates data for grid specs</p>
</dd>
<dt><a href="#getGridSpec">getGridSpec(spec, rows)</a> ⇒</dt>
<dd><p>Generates infogrid specification</p>
</dd>
<dt><a href="#getJitterSpec">getJitterSpec(spec)</a> ⇒</dt>
<dd><p>Generates jittered specification using d3-force</p>
</dd>
</dl>

<a name="generateGrid"></a>

## generateGrid(spec, rows, stacked) ⇒
Generates data for grid specs

**Kind**: global function  
**Returns**: an array of objects  

| Param | Type | Description |
| --- | --- | --- |
| spec | <code>Object</code> | vega-lite spec |
| rows | <code>Number</code> | number of rows |
| stacked | <code>Boolean</code> | if true, circles are stacked and vertically aliged |

<a name="getGridSpec"></a>

## getGridSpec(spec, rows) ⇒
Generates infogrid specification

**Kind**: global function  
**Returns**: grid specification  

| Param | Type | Description |
| --- | --- | --- |
| spec | <code>Object</code> | vega-lite specification |
| rows | <code>Number</code> | number of rows in a grid |

<a name="getJitterSpec"></a>

## getJitterSpec(spec) ⇒
Generates jittered specification using d3-force

**Kind**: global function  
**Returns**: jittered spec  

| Param | Type | Description |
| --- | --- | --- |
| spec | <code>Object</code> | vega-lite specification |

