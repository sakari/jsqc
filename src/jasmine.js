(function(){
     var Property = function(env, suite, description, generators, property) {
	 this._env = env;
	 this._suite = suite;
	 this._description = description;
	 this._property = property;
	 this._generators = generators;
	 this._results = new jasmine.NestedResults();
	 this._results.description = this._description;
     };
     Property.prototype.execute = function(on_complete) {
	 var self = this;
	 function property_wrapper(done) {
	     var test_data = arguments;
	     var spec = new jasmine.Spec(this._env, 
					 this._suite, 
					 this._description);
	     spec.runs(function() { self._property.apply(self, test_data); });
	     spec.execute(function() {
			      done(spec.results().passed());
			  });
	 }
	 qc.property_continuation_passing(this._generators, property_wrapper, on_complete);
     };

     jasmine.Env.prototype.property = function(description) {
	 var generators = [];
	 for(var i = 1; i < arguments.length -1; i++) {
	     generators.push(arguments[i]);
	 }
	 var property = arguments[arguments.length - 1];
	 var prop = new Property(this, 
				 this.currentSuite, 
				 description, 
				 generators,
				 property);
	 this.currentSuite.add(prop);
	 this.currentSpec = prop;
	 return prop;
     };
 })();
