# datamation_sanddance()

[datamation_sanddance()](https://github.com/microsoft/datamations/blob/main/datamations/datamation_frame.py#L127) is the main function that a user will call to generate a datamation.

```python
from datamations import *

df = DatamationFrame(small_salary().df)

df.groupby('Degree').mean().datamation_sanddance()
```
<img src="../man/figures/README-mean_salary_group_by_degree.gif" width="80%" />

You can group by multiple variables, as in this example, grouping by
`Degree` and `Work` before calculating the mean `Salary`:

```python
df.groupby(['Degree', 'Work']).mean().datamation_sanddance()
```

<img src="../man/figures/README-mean_salary_group_by_degree_work.gif" width="80%" />
