# Create a DatamationGroupBy
#
# Create a subclass from a pandas DataFrame.
#
import pandas as pd

class DatamationGroupBy(pd.core.groupby.generic.DataFrameGroupBy):
    @property
    def _constructor(self):
        return DatamationGroupBy._internal_ctor

    _metadata = ['']

    @classmethod
    def _internal_ctor(cls, *args, **kwargs):
        kwargs['new_property'] = None
        return cls(*args, **kwargs)

    def __init__(self, data, new_property, index=None, columns=None, dtype=None, copy=True):
        # super(DatamationGroupBy, self).__init__(data=data,
        #                               index=index,
        #                               columns=columns,
        #                               dtype=dtype,
        #                               copy=copy)
        self.new_property = new_property
    def mean(self):
        self._metadata.append('mean')
        return self._metadata #super(DatamationGroupBy, self).mean()

    def datamate(self, *args, **kwargs):
        return self._metadata