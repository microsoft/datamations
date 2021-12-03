# Utility functions
#

import copy

class utils():

    X_FIELD_CHR = "datamations_x"
    Y_FIELD_CHR = "datamations_y"
    Y_RAW_FIELD_CHR = "datamations_y_raw"
    Y_TOOLTIP_FIELD_CHR = "datamations_y_tooltip"

    def generate_vega_specs(data, meta, spec_encoding, errorbar=False, height=300, width=300):
        if not errorbar:
            mark = {
                "type": "point",
                "filled": True,
                "strokeWidth": 1
            }
            spec = {
                "height": height,
                "width": width,
                "$schema": "https://vega.github.io/schema/vega-lite/v4.json",
                "meta": meta,
                "data": {
                    "values": data
                },
                "mark": {
                    "type": "point",
                    "filled": True,
                    "strokeWidth": 1
                },
                "encoding": spec_encoding
            }
        else:
            errorbar_spec_encoding = copy.deepcopy(spec_encoding)
            errorbar_spec_encoding["y"]["field"] = utils.Y_RAW_FIELD_CHR

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
                        "mark": {
                            "type": "point",
                            "filled": True,
                            "strokeWidth": 1
                        },
                        "encoding": spec_encoding
                    }
                ]
            }
        return spec
        