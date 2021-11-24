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

    _states = []
    _operations = []

    @classmethod
    def _internal_ctor(cls, *args, **kwargs):
        return cls(*args, **kwargs)

    def __init__(self, obj, by, keys=None, axis=0, level=None):
        super(DatamationGroupBy, self).__init__(obj=obj, keys=[by])
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
        df._states = self._states
        df._operations = self._operations
        return df
        
    def prep_specs_summarize(self, width=300, height=300):
        x_encoding = {
            "field": "datamations_x",
            "type": "quantitative",
            "axis": {
            "values": [1, 2],
            "labelExpr": "round(datum.label) == 1 ? 'Masters' : 'PhD'",
            "labelAngle": -90
            },
            "title": "Degree",
            "scale": {
            "domain": [0.5, 2.5]
            }
        }

        y_encoding = {
            "field": "datamations_y",
            "type": "quantitative",
            "title": "Salary",
            "scale": {
            "domain": [81.9445013836958, 94.0215112566948]
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
                "title": "Salary"
            },
            {
                "field": "Degree",
                "type": "nominal"
            }
        ]

        spec_encoding = {
            "x": {
                "field": "datamations_x",
                "type": "quantitative",
                "axis": {
                "values": [1, 2],
                "labelExpr": "round(datum.label) == 1 ? 'Masters' : 'PhD'",
                "labelAngle": -90
                },
                "title": "Degree",
                "scale": {
                "domain": [0.5, 2.5]
                }
            },
            "y": {
                "field": "datamations_y",
                "type": "quantitative",
                "title": "Salary",
                "scale": {
                "domain": [81.9445013836958, 94.0215112566948]
                }
            },
            "tooltip": [
                {
                "field": "datamations_y_tooltip",
                "type": "quantitative",
                "title": "Salary"
                },
                {
                "field": "Degree",
                "type": "nominal"
                }
            ]
        }

        values = []
        
        id = 1
        for i in range(len(self.states[0])):
            if self.states[0]['Degree'][i] == 'PhD':
                continue
            values.append({
                "gemini_id": id,
                "Degree": self.states[0]['Degree'][i],
                "datamations_x": 1 if self.states[0]['Degree'][i] == 'Masters'  else 2,
                "datamations_y": self.states[0]['Salary'][i],
                "datamations_y_tooltip": self.states[0]['Salary'][i],
            })
            id = id + 1

        for i in range(len(self.states[0])):
            if self.states[0]['Degree'][i] == 'Masters':
                continue
            values.append({
                "gemini_id": id,
                "Degree": self.states[0]['Degree'][i],
                "datamations_x": 1 if self.states[0]['Degree'][i] == 'Masters'  else 2,
                "datamations_y": self.states[0]['Salary'][i],
                "datamations_y_tooltip": self.states[0]['Salary'][i]
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
                "description": "Plot Salary within each group",
                "splitField": "Degree",
                "xAxisLabels": ["Masters", "PhD"]
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
                "labelExpr": "round(datum.label) == 1 ? 'Masters' : 'PhD'",
                "labelAngle": -90
                },
                "title": "Degree",
                "scale": {
                "domain": [0.5, 2.5]
                }
            },
            "y": {
                "field": "datamations_y",
                "type": "quantitative",
                "title": "mean(Salary)",
                "scale": {
                "domain": [81.9445013836958, 94.0215112566948]
                }
            },
            "tooltip": [
                {
                "field": "datamations_y_tooltip",
                "type": "quantitative",
                "title": "mean(Salary)"
                },
                {
                "field": "Degree",
                "type": "nominal"
                }
            ]
        }

        values = []
        
        id = 1
        for i in range(len(self.states[0])):
            if self.states[0]['Degree'][i] == 'PhD':
                continue
            values.append({
                "gemini_id": id,
                "Degree": self.states[0]['Degree'][i],
                "datamations_x": 1 if self.states[0]['Degree'][i] == 'Masters'  else 2,
                "datamations_y": 90.2263340061763,
                "datamations_y_tooltip": 90.2263340061763,
            })
            id = id + 1

        for i in range(len(self.states[0])):
            if self.states[0]['Degree'][i] == 'Masters':
                continue
            values.append({
                "gemini_id": id,
                "Degree": self.states[0]['Degree'][i],
                "datamations_x": 1 if self.states[0]['Degree'][i] == 'Masters'  else 2,
                "datamations_y": 88.2456061263219,
                "datamations_y_tooltip": 88.2456061263219
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
                "description": "Plot mean Salary of each group"
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
                        "labelExpr": "round(datum.label) == 1 ? 'Masters' : 'PhD'",
                        "labelAngle": -90
                        },
                        "title": "Degree",
                        "scale": {
                        "domain": [0.5, 2.5]
                        }
                    },
                    "y": {
                        "field": "datamations_y_raw",
                        "type": "quantitative",
                        "title": "mean(Salary)",
                        "scale": {
                        "domain": [81.9445013836958, 94.0215112566948]
                        }
                    },
                    "tooltip": [
                        {
                        "field": "datamations_y_tooltip",
                        "type": "quantitative",
                        "title": "mean(Salary)"
                        },
                        {
                        "field": "Upper",
                        "type": "nominal",
                        "title": "mean(Salary) + standard error"
                        },
                        {
                        "field": "Lower",
                        "type": "nominal",
                        "title": "mean(Salary) - standard error"
                        },
                        {
                        "field": "Degree",
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
                        "labelExpr": "round(datum.label) == 1 ? 'Masters' : 'PhD'",
                        "labelAngle": -90
                        },
                        "title": "Degree",
                        "scale": {
                        "domain": [0.5, 2.5]
                        }
                    },
                    "y": {
                        "field": "datamations_y",
                        "type": "quantitative",
                        "title": "mean(Salary)",
                        "scale": {
                        "domain": [81.9445013836958, 94.0215112566948]
                        }
                    },
                    "tooltip": [
                        {
                        "field": "datamations_y_tooltip",
                        "type": "quantitative",
                        "title": "mean(Salary)"
                        },
                        {
                        "field": "Upper",
                        "type": "nominal",
                        "title": "mean(Salary) + standard error"
                        },
                        {
                        "field": "Lower",
                        "type": "nominal",
                        "title": "mean(Salary) - standard error"
                        },
                        {
                        "field": "Degree",
                        "type": "nominal"
                        }
                    ]
                }
            }
        ]

        values = []
        
        id = 1
        for i in range(len(self.states[0])):
            if self.states[0]['Degree'][i] == 'PhD':
                continue
            values.append({
                "gemini_id": id,
                "Degree": self.states[0]['Degree'][i],
                "datamations_x": 1 if self.states[0]['Degree'][i] == 'Masters'  else 2,
                "datamations_y": 90.2263340061763,
                "datamations_y_raw": self.states[0]['Salary'][i],
                "datamations_y_tooltip": 90.2263340061763,
                "Lower": 89.9152330064628,
                "Upper": 90.5374350058899
            })
            id = id + 1

        for i in range(len(self.states[0])):
            if self.states[0]['Degree'][i] == 'Masters':
                continue
            values.append({
                "gemini_id": id,
                "Degree": self.states[0]['Degree'][i],
                "datamations_x": 1 if self.states[0]['Degree'][i] == 'Masters'  else 2,
                "datamations_y": 88.2456061263219,
                "datamations_y_raw": self.states[0]['Salary'][i],
                "datamations_y_tooltip": 88.2456061263219,
                "Lower": 87.5297479964919,
                "Upper": 88.961464256152
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
                "description": "Plot mean Salary of each group, with errorbar"
            },
            "layer": layer
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
                        "labelExpr": "round(datum.label) == 1 ? 'Masters' : 'PhD'",
                        "labelAngle": -90
                        },
                        "title": "Degree",
                        "scale": {
                        "domain": [0.5, 2.5]
                        }
                    },
                    "y": {
                        "field": "datamations_y_raw",
                        "type": "quantitative",
                        "title": "mean(Salary)",
                        "scale": {
                        "domain": [87.5297479964919, 90.5374350058899]
                        }
                    },
                    "tooltip": [
                        {
                        "field": "datamations_y_tooltip",
                        "type": "quantitative",
                        "title": "mean(Salary)"
                        },
                        {
                        "field": "Upper",
                        "type": "nominal",
                        "title": "mean(Salary) + standard error"
                        },
                        {
                        "field": "Lower",
                        "type": "nominal",
                        "title": "mean(Salary) - standard error"
                        },
                        {
                        "field": "Degree",
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
                        "labelExpr": "round(datum.label) == 1 ? 'Masters' : 'PhD'",
                        "labelAngle": -90
                        },
                        "title": "Degree",
                        "scale": {
                        "domain": [0.5, 2.5]
                        }
                    },
                    "y": {
                        "field": "datamations_y",
                        "type": "quantitative",
                        "title": "mean(Salary)",
                        "scale": {
                        "domain": [87.5297479964919, 90.5374350058899]
                        }
                    },
                    "tooltip": [
                        {
                        "field": "datamations_y_tooltip",
                        "type": "quantitative",
                        "title": "mean(Salary)"
                        },
                        {
                        "field": "Upper",
                        "type": "nominal",
                        "title": "mean(Salary) + standard error"
                        },
                        {
                        "field": "Lower",
                        "type": "nominal",
                        "title": "mean(Salary) - standard error"
                        },
                        {
                        "field": "Degree",
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
                "description": "Plot mean Salary of each group, with errorbar, zoomed in"
            },
            "layer": layer
        }

        specs_list.append(spec)

        specs_list = specs_list
        return specs_list
