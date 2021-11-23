import setuptools

setuptools.setup(
   name='datamations',
   version='1.0',
   description='Automatic generation of explanation of plots and tables from analysis code',
   author='Chinmay Singh',
   author_email='chsingh@microsoft.com',
   packages=['datamations'],
   package_data={'datamations': ['../data-raw/small_salary.csv', '../sandbox/specs_for_python/raw_spec.json']},
   install_requires=['pandas', 'ipython']
)