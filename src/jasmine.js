(function(){
     var Property = function(env, suite, description, generators, property) {
	 this._env = env;
	 this._suite = suite;
	 this._description = description;
	 this._property = property;
	 this._generators = generators;
     };
     Property.prototype.results = function() {
	 return this._results;
     };
     Property.prototype.execute = function(on_complete) {
	 var self = this;
	 var latest_failed_result;
	 var latest_result;
	 function property_wrapper(cb, test_data) {
	     var spec = new jasmine.Spec(self._env, 
					 self._suite, 
					 self._description);
	     var spec_done;
	     spec.runs(function() { 
			   self._property.apply(spec, test_data); 
			   spec_done = true;
		       });
	     spec.waitsFor(function(){
			       return spec_done;
			   });
	     spec.execute(function() {
			      latest_result = spec.results();
			      if (!latest_result.passed()) {
				  latest_failed_result = latest_result;
				  return cb(new Error('test failed'));
			      }
			      return cb();
			  });
	 }
	 qc.generate(100, 
		     this._generators, 
		     property_wrapper, 
		     function(e, gs) {
			 if (e) {
			     self._results = latest_failed_result;
			 } else {
			     self._results = latest_result;
			     
			 }
			 on_complete();
		     });
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
