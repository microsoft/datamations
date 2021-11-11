# Copyright (c) Microsoft Corporation
# 

from datamations import *

def test_datamation_frame():
    df = small_salary().df
    df = DatamationFrame(df, new_property='')

    grouped = df.groupby('Work')

    assert grouped.new_property == ''
    