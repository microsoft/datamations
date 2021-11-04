# Create a plot datamation
#
# Create a plot datamation from a pandas pipeline.
#

class datamation_sanddance():

    def __init__(self, pipeline, locals):
        self._value = eval(pipeline, {}, locals)

    def __str__(self):
        return str(self._value)
