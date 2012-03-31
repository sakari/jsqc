qc = (function() {
	    var __size = 1;
	    return {
		gen : {
		    async : function(_opts) {
			var wait_event_size = qc.size() * 0.1;
			var callbacks = {};
			var callback_selection_order = [];
			var required_callback_order = (_opts ? _opts.callback_order : undefined);
			var callback_index = 0;
			var parent = this;

			this.size = qc.size();
			this.next = function() {
			    return new qc.gen.async();
			};
			this.value = function() {
			    return new (function async_value() {
					    this.wait = function(predicate) {
						function execute(ix) {
						    callback_selection_order.push(ix);
						    callbacks[ix].already_triggered = true;
						    callbacks[ix].cb();
						}
						function replay_when_shrinking() {
						    var ix;
						    while(required_callback_order) {
							execute(required_callback_order.shift());
						    }
						    if (!predicate())
							throw new qc.Skip('Default predicate does not hold after executing required events');
						}
						function generate_new_execution_order() {
						    var ix;
						    var rounds = Math.floor(Math.random() * wait_event_size);
						    var tries = 0;
						    var candidates;
						    while( tries++ < parent.DEFAULT_WAIT &&
							   (rounds-- > 0 || !predicate())){
							candidates = [];
							_.each(callbacks, function(v, i) { 
								   if (!v.already_triggered) {
								       candidates.push(i);
								   }
							       });
							if(candidates.length)
							    execute(candidates[Math.floor(Math.random() * candidates.length)]);
						    }
						    if (!predicate())
							throw new Error('Default wait count of ' + parent.DEFAULT_WAIT + ' exceeded');
						}
						if (required_callback_order)
						    return replay_when_shrinking();
						return generate_new_execution_order();
					    };
					    this.callback = function(cb) {
						callbacks[callback_index++] = { cb : cb };
					    };
					})();
			};
			this.show = function() {
			    return JSON.stringify({ callback_count : callbacks.length, 
						    triggered : callback_selection_order,
						    required_callback_order : required_callback_order
						  });
			};
			this.shrink = function() {
			    if (callback_selection_order.length === 0) {
				return [];
			    }
			    return _.map(callback_selection_order, function(value, i) {
					     var smaller = callback_selection_order.slice();
					     smaller.splice(i, 1);
					     return new qc.gen.async({ callback_order : smaller});
					 });
			};
			this.DEFAULT_WAIT = 10000;
		    },
		    oneof : function(generators) {
			var choises = _.map(generators, function(constr) {
						return new constr();
					    });
			return function oneof_inner() {
			    var choice = new (qc.gen.choice(choises))();
			    this.value = function() {
				return choice.value().value();
			    };
			    this.shrink = function() { 
				return []; 
			    };
			    this.next = function() {
				return new oneof_inner();
			    };
			};
		    },
		    choice : function(values, copy) {
			return function choice_inner () {
			    var pick = Math.floor(Math.random() * values.length);
			    this.value = function() {
				return (copy ? copy(values[pick]) : values[pick]);
			    };
			    this.shrink = function() {
				return [];
			    };
			    this.next = function() {
				return new choice_inner();
			    };
			};
		    },
		    const : function(value, copy) {
			return function() {
			    this.value = function() {
				return (copy ? copy(value) : value);
			    };
			    this.shrink = function() {
				return [];
			    };
			    this.next = function() {
				return this;
			    };
			};
		    },
		    array : function(inner) {
			return function inner_array (_opts) {
			    this.size = qc.size();

			    _opts = _opts || {};
			    var value = ( _opts.value === undefined ? 
					  generate(this.size):
					  _opts.value
					);

			    this.value = function() {
				return _.map(value, function(i) {
						 return i.value();
					     });				
			    };
			    this.shrink = function() {
				if (value.length === 0)
				    return [];
				return _.map(_.last(value).shrink(), 
					     function(s) {
						 return new inner_array({ value: _.initial(value).concat([s])});
					     }).concat([new inner_array({ value: _.initial(value) })]);
			    };
			    this.next = function() {
				return new (qc.gen.array(inner))();
			    };

			    function generate(size) {
				var n = Math.abs(new qc.gen.integer({}).value());
				var array = [];
				while(n-- > 0) {
				    array.push(new inner({}));
				} 
				return array;
			    };
			};
		    },
		    integer : function(_opts) {
			_opts = _opts || {};
			var self = this;

			this.size = qc.size();

			var value = (_opts.value === undefined ? 
				     generate() :
				     _opts.value);

			this.shrink = function() {
			    if (value === 0)
				return [];
			    if (value < 0)
				return [new qc.gen.integer({ value : value + 1})];
			    return [new qc.gen.integer({ value : value - 1})];
			};
			this.show = function() {
			  return value.toString();  
			};
			this.value = function() {
			    return value;
			};
			this.next = function() {
			   return qc.resize(this.size + 1, 
					      function() {
						  return new qc.gen.integer({}); 
					      });

			};
			function generate () {
			    return Math.floor(Math.random() * self.size);
			};
		    }
		},
		size : function() {
		    return __size;  
		},
		resize : function(size, block) {
		    var original_size = qc.size();
		    var result;
		    try {
			__size = size;
			result = block();
		    } catch (x) {
			__size = original_size;
			throw x;
		    }
		    __size = original_size;
		    return result;
		},
		_minimize_at_position : function(position, generators, predicate, done) {
		    generators = generators.slice();
		    var candidates = generators[position].shrink();
		    if (candidates.length === 0)
			return done();
		    generators[position] = candidates.pop();

		    var predicate_done = function(e) {
			if(e) return done(e, generators);
			return qc._minimize_at_position(position, generators, predicate, done);
		    };
		    var ctx = {
			classify : function() {},
			require : function() {},
			classifications : function() {}
		    };
		    try {
			return predicate.call(ctx, predicate_done, _.map(generators, function(g) { return g.value(); }));
		    } catch (x) {
			if (x instanceof qc.Skip)
			    return predicate_done.success();
			return predicate_done(x);
		    }

		},
		minimize : function(generators, predicate, done) {
		    var shrink_position = generators.length - 1;
		    async.until(function() {
				    return shrink_position < 0;
				},
				function(cb) {
				    console.log('minimizing: ' + _.map(generators, function(g) { return g.show(); }).join(', '));
				    return qc._minimize_at_position(shrink_position--, 
								    generators, 
								    predicate, 
								    function(e, gs) {
									if (e) {
									    generators = gs;
									}
									return cb(e);
								    });
				},
				function(e) {
				    if(e) {
					return qc.minimize(generators, predicate, 
							   function(new_e, new_generators) {
							       if (new_e)
								   return done(new_e, new_generators);
							       return done(e, generators);
							   });
				    }
				    console.log(generators);
				    return done(null, generators);
				});
		},
		generate : function(how_many, generator_constructors, predicate, done) {
		    var count = 0;
		    var size = qc.size();
		    var generators = _.map(generator_constructors, function(c) {
					        return new c({});
					   });
		    var classification = {};
		    var require = function() {
			return true;
		    };
		    var ctx = {
			classify : function(name) { 
			    if(!classification[name])
				classification[name] = 0;
			    classification[name]++;
			},
			require : function(p) { require = p; }
		    };
		    async.until(function() {
				    return count++ >= how_many;
				},
				function(cb) {
				    qc.resize(size++, function() {
						  generators = _.map(generators, function(g) { return g.next(); });
					      });
				    console.log('testing with: ' + _.map(generators, function(g) { return g.show(); }).join(', '));
				    predicate.call(ctx, cb, _.map(generators, 
								 function(g) { 
								     return g.value(); 
								 }
								));
				},
				function(e) {
				    if(e) return done(e, generators);
				    if(!require(classification)) 
					return done(new Error('Classification does not match requirement: ' + 
							      JSON.stringify(classification)));
				    return done(null);
				}
			       );
		},
		Skip : function() {},
		TRIES : 100,
		jasmine : {
		}
	    };
})();