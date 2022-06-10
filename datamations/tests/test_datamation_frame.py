# Copyright (c) Microsoft Corporation
#
import os
import json
from pytest import approx
from palmerpenguins import load_penguins
from datamations import DatamationFrame
from datamations import DatamationGroupBy
from datamations import small_salary

def compare_specs_with_file(specs, specs_file):
    for i, spec in enumerate(json.load(specs_file)):
        for key in spec:
            if key == 'data':
                for j, val in enumerate(spec['data']['values']):
                    assert val == approx(specs[i]['data']['values'][j])
            else:
                if  key == 'layer':
                    for j, encoding in enumerate(spec["layer"]):
                        for field in encoding:
                            if field == 'encoding':
                                for val in encoding[field]:
                                    assert encoding[field][val] == specs[i][key][j][field][val]
                            else:
                                assert encoding[field] == specs[i][key][j][field]
                elif key == "spec":
                    for item in spec[key]:
                        if item == 'layer':
                            for j, encoding in enumerate(spec[key]["layer"]):
                                for field in encoding:
                                    if field == 'encoding':
                                        for val in encoding[field]:
                                            if val == "y":
                                                for y_key in encoding[field][val]:
                                                    if y_key == "scale":
                                                        for scale_key in encoding[field][val][y_key]:
                                                            if scale_key == "domain":
                                                                assert encoding[field][val][y_key][scale_key] == approx(specs[i][key][item][j][field][val][y_key][scale_key])
                                                            else:
                                                                assert encoding[field][val][y_key][scale_key] == specs[i][key][item][j][field][val][y_key][scale_key]
                                                    else:
                                                        assert encoding[field][val][y_key] == specs[i][key][item][j][field][val][y_key]
                                            else:
                                                assert encoding[field][val] == specs[i][key][item][j][field][val]
                                    else:
                                        assert encoding[field] == specs[i][key][item][j][field]
                        else:
                            assert spec[key][item] == specs[i][key][item]
                else:
                    assert spec[key] == specs[i][key]

def test_datamation_frame_groupby():
    df = small_salary().df
    df = DatamationFrame(df)

    grouped = df.groupby('Work')

    assert 'groupby' in grouped.operations
    assert df.equals(grouped.states[0])


def test_datamation_frame_specs():
    df = small_salary().df
    df = DatamationFrame(df)

    # Group by Degree
    specs = df.groupby('Degree').mean().specs()
    script_dir = os.path.dirname( __file__ )
    with open(os.path.join(script_dir, '../../inst/specs/raw_spec.json'), 'r') as specs_file:
        compare_specs_with_file(specs, specs_file)

    # Group by Work
    specs = df.groupby('Work').mean().specs()
    script_dir = os.path.dirname( __file__ )
    with open(os.path.join(script_dir, '../../inst/specs/groupby_work.json'), 'r') as specs_file:
        compare_specs_with_file(specs, specs_file)

    # Group by Degree, Work
    specs = df.groupby(['Degree', 'Work']).mean().specs()
    script_dir = os.path.dirname( __file__ )
    with open(os.path.join(script_dir, '../../inst/specs/groupby_degree_work.json'), 'r') as specs_file:
        compare_specs_with_file(specs, specs_file)

    # Group by Work, Degree
    specs = df.groupby(['Work', 'Degree']).mean().specs()
    script_dir = os.path.dirname( __file__ )
    with open(os.path.join(script_dir, '../../inst/specs/groupby_work_degree.json'), 'r') as specs_file:
        compare_specs_with_file(specs, specs_file)


def test_three_variables_frame_specs():
    # three-variable grouping
    df = DatamationFrame(load_penguins())
    script_dir = os.path.dirname( __file__ )
    with open(os.path.join(script_dir, '../../sandbox/penguins_three_groups.json'), 'r') as specs_file:
        specs = df.groupby(['species', 'island', 'sex']).mean('bill_length_mm').specs()
        compare_specs_with_file(specs, specs_file)

    # median support
    script_dir = os.path.dirname( __file__ )
    with open(os.path.join(script_dir, '../../sandbox/penguins_median_specs.json'), 'r') as specs_file:
        specs = df.groupby(['species', 'island', 'sex']).median('bill_depth_mm').specs()
        compare_specs_with_file(specs, specs_file)


def test_datamation_frame_datamation_sanddance():
    df = small_salary().df
    df = DatamationFrame(df)

    datamation = df.groupby('Work').mean().datamation_sanddance()

    assert len(datamation.states) == 2
    assert len(datamation.operations) == 2

    assert df.equals(datamation.states[0])
    assert isinstance(datamation.states[1], DatamationGroupBy)

    assert datamation.operations[0] == 'groupby'
    assert datamation.operations[1] == 'mean'

    assert isinstance(datamation.output, DatamationFrame)

    assert datamation.output.Salary.Academia == 85.01222196154829
    assert datamation.output.Salary.Industry == 91.48376118136609

    assert 'Salary' in str(datamation)
