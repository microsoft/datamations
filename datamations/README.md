# datamation_sanddance()

[datamation_sanddance()](https://github.com/microsoft/datamations/blob/main/datamations/datamation_sanddance.py#L6) is the main function that a user will call to generate a datamation.

```{python}
from datamations import *

df = small_salary().df

df.groupby(by=["Degree"]).mean().pipe(datamate)

data = {'a': [1, 2, 3], 'b': [4, 5, 6], 'c': [15, 25, 30], 'd': [1, 1, 2]}
df = DatamationsFrame(data, new_property='value')

df.groupby(by='b').mean().datamate()

print(datamation_sanddance('df.groupby(by=["Degree"]).mean()', {'df': small_salary().df}))
```