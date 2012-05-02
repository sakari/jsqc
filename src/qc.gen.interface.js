qc.gen.interface = 
    function(generator,
	     valuetest
	    ) {
		function with_increasing_size(test) {
		    for(var i = 0; i < 100; i++) {
			qc.resize(i, test);
		    } 
		}
		it('has #show for printing values', function() {
		       with_increasing_size(
			   function() {
			       expect(_.isString(new generator().show()))
				   .toBeTruthy();
			   });
		   });
		
		it('has #next for producing the next generator', function() {
		       with_increasing_size(
			   function() {
			       expect(valuetest(new generator().next().value()))
				   .toBeTruthy();
			   });
		   });

		describe('#value', function() {
			     it('produces correctly formed values', function() {
				    with_increasing_size(
					function() {
					    expect(valuetest(new generator().value()))
						.toBeTruthy();
					});				
				});
			     it('returns the same value', function() {
				    with_increasing_size(
					function() {
					    var g = new generator();
					    expect(g.value())
						.toEqual(g.value());
					});
				});
			     it('returns a distinct instance each time for object types', function() {
				   with_increasing_size(
				       function() {
					   var g = new generator();
					   if (typeof(g.value()) !== 'object')
					       return;
					   expect(g.value()).
					       not.toBe(g.value());
				       }); 
				});
			 });

		describe('#shrink', function(){
			     it('produces correctly formed values', function() {
				    with_increasing_size(
					function() {
					    expect(_.all(new generator().shrink(),
							 function(g) {
							     return valuetest(g.value());
							 }))
						.toBeTruthy();
					});
				});
			     
			     it('converges to []', function() {
				    function converges(g) {
					var shrunk = g.shrink();
					return _.isArray(shrunk) &&
					    _.all(shrunk,
						  converges);
				    }
				    with_increasing_size(
					function() {
					    expect(converges(new generator()))
						.toBeTruthy();
					});
				});
			 });
	    };
