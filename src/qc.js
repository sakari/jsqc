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
		_minimize_at_position : function(position, generators, prop) {
		    generators = generators.slice();
		    var candidates = generators[position].shrink();
		    var shrinks = 0;
		    for( var i in candidates ) {
			console.log(candidates[i].show());
			try {
			    var value = _.map(generators, function(g) { return g.value(); });
			    value[position] = candidates[i].value();
			    prop.apply({}, value);
			} catch (x) {
			    if (x instanceof qc.Skip)
				continue;
			    shrinks++;

			    generators[position] = candidates[i];
			    candidates = generators[position].shrink();
			}
		    }
		    return { minimized : generators, shrinks : shrinks };
		},
		_minimize : function(last_failing, prop) {
		    var data;
		    var total_shrinks = 0;
		    console.log('shrinking..');
		    for (var shrink_position in last_failing) {
			data = this._minimize_at_position(shrink_position, last_failing, prop);
			total_shrinks += data.shrinks;
			last_failing = data.minimized;
		    }
		    return { minimized : last_failing, shrinks : total_shrinks };
		},
		property_continuation : function(generators, property, on_complete) {
		    var done = {
			success : function() {
			    on_complete({ passed : true });
			},
			failure : function() {		
			    on_complete({ passed : false});
			}
		    };
		    property(done);
		},
		property : function() {
		    var gens = [];

		    var classifications = {};
		    var require = function() {
			return true;
		    };

		    for (var i = 0; i < arguments.length - 1; i++)
			gens.push(arguments[i]);
		    var prop = arguments[arguments.length - 1];
		    var generators = _.map(gens, function(g) { return new g({}); });
		    try {
			_.times(qc.TRIES, function() {
				    try {
					var ctx = {
					    qc : {
						classify : function(c) {
						    if (!classifications[c])
							classifications[c] = 0;
						    classifications[c]++;
						}, 
						classifications : function() {
						    return classifications;
						},
						require : function(p) {
						    require = p;
						}
					    }
					};
					prop.apply(ctx, _.map(generators, function(g) { return g.value(); }));
				    } catch (x) {
					if (x instanceof qc.Skip)
					    return;
					throw x;
				    }
				    generators = _.map(generators, function(g) { return g.next(); });
				});
		    } catch (x) {
			var min = this._minimize(generators, prop);
			throw new Error('Failing case after ' +
					min.shrinks + ' shrinks ' +
					_.map(min.minimized, function(m) { return m.show(); }).join(', ') + 
					' error: ' + x 
					);
		    }
		    if (!require(classifications))
			throw new Error('Require failed for classification ' + JSON.stringify(classifications));

		    if(qc.out)
			qc.out(classifications);
		},
		Skip : function() {},
		TRIES : 100,
		jasmine : {
		}
	    };
})();