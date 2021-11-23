# Create a DatamationGroupBy
#
# Create a subclass from a pandas DataFrame.
#
import os, json
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
        
    def prep_specs_summarize(self, width=300, height=300):
        script_dir = os.path.dirname( __file__ )
        specs_file = open(os.path.join(script_dir, '../sandbox/specs_for_python/raw_spec.json'), 'r')
        specs = json.load(specs_file)
        return specs[2:]
        