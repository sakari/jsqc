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
			  function given_a_property(description, generator, pred) {
			      given_suite_with(function(env) {
						   if (pred)
						       return env.property(description, generator, pred);
						   return env.property(description, generator);
					       });
			  }
			  it('passes on holding properties', function() {
				 given_a_property('property that holds', qc.gen.integer, 
						  function(i) {
						      this.expect(_.isNumber(i)).toEqual(true);
						  });
				 when_suite_has_been_run(function(suite) {
							     expect(suite.results().passedCount).toEqual(1);
							     expect(suite.results().totalCount).toEqual(1);
							 });
			     });
			  
			  it('fails when property does not hold', function(i) {
				 given_a_property('property that fails with some value', qc.gen.integer,
						  function(i) {
						      this.expect(i).toBeLessThan(5);
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
			  it('executes beforeEachs before running each test', function() {
				 var trip;
				 given_suite_with(function(env) {
						      env.beforeEach(function() {
									 trip = true;
								     });
						      env.property('prop', qc.gen.integer,
								  function(i) {
								      this.expect(trip).toBeTruthy();
								      trip = false;
								  });
						  });
				 when_suite_has_been_run(function(suite) {
							     expect(trip).toBeFalsy();
							 });
			     });
			  it('executes afterEachs before running each test', function() {
				 var trip = true;
				 given_suite_with(function(env) {
						      env.afterEach(function() {
									 trip = true;
								     });
						      env.property('prop', qc.gen.integer,
								  function(i) {
								      this.expect(trip).toBeTruthy();
								      trip = false;
								  });
						  });
				 when_suite_has_been_run(function() {
							     expect(trip).toBeTruthy();
							 });
			     });
			  it('runs property many times', function() {
				 var tries = 0;
				 given_a_property('prop', qc.gen.integer,
						  function(i) {
						      tries++;			      
						  });
			     	 when_suite_has_been_run(function() {
							     expect(tries).toBeGreaterThan(1);
							 });
			     });

			  it('fails if some tests fail', function() {
				 given_a_property('prop', qc.gen.integer,
						  function(i) {
						      this.expect(i).toBeLessThan(10);
						  });
			     	 when_suite_has_been_run(function(suite) {
							     expect(suite.results().failedCount).toEqual(1);
							 });
			     });

			  it('shrinks to the minimal failing value', function() {
				 given_a_property('prop', qc.gen.integer,
						  function(i) {
						      this.expect(i).toBeLessThan(10);
						  });
			     	 when_suite_has_been_run(function(suite) {
							     expect(suite.results().getItems()[0].getItems()[1].values)
								 .toEqual(['10']);
							 });
			     });

			  it('logs the last failing value', function() {
				 var last_failing_value;
				 given_a_property('prop', qc.gen.integer,
						  function(i) {
						      if (i >= 10)
							  last_failing_value = i;
						      this.expect(i).toBeLessThan(10);
						  });
			     	 when_suite_has_been_run(function(suite) {
							     expect(suite.results().getItems()[0].getItems()[1].values)
								 .toEqual([last_failing_value + '']);
							 });
			     });

			  describe('waiting for async events', function() {
				       it('works with jasmine async tests', function() {
					      var ticks = 0;
					      given_a_property('prop', function() {
								   var tick;
								   setTimeout(function() { tick = true; }, 1);
								   this.waitsFor(function() { return tick; });
								   this.runs(function() {
										 this.expect(tick).toBeTruthy();
										 ticks++;
									     });
							       });
					      when_suite_has_been_run(function() {
									  expect(ticks).toBeGreaterThan(1);
								      });
					  });
				       describe('randomized async testing', function() {
						    it('waits until a condition holds', function() {
							   var tick;
							   given_a_property('prop', function() {
										this.qc.event(function() {
												  tick = true;
											      });
										this.qc.waitsFor(function() {
												     return tick;
												 });
										this.expect(tick).toBeTruthy();
									    });
							   when_suite_has_been_run(function() {
										expect(tick).toBeTruthy();
										   });
						       });
						});
				       
				   });

			  describe('classify', function() {
				       it('logs the classification results', function() {
					      var prop;
					      given_suite_with(function(env) {
								   prop = env.property('prop', qc.gen.integer,
										function(i) {
										    this.classify('classified');
										});
							       });
					      when_suite_has_been_run(function(suite) {
									  expect(prop.results().getItems()[0]['values'])
									      .toEqual({ 'classified': 100});
								      });
					  });
				       it('returns the collected classifications if called without argumets', function() {
					      var cls;
					      given_suite_with(function(env) {
								   env.property('prop', qc.gen.integer,
										function() {
										    this.classify('tag');
										    cls = this.classify();
										});
							       });
					      when_suite_has_been_run(function(suite) {
									  expect(cls).toEqual({ 'tag': 100 });
								      });
					  });
				   });
		      });
	 });