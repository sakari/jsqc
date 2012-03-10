describe('jsqc', function() {
	     describe('gen', function(){
			  describe('oneof', function() {
				      var g = new (jsqc.gen.oneof(
						       [jsqc.gen.const(1),
							jsqc.gen.const("A")]
						   ))();
				       it('generates always values from the union of generators', function() {
					      expect(g.value() === 1 ||
						     g.value() === "A")
						  .toEqual(true);
					      var n = g.next();
					      expect(g.value() === 1 ||
						     g.value() === "A")
						  .toEqual(true);
					  });
				   });
			  describe('choice', function() {
				       var g = new (jsqc.gen.choice([1, 2]))();
				       it('generates always one of given values', function() {
					      expect(g.value() === 1 ||
						     g.value() === 2)
						  .toEqual(true);
					      var n = g.next();
					      expect(g.value() === 1 ||
						     g.value() === 2)
						  .toEqual(true);
					  });
				   });
			  describe('const', function() {
				      var g = new (jsqc.gen.const("constant"))();
				       it('generates always the same value', function() {
					      expect(g.value())
						  .toEqual("constant");
					      expect(g.next().value())
						  .toEqual("constant");
					  });
				   });
			  describe('integer', function() {
				       it('shrinking goes towards 0', function() {
					      var g = new jsqc.gen.integer(1, 
									   { value : 2 });
					      expect(_.map(g.shrink(), 
							   function(v) { 
							       return v.value(); 
							   }))
						  .toEqual([1]);
					  });
				       it('0 is not shrunk', function() {
					      var g = new jsqc.gen.integer(1, 
									   { value : 0 });
					      expect(g.shrink(0))
						  .toEqual([]);
					  });
				       it('can be shown', function() {
					      var g = new jsqc.gen.integer(1, 
									   { value : 1 });
					      expect(g.show(1))
						  .toEqual("1");
					  });
				       it('generates different values', function() {
					      var seen = {};
					      var count = 100;
					      var seen_numbers = 0;
					      var number;
					      var g = new jsqc.gen.integer(1, {});
					      while(count--) {
						  g = g.next();
						  if(seen[g.value(number)])
						      continue;
						  seen[g.value(number)] = true;
						  seen_numbers++;
					      }
					      expect(seen_numbers)
						  .toBeGreaterThan(10);
					      
					  });
				       it('generates integers', function() {
					      var g = new jsqc.gen.integer(10, {});
					      expect(g.value())
						  .toEqual(Math.floor(g.value()));
					  });
				   });
			  describe('array', function() {
				       it('can be shrunk', function() {
					      var g = new (jsqc.gen.array(
							       jsqc.gen.integer))(1, { value : [ new jsqc.gen.integer(1, { value : 1}), 
												 new jsqc.gen.integer(1, { value : 2}),
												 new jsqc.gen.integer(1, { value : 3})] });

					      expect(_.map(g.shrink(), function(v) { 
							       return v.value(); 
							   }))
						  .toEqual(
						      [[1, 2, 2], [1, 2]]
						  );
					  });
				       it('empty list cannot be shrunk', function() {
					      var g = new (jsqc.gen.array(jsqc.gen.integer))(1, { value : []});
					      expect(g.shrink([]))
						  .toEqual([]);
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
				     var value = "value";
				     this.copy = function(){
					 return value;
				     };
				     this.next = function() {
					 return this;
				     };
				     this.value = function() {
					 return value;
				     };
				 };
				 jsqc.property(gen, function(value) {
						   expect(value)
						       .toEqual("value");
					       });
			     });
			  it('calls shrink to shrink failing test data', function() {
				 function gen(size, _opts) {
				     var value = _opts.value || 2;
				     this.value = function() {
					 return value;
				     };
				     this.shrink = function() {
					 if (value === 2)
					     return [new gen(size, { value : value - 1})];
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