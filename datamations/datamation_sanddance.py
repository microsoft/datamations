# Create a plot datamation
#
# Create a plot datamation from a pandas pipeline.
#

import os
import pandas as pd

class sanddance():
    def datamation_sanddance():
        script_dir = os.path.dirname( __file__ )
        small_salary = os.path.join(script_dir, 'small_salary.csv')
        df = pd.read_csv(small_salary)
        return df.groupby(by=["Degree"]).mean()        
