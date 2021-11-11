# Copyright (c) Microsoft Corporation
# 

from datamations import *

def test_datamation_frame():
    df = small_salary().df
    df = DatamationFrame(df)

    grouped = df.groupby('Work')

    assert 'groupby' in grouped.operations
    