# Copyright (c) Microsoft Corporation
# 

from datamations import *

def test_datamation_groupby():
    df = small_salary().df
    df = DatamationFrame(df)
    
    mean = df.groupby('Work').mean()

    assert "groupby" in mean.operations
    assert "mean" in mean.operations
    
    assert mean.Salary.Academia == 85.01222196154829
    assert mean.Salary.Industry == 91.48376118136609
    