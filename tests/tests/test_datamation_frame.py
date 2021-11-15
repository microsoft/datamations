# Copyright (c) Microsoft Corporation
# 

from datamations import *

def test_datamation_frame_groupby():
    df = small_salary().df
    df = DatamationFrame(df)

    grouped = df.groupby('Work')

    assert 'groupby' in grouped.operations
    assert df.equals(grouped.inputs[0])
    

def test_datamation_frame_datamation():
    df = small_salary().df
    df = DatamationFrame(df)

    datamation = df.groupby('Work').mean().datamation()

    assert len(datamation.inputs) == 2
    assert len(datamation.operations) == 2
    
    assert df.equals(datamation.inputs[0])
    assert isinstance(datamation.inputs[1], DatamationGroupBy)

    assert 'groupby' == datamation.operations[0]
    assert 'mean' == datamation.operations[1]

    assert isinstance(datamation.output, DatamationFrame)

    assert datamation.output.Salary.Academia == 85.01222196154829
    assert datamation.output.Salary.Industry == 91.48376118136609

    assert 'Salary' in str(datamation)