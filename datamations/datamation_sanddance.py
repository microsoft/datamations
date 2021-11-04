# Create a plot datamation
#
# Create a plot datamation from a pandas pipeline.
#

class datamation_sanddance():
    def datamation_sanddance(pipeline, locals):
        return eval(pipeline, {}, locals)        
