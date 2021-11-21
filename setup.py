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
                                 '../inst/htmlwidgets/d3/d3.js',
                                 '../inst/htmlwidgets/vega/vega.js',
                                 '../inst/htmlwidgets/vega-util/vega-util.js',
                                 '../inst/htmlwidgets/vega-lite/vega-lite.js',
                                 '../inst/htmlwidgets/vega-embed/vega-embed.js',
                                 '../inst/htmlwidgets/gemini/gemini.web.js',
                                 '../inst/htmlwidgets/css/datamationSandDance.css',
                                 '../inst/htmlwidgets/js/config.js',
                                 '../inst/htmlwidgets/js/utils.js',
                                 '../inst/htmlwidgets/js/layout.js',
                                 '../inst/htmlwidgets/js/hack-facet-view.js',
                                 '../inst/htmlwidgets/js/app.js'
                                 ]},
   install_requires=['pandas']
)