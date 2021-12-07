# Utility functions
#

import copy

class utils():

    X_FIELD_CHR = "datamations_x"
    Y_FIELD_CHR = "datamations_y"
    Y_RAW_FIELD_CHR = "datamations_y_raw"
    Y_TOOLTIP_FIELD_CHR = "datamations_y_tooltip"

    def generate_vega_specs(data, meta, spec_encoding, facet_encoding=None, facet_dims=None, errorbar=False, height=300, width=300):
        mark = {
                "type": "point",
                "filled": True,
                "strokeWidth": 1
        }
        if not errorbar:
            if facet_encoding:
                spec = {
                    "$schema": "https://vega.github.io/schema/vega-lite/v4.json",
                    "meta": meta,
                    "data": {
                        "values": data
                    },
                    "facet": facet_encoding,
                    "spec": {
                        "height": height / facet_dims["nrow"] if facet_dims else 1,
                        "width": width / facet_dims["ncol"] if facet_dims else 1,
                        "mark": mark,
                        "encoding": spec_encoding
                    }
                }
            else:
                spec = {
                    "height": height,
                    "width": width,
                    "$schema": "https://vega.github.io/schema/vega-lite/v4.json",
                    "meta": meta,
                    "data": {
                        "values": data
                    },
                    "mark": mark,
                    "encoding": spec_encoding
                }

        else:
            errorbar_spec_encoding = copy.deepcopy(spec_encoding)
            errorbar_spec_encoding["y"]["field"] = utils.Y_RAW_FIELD_CHR

            if facet_encoding:
                spec = {
                    "$schema": "https://vega.github.io/schema/vega-lite/v4.json",
                    "meta": meta,
                    "data": {
                        "values": data
                    },
                    "facet": facet_encoding,
                    "spec": {
                        "height": height / facet_dims["nrow"] if facet_dims else 1,
                        "width": width / facet_dims["ncol"] if facet_dims else 1,
                        "layer": [
                            {
                                "mark": "errorbar",
                                "encoding": errorbar_spec_encoding
                            },
                            {
                                "mark": mark,
                                "encoding": spec_encoding
                            }
                        ]
                    }
                }
            else:
                spec = {
                    "height": height,
                    "width": width,
                    "$schema": "https://vega.github.io/schema/vega-lite/v4.json",
                    "data": {
                        "values": data
                    },
                    "meta": meta,
                    "layer": [
                        {
                            "mark": "errorbar",
                            "encoding": errorbar_spec_encoding
                        },
                        {
                            "mark": mark,
                            "encoding": spec_encoding
                        }
                    ]
                }
        return spec
        