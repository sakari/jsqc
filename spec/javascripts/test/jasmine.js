describe('qc.jasmine', function() {
	     describe('property', function() {
			  var env;
			  beforeEach(function() {
					 env = new jasmine.Env();					 
				     });
			  it('is provided by jasmine', function(i) {
				 var spec; 
				 var suite = env.describe('suite', function() {
							      env.it('spec that holds', 
								     function(i) {
									 this.expect(true).toEqual(true);
									 console.log('ok');
								     });
							      env.it('spec that does not hold', function(i) {
									 console.log('nok');
									 this.expect(false).toEqual(true);
								     });
							      env.property('property that holds', qc.gen.integer, 
									   function(i) {
									       console.log('prop');
									       this.expect(true).toEqual(true);
									   });
							  });
				 var ready;
				 suite.execute(function() { ready = true; });
				 waitsFor(function() { return ready; });
				 runs(function() {
					  console.log(suite.results());
					  expect(suite.results().totalCount).toEqual(3);
					  expect(suite.results().passedCount).toEqual(2);
					  expect(suite.results().failedCount).toEqual(1);
				      });
			     });
		      });
	 });