(function(){
     var currentProperty;

     var Property = function(env, suite, description, generators, property) {
	 this._env = env;
	 this._suite = suite;
	 this._description = description;
	 this._property = property;
	 this._generators = generators;
     };
     Property.prototype.classify = function(tag) {
	 if (tag === undefined)
	     return this._classifications;

	 this._classifications = this._classifications || {};
	 if (!this._classifications[tag])
	     this._classifications[tag] = 0;
	 this._classifications[tag]++;
	 return this._classifications;
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
	     spec.qc ={
		 waitsFor : function() {},
		 event : function(fn) { fn(); }
	     };

	     spec.runs(function() { 
			   try {
			       self._property.apply(spec, test_data); 
			   } catch (x) {
			       spec_done = true;
			       throw x;
			   }
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

	 currentProperty = self;
	 qc.generate(100, 
		     this._generators, 
		     property_wrapper, 
		     function(e, gs) {
			 if (e) {
			     return qc.minimize(gs, property_wrapper, 
						function(e, gs) {
						    self._results = latest_failed_result;
						    self._results.log(_.map(gs, function(v) { return v.show(); }));
						    return on_complete();
						});
			 } else {
			     self._results = latest_result;
			     self._results.log(currentProperty.classify());
			 }
			 currentProperty = null;
			 return on_complete();
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
     
     jasmine.Spec.prototype.classify = function(tag) {
	 return currentProperty.classify(tag);
     };
 })();
