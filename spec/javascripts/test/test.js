describe('jsqc', function() {
	     describe('#property', function() {
			  it('produces test data', function() {
				 var values = [];
				 jsqc.property(jsqc.int,
					       function(integer) {
						   values.push(integer);
					       });
				 expect(values.length)
				     .toBeGreaterThan(0);
			     });
		      });

	 });