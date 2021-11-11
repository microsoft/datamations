# Create a DatamationGroupBy
#
# Create a subclass from a pandas DataFrame.
#
import pandas as pd

class DatamationGroupBy(pd.core.groupby.generic.DataFrameGroupBy):
    @property
    def _constructor(self):
        return DatamationGroupBy._internal_ctor

    _input = None
    _operations = []

    @classmethod
    def _internal_ctor(cls, *args, **kwargs):
        return cls(*args, **kwargs)

    def __init__(self, obj, input, by, keys=None, axis=0, level=None):
        self._input = input
        super(DatamationGroupBy, self).__init__(obj=obj, keys=['Work'])
                                    #   keys=keys,
                                    #   axis=axis,
                                    #   level=level,
                                      #grouper=pd.Grouper(key=by))
        self._operations = list(obj.operations)

    @property
    def input(self):
        return self._input

    @property
    def operations(self):
        return self._operations

    def mean(self):
        df = super(DatamationGroupBy, self).mean()
        #df.operations.append('mean')
        return df