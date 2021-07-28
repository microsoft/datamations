## Functions

<dl>
<dt><a href="#getSpecTemplate">getSpecTemplate(width, height, axes, spec)</a> ⇒</dt>
<dd><p>Creates vega-lite spec template</p>
</dd>
<dt><a href="#getHackedSpec">getHackedSpec(param0)</a> ⇒</dt>
<dd><p>Creates a vega-lite specification, without facets</p>
</dd>
<dt><a href="#hackFacet">hackFacet(spec)</a> ⇒</dt>
<dd></dd>
</dl>

<a name="getSpecTemplate"></a>

## getSpecTemplate(width, height, axes, spec) ⇒
Creates vega-lite spec template

**Kind**: global function  
**Returns**: vega-lite spec template  

| Param | Type | Description |
| --- | --- | --- |
| width | <code>Number</code> | chart width |
| height | <code>Number</code> | chart height |
| axes | <code>Object</code> | which axis to include |
| spec | <code>Object</code> | vega-lite spec |

<a name="getHackedSpec"></a>

## getHackedSpec(param0) ⇒
Creates a vega-lite specification, without facets

**Kind**: global function  
**Returns**: new vega-lite specification  

| Param | Type | Description |
| --- | --- | --- |
| param0 | <code>Object</code> | some parameters to generate hacked specification |

<a name="hackFacet"></a>

## hackFacet(spec) ⇒
**Kind**: global function  
**Returns**: a promise of vegaEmbed  

| Param | Type | Description |
| --- | --- | --- |
| spec | <code>Object</code> | vega-lite spec |

