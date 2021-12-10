# Copyright (c) Microsoft Corporation
# 

from datamations import *

def test_datamation_groupby():
    df = small_salary().df
    df = DatamationFrame(df)
    
    # Group by Degree
    mean = df.groupby('Degree').mean()

    assert "groupby" in mean.operations
    assert "mean" in mean.operations
    
    assert len(mean.states) == 2
    assert df.equals(mean.states[0])
    
    assert mean.Salary.Masters == 90.22633400617633
    assert mean.Salary.PhD == 88.24560612632195

    # Group by Work
    mean = df.groupby('Work').mean()

    assert "groupby" in mean.operations
    assert "mean" in mean.operations
    
    assert len(mean.states) == 2
    assert df.equals(mean.states[0])
    
    assert mean.Salary.Academia == 85.01222196154829
    assert mean.Salary.Industry == 91.48376118136609
    

def test_datamation_groupby_multiple():
    df = small_salary().df
    df = DatamationFrame(df)
    
    # Group by Degree, Work
    mean = df.groupby(['Degree', 'Work']).mean()

    assert "groupby" in mean.operations
    assert "mean" in mean.operations
    
    assert len(mean.states) == 2
    assert df.equals(mean.states[0])
    
    assert mean.Salary.Masters.Academia == 84.0298831968801
    assert mean.Salary.Masters.Industry == 91.22576155606282
    assert mean.Salary.PhD.Academia == 85.55796571969728
    assert mean.Salary.PhD.Industry == 93.08335885824636
    