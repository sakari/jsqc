describe('qc.jasmine', function() {
	     describe('property', function() {
			  var env;
			  beforeEach(function() {
					 env = new jasmine.Env();					 
				     });
			  it('is provided by jasmine', function(i) {
				 var spec; 
				 var suite = env.describe('suite', function() {
							      env.property('property that holds', qc.gen.integer, 
									   function(i) {
									       this.expect(_.isNumber(i)).toEqual(true);
									   });
							      env.property('propert that fails with some value', qc.gen.integer,
									  function(i) {
									      this.expect(i).toBeLessThan(5);
									  });
							  });
				 var ready;
				 suite.execute(function() { ready = true; });
				 waitsFor(function() { return ready; });
				 runs(function() {
					  console.log(suite.results());
					  expect(suite.results().totalCount).toEqual(2);
					  expect(suite.results().passedCount).toEqual(1);
					  expect(suite.results().failedCount).toEqual(1);
				      });
			     });
		      });
	 });