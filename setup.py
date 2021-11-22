import setuptools

setuptools.setup(
   name='datamations',
   version='1.0',
   description='Automatic generation of explanation of plots and tables from analysis code',
   author='Chinmay Singh',
   author_email='chsingh@microsoft.com',
   packages=['datamations'],
   package_data={'datamations': ['../data-raw/small_salary.csv',
                                 '../sandbox/specs.json',
                                 '../inst/htmlwidgets/css/datamationSandDance.css'
                                 ]},
   install_requires=['pandas', 'importlib_resources']
)