# Create a DatamationFrame
#
# Create a subclass from a pandas DataFrame.
#
import os
import pandas as pd
from . import datamation_groupby

import json
from IPython.core.display import display, Javascript

X_FIELD_CHR = "datamations_x"
Y_FIELD_CHR = "datamations_y"
Y_RAW_FIELD_CHR = "datamations_y_raw"
Y_TOOLTIP_FIELD_CHR = "datamations_y_tooltip"

class Datamation:
    def __init__(self, states, operations, output):
        self.states = states
        self.operations = operations
        self.output = output

    def __str__(self):
        return self.output.to_json()

class DatamationFrame(pd.DataFrame):
    @property
    def _constructor(self):
        return DatamationFrame._internal_ctor

    _states = []
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
        self._states = []
        self._states.append(data)
        self._operations = []

    @property
    def states(self):
        return self._states

    @property
    def operations(self):
        return self._operations

    def groupby(self, by):
        self._operations.append('groupby')
        df = super(DatamationFrame, self).groupby(by=by)
        return datamation_groupby.DatamationGroupBy(self, by)

    def prep_specs_group_by(self, width=300, height=300):
        script_dir = os.path.dirname( __file__ )
        specs_file = open(os.path.join(script_dir, '../sandbox/specs_for_python/raw_spec.json'), 'r')
        specs = json.load(specs_file)
        return specs[1:3]

    def prep_specs_summarize(self, width=300, height=300):
        script_dir = os.path.dirname( __file__ )
        specs_file = open(os.path.join(script_dir, '../sandbox/specs_for_python/raw_spec.json'), 'r')
        specs = json.load(specs_file)
        return specs[3:]

    def prep_specs_data(self, width=300, height=300):
        # Prep encoding
        x_encoding = { 'field': X_FIELD_CHR, 'type':  "quantitative", 'axis': None }
        y_encoding = { 'field': Y_FIELD_CHR, 'type': "quantitative", 'axis': None }

        spec_encoding = { 'x': x_encoding, 'y': y_encoding }

        return [{
            "height": height,
            "width": width,
            "$schema": "https://vega.github.io/schema/vega-lite/v4.json",
            "data": {
                "values": [
                    {
                    "n": len(self.states[0])
                    }
                ]
            },
            "meta": { 
                'parse': "grid",
                'description': "Initial data"
            },
            "mark": {
                "type": "point",
                "filled": True,
                "strokeWidth": 1
            },
            "encoding": spec_encoding
        }]

    def specs(self):
        return self.prep_specs_data() + self.prep_specs_group_by() + self.prep_specs_summarize()

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

            (function(element) {
                element.append($('<div>').html(`
                <link href="https://cdn.jsdelivr.net/gh/microsoft/datamations@main/inst/htmlwidgets/css/datamationSandDance.css" rel="stylesheet" type="text/css">
                <style type="text/css">
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
        """ % (json.dumps(self.specs()))))

        return Datamation(self._states, self._operations, self)
