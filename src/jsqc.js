jsqc = (function() {
	    var __size = 1;

	    function minimize(last_failing, prop) {
		if(!last_failing.shrink)
		    return next;

		var candidates = last_failing.shrink();
		for( var i in candidates ) {
		    try {
			prop(candidates[i].value());
		    } catch (x) {
			last_failing = candidates[i];
			candidates = candidates[i].shrink();
		    }
		}
		return last_failing;
	    }

	    return {
		gen : {
		    async : function() {
			this.wait = function(predicate) {
			    while(!predicate());
			};
		    },
		    oneof : function(generators) {
			var choises = _.map(generators, function(constr) {
						return new constr();
					    });
			return function oneof_inner() {
			    var choice = new (jsqc.gen.choice(choises))();
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
			    function generate() {
				var n = Math.abs(new jsqc.gen.integer({}).value());
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
				return [new jsqc.gen.integer({ value : value + 1})];
			    return [new jsqc.gen.integer({ value : value - 1})];
			};
			this.show = function() {
			  return value.toString();  
			};
			this.value = function() {
			    return value;
			};
			this.next = function() {
			   return jsqc.resize(jsqc.size() + 1, 
					      function() {
						  return new jsqc.gen.integer({}); 
					      });

			};
			function generate () {
			    return Math.floor(Math.random() * jsqc.size());
			};
		    }
		},
		size : function() {
		    return __size;  
		},
		resize : function(size, block) {
		    var original_size = jsqc.size();
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
		property : function(gen, prop) {
		    var generator = new gen(1, {});
		    try {
			prop(generator.value());
		    } catch (x) {
			var min = minimize(generator, prop);
			throw new Error('Failing case ' + 
					generator.show() + 
					' error:' + e 
					);
		    }
		}
	    };
})();