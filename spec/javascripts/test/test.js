describe('qc', function() {
	     describe('gen', function(){
			  describe('async', function(){
				       it('can be waited on until a given predicate holds', function() {
					      var a = new qc.gen.async().value();
					      var waits = 0;
					      a.wait(function() {
							 waits++;
							 return waits >= 10;
						     });
					      expect(waits).toEqual(10);
					  });
				       it('wait is limited by a defalt wait try count of DEFAULT_WAIT', function() {
					      var g = new qc.gen.async();
					      var a = g.value();
					      var tries = 0;
					      expect(function() {
							 a.wait(function() { tries++; return false; });
						     }).toThrow();
					      expect(tries).toEqual(g.DEFAULT_WAIT);
					  });
				       it('triggers registered callbacks when waited on', function() {
					      var a = new qc.gen.async().value();
					      var triggered;
					      a.callback(function() {
							     triggered = true;
							 });
					      a.wait(function() { return triggered;});

					      expect(triggered).toEqual(true);
					  });
				       
				       describe('shrink', function(){
						    it('removes triggered callback indexes to simplify the execution', function() {
							   var g = new qc.gen.async();
							   var a = g.value();
							   var only_second;
							   var only_first;

							   a.callback(function() {});
							   a.callback(function() {});
							   expect(function() { a.wait(function() {}); }).toThrow();

							   _.each(g.shrink(), function(shrunk) {
								      var s = shrunk.value();
								      var first = false;
								      var second = false;
								      s.callback(function() { first = true; });
								      s.callback(function() { second = true; });
								      expect(function() { s.wait(function() {}); }).toThrow();
								      if(!first && second)
									  only_second = true;
								      else if(first && !second)
									  only_first = true;
								      else
									  throw new Error('one callback should have been called: ' + first + ' ' + second);
								  });
							   expect(only_first && only_second).toEqual(true);
						       });
						    it('throws Skip if after executing the required callbacks the wait does not finish', function(){
							   var g = new qc.gen.async();
							   var a = g.value();
							   a.callback();
							   expect(function() { a.wait(); }).toThrow();
							   _.each(g.shrink(), function(shrunk) {
								      var s = shrunk.value();
								      s.callback();
								      s.callback();
								      expect(function() { s.wait(); }).toThrow(new qc.Skip());
								  });
						    });
						});
				   });

			  describe('oneof', function() {
				      var g = new (qc.gen.oneof(
						       [qc.gen.const(1),
							qc.gen.const("A")]
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
				       var g = new (qc.gen.choice([1, 2]))();
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
				      var g = new (qc.gen.const("constant"))();
				       it('generates always the same value', function() {
					      expect(g.value())
						  .toEqual("constant");
					      expect(g.next().value())
						  .toEqual("constant");
					  });
				   });
			  describe('integer', function() {
				       it('shrinking goes towards 0', function() {
					      var g = new qc.gen.integer({ value : 2 });
					      expect(_.map(g.shrink(), 
							   function(v) { 
							       return v.value(); 
							   }))
						  .toEqual([1]);
					  });
				       it('0 is not shrunk', function() {
					      var g = new qc.gen.integer({ value : 0 });
					      expect(g.shrink(0))
						  .toEqual([]);
					  });
				       it('can be shown', function() {
					      var g = new qc.gen.integer({ value : 1 });
					      expect(g.show(1))
						  .toEqual("1");
					  });
				       it('generates different values', function() {
					      var seen = {};
					      var count = 100;
					      var seen_numbers = 0;
					      var number;
					      var g = new qc.gen.integer(1, {});
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
					      var g = new qc.gen.integer(10, {});
					      expect(g.value())
						  .toEqual(Math.floor(g.value()));
					  });
				   });
			  describe('array', function() {
				       it('can be shrunk', function() {
					      var g = new (qc.gen.array(
							       qc.gen.integer))({ value : [ new qc.gen.integer({ value : 1}), 
											      new qc.gen.integer({ value : 2}),
											      new qc.gen.integer({ value : 3})] });
					      
					      expect(_.map(g.shrink(), function(v) { 
							       return v.value(); 
							   }))
						  .toEqual(
						      [[1, 2, 2], [1, 2]]
						  );
					  });
				       it('empty list cannot be shrunk', function() {
					      var g = new (qc.gen.array(qc.gen.integer))({ value : []});
					      expect(g.shrink([]))
						  .toEqual([]);
					  });
				       it('generates arrays of generated values', function() {
					      var g = new (qc.gen.array(qc.gen.integer))();
					      var non_empty = 0;
					      _.times(100, function() {
							  if (g.value().length > 0) {
							      non_empty++;
							      expect(_.all(g.value(), 
									   function(e) {
									       return _.isNumber(e);
									   })).toEqual(true);
							  }
							  g = g.next();
						      });
					      expect(non_empty).toBeGreaterThan(0);
					  });
				   });
		      });
	     describe('generate', function() {
			  var done;
			  var how_many;
			  beforeEach(function() {
					 done = false;
					 how_many = 100;
				     });
			  function afterDone(fn) {
			      waitsFor(function() { return done; });
			      if(fn)
				  runs(fn);
			  };
			  it('can be called with empty generator list', function() {
				 var result;
				 qc.generate(how_many, [], 
					     function(cb) { cb(); },
					     function() { done = true; }
					    );
				 afterDone();
			     });
			  it('produces random values', function() {
				 var values = [];
				 qc.generate(how_many, [qc.gen.integer], 
					     function(cb, i) {
						 values.push(i);
						 cb();
					     },
					     function(e, g) {
						 done = true;
					     });
				 afterDone(function() {
					       expect(values.length).toEqual(how_many);
					       expect(_.all(values, function(v) { return _.isNumber(v); }));
					   });
			     });

			  it('stops short if callback is called with a value', function() {
				 var tries = 0;
				 var result;
				 qc.generate(how_many, [qc.gen.integer],
					     function(cb, i) {
						 if (tries++ > how_many / 2)
						     return cb("stopped");
						 return cb();
					     },
					     function(e) {
						 result = e;
						 done = true;
					     });
				 afterDone(function() {
					       expect(tries).toBeLessThan(how_many);
					       expect(result).toEqual("stopped");
					   });
			     });
			  it('passes the current generator as the second argument to on_complete when stopping', function() {
				 var value;
				 var gen;
				 qc.generate(how_many, [qc.gen.integer], 
					     function(cb, test_data) {
						 value = test_data;
						 cb("error");
					     },
					     function(e, g) {
						 gen = g;
						 done = true;
					     });
				 afterDone(function() {
					       expect(_.map(gen, function(g) { return g.value(); }))
						   .toEqual(value);
					   });
			     });

			  describe('generator predicate classification', function()  {
				       describe('classify', function() {
						    it('is provided by the ctx', function() {
							   qc.generate(how_many, [qc.gen.integer],
								       function(cb, value) {
									   this.classify('classified');
									   return cb();
								       },
								       function(e) {
									   done = true;
								       });
							   afterDone();
						       });
						});
				       describe('require', function() {
						    it('classifications can be asserted on with require', function() {
							   var exception;
							   qc.generate(how_many, [qc.gen.integer], 
								       function(cb, value) {
									   this.classify('classification');
									   this.require(function(cl) {
											    return cl.classification > 1;
											});
									   return cb();
								       },
								       function(e) {
									   exception = e;
									   done = true;
								       });
							   afterDone(
							       function() {
								   expect(exception).toEqual(null);
							       });
						       });
						    it('fails the predicate if the assertion does not hold in the end', function() {
							   var exception;
							   var tries = 0;
							   qc.generate(how_many, [qc.gen.integer], 
								       function(cb, value) {
									   tries++;
									   this.require(function(cl) { return false; });
									   return cb();
								       },
								       function(e) {
									   exception = e;
									   done = true;
								       });
							   afterDone(function() {
									 expect(tries).toEqual(how_many);
									 expect(exception).toBeDefined(); 
								     });
						       });
						});
				   });

		      });
	     describe('minimize', function() {
			  function gen(value) {
			      this.shrink = function() {
				  if(value === 0)
				      return [];
				  return [new gen(value - 1)];
			      };
			      this.value = function() {
				  return value;
			      };
			      this.show = function() {};
			  };
			  it('stops when it cannot minimize further', function() {
				 var g = new (function() {
						  this.shrink = function() {
						      return [];
						  };
						  this.show = function() {
						      return '';
						  };
					      })();
				 var minimized_g; 
				 qc.minimize([g],
					     function(ctx, cb, v) {
						 cb();
					     },
					     function(e, g) {
						 minimized_g = g;
					     });
				 waitsFor(function() { return minimized_g; });
				 runs(function() {
					  expect(minimized_g.length)
					      .toEqual(1);
					  expect(minimized_g[0])
					      .toBe(g);
				      });
			     });
			  it('calls predicate with the shrunk value', function() {
				 var g = new gen(3);
				 var got = [];
				 qc.minimize([g], 
					     function(ctx, cb, v) {
						 got.push(v);
						 cb();
					     },
					     function() {});
				 waitsFor(function() {
					      return got.length >= 2;
					  });
				 runs(function() {
					  expect(got).toEqual([[2], [1], [0]]);
				      });
			     });
		      });
	     
	     describe('resize', function() {
			  it('sets the global size for the execution of the function', function() {
				 var size;
				 var set_size = 5;
				 qc.resize(set_size, function() {
						 size = qc.size();
					     });
				 expect(size).toEqual(set_size);
			     });
		      });
	 });