describe('jsqc', function() {
	     describe('#property', function() {
			  it('produces test data', function() {
				 var values = [];
				 jsqc.property(jsqc.gen.integer,
					       function(integer) {
						   values.push(integer);
					       });
				 expect(values.length)
				     .toBeGreaterThan(0);
			     });
			  it('throws when fails', function() {
				 expect(function() {
					    jsqc.property(jsqc.gen.integer, 
							  function(){
							      throw new Error();
							  });
					}).toThrow(new Error());
			     });
		      });

	 });