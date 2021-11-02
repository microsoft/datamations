from setuptools import setup

setup(
   name='datamations',
   version='1.0',
   description='Automatic generation of explanation of plots and tables from analysis code',
   author='Chinmay Singh',
   author_email='chsingh@microsoft.com',
   packages=['datamations'],
   install_requires=['pandas'],
)