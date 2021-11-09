# Create a DatamationFrame
#
# Create a subclass from a pandas DataFrame.
#
import pandas as pd

class DatamationsFrame(pd.DataFrame):
    @property
    def _constructor(self):
        return DatamationsFrame._internal_ctor

    _metadata = ['']

    @classmethod
    def _internal_ctor(cls, *args, **kwargs):
        kwargs['new_property'] = None
        return cls(*args, **kwargs)

    def __init__(self, data, new_property, index=None, columns=None, dtype=None, copy=True):
        super(DatamationsFrame, self).__init__(data=data,
                                      index=index,
                                      columns=columns,
                                      dtype=dtype,
                                      copy=copy)
        self.new_property = new_property

    def groupby(self, by):
        self._metadata.append('groupby')
        return super(DatamationsFrame, self).groupby(by=by)

    def mean(self):
        self._metadata.append('mean')
        return super(DatamationsFrame, self).mean()

    def datamate(self, *args, **kwargs):
        return self._metadata