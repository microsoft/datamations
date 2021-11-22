# Create a DatamationFrame
#
# Create a subclass from a pandas DataFrame.
#
import pandas as pd
import importlib_resources
from . import datamation_groupby

import json
from IPython.core.display import display, Javascript, HTML

class Datamation:
    def __init__(self, inputs, operations, output):
        self.inputs = inputs
        self.operations = operations
        self.output = output

    def __str__(self):
        return self.output.to_json()

class DatamationFrame(pd.DataFrame):
    @property
    def _constructor(self):
        return DatamationFrame._internal_ctor

    _inputs = []
    _operations = []

    @classmethod
    def _internal_ctor(cls, *args, **kwargs):
        return cls(*args, **kwargs)

    def __init__(self, data, index=None, columns=None, dtype=None, copy=True):
        super(DatamationFrame, self).__init__(data=data,
                                      index=index,
                                      columns=columns,
                                      dtype=dtype,
                                      copy=copy)
        self._inputs = []
        self._inputs.append(data)
        self._operations = []

    @property
    def inputs(self):
        return self._inputs

    @property
    def operations(self):
        return self._operations

    def groupby(self, by):
        self._operations.append('groupby')
        df = super(DatamationFrame, self).groupby(by=by)
        return datamation_groupby.DatamationGroupBy(self, by)

    def datamation(self):
        display(Javascript("""
        require.config({ 
            paths: { 
            d3: 'https://cdn.jsdelivr.net/gh/microsoft/datamations@main/inst/htmlwidgets/d3/d3',
            vega: 'https://cdn.jsdelivr.net/gh/microsoft/datamations@main/inst/htmlwidgets/vega/vega',
            'vega-util': 'https://cdn.jsdelivr.net/gh/chisingh/datamations@main/inst/htmlwidgets/vega-util/vega-util',
            'vega-lite': 'https://cdn.jsdelivr.net/gh/microsoft/datamations@main/inst/htmlwidgets/vega-lite/vega-lite',
            'vega-embed': 'https://cdn.jsdelivr.net/gh/microsoft/datamations@main/inst/htmlwidgets/vega-embed/vega-embed',
            gemini: 'https://cdn.jsdelivr.net/gh/microsoft/datamations@main/inst/htmlwidgets/gemini/gemini.web',
            config: 'https://cdn.jsdelivr.net/gh/microsoft/datamations@main/inst/htmlwidgets/js/config',
            utils: 'https://cdn.jsdelivr.net/gh/microsoft/datamations@main/inst/htmlwidgets/js/utils',
            layout: 'https://cdn.jsdelivr.net/gh/microsoft/datamations@main/inst/htmlwidgets/js/layout',
            'hack-facet-view': 'https://cdn.jsdelivr.net/gh/microsoft/datamations@main/inst/htmlwidgets/js/hack-facet-view',
            app: 'https://cdn.jsdelivr.net/gh/microsoft/datamations@main/inst/htmlwidgets/js/app'
        }});
        """))

        resource = importlib_resources.files("datamations") / "../inst/htmlwidgets/css" / "datamationSandDance.css"
        styles = resource.read_bytes()

        resource = importlib_resources.files("datamations") / "../sandbox" / "specs.json"
        specs = json.loads(resource.read_bytes())

        display(Javascript("""
        (function(element) {
            element.append($('<div>').html(`
            <style type="text/css">
                %s
                .vega-vis-wrapper > div {
                    position: relative;
                }
            </style>
            <div class="flex-wrap">
            <div id="app">
                <div class="controls-wrapper">
                <div class="control-bar">
                    <div class="button-wrapper">
                    <button onclick="window.app1.play('app')">Replay</button>
                    </div>
                    <div class="slider-wrapper">
                    <input
                        class="slider"
                        type="range"
                        min="0"
                        value="0"
                        onchange="window.app1.onSlide('app')"
                    />
                    </div>
                </div>
                <div class="description"></div>
                </div>
                
                <div class="vega-vis-wrapper">
                <div class="vega-for-axis"></div>
                <div class="vega-other-layers"></div>
                <div class="vega-vis"></div>
                </div>
            </div>
            </div>
            `));
            
            require(['d3', 'vega', 'vega-util', 'vega-lite', 'vega-embed', 'gemini', 'app', 'utils', 'layout', 'config', 'hack-facet-view'], function(d3, vega, vegaUtil, vegaLite, vegaEmbed, gemini, app, utils, layout, config, hackFacetView) {
                window.d3 = d3
                window.vegaEmbed = vegaEmbed
                window.gemini = gemini
                window.app1 = App("app", {specs: %s, autoPlay: true});
            });            
        })(element);
        """ % (styles, json.dumps(specs))))
        
        return Datamation(self._inputs, self._operations, self)
