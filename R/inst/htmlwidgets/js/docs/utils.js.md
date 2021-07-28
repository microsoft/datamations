## Functions

<dl>
<dt><a href="#getSelectors">getSelectors(id)</a> ⇒</dt>
<dd><p>Gets selectors for each componenent, such as slider and animation divs</p>
</dd>
<dt><a href="#splitLayers">splitLayers(input)</a> ⇒</dt>
<dd><p>Splits layers into separate vega-lite specifications, removes layer field</p>
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

