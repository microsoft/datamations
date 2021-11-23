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