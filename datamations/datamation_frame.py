# Create a DatamationFrame
#
# Create a subclass from a pandas DataFrame.
#
import pandas as pd
from .datamation_groupby import DatamationGroupBy

class DatamationFrame(pd.DataFrame):
    @property
    def _constructor(self):
        return DatamationFrame._internal_ctor

    _input = None
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
        self._input = data

    @property
    def input(self):
        return self._input

    @property
    def operations(self):
        return self._operations

    def groupby(self, by):
        self._operations.append('groupby')
        df = super(DatamationFrame, self).groupby(by=by)
        return DatamationGroupBy(self, self._input, by)
