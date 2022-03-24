## Functions

<dl>
<dt><a href="#getSelectors">getSelectors(id)</a> ⇒</dt>
<dd><p>Gets selectors for each componenent, such as slider and animation divs</p>
</dd>
<dt><a href="#splitLayers">splitLayers(input)</a> ⇒</dt>
<dd><p>Splits layers into separate vega-lite specifications, removes layer field</p>
</dd>
<dt><a href="#lookupByBucket">lookupByBucket(words, buckets, value)</a></dt>
<dd><p>Looks up a word based of buckets and value.
Example:</p>
<ul>
<li>words: [&#39;a&#39;, &#39;b&#39;, &#39;c&#39;]</li>
<li>buckets: [10, 20, 30]</li>
<li>value: 25
will return &#39;c&#39;</li>
</ul>
</dd>
<dt><a href="#getRows">getRows(vegaLiteSpecs)</a> ⇒</dt>
<dd><p>Finds correct number of rows for grid based on biggest group</p>
</dd>
</dl>

<a name="getSelectors"></a>

## getSelectors(id) ⇒
Gets selectors for each componenent, such as slider and animation divs

**Kind**: global function  
**Returns**: object of selectors  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>String</code> | root container id where all the animation components are rendered |

<a name="splitLayers"></a>

## splitLayers(input) ⇒
Splits layers into separate vega-lite specifications, removes layer field

**Kind**: global function  
**Returns**: a list of specs  

| Param | Type | Description |
| --- | --- | --- |
| input | <code>Object</code> | vega-lite specification with layers |

<a name="lookupByBucket"></a>

## lookupByBucket(words, buckets, value)
Looks up a word based of buckets and value.
Example:
  - words: ['a', 'b', 'c']
  - buckets: [10, 20, 30]
  - value: 25
  will return 'c'

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| words | <code>Array</code> | list of words |
| buckets | <code>Array</code> | list of numbers |
| value | <code>Number</code> | score to lookup |

<a name="getRows"></a>

## getRows(vegaLiteSpecs) ⇒
Finds correct number of rows for grid based on biggest group

**Kind**: global function  
**Returns**: a number of rows  

| Param | Type | Description |
| --- | --- | --- |
| vegaLiteSpecs | <code>Array</code> | an array of vega lite specs |

