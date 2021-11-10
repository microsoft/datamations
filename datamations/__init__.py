# Create a plot datamation
#
# Create a plot datamation from a pandas pipeline.
#

from .datamation_sanddance import datamation_sanddance
from .small_salary import small_salary
from .DatamationFrame import DatamationFrame
from .DatamationGroupBy import DatamationGroupBy

__all__ = [
    "small_salary", "datamation_sanddance", "DatamationFrame", "DatamationGroupBy"
]