# datamation()

[datamation()](https://github.com/microsoft/datamations/blob/main/datamations/datamation_frame.py#L122) is the main function that a user will call to generate a datamation.

```{python}
from datamations import *

df = DatamationFrame(small_salary().df)

df.groupby('Degree').mean().datamation()
```
