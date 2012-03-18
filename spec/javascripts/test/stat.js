describe('qc.stat', function() {
	    describe('classify', function() {
			 beforeEach(function() {
					var self = this;
					this.output = [];
					qc.out = function(o) {
					    self.output.push(o);
					};
				    });
			 afterEach(function() {
				       delete qc['out'];
				   });
			 it('calls qc.out with classification results', function() {
				qc.property(qc.gen.integer, function(i) {
						this.qc.classify("classified");
					    });
				expect(this.output).toEqual([{ "classified" : qc.TRIES }]);
			    });
		     });
	     describe('classifications', function() {
			  it('returns the current classification result inside the property', function() {
				 var test = 0;
				 qc.property(qc.gen.integer, function(i) {
						 this.qc.classify("classified");
						 test++;
						 expect(this.qc.classifications()).toEqual( { "classified" : test});
					     });
			     });
		      });
	     describe('require', function() {
			  it('can be used to specify a predicate on classification', function() {
				 qc.property(qc.gen.integer, function(i) {
						 this.qc.classify("classified");
						 this.qc.require(function(c) {
								     return c.classified > 0;
								 });
					     });
			     });
			  it('fails the test case if after the test run the predicate does not hold', function() {
				 expect(function() {
					    qc.property(qc.gen.integer, function(i) {
							    this.qc.require(function(c) {
										return c.classified;
									    });
							});
					}).toThrow();
			     });
		      });
	 });