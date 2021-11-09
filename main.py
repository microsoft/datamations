# Create a plot datamation
#
# Create a plot datamation from a pandas pipeline.
#

from datamations import *

df = small_salary().df

#df.groupby(by=["Degree"]).mean().pipe(datamate)

#data = {'a': [1, 2, 3], 'b': [4, 5, 6], 'c': [15, 25, 30], 'd': [1, 1, 2]}
df = DatamationsFrame(df, new_property='')

print(df.groupby('Work').mean().datamate())

#print(datamation_sanddance('df.groupby(by=["Degree"]).mean()', {'df': small_salary().df}))
