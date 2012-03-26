describe('qc.jasmine', function() {
	     describe('property', function() {
			  var _env, _ready, _suite;
			  beforeEach(function() {
					 _ready = false;
					 _suite = undefined;
					 _env = new jasmine.Env();
				     });
			  function when_suite_has_been_run(fn) {
			      _suite.execute(function() { _ready = true; });
			      waitsFor(function() { return _ready; });
			      runs(function() { fn(_suite); } );
			  }
			  function given_suite_with(fn) {
			      _suite = _env.describe('suite', function() { fn(_env); } );
			  }
			  it('passes on holding properties', function() {
				 given_suite_with(function(env){
						 env.property('property that holds', qc.gen.integer, 
							      function(i) {
								  this.expect(_.isNumber(i)).toEqual(true);
							      });
					     });
				 when_suite_has_been_run(function(suite) {
							     expect(suite.results().passedCount).toEqual(1);
							     expect(suite.results().totalCount).toEqual(1);
							 });
			     });
			  
			  it('fails when property does not hold', function(i) {
				 given_suite_with(function(env) {
						 env.property('property that fails with some value', qc.gen.integer,
							      function(i) {
								  this.expect(i).toBeLessThan(5);
							      });
					     });
				 when_suite_has_been_run(function(suite) {
							     expect(suite.results().failedCount).toEqual(1);
							     expect(suite.results().totalCount).toEqual(1);
							 });
			     });
			  
			  it('allows specs and properties in the same suite', function() {
				 given_suite_with(function(env) {
						 env.it('spec', function() {
						 	      this.expect(true).toBeTruthy();
						 	  });
 						 env.property('property', qc.gen.integer,
						 	      function(i) {
						 		  this.expect(true).toBeTruthy();
						 	      });
 						 env.property('failing property', qc.gen.integer,
						 	      function(i) {
						 		  this.expect(true).toBeFalsy();
						 	      });
					     });
				 when_suite_has_been_run(function(suite) {
							     expect(suite.results().passedCount).toEqual(2);
							     expect(suite.results().failedCount).toEqual(1);
							     expect(suite.results().totalCount).toEqual(3);
							 });
			     });
		      });
	 });