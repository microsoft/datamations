# Copyright (c) Microsoft Corporation
# 

from datamations import *

def test_smoke(capsys):
    df = small_salary().df
    df = DatamationFrame(df, new_property='')
    
    print(df.groupby('Work').mean())

    captured = capsys.readouterr()

    assert "mean" in captured.out
    