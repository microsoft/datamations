# Create a DatamationGroupBy
#
# Create a subclass from a pandas DataFrame.
#
import json
import pandas as pd
from . import datamation_frame

X_FIELD_CHR = "datamations_x"
Y_FIELD_CHR = "datamations_y"
Y_RAW_FIELD_CHR = "datamations_y_raw"
Y_TOOLTIP_FIELD_CHR = "datamations_y_tooltip"

class DatamationGroupBy(pd.core.groupby.generic.DataFrameGroupBy):
    @property
    def _constructor(self):
        return DatamationGroupBy._internal_ctor

    _by = []
    _output = {}
    _error = {}
    _states = []
    _operations = []

    @classmethod
    def _internal_ctor(cls, *args, **kwargs):
        return cls(*args, **kwargs)

    def __init__(self, obj, by, keys=None, axis=0, level=None):
        super(DatamationGroupBy, self).__init__(obj=obj, keys=[by])
        self._by = [by]
        self._states = list(obj.states)
        self._operations = list(obj.operations)

    @property
    def states(self):
        return self._states

    @property
    def operations(self):
        return self._operations

    def mean(self):
        self._states.append(self)
        self._operations.append('mean')
        df = super(DatamationGroupBy, self).mean()
        df = datamation_frame.DatamationFrame(df)
        df._by = self.states[1]._by
        df._states = self._states
        df._operations = self._operations
        self._output = df
        self._error = super(DatamationGroupBy, self).sem()
        return df
        
    def prep_specs_summarize(self, width=300, height=300):
        x_axis = self.states[1].dtypes.axes[0].name
        y_axis = self.states[1].dtypes.axes[1].values[1]

        groups = list(self.states[1].groups.keys())

        x_encoding = {
            "field": "datamations_x",
            "type": "quantitative",
            "axis": {
            "values": [1, 2],
            "labelExpr": "round(datum.label) == 1 ? '" + groups[0] + "' : '"  + groups[1] + "'",
            "labelAngle": -90
            },
            "title": x_axis,
            "scale": {
            "domain": [0.5, 2.5]
            }
        }

        y_encoding = {
            "field": "datamations_y",
            "type": "quantitative",
            "title": y_axis,
            "scale": {
            "domain": [round(self.states[0][y_axis].min(),13), self.states[0][y_axis].max()]
            }
        }

        spec_encoding = { 'x': x_encoding, 'y': y_encoding }

        spec_encoding["color"] = {
            "field": None,
            "type": "nominal"
        }
        
        spec_encoding["tooltip"] = [
            {
                "field": "datamations_y_tooltip",
                "type": "quantitative",
                "title": y_axis
            },
            {
                "field": x_axis,
                "type": "nominal"
            }
        ]

        spec_encoding = {
            "x": {
                "field": "datamations_x",
                "type": "quantitative",
                "axis": {
                "values": [1, 2],
                "labelExpr": "round(datum.label) == 1 ? '" + groups[0] + "' : '" + groups[1] +"'",
                "labelAngle": -90
                },
                "title": x_axis,
                "scale": {
                "domain": [0.5, 2.5]
                }
            },
            "y": {
                "field": "datamations_y",
                "type": "quantitative",
                "title": y_axis,
                "scale": {
                "domain": [round(self.states[0][y_axis].min(),13), self.states[0][y_axis].max()]
                }
            },
            "tooltip": [
                {
                "field": "datamations_y_tooltip",
                "type": "quantitative",
                "title": y_axis
                },
                {
                "field": x_axis,
                "type": "nominal"
                }
            ]
        }

        values = []
        
        id = 1
        for i in range(len(self.states[0])):
            if self.states[0][x_axis][i] == groups[1]:
                continue
            values.append({
                "gemini_id": id,
                x_axis: self.states[0][x_axis][i],
                "datamations_x": 1 if self.states[0][x_axis][i] == groups[0]  else 2,
                "datamations_y": self.states[0][y_axis][i],
                "datamations_y_tooltip": self.states[0][y_axis][i],
            })
            id = id + 1

        for i in range(len(self.states[0])):
            if self.states[0][x_axis][i] == groups[0]:
                continue
            values.append({
                "gemini_id": id,
                x_axis: self.states[0][x_axis][i],
                "datamations_x": 1 if self.states[0][x_axis][i] == groups[0]  else 2,
                "datamations_y": self.states[0][y_axis][i],
                "datamations_y_tooltip": self.states[0][y_axis][i]
            })
            id = id + 1

        specs_list = []

        spec = {
            "height": height,
            "width": width,
            "$schema": "https://vega.github.io/schema/vega-lite/v4.json",
            "data": {
                "values": values
            },
            "meta": { 
                "parse": "jitter",
                "axes": False,
                "description": "Plot " + y_axis + " within each group",
                "splitField": x_axis,
                "xAxisLabels": groups
            },
            "mark": {
                "type": "point",
                "filled": True,
                "strokeWidth": 1
            },
            "encoding": spec_encoding
        }
        specs_list.append(spec)

        spec_encoding = {
            "x": {
                "field": "datamations_x",
                "type": "quantitative",
                "axis": {
                "values": [1, 2],
                "labelExpr": "round(datum.label) == 1 ? '" + groups[0] + "' : '" + groups[1] +"'",
                "labelAngle": -90
                },
                "title": x_axis,
                "scale": {
                "domain": [0.5, 2.5]
                }
            },
            "y": {
                "field": "datamations_y",
                "type": "quantitative",
                "title": "mean(" + y_axis + ")",
                "scale": {
                "domain": [round(self.states[0][y_axis].min(),13), self.states[0][y_axis].max()]
                }
            },
            "tooltip": [
                {
                "field": "datamations_y_tooltip",
                "type": "quantitative",
                "title": "mean(" + y_axis + ")"
                },
                {
                "field": x_axis,
                "type": "nominal"
                }
            ]
        }

        values = []
        
        id = 1
        for i in range(len(self.states[0])):
            if self.states[0][x_axis][i] == groups[1]:
                continue
            values.append({
                "gemini_id": id,
                x_axis: self.states[0][x_axis][i],
                "datamations_x": 1 if self.states[0][x_axis][i] == groups[0]  else 2,
                "datamations_y": self._output[y_axis][groups[0]],
                "datamations_y_tooltip": self._output[y_axis][groups[0]],
            })
            id = id + 1

        for i in range(len(self.states[0])):
            if self.states[0][x_axis][i] == groups[0]:
                continue
            values.append({
                "gemini_id": id,
                x_axis: self.states[0][x_axis][i],
                "datamations_x": 1 if self.states[0][x_axis][i] == groups[0]  else 2,
                "datamations_y": self._output[y_axis][groups[1]],
                "datamations_y_tooltip": self._output[y_axis][groups[1]]
            })
            id = id + 1

        spec = {
            "height": height,
            "width": width,
            "$schema": "https://vega.github.io/schema/vega-lite/v4.json",
            "data": {
                "values": values
            },
            "meta": { 
                "axes": False,
                "description": "Plot mean " + y_axis + " of each group"
            },
            "mark": {
                "type": "point",
                "filled": True,
                "strokeWidth": 1
            },
            "encoding": spec_encoding
        }
        specs_list.append(spec)

        layer = [
            {
                "mark": "errorbar",
                "encoding": {
                    "x": {
                        "field": "datamations_x",
                        "type": "quantitative",
                        "axis": {
                        "values": [1, 2],
                        "labelExpr": "round(datum.label) == 1 ? '" + groups[0] + "' : '" + groups[1] +"'",
                        "labelAngle": -90
                        },
                        "title": x_axis,
                        "scale": {
                        "domain": [0.5, 2.5]
                        }
                    },
                    "y": {
                        "field": "datamations_y_raw",
                        "type": "quantitative",
                        "title": "mean(" + y_axis + ")",
                        "scale": {
                        "domain": [round(self.states[0][y_axis].min(),13), self.states[0][y_axis].max()]
                        }
                    },
                    "tooltip": [
                        {
                        "field": "datamations_y_tooltip",
                        "type": "quantitative",
                        "title": "mean(" + y_axis + ")"
                        },
                        {
                        "field": "Upper",
                        "type": "nominal",
                        "title": "mean(" + y_axis + ") + standard error"
                        },
                        {
                        "field": "Lower",
                        "type": "nominal",
                        "title": "mean(" + y_axis + ") - standard error"
                        },
                        {
                        "field": x_axis,
                        "type": "nominal"
                        }
                    ]
                }
            },
            {
                "mark": {
                "type": "point",
                "filled": True,
                "strokeWidth": 1
                },
                "encoding": {
                    "x": {
                        "field": "datamations_x",
                        "type": "quantitative",
                        "axis": {
                        "values": [1, 2],
                        "labelExpr": "round(datum.label) == 1 ? '" + groups[0] + "' : '" + groups[1] +"'",
                        "labelAngle": -90
                        },
                        "title": x_axis,
                        "scale": {
                        "domain": [0.5, 2.5]
                        }
                    },
                    "y": {
                        "field": "datamations_y",
                        "type": "quantitative",
                        "title": "mean(" + y_axis + ")",
                        "scale": {
                        "domain": [round(self.states[0][y_axis].min(),13), self.states[0][y_axis].max()]
                        }
                    },
                    "tooltip": [
                        {
                        "field": "datamations_y_tooltip",
                        "type": "quantitative",
                        "title": "mean(" + y_axis + ")"
                        },
                        {
                        "field": "Upper",
                        "type": "nominal",
                        "title": "mean(" + y_axis + ") + standard error"
                        },
                        {
                        "field": "Lower",
                        "type": "nominal",
                        "title": "mean(" + y_axis + ") - standard error"
                        },
                        {
                        "field": x_axis,
                        "type": "nominal"
                        }
                    ]
                }
            }
        ]

        values = []

        id = 1
        for i in range(len(self.states[0])):
            if self.states[0][x_axis][i] == groups[1]:
                continue
            values.append({
                "gemini_id": id,
                x_axis: self.states[0][x_axis][i],
                "datamations_x": 1 if self.states[0][x_axis][i] == groups[0]  else 2,
                "datamations_y": self._output[y_axis][groups[0]],
                "datamations_y_raw": self.states[0][y_axis][i],
                "datamations_y_tooltip": self._output[y_axis][groups[0]],
                "Lower": self._output[y_axis][groups[0]] - self._error[y_axis][groups[0]],
                "Upper": self._output[y_axis][groups[0]] + self._error[y_axis][groups[0]]
            })
            id = id + 1

        for i in range(len(self.states[0])):
            if self.states[0][x_axis][i] == groups[0]:
                continue
            values.append({
                "gemini_id": id,
                x_axis: self.states[0][x_axis][i],
                "datamations_x": 1 if self.states[0][x_axis][i] == groups[0]  else 2,
                "datamations_y": self._output[y_axis][groups[1]],
                "datamations_y_raw": self.states[0][y_axis][i],
                "datamations_y_tooltip": self._output[y_axis][groups[1]],
                "Lower": self._output[y_axis][groups[1]] - self._error[y_axis][groups[1]],
                "Upper": self._output[y_axis][groups[1]] + self._error[y_axis][groups[1]]
            })
            id = id + 1

        spec = {
            "height": height,
            "width": width,
            "$schema": "https://vega.github.io/schema/vega-lite/v4.json",
            "data": {
                "values": values
            },
            "meta": { 
                "axes": False,
                "description": "Plot mean " + y_axis + " of each group, with errorbar"
            },
            "layer": layer
        }

        specs_list.append(spec)

        domain = [
                round(min(self._output[y_axis][groups[0]]-self._error[y_axis][groups[0]], self._output[y_axis][groups[1]]-self._error[y_axis][groups[1]]),13),
                round(max(self._output[y_axis][groups[0]]+self._error[y_axis][groups[0]], self._output[y_axis][groups[1]]+self._error[y_axis][groups[1]]),13)
        ]

        layer = [
            {
                "mark": "errorbar",
                "encoding": {
                    "x": {
                        "field": "datamations_x",
                        "type": "quantitative",
                        "axis": {
                        "values": [1, 2],
                        "labelExpr": "round(datum.label) == 1 ? '" + groups[0] + "' : '" + groups[1] +"'",
                        "labelAngle": -90
                        },
                        "title": x_axis,
                        "scale": {
                        "domain": [0.5, 2.5]
                        }
                    },
                    "y": {
                        "field": "datamations_y_raw",
                        "type": "quantitative",
                        "title": "mean(" + y_axis + ")",
                        "scale": {
                        "domain": domain
                        }
                    },
                    "tooltip": [
                        {
                        "field": "datamations_y_tooltip",
                        "type": "quantitative",
                        "title": "mean(" + y_axis + ")"
                        },
                        {
                        "field": "Upper",
                        "type": "nominal",
                        "title": "mean(" + y_axis + ") + standard error"
                        },
                        {
                        "field": "Lower",
                        "type": "nominal",
                        "title": "mean(" + y_axis + ") - standard error"
                        },
                        {
                        "field": x_axis,
                        "type": "nominal"
                        }
                    ]
                }
            },
            {
                "mark": {
                "type": "point",
                "filled": True,
                "strokeWidth": 1
                },
                "encoding": {
                    "x": {
                        "field": "datamations_x",
                        "type": "quantitative",
                        "axis": {
                        "values": [1, 2],
                        "labelExpr": "round(datum.label) == 1 ? '" + groups[0] + "' : '" + groups[1] +"'",
                        "labelAngle": -90
                        },
                        "title": x_axis,
                        "scale": {
                        "domain": [0.5, 2.5]
                        }
                    },
                    "y": {
                        "field": "datamations_y",
                        "type": "quantitative",
                        "title": "mean(" + y_axis + ")",
                        "scale": {
                        "domain": domain
                        }
                    },
                    "tooltip": [
                        {
                        "field": "datamations_y_tooltip",
                        "type": "quantitative",
                        "title": "mean(" + y_axis + ")"
                        },
                        {
                        "field": "Upper",
                        "type": "nominal",
                        "title": "mean(" + y_axis + ") + standard error"
                        },
                        {
                        "field": "Lower",
                        "type": "nominal",
                        "title": "mean(" + y_axis + ") - standard error"
                        },
                        {
                        "field": x_axis,
                        "type": "nominal"
                        }
                    ]
                }
            }
        ]

        spec = {
            "height": height,
            "width": width,
            "$schema": "https://vega.github.io/schema/vega-lite/v4.json",
            "data": {
                "values": values
            },
            "meta": { 
                "axes": False,
                "description": "Plot mean " + y_axis + " of each group, with errorbar, zoomed in"
            },
            "layer": layer
        }

        specs_list.append(spec)

        specs_list = specs_list
        return specs_list
