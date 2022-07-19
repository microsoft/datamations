# Copyright (c) Microsoft Corporation
#
from pytest import approx
from palmerpenguins import load_penguins
from datamations import DatamationFrame
from datamations import small_salary

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

    # median
    median = df.groupby('Degree').median()

    assert "groupby" in median.operations
    assert "median" in median.operations

    assert len(median.states) == 2
    assert df.equals(median.states[0])

    assert median.Salary.Masters == 91.13211765489541
    assert median.Salary.PhD == 86.40630845562555

    # sum
    sum = df.groupby('Degree').sum()

    assert "groupby" in sum.operations
    assert "sum" in sum.operations

    assert len(sum.states) == 2
    assert df.equals(sum.states[0])

    assert sum.Salary.Masters == 6496.296048444696
    assert sum.Salary.PhD == 2470.8769715370145

    # product
    product = df.groupby('Degree').prod()

    assert "groupby" in product.operations
    assert "product" in product.operations

    assert len(product.states) == 2
    assert df.equals(product.states[0])

    assert product.Salary.PhD == 2.9426590692781414e+54
    assert product.Salary.Masters == 5.892246828184284e+140

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

    # sum
    sum = df.groupby(['Degree', 'Work']).sum()

    assert "groupby" in sum.operations
    assert "sum" in sum.operations

    assert len(sum.states) == 2
    assert df.equals(sum.states[0])

    assert sum.Salary.Masters.Academia == 840.2988319688011
    assert sum.Salary.Masters.Industry == 5655.997216475895
    assert sum.Salary.PhD.Academia == 1540.043382954551
    assert sum.Salary.PhD.Industry == 930.8335885824636

    # product
    product = df.groupby(['Degree', 'Work']).prod()

    assert "groupby" in product.operations
    assert "product" in product.operations

    assert len(product.states) == 2
    assert df.equals(product.states[0])

    assert product.Salary.Masters.Academia == 1.753532557780977e+19
    assert product.Salary.Masters.Industry == 3.3602152421057308e+121
    assert product.Salary.PhD.Academia == 6.027761935702164e+34
    assert product.Salary.PhD.Industry == 4.8818435443657834e+19

    # Group by species, island, sex
    df = DatamationFrame(load_penguins())
    mean = df.groupby(['species', 'island', 'sex']).mean()

    assert "groupby" in mean.operations
    assert "mean" in mean.operations

    assert len(mean.states) == 2
    assert df.equals(mean.states[0])

    assert mean.bill_length_mm.Adelie.Biscoe.male == approx(40.5909090909091)
    assert mean.bill_length_mm.Adelie.Biscoe.female == approx(37.35909090909092)
