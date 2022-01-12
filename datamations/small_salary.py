# Read small salary csv file
#

import os
import pandas as pd

class small_salary():

    def __init__(self):
        script_dir = os.path.dirname( __file__ )
        small_salary = os.path.join(script_dir, '../data-raw/small_salary.csv')
        self._data = pd.read_csv(small_salary)

    @property
    def df(self):
        return self._data
        