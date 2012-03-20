qc = (function() {
	    var __size = 1;
	    return {
		gen : {
		    async : function(_opts) {
			var callbacks = {};
			var callback_selection_order = [];
			var required_callback_order = (_opts ? _opts.callback_order : undefined);
			var callback_index = 0;
			var parent = this;
			this.value = function() {
			    return new (function async_value() {
					    this.wait = function(predicate) {
						var tries = 0;
						do {
						    var pick = undefined;
						    var ix = undefined;
						    if(required_callback_order !== undefined) {
							if (required_callback_order.length === 0)
							    throw new qc.Skip();
							ix = required_callback_order.shift();
						    } else {
							_.each(callbacks, function(v, i) { 
								   if (!v.already_triggered) {
								       ix = i;
								   }
							       });
						    }
						    if (ix === undefined || !callbacks[ix])
							continue;
						    callback_selection_order.push(ix);
						    callbacks[ix].already_triggered = true;
						    callbacks[ix].cb();
						} while (tries++ < parent.DEFAULT_WAIT && !predicate());
						if (tries >= parent.DEFAULT_WAIT)
						    throw new Error('Default wait count of ' + parent.DEFAULT_WAIT + ' exceeded');
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
			    _opts = _opts || {};
			    var value = ( _opts.value === undefined ? 
					  generate():
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

			    function generate() {
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
			   return qc.resize(qc.size() + 1, 
					      function() {
						  return new qc.gen.integer({}); 
					      });

			};
			function generate () {
			    return Math.floor(Math.random() * qc.size());
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
		    return result;
		},
		_minimize_at_position : function(position, generators, predicate, done) {
		    generators = generators.slice();
		    var candidates = generators[position].shrink();
		    if (candidates.length === 0)
			return done();
		    generators[position] = candidates.pop();

		    var predicate_done = {
			success : function() {
			    return qc._minimize_at_position(position, generators, predicate, done);
			},
			failure : function() {
			    return done('failed', generators);
			}
		    };
		    var ctx = {
			classify : function() {},
			require : function() {},
			classifications : function() {}
		    };
		    try {
			return predicate(ctx, predicate_done, _.map(generators, function(g) { return g.value(); }));
		    } catch (x) {
			if (x instanceof qc.Skip)
			    return predicate_done.success();
			return predicate_done.failure();
		    }

		},
		minimize : function(generators, predicate, done) {
		    var shrink_position = generators.length - 1;
		    async.until(function() {
				    return shrink_position < 0;
				},
				function(cb) {
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
					return qc.minimize(generators, predicate, done);
				    }
				    console.log(generators);
				    return done('foobar', generators);
				});
		},
		generate : function(how_many, generator_constructors, predicate, done) {
		    var count = 0;
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
				    generators = _.map(generators, function(g) { return g.next(); });
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