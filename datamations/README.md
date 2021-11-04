# datamation_sanddance()

[datamation_sanddance()](https://github.com/microsoft/datamations/blob/main/datamations/datamation_sanddance.py#L6) is the main function that a user will call to generate a datamation.

```{python}
from datamations import *

print(datamation_sanddance('df.groupby(by=["Degree"]).mean()', {'df': small_salary().df}))
```