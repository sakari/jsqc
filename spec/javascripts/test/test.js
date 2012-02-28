describe('jsqc', function() {
	     describe('gen', function(){
			  describe('const', function() {
				      var g = new (jsqc.gen.const("constant"))();
				       it('generates the same value', function() {
					      expect(g.generate())
						  .toEqual("constant");
					  });
				   });
			  describe('integer', function() {
				       var g = new jsqc.gen.integer();
				       it('shrinking goes towards 0', function() {
					      expect(g.shrink(2))
						  .toEqual([1]);
					  });
				       it('0 is not shrunk', function() {
					      expect(g.shrink(0))
						  .toEqual([]);
					  });
				       it('can be shown', function() {
					      expect(g.show(1))
						  .toEqual("1");
					  });
				       it('generates different values', function() {
					      var seen = {};
					      var count = 100;
					      var seen_numbers = 0;
					      var number;
					      while(count--) {
						  number = g.generate();
						  if(seen[number])
						      continue;
						  seen[number] = true;
						  seen_numbers++;
					      }
					      expect(seen_numbers)
						  .toBeGreaterThan(10);
					      
					  });
				       it('generates integers', function() {
					      var value = g.generate();
					      expect(value)
						  .toEqual(Math.floor(value));
					  });
				   });
			  describe('array', function() {
				       var g = new (jsqc.gen.array(
							jsqc.gen.integer))();
				       it('can be shrunk', function() {
					      expect(g.shrink([1, 2, 3]))
						  .toEqual(
						      [[1, 2, 2], [1, 2]]
						     );
					  });
				       it('empty list cannot be shrunk', function() {
					      expect(g.shrink([]))
						  .toEqual([]);
					  });
				       it('can be copied', function() {
					      var original = [1,2];
					      var newList = g.copy(original);
					      original[0] = "changed";
					      expect(newList).toEqual([1, 2]);
					  });
				   });
		      });

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
					}).toThrow();
			     });
			  it('calls generator to produce test data', function() {
				 function gen() {
				     this.copy = function(value){
					 return value;
				     }
				     this.generate = function() {
					 return "value";
				     };
				 };
				 jsqc.property(gen, function(value) {
						   expect(value)
						       .toEqual("value");
					       });
			     });
			  it('calls shrink to shrink failing test data', function() {
				 function gen() {
				     this.copy = function(value) {
					 return value;
				     };
				     this.generate = function() {
					 return 2;
				     };
				     this.shrink = function(value) {
					 if (value === 2)
					     return [1];
				     };
				 }
				 var succeedingValue;
				 expect(function() {
					    jsqc.property(gen, function(value) {
							      if(value > 1)
								  throw new Error();
							      succeedingValue = value;
							  });})
				     .toThrow();
				 expect(succeedingValue).toEqual(1);
			     });
		      });
	     
	 });