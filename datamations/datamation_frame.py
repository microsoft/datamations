# Create a DatamationFrame
#
# Create a subclass from a pandas DataFrame.
#
import pandas as pd
from . import datamation_groupby

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
        return Datamation(self._inputs, self._operations, self)
