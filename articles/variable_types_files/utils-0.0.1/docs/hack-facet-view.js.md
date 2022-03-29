## Functions

<dl>
<dt><a href="#getEmptySpec">getEmptySpec(spec)</a> ⇒</dt>
<dd><p>Get empty spec, if no data is present</p>
</dd>
<dt><a href="#getSpecTemplate">getSpecTemplate(width, height, axes, spec)</a> ⇒</dt>
<dd><p>Creates and returns a template for vega spec</p>
</dd>
<dt><a href="#getHackedSpec">getHackedSpec(param0)</a> ⇒</dt>
<dd><p>Get hacked spec
Finding coordinates of each circle and treat them as real values in the one axis view 
Adding axis layer underneath to look exactly same as faceted view</p>
</dd>
<dt><a href="#hackFacet">hackFacet(spec)</a> ⇒</dt>
<dd><p>turns faceted spec to regular spec, using hacking technique</p>
</dd>
</dl>

<a name="getEmptySpec"></a>

## getEmptySpec(spec) ⇒
Get empty spec, if no data is present

**Kind**: global function  
**Returns**: vega-lite spec  

| Param | Type |
| --- | --- |
| spec | <code>Object</code> | 

<a name="getSpecTemplate"></a>

## getSpecTemplate(width, height, axes, spec) ⇒
Creates and returns a template for vega spec

**Kind**: global function  
**Returns**: vega-lite spec  

| Param | Type | Description |
| --- | --- | --- |
| width | <code>Number</code> | spec width |
| height | <code>Number</code> | spec height |
| axes | <code>Object</code> | which axes to add |
| spec | <code>Object</code> | original spec |

<a name="getHackedSpec"></a>

## getHackedSpec(param0) ⇒
Get hacked spec
Finding coordinates of each circle and treat them as real values in the one axis view 
Adding axis layer underneath to look exactly same as faceted view

**Kind**: global function  
**Returns**: vega-lite spec  

| Param | Type | Description |
| --- | --- | --- |
| param0 | <code>Object</code> | parameters |
| param0.view | <code>Object</code> | a vega view instance |
| param0.spec | <code>Object</code> | a vega spec |
| param0.width | <code>Object</code> | spec width |
| param0.height | <code>Object</code> | spec height |

<a name="hackFacet"></a>

## hackFacet(spec) ⇒
turns faceted spec to regular spec, using hacking technique

**Kind**: global function  
**Returns**: vega-lite spec  

| Param | Type | Description |
| --- | --- | --- |
| spec | <code>Object</code> | vega lite spec with facets |

