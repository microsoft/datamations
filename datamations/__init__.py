# Create a plot datamation
#
# Create a plot datamation from a pandas pipeline.
#

from .small_salary import small_salary
from .datamation_frame import DatamationFrame
from .datamation_groupby import DatamationGroupBy

__all__ = [
    "small_salary", "DatamationFrame", "DatamationGroupBy"
]
