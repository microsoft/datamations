# Create a DatamationGroupBy
#
# Create a subclass from a pandas DataFrame.
#
import pandas as pd

from . import datamation_frame

class DatamationGroupBy(pd.core.groupby.generic.DataFrameGroupBy):
    @property
    def _constructor(self):
        return DatamationGroupBy._internal_ctor

    _inputs = []
    _operations = []

    @classmethod
    def _internal_ctor(cls, *args, **kwargs):
        return cls(*args, **kwargs)

    def __init__(self, obj, input, by, keys=None, axis=0, level=None):
        self._inputs = [input]
        super(DatamationGroupBy, self).__init__(obj=obj, keys=['Work'])
                                    #   keys=keys,
                                    #   axis=axis,
                                    #   level=level,
                                      #grouper=pd.Grouper(key=by))
        self._operations = list(obj.operations)

    @property
    def inputs(self):
        return self._inputs

    @property
    def operations(self):
        return self._operations

    def mean(self):
        df = super(DatamationGroupBy, self).mean()
        df = datamation_frame.DatamationFrame(df)
        df.operations.append('mean')
        df._inputs = self._inputs
        df._inputs.append(self)
        return df