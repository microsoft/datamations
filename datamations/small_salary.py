# Read small salary csv file
#

import os
import pandas as pd

class small_salary():

    def __init__(self):
        script_dir = os.path.dirname( __file__ )
        small_salary = os.path.join(script_dir, 'small_salary.csv')
        self._data = pd.read_csv(small_salary)

    @property
    def small_salary(self):
        return self._data